#![cfg(test)]

use super::{YtToken, YtTokenClient};
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn mint_and_burn() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let minter = Address::generate(&env);
    let user = Address::generate(&env);

    let id = env.register(YtToken, ());
    let token = YtTokenClient::new(&env, &id);
    token.__constructor(
        &admin,
        &minter,
        &String::from_str(&env, "YT"),
        &soroban_sdk::symbol_short!("YT"),
        &7,
    );
    token.set_minter(&minter);

    token.mint(&user, &500);
    token.burn(&user, &200);

    assert_eq!(token.balance(&user), 300);
    assert_eq!(token.total_supply(), 300);
}
