#![cfg(test)]

use super::{Market, MarketClient, SyVault, SyVaultClient};
use pt_token::{PtToken, PtTokenClient};
use soroban_sdk::{
    testutils::{Address as _, Ledger, LedgerInfo},
    token::StellarAssetClient,
    Address, Env, String,
};
use yt_token::{YtToken, YtTokenClient};

fn setup(env: &Env) -> (Address, SyVaultClient<'_>, MarketClient<'_>, PtTokenClient<'_>, YtTokenClient<'_>) {
    env.mock_all_auths();

    let admin = Address::generate(env);
    let user = Address::generate(env);
    let asset_admin = Address::generate(env);
    let asset = env.register_stellar_asset_contract_v2(asset_admin.clone());
    let asset_addr = asset.address();

    let vault_id = env.register(SyVault, ());
    let vault = SyVaultClient::new(env, &vault_id);
    vault.__constructor(&admin, &asset_addr, &800u64);

    let pt_id = env.register(PtToken, ());
    let pt = PtTokenClient::new(env, &pt_id);
    pt.__constructor(
        &admin,
        &Address::generate(env),
        &String::from_str(env, "Principal Token"),
        &soroban_sdk::symbol_short!("PT"),
        &7u32,
    );

    let yt_id = env.register(YtToken, ());
    let yt = YtTokenClient::new(env, &yt_id);
    yt.__constructor(
        &admin,
        &Address::generate(env),
        &String::from_str(env, "Yield Token"),
        &soroban_sdk::symbol_short!("YT"),
        &7u32,
    );

    let market_id = env.register(Market, ());
    let market = MarketClient::new(env, &market_id);
    let maturity = env.ledger().sequence() + 1000;
    market.__constructor(&admin, &vault_id, &pt_id, &yt_id, &maturity);

    pt.set_minter(&market_id);
    yt.set_minter(&market_id);

    StellarAssetClient::new(env, &asset_addr).mint(&user, &20_000_000_000i128);
    vault.deposit(&user, &10_000_000_000i128);

    (user, vault, market, pt, yt)
}

#[test]
fn strip_mints_equal_pt_and_yt() {
    let env = Env::default();
    let (user, vault, market, pt, yt) = setup(&env);

    market.strip(&user, &4_000_000_000i128);

    assert_eq!(pt.balance(&user), 4_000_000_000);
    assert_eq!(yt.balance(&user), 4_000_000_000);
    assert_eq!(vault.balance(&user), 6_000_000_000);
    assert_eq!(market.locked_shares(), 4_000_000_000);
}

#[test]
fn merge_returns_sy() {
    let env = Env::default();
    let (user, vault, market, pt, yt) = setup(&env);

    market.strip(&user, &2_000_000_000i128);
    market.merge(&user, &2_000_000_000i128);

    assert_eq!(pt.balance(&user), 0);
    assert_eq!(yt.balance(&user), 0);
    assert_eq!(vault.balance(&user), 10_000_000_000);
    assert_eq!(market.locked_shares(), 0);
}

#[test]
fn claim_yield_after_accrual() {
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

    let (user, _, market, _, _) = setup(&env);
    market.strip(&user, &5_000_000_000i128);

    env.ledger().advance(6_307_200);
    let claimable = market.claimable_yield(&user);
    assert!(claimable > 0);

    let paid = market.claim_yield(&user);
    assert_eq!(paid, claimable);
}

#[test]
fn redeem_pt_after_maturity() {
    let env = Env::default();
    let (user, vault, market, pt, _) = setup(&env);

    market.strip(&user, &3_000_000_000i128);
    let maturity = market.maturity_ledger();
    env.ledger().set_sequence_number(maturity);
    market.sweep_matured();

    let before = vault.balance(&user);
    market.redeem_pt(&user, &3_000_000_000i128);
    assert_eq!(pt.balance(&user), 0);
    assert_eq!(vault.balance(&user), before + 3_000_000_000);
}
