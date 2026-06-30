#![cfg(test)]

use super::{PtToken, PtTokenClient};
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn mint_and_transfer() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let minter = Address::generate(&env);
    let user = Address::generate(&env);
    let recipient = Address::generate(&env);

    let id = env.register(PtToken, ());
    let token = PtTokenClient::new(&env, &id);
    token.__constructor(
        &admin,
        &minter,
        &String::from_str(&env, "PT"),
        &soroban_sdk::symbol_short!("PT"),
        &7,
    );
    token.set_minter(&minter);

    token.mint(&user, &1000);
    token.transfer(&user, &recipient, &400);

    assert_eq!(token.balance(&user), 600);
    assert_eq!(token.balance(&recipient), 400);
}
