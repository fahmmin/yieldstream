#![cfg(test)]

use super::{SyVault, SyVaultClient, RATE_SCALE, LEDGERS_PER_YEAR};
use soroban_sdk::{
    testutils::{Address as _, Ledger, LedgerInfo},
    token::{StellarAssetClient, TokenClient},
    Address, Env,
};

fn setup(env: &Env) -> (Address, Address, Address, SyVaultClient<'_>) {
    env.mock_all_auths();
    let admin = Address::generate(env);
    let user = Address::generate(env);

    let asset_admin = Address::generate(env);
    let asset = env.register_stellar_asset_contract_v2(asset_admin.clone());
    let asset_addr = asset.address();

    let vault_id = env.register(SyVault, ());
    let vault = SyVaultClient::new(env, &vault_id);

    vault.__constructor(&admin, &asset_addr, &800u64);

    let stellar = StellarAssetClient::new(env, &asset_addr);
    stellar.mint(&user, &10_000_000_000i128);

    (user, asset_addr, vault_id, vault)
}

#[test]
fn deposit_mints_shares_one_to_one_initially() {
    let env = Env::default();
    let (user, _, _, vault) = setup(&env);

    let shares = vault.deposit(&user, &1_000_000_000i128);
    assert_eq!(shares, 1_000_000_000);
    assert_eq!(vault.balance(&user), 1_000_000_000);
    assert_eq!(vault.total_assets(), 1_000_000_000);
}

#[test]
fn withdraw_returns_principal() {
    let env = Env::default();
    let (user, _, _, vault) = setup(&env);

    vault.deposit(&user, &2_000_000_000i128);
    let assets = vault.withdraw(&user, &1_000_000_000i128);
    assert_eq!(assets, 1_000_000_000);
    assert_eq!(vault.balance(&user), 1_000_000_000);
}

#[test]
fn accrual_increases_total_assets() {
    let env = Env::default();
    env.ledger().set(LedgerInfo {
        sequence_number: 1,
        protocol_version: 22,
        timestamp: 1,
        network_id: Default::default(),
        base_reserve: 10,
        min_temp_entry_ttl: 16,
        min_persistent_entry_ttl: 16,
        max_entry_ttl: 631_200,
    });

    let (user, _, _, vault) = setup(&env);
    vault.deposit(&user, &1_000_000_000i128);

    let before = vault.total_assets();
    env.ledger().advance(LEDGERS_PER_YEAR);
    let after = vault.total_assets();

    assert!(after > before);
    assert!(after >= before + before * 8 / 100);
}

#[test]
fn transfer_moves_shares() {
    let env = Env::default();
    let (user, _, _, vault) = setup(&env);
    let recipient = Address::generate(&env);

    vault.deposit(&user, &500_000_000i128);
    vault.transfer(&user, &recipient, &200_000_000i128);

    assert_eq!(vault.balance(&user), 300_000_000);
    assert_eq!(vault.balance(&recipient), 200_000_000);
}

#[test]
#[should_panic(expected = "Error(Contract, #4)")]
fn withdraw_over_balance_fails() {
    let env = Env::default();
    let (user, _, _, vault) = setup(&env);
    vault.deposit(&user, &100i128);
    vault.withdraw(&user, &200i128);
}
