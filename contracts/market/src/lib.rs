#![no_std]

use soroban_sdk::{
    contract, contractclient, contracterror, contractimpl, contracttype, panic_with_error,
    symbol_short, Address, Env,
};

pub const RATE_SCALE: i128 = 1_000_000;
pub const LEDGERS_PER_YEAR: u32 = 6_307_200;
pub const MONTH_LEDGERS: u32 = LEDGERS_PER_YEAR / 12;

#[contractclient(name = "SyVaultClient")]
pub trait SyVault {
    fn balance(env: Env, user: Address) -> i128;
    fn transfer(env: Env, from: Address, to: Address, shares: i128);
    fn deposit(env: Env, from: Address, amount: i128) -> i128;
    fn withdraw_for(env: Env, owner: Address, to: Address, shares: i128) -> i128;
    fn exchange_rate_scaled(env: Env) -> i128;
    fn rate_bps(env: Env) -> u64;
    fn asset(env: Env) -> Address;
}

#[contractclient(name = "PtTokenClient")]
pub trait PtToken {
    fn balance(env: Env, id: Address) -> i128;
    fn mint(env: Env, to: Address, amount: i128);
    fn burn(env: Env, from: Address, amount: i128);
}

#[contractclient(name = "YtTokenClient")]
pub trait YtToken {
    fn balance(env: Env, id: Address) -> i128;
    fn mint(env: Env, to: Address, amount: i128);
    fn burn(env: Env, from: Address, amount: i128);
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    SyVault,
    PtToken,
    YtToken,
    Treasury,
    FeeBps,
    MaturityLedger,
    Matured,
    LockedShares,
    UserLastPayoutLedger(Address),
    UserTotalPaid(Address),
    UserFirstStripLedger(Address),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum MarketError {
    NotInitialized = 1,
    InvalidAmount = 2,
    InsufficientBalance = 3,
    NotMatured = 4,
    AlreadyMatured = 5,
    MarketMatured = 6,
    HardLocked = 7,
    PayoutNotDue = 8,
    YieldCapReached = 9,
    Unauthorized = 10,
}

const DAY_LEDGERS: u32 = 17_280;

#[contract]
pub struct Market;

fn vault_client(env: &Env) -> SyVaultClient<'_> {
    let addr: Address = env.storage().instance().get(&DataKey::SyVault).unwrap();
    SyVaultClient::new(env, &addr)
}

fn pt_client(env: &Env) -> PtTokenClient<'_> {
    let addr: Address = env.storage().instance().get(&DataKey::PtToken).unwrap();
    PtTokenClient::new(env, &addr)
}

fn yt_client(env: &Env) -> YtTokenClient<'_> {
    let addr: Address = env.storage().instance().get(&DataKey::YtToken).unwrap();
    YtTokenClient::new(env, &addr)
}

fn market_addr(env: &Env) -> Address {
    env.current_contract_address()
}

fn assets_for_shares(env: &Env, shares: i128) -> i128 {
    if shares == 0 {
        return 0;
    }
    let rate = vault_client(env).exchange_rate_scaled();
    shares * rate / RATE_SCALE
}

fn shares_for_assets(env: &Env, assets: i128) -> i128 {
    if assets == 0 {
        return 0;
    }
    let rate = vault_client(env).exchange_rate_scaled();
    if rate == 0 {
        return 0;
    }
    assets * RATE_SCALE / rate
}

fn monthly_gross_yield(env: &Env, principal_shares: i128) -> i128 {
    if principal_shares <= 0 {
        return 0;
    }
    let rate_bps = vault_client(env).rate_bps() as i128;
    let assets = assets_for_shares(env, principal_shares);
    assets * rate_bps / 12 / 10_000
}

fn split_payout(gross: i128, fee_bps: u64) -> (i128, i128) {
    if gross <= 0 {
        return (0, 0);
    }
    let fee = gross * fee_bps as i128 / 10_000;
    (gross - fee, fee)
}

fn user_key_last_payout(user: &Address) -> DataKey {
    DataKey::UserLastPayoutLedger(user.clone())
}

fn user_key_total_paid(user: &Address) -> DataKey {
    DataKey::UserTotalPaid(user.clone())
}

fn user_key_first_strip(user: &Address) -> DataKey {
    DataKey::UserFirstStripLedger(user.clone())
}

fn read_u32_persistent(env: &Env, key: &DataKey) -> u32 {
    env.storage().persistent().get(key).unwrap_or(0)
}

fn write_u32_persistent(env: &Env, key: &DataKey, value: u32) {
    env.storage().persistent().set(key, &value);
    env.storage()
        .persistent()
        .extend_ttl(key, DAY_LEDGERS, DAY_LEDGERS);
}

fn read_i128_persistent(env: &Env, key: &DataKey) -> i128 {
    env.storage().persistent().get(key).unwrap_or(0)
}

fn write_i128_persistent(env: &Env, key: &DataKey, value: i128) {
    env.storage().persistent().set(key, &value);
    env.storage()
        .persistent()
        .extend_ttl(key, DAY_LEDGERS, DAY_LEDGERS);
}

fn max_yield_cap(env: &Env, user: &Address, principal_shares: i128) -> i128 {
    if principal_shares <= 0 {
        return 0;
    }
    let first_strip = read_u32_persistent(env, &user_key_first_strip(user));
    if first_strip == 0 {
        return 0;
    }
    let maturity: u32 = env
        .storage()
        .instance()
        .get(&DataKey::MaturityLedger)
        .unwrap_or(0);
    let now = env.ledger().sequence();
    if now >= maturity {
        return read_i128_persistent(env, &user_key_total_paid(user));
    }
    let ledgers_left = (maturity - first_strip.max(now)) as i128;
    let rate_bps = vault_client(env).rate_bps() as i128;
    let assets = assets_for_shares(env, principal_shares);
    assets * rate_bps * ledgers_left / LEDGERS_PER_YEAR as i128 / 10_000
        + monthly_gross_yield(env, principal_shares)
}

fn execute_yield_payout(env: &Env, user: &Address, gross: i128) -> i128 {
    if gross <= 0 {
        return 0;
    }

    let pt_balance = pt_client(env).balance(user);
    let total_paid = read_i128_persistent(env, &user_key_total_paid(user));
    let cap = max_yield_cap(env, user, pt_balance);
    if total_paid + gross > cap {
        panic_with_error!(env, MarketError::YieldCapReached);
    }

    let fee_bps: u64 = env.storage().instance().get(&DataKey::FeeBps).unwrap_or(1000);
    let (user_amt, fee_amt) = split_payout(gross, fee_bps);

    let vault = vault_client(env);
    let market = market_addr(env);
    let treasury: Address = env.storage().instance().get(&DataKey::Treasury).unwrap();

    if user_amt > 0 {
        let user_shares = shares_for_assets(env, user_amt);
        if user_shares > vault.balance(&market) {
            panic_with_error!(env, MarketError::InsufficientBalance);
        }
        vault.withdraw_for(&market, user, &user_shares);
    }

    if fee_amt > 0 {
        let fee_shares = shares_for_assets(env, fee_amt);
        if fee_shares > vault.balance(&market) {
            panic_with_error!(env, MarketError::InsufficientBalance);
        }
        vault.withdraw_for(&market, &treasury, &fee_shares);
    }

    write_i128_persistent(env, &user_key_total_paid(user), total_paid + gross);
    write_u32_persistent(env, &user_key_last_payout(user), env.ledger().sequence());

    env.events()
        .publish((symbol_short!("payout"), user.clone()), (user_amt, fee_amt));

    user_amt
}

fn pay_upfront_on_strip(env: &Env, user: &Address, sy_amount: i128) -> i128 {
    let gross = monthly_gross_yield(env, sy_amount);
    execute_yield_payout(env, user, gross)
}

fn pay_monthly_yield_internal(env: &Env, user: &Address, allow_early: bool) -> i128 {
    if env
        .storage()
        .instance()
        .get::<_, bool>(&DataKey::Matured)
        .unwrap_or(false)
    {
        return 0;
    }

    let pt_balance = pt_client(env).balance(user);
    if pt_balance <= 0 {
        return 0;
    }

    let last_payout = read_u32_persistent(env, &user_key_last_payout(user));
    let now = env.ledger().sequence();
    if !allow_early && last_payout > 0 && now < last_payout.saturating_add(MONTH_LEDGERS) {
        panic_with_error!(env, MarketError::PayoutNotDue);
    }

    let gross = monthly_gross_yield(env, pt_balance);
    execute_yield_payout(env, user, gross)
}

#[contractimpl]
impl Market {
    pub fn __constructor(
        env: Env,
        admin: Address,
        sy_vault: Address,
        pt_token: Address,
        yt_token: Address,
        maturity_ledger: u32,
        treasury: Address,
        fee_bps: u64,
    ) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::SyVault, &sy_vault);
        env.storage().instance().set(&DataKey::PtToken, &pt_token);
        env.storage().instance().set(&DataKey::YtToken, &yt_token);
        env.storage().instance().set(&DataKey::Treasury, &treasury);
        env.storage().instance().set(&DataKey::FeeBps, &fee_bps);
        env.storage()
            .instance()
            .set(&DataKey::MaturityLedger, &maturity_ledger);
        env.storage().instance().set(&DataKey::Matured, &false);
        env.storage().instance().set(&DataKey::LockedShares, &0_i128);
    }

    pub fn treasury(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Treasury).unwrap()
    }

    pub fn fee_bps(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::FeeBps).unwrap_or(1000)
    }

    pub fn maturity_ledger(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::MaturityLedger)
            .unwrap_or(0)
    }

    pub fn is_matured(env: Env) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::Matured)
            .unwrap_or(false)
    }

    pub fn locked_shares(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::LockedShares)
            .unwrap_or(0)
    }

    pub fn locked_principal(env: Env, user: Address) -> i128 {
        pt_client(&env).balance(&user)
    }

    pub fn total_yield_paid(env: Env, user: Address) -> i128 {
        read_i128_persistent(&env, &user_key_total_paid(&user))
    }

    pub fn preview_monthly_yield(env: Env, user: Address) -> i128 {
        let pt = pt_client(&env).balance(&user);
        let gross = monthly_gross_yield(&env, pt);
        let fee_bps: u64 = env.storage().instance().get(&DataKey::FeeBps).unwrap_or(1000);
        split_payout(gross, fee_bps).0
    }

    pub fn preview_upfront_yield(env: Env, sy_amount: i128) -> i128 {
        let gross = monthly_gross_yield(&env, sy_amount);
        let fee_bps: u64 = env.storage().instance().get(&DataKey::FeeBps).unwrap_or(1000);
        split_payout(gross, fee_bps).0
    }

    pub fn can_pay_monthly_yield(env: Env, user: Address) -> bool {
        if env
            .storage()
            .instance()
            .get::<_, bool>(&DataKey::Matured)
            .unwrap_or(false)
        {
            return false;
        }
        let pt = pt_client(&env).balance(&user);
        if pt <= 0 {
            return false;
        }
        let last = read_u32_persistent(&env, &user_key_last_payout(&user));
        if last == 0 {
            return false;
        }
        env.ledger().sequence() >= last.saturating_add(MONTH_LEDGERS)
    }

    /// Legacy view — returns user portion of next monthly payout if due, else 0.
    pub fn claimable_yield(env: Env, user: Address) -> i128 {
        if !Self::can_pay_monthly_yield(env.clone(), user.clone()) {
            return 0;
        }
        Self::preview_monthly_yield(env, user)
    }

    pub fn deposit_and_lock(env: Env, user: Address, usdc_amount: i128) -> i128 {
        user.require_auth();
        if usdc_amount <= 0 {
            panic_with_error!(&env, MarketError::InvalidAmount);
        }
        if env
            .storage()
            .instance()
            .get::<_, bool>(&DataKey::Matured)
            .unwrap_or(false)
        {
            panic_with_error!(&env, MarketError::MarketMatured);
        }

        let vault = vault_client(&env);
        let shares = vault.deposit(&user, &usdc_amount);
        Self::strip(env, user, shares);
        shares
    }

    pub fn strip(env: Env, user: Address, sy_amount: i128) {
        user.require_auth();
        if sy_amount <= 0 {
            panic_with_error!(&env, MarketError::InvalidAmount);
        }
        if env
            .storage()
            .instance()
            .get::<_, bool>(&DataKey::Matured)
            .unwrap_or(false)
        {
            panic_with_error!(&env, MarketError::MarketMatured);
        }

        let market = market_addr(&env);
        let vault = vault_client(&env);
        vault.transfer(&user, &market, &sy_amount);

        let mut locked: i128 = env
            .storage()
            .instance()
            .get(&DataKey::LockedShares)
            .unwrap_or(0);
        locked += sy_amount;
        env.storage().instance().set(&DataKey::LockedShares, &locked);

        if read_u32_persistent(&env, &user_key_first_strip(&user)) == 0 {
            write_u32_persistent(&env, &user_key_first_strip(&user), env.ledger().sequence());
        }

        pt_client(&env).mint(&user, &sy_amount);
        yt_client(&env).mint(&user, &sy_amount);

        let paid = pay_upfront_on_strip(&env, &user, sy_amount);

        env.events()
            .publish((symbol_short!("strip"), user), (sy_amount, paid));
    }

    /// Hard-locked: principal cannot be merged back before maturity.
    pub fn merge(env: Env, _user: Address, _amount: i128) {
        panic_with_error!(&env, MarketError::HardLocked);
    }

    /// User-initiated monthly yield payout (Model A).
    pub fn pay_monthly_yield(env: Env, user: Address) -> i128 {
        user.require_auth();
        pay_monthly_yield_internal(&env, &user, false)
    }

    /// Keeper/admin batch payout for a user.
    pub fn pay_monthly_yield_for(env: Env, operator: Address, user: Address) -> i128 {
        operator.require_auth();
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if operator != admin {
            panic_with_error!(&env, MarketError::Unauthorized);
        }
        if !Self::can_pay_monthly_yield(env.clone(), user.clone()) {
            return 0;
        }
        pay_monthly_yield_internal(&env, &user, false)
    }

    /// Legacy alias — routes to monthly payout when due.
    pub fn claim_yield(env: Env, user: Address) -> i128 {
        Self::pay_monthly_yield(env, user)
    }

    pub fn redeem_pt(env: Env, user: Address, amount: i128) -> i128 {
        user.require_auth();
        if amount <= 0 {
            panic_with_error!(&env, MarketError::InvalidAmount);
        }

        let matured: bool = env
            .storage()
            .instance()
            .get(&DataKey::Matured)
            .unwrap_or(false);
        let maturity: u32 = env
            .storage()
            .instance()
            .get(&DataKey::MaturityLedger)
            .unwrap_or(0);
        if !matured && env.ledger().sequence() < maturity {
            panic_with_error!(&env, MarketError::NotMatured);
        }

        let pt_bal = pt_client(&env).balance(&user);
        if pt_bal < amount {
            panic_with_error!(&env, MarketError::InsufficientBalance);
        }

        pt_client(&env).burn(&user, &amount);
        yt_client(&env).burn(&user, &amount);

        let market = market_addr(&env);
        vault_client(&env).transfer(&market, &user, &amount);

        let mut locked: i128 = env
            .storage()
            .instance()
            .get(&DataKey::LockedShares)
            .unwrap_or(0);
        locked -= amount;
        env.storage().instance().set(&DataKey::LockedShares, &locked);

        env.events()
            .publish((symbol_short!("redeem"), user), amount);

        amount
    }

    pub fn sweep_matured(env: Env) {
        let maturity: u32 = env
            .storage()
            .instance()
            .get(&DataKey::MaturityLedger)
            .unwrap_or(0);
        if env.ledger().sequence() < maturity {
            panic_with_error!(&env, MarketError::NotMatured);
        }
        if env
            .storage()
            .instance()
            .get::<_, bool>(&DataKey::Matured)
            .unwrap_or(false)
        {
            panic_with_error!(&env, MarketError::AlreadyMatured);
        }

        env.storage().instance().set(&DataKey::Matured, &true);

        env.events().publish((symbol_short!("swept"),), maturity);
    }
}

mod test;
