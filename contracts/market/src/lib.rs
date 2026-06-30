#![no_std]

use soroban_sdk::{
    contract, contractclient, contracterror, contractimpl, contracttype, panic_with_error,
    symbol_short, Address, Env,
};

pub const RATE_SCALE: i128 = 1_000_000;
pub const REWARD_SCALE: i128 = 1_000_000_000_000;

#[contractclient(name = "SyVaultClient")]
pub trait SyVault {
    fn balance(env: Env, user: Address) -> i128;
    fn transfer(env: Env, from: Address, to: Address, shares: i128);
    fn withdraw_for(env: Env, owner: Address, to: Address, shares: i128) -> i128;
    fn exchange_rate_scaled(env: Env) -> i128;
    fn total_assets(env: Env) -> i128;
    fn asset(env: Env) -> Address;
}

#[contractclient(name = "PtTokenClient")]
pub trait PtToken {
    fn balance(env: Env, id: Address) -> i128;
    fn total_supply(env: Env) -> i128;
    fn mint(env: Env, to: Address, amount: i128);
    fn burn(env: Env, from: Address, amount: i128);
}

#[contractclient(name = "YtTokenClient")]
pub trait YtToken {
    fn balance(env: Env, id: Address) -> i128;
    fn total_supply(env: Env) -> i128;
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
    MaturityLedger,
    Matured,
    LockedShares,
    LastSyncedAssets,
    RewardPerYt,
    UserRewardPaid(Address),
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
    YieldDisabled = 7,
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

fn sync_rewards(env: &Env) {
    if env
        .storage()
        .instance()
        .get::<_, bool>(&DataKey::Matured)
        .unwrap_or(false)
    {
        return;
    }

    let vault = vault_client(env);
    let market = market_addr(env);
    let current_assets = assets_for_shares(env, vault.balance(&market));

    let last: i128 = env
        .storage()
        .instance()
        .get(&DataKey::LastSyncedAssets)
        .unwrap_or(current_assets);

    if current_assets > last {
        let yield_delta = current_assets - last;
        let yt_supply = yt_client(env).total_supply();
        if yt_supply > 0 {
            let mut reward_per_yt: i128 = env
                .storage()
                .instance()
                .get(&DataKey::RewardPerYt)
                .unwrap_or(0);
            reward_per_yt += yield_delta * REWARD_SCALE / yt_supply;
            env.storage()
                .instance()
                .set(&DataKey::RewardPerYt, &reward_per_yt);
        }
    }

    env.storage()
        .instance()
        .set(&DataKey::LastSyncedAssets, &current_assets);
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

fn pending_yield(env: &Env, user: &Address) -> i128 {
    let yt_balance = yt_client(env).balance(user);
    if yt_balance == 0 {
        return 0;
    }
    let reward_per_yt: i128 = env
        .storage()
        .instance()
        .get(&DataKey::RewardPerYt)
        .unwrap_or(0);
    let paid: i128 = env
        .storage()
        .persistent()
        .get(&DataKey::UserRewardPaid(user.clone()))
        .unwrap_or(0);
    if reward_per_yt <= paid {
        return 0;
    }
    yt_balance * (reward_per_yt - paid) / REWARD_SCALE
}

fn set_user_reward_paid(env: &Env, user: &Address, value: i128) {
    let key = DataKey::UserRewardPaid(user.clone());
    env.storage().persistent().set(&key, &value);
    env.storage()
        .persistent()
        .extend_ttl(&key, DAY_LEDGERS, DAY_LEDGERS);
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
    ) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::SyVault, &sy_vault);
        env.storage().instance().set(&DataKey::PtToken, &pt_token);
        env.storage().instance().set(&DataKey::YtToken, &yt_token);
        env.storage()
            .instance()
            .set(&DataKey::MaturityLedger, &maturity_ledger);
        env.storage().instance().set(&DataKey::Matured, &false);
        env.storage().instance().set(&DataKey::LockedShares, &0_i128);
        env.storage()
            .instance()
            .set(&DataKey::LastSyncedAssets, &0_i128);
        env.storage().instance().set(&DataKey::RewardPerYt, &0_i128);
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

    pub fn claimable_yield(env: Env, user: Address) -> i128 {
        sync_rewards(&env);
        pending_yield(&env, &user)
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

        sync_rewards(&env);

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

        pt_client(&env).mint(&user, &sy_amount);
        yt_client(&env).mint(&user, &sy_amount);

        let reward_per_yt: i128 = env
            .storage()
            .instance()
            .get(&DataKey::RewardPerYt)
            .unwrap_or(0);
        set_user_reward_paid(&env, &user, reward_per_yt);

        env.events()
            .publish((symbol_short!("strip"), user), sy_amount);
    }

    pub fn merge(env: Env, user: Address, amount: i128) {
        user.require_auth();
        if amount <= 0 {
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

        sync_rewards(&env);

        let pt_bal = pt_client(&env).balance(&user);
        let yt_bal = yt_client(&env).balance(&user);
        if pt_bal < amount || yt_bal < amount {
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
            .publish((symbol_short!("merge"), user), amount);
    }

    pub fn claim_yield(env: Env, user: Address) -> i128 {
        user.require_auth();
        if env
            .storage()
            .instance()
            .get::<_, bool>(&DataKey::Matured)
            .unwrap_or(false)
        {
            panic_with_error!(&env, MarketError::YieldDisabled);
        }

        sync_rewards(&env);
        let payout = pending_yield(&env, &user);
        if payout <= 0 {
            return 0;
        }

        let reward_per_yt: i128 = env
            .storage()
            .instance()
            .get(&DataKey::RewardPerYt)
            .unwrap_or(0);
        set_user_reward_paid(&env, &user, reward_per_yt);

        let shares_to_burn = shares_for_assets(&env, payout);
        let market = market_addr(&env);
        let vault = vault_client(&env);
        let market_shares = vault.balance(&market);
        if shares_to_burn > market_shares {
            panic_with_error!(&env, MarketError::InsufficientBalance);
        }

        vault.withdraw_for(&market, &user, &shares_to_burn);

        let current_assets = assets_for_shares(&env, vault.balance(&market));
        env.storage()
            .instance()
            .set(&DataKey::LastSyncedAssets, &current_assets);

        env.events()
            .publish((symbol_short!("claim"), user), payout);

        payout
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

        sync_rewards(&env);
        env.storage().instance().set(&DataKey::Matured, &true);

        env.events().publish((symbol_short!("swept"),), maturity);
    }
}

mod test;
