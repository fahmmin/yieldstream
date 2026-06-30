#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env, Symbol,
};

pub const RATE_SCALE: i128 = 1_000_000;
pub const LEDGERS_PER_YEAR: u64 = 6_307_200;
const DAY_LEDGERS: u64 = 17_280;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Asset,
    RateBps,
    LastAccrualLedger,
    ExchangeRate,
    TotalShares,
    Balance(Address),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum VaultError {
    NotInitialized = 1,
    Unauthorized = 2,
    InvalidAmount = 3,
    InsufficientBalance = 4,
    InsufficientLiquidity = 5,
}

#[contract]
pub struct SyVault;

fn accrue(env: &Env) {
    let last: u64 = env
        .storage()
        .instance()
        .get(&DataKey::LastAccrualLedger)
        .unwrap_or_else(|| env.ledger().sequence());
    let current = env.ledger().sequence();
    if current <= last {
        return;
    }

    let rate_bps: u64 = env.storage().instance().get(&DataKey::RateBps).unwrap_or(0);
    if rate_bps == 0 {
        env.storage()
            .instance()
            .set(&DataKey::LastAccrualLedger, &current);
        return;
    }

    let mut rate: i128 = env
        .storage()
        .instance()
        .get(&DataKey::ExchangeRate)
        .unwrap_or(RATE_SCALE);
    let delta = (current - last) as i128;
    let yield_add = rate * rate_bps as i128 * delta / (10_000 * LEDGERS_PER_YEAR as i128);
    rate += yield_add;

    env.storage().instance().set(&DataKey::ExchangeRate, &rate);
    env.storage()
        .instance()
        .set(&DataKey::LastAccrualLedger, &current);
}

fn balance_key(user: &Address) -> DataKey {
    DataKey::Balance(user.clone())
}

fn read_balance(env: &Env, user: &Address) -> i128 {
    env.storage()
        .persistent()
        .get(&balance_key(user))
        .unwrap_or(0)
}

fn write_balance(env: &Env, user: &Address, amount: i128) {
    let key = balance_key(user);
    if amount == 0 {
        env.storage().persistent().remove(&key);
    } else {
        env.storage().persistent().set(&key, &amount);
        env.storage()
            .persistent()
            .extend_ttl(&key, DAY_LEDGERS, DAY_LEDGERS);
    }
}

fn exchange_rate(env: &Env) -> i128 {
    accrue(env);
    env.storage()
        .instance()
        .get(&DataKey::ExchangeRate)
        .unwrap_or(RATE_SCALE)
}

fn shares_to_assets(env: &Env, shares: i128) -> i128 {
    shares * exchange_rate(env) / RATE_SCALE
}

fn assets_to_shares(env: &Env, assets: i128) -> i128 {
    let rate = exchange_rate(env);
    if rate == 0 {
        return 0;
    }
    assets * RATE_SCALE / rate
}

#[contractimpl]
impl SyVault {
    pub fn __constructor(env: Env, admin: Address, asset: Address, rate_bps: u64) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Asset, &asset);
        env.storage().instance().set(&DataKey::RateBps, &rate_bps);
        env.storage()
            .instance()
            .set(&DataKey::ExchangeRate, &RATE_SCALE);
        env.storage()
            .instance()
            .set(&DataKey::TotalShares, &0_i128);
        env.storage()
            .instance()
            .set(&DataKey::LastAccrualLedger, &env.ledger().sequence());
    }

    pub fn set_rate_bps(env: Env, rate_bps: u64) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        accrue(&env);
        env.storage().instance().set(&DataKey::RateBps, &rate_bps);
    }

    pub fn rate_bps(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::RateBps).unwrap_or(0)
    }

    pub fn asset(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Asset)
            .expect("not initialized")
    }

    pub fn exchange_rate_scaled(env: Env) -> i128 {
        exchange_rate(&env)
    }

    pub fn total_shares(env: Env) -> i128 {
        accrue(&env);
        env.storage()
            .instance()
            .get(&DataKey::TotalShares)
            .unwrap_or(0)
    }

    pub fn total_assets(env: Env) -> i128 {
        let total_shares = Self::total_shares(env.clone());
        shares_to_assets(&env, total_shares)
    }

    pub fn balance(env: Env, user: Address) -> i128 {
        accrue(&env);
        read_balance(&env, &user)
    }

    pub fn deposit(env: Env, from: Address, amount: i128) -> i128 {
        from.require_auth();
        if amount <= 0 {
            panic_with_error!(&env, VaultError::InvalidAmount);
        }

        accrue(&env);
        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        token::Client::new(&env, &asset).transfer(
            &from,
            &env.current_contract_address(),
            &amount,
        );

        let shares = assets_to_shares(&env, amount);
        if shares <= 0 {
            panic_with_error!(&env, VaultError::InvalidAmount);
        }

        let mut total: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalShares)
            .unwrap_or(0);
        total += shares;
        env.storage().instance().set(&DataKey::TotalShares, &total);

        let user_balance = read_balance(&env, &from) + shares;
        write_balance(&env, &from, user_balance);

        env.events().publish(
            (symbol_short!("deposit"), from),
            (amount, shares),
        );

        shares
    }

    pub fn withdraw(env: Env, to: Address, shares: i128) -> i128 {
        Self::withdraw_for(env.clone(), to.clone(), to, shares)
    }

    pub fn withdraw_for(env: Env, owner: Address, to: Address, shares: i128) -> i128 {
        owner.require_auth();
        if shares <= 0 {
            panic_with_error!(&env, VaultError::InvalidAmount);
        }

        accrue(&env);
        let owner_balance = read_balance(&env, &owner);
        if owner_balance < shares {
            panic_with_error!(&env, VaultError::InsufficientBalance);
        }

        let assets_out = shares_to_assets(&env, shares);
        let asset: Address = env.storage().instance().get(&DataKey::Asset).unwrap();
        let vault_addr = env.current_contract_address();
        let token = token::Client::new(&env, &asset);
        let vault_cash = token.balance(&vault_addr);
        if vault_cash < assets_out {
            panic_with_error!(&env, VaultError::InsufficientLiquidity);
        }

        write_balance(&env, &owner, read_balance(&env, &owner) - shares);
        let mut total: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalShares)
            .unwrap_or(0);
        total -= shares;
        env.storage().instance().set(&DataKey::TotalShares, &total);

        token.transfer(&vault_addr, &to, &assets_out);

        env.events()
            .publish((symbol_short!("withdraw"), owner, to), (shares, assets_out));

        assets_out
    }

    pub fn transfer(env: Env, from: Address, to: Address, shares: i128) {
        from.require_auth();
        if shares <= 0 {
            panic_with_error!(&env, VaultError::InvalidAmount);
        }

        accrue(&env);
        let from_balance = read_balance(&env, &from);
        if from_balance < shares {
            panic_with_error!(&env, VaultError::InsufficientBalance);
        }

        write_balance(&env, &from, from_balance - shares);
        write_balance(&env, &to, read_balance(&env, &to) + shares);

        env.events()
            .publish((symbol_short!("xfer"), from, to), shares);
    }

    pub fn transfer_from(env: Env, spender: Address, from: Address, to: Address, shares: i128) {
        spender.require_auth();
        if shares <= 0 {
            panic_with_error!(&env, VaultError::InvalidAmount);
        }

        accrue(&env);
        let from_balance = read_balance(&env, &from);
        if from_balance < shares {
            panic_with_error!(&env, VaultError::InsufficientBalance);
        }

        write_balance(&env, &from, from_balance - shares);
        write_balance(&env, &to, read_balance(&env, &to) + shares);

        env.events()
            .publish((symbol_short!("xfer_f"), spender, from, to), shares);
    }
}

mod test;
