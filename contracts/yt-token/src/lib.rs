#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, symbol_short, Address,
    Env, String, Symbol,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Minter,
    TotalSupply,
    Balance(Address),
    Name,
    Symbol,
    Decimals,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum TokenError {
    Unauthorized = 1,
    InvalidAmount = 2,
    InsufficientBalance = 3,
}

const DAY_LEDGERS: u32 = 17_280;

#[contract]
pub struct YtToken;

fn read_balance(env: &Env, id: &Address) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::Balance(id.clone()))
        .unwrap_or(0)
}

fn write_balance(env: &Env, id: &Address, amount: i128) {
    let key = DataKey::Balance(id.clone());
    if amount == 0 {
        env.storage().persistent().remove(&key);
    } else {
        env.storage().persistent().set(&key, &amount);
        env.storage()
            .persistent()
            .extend_ttl(&key, DAY_LEDGERS, DAY_LEDGERS);
    }
}

#[contractimpl]
impl YtToken {
    pub fn __constructor(
        env: Env,
        admin: Address,
        minter: Address,
        name: String,
        symbol: Symbol,
        decimals: u32,
    ) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Minter, &minter);
        env.storage().instance().set(&DataKey::TotalSupply, &0_i128);
        env.storage().instance().set(&DataKey::Name, &name);
        env.storage().instance().set(&DataKey::Symbol, &symbol);
        env.storage().instance().set(&DataKey::Decimals, &decimals);
    }

    pub fn set_minter(env: Env, minter: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage().instance().set(&DataKey::Minter, &minter);
    }

    pub fn decimals(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::Decimals).unwrap_or(7)
    }

    pub fn name(env: Env) -> String {
        env.storage().instance().get(&DataKey::Name).unwrap()
    }

    pub fn symbol(env: Env) -> Symbol {
        env.storage().instance().get(&DataKey::Symbol).unwrap()
    }

    pub fn total_supply(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0)
    }

    pub fn balance(env: Env, id: Address) -> i128 {
        read_balance(&env, &id)
    }

    pub fn mint(env: Env, to: Address, amount: i128) {
        let minter: Address = env.storage().instance().get(&DataKey::Minter).unwrap();
        minter.require_auth();
        if amount <= 0 {
            panic_with_error!(&env, TokenError::InvalidAmount);
        }

        let mut supply: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0);
        supply += amount;
        env.storage().instance().set(&DataKey::TotalSupply, &supply);
        write_balance(&env, &to, read_balance(&env, &to) + amount);

        env.events()
            .publish((symbol_short!("mint"), to), amount);
    }

    pub fn burn(env: Env, from: Address, amount: i128) {
        let minter: Address = env.storage().instance().get(&DataKey::Minter).unwrap();
        minter.require_auth();
        if amount <= 0 {
            panic_with_error!(&env, TokenError::InvalidAmount);
        }

        let balance = read_balance(&env, &from);
        if balance < amount {
            panic_with_error!(&env, TokenError::InsufficientBalance);
        }

        let mut supply: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0);
        supply -= amount;
        env.storage().instance().set(&DataKey::TotalSupply, &supply);
        write_balance(&env, &from, balance - amount);

        env.events()
            .publish((symbol_short!("burn"), from), amount);
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        if amount <= 0 {
            panic_with_error!(&env, TokenError::InvalidAmount);
        }

        let from_bal = read_balance(&env, &from);
        if from_bal < amount {
            panic_with_error!(&env, TokenError::InsufficientBalance);
        }

        write_balance(&env, &from, from_bal - amount);
        write_balance(&env, &to, read_balance(&env, &to) + amount);

        env.events()
            .publish((symbol_short!("xfer"), from, to), amount);
    }
}

mod test;
