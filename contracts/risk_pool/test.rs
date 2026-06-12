#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{symbol_short, token, Address, Env};

mod mock_oracle {
    use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env};

    #[contract]
    pub struct MockOracle;

    #[contractimpl]
    impl MockOracle {
        pub fn trigger_payout(
            env: Env,
            risk_pool: Address,
            policy_id: u64,
            recipient: Address,
            amount: i128,
        ) {
            env.current_contract_address().require_auth();
            let client = super::RiskPoolClient::new(&env, &risk_pool);
            client.execute_payout(&policy_id, &recipient, &amount, &symbol_short!("event"));
        }
    }
}

fn setup_env() -> (Env, Address, Address) {
    let env = Env::default();
    let admin = Address::generate(&env);
    let token_sac = env.register_stellar_asset_contract_v2(admin.clone());
    let token = token_sac.address();
    (env, admin, token)
}

fn init_pool<'a>(env: &'a Env, admin: &Address, oracle: &Address, token: &Address) -> (Address, RiskPoolClient<'a>) {
    let contract_id = env.register(RiskPool, ());
    let client = RiskPoolClient::new(env, &contract_id);
    client.initialize(admin, oracle, token, &100_000_000);
    (contract_id, client)
}

fn mint_tokens(env: &Env, token: &Address, to: &Address, amount: i128) {
    let token_admin = token::StellarAssetClient::new(env, token);
    token_admin.mint(to, &amount);
}

#[test]
fn test_deposit_premium() {
    let (env, admin, token) = setup_env();
    let oracle = Address::generate(&env);
    let (_pool_id, client) = init_pool(&env, &admin, &oracle, &token);

    let user = Address::generate(&env);
    env.mock_all_auths();
    mint_tokens(&env, &token, &user, 1000);

    client.deposit_premium(&user, &1, &500);

    assert_eq!(client.pool_balance(), 500);
    let state = client.get_state();
    assert_eq!(state.total_deposits, 500);
    assert_eq!(state.total_payouts, 0);

    let bal = client.get_policy_balance(&1);
    assert_eq!(bal.deposited, 500);
    assert_eq!(bal.claimed, 0);
}

#[test]
fn test_multiple_deposits() {
    let (env, admin, token) = setup_env();
    let oracle = Address::generate(&env);
    let (_pool_id, client) = init_pool(&env, &admin, &oracle, &token);

    let user = Address::generate(&env);
    env.mock_all_auths();
    mint_tokens(&env, &token, &user, 2000);

    client.deposit_premium(&user, &1, &300);
    assert_eq!(client.pool_balance(), 300);

    client.deposit_premium(&user, &1, &700);
    assert_eq!(client.pool_balance(), 1000);

    let state = client.get_state();
    assert_eq!(state.total_deposits, 1000);
}

#[test]
fn test_multiple_policies_deposits() {
    let (env, admin, token) = setup_env();
    let oracle = Address::generate(&env);
    let (_pool_id, client) = init_pool(&env, &admin, &oracle, &token);

    let user = Address::generate(&env);
    env.mock_all_auths();
    mint_tokens(&env, &token, &user, 3000);

    client.deposit_premium(&user, &1, &500);
    client.deposit_premium(&user, &2, &1000);
    client.deposit_premium(&user, &1, &200);

    assert_eq!(client.pool_balance(), 1700);
    assert_eq!(client.get_policy_balance(&1).deposited, 700);
    assert_eq!(client.get_policy_balance(&2).deposited, 1000);
}

#[test]
fn test_payout_authorized() {
    let (env, admin, token) = setup_env();

    let oracle_id = env.register(mock_oracle::MockOracle, ());
    let oracle_client = mock_oracle::MockOracleClient::new(&env, &oracle_id);

    let (risk_pool_id, client) = init_pool(&env, &admin, &oracle_id, &token);

    let user = Address::generate(&env);
    env.mock_all_auths();
    mint_tokens(&env, &token, &user, 1000);

    client.deposit_premium(&user, &1, &1000);
    assert_eq!(client.pool_balance(), 1000);

    let recipient = Address::generate(&env);
    oracle_client.trigger_payout(&risk_pool_id, &1, &recipient, &400);

    assert_eq!(client.pool_balance(), 600);
    assert_eq!(token::Client::new(&env, &token).balance(&recipient), 400);

    let state = client.get_state();
    assert_eq!(state.total_payouts, 400);

    let bal = client.get_policy_balance(&1);
    assert_eq!(bal.claimed, 400);
}

#[test]
fn test_payout_unauthorized() {
    let (env, admin, token) = setup_env();
    let oracle = Address::generate(&env);
    let (_pool_id, client) = init_pool(&env, &admin, &oracle, &token);

    let user = Address::generate(&env);
    env.mock_all_auths();
    mint_tokens(&env, &token, &user, 1000);

    client.deposit_premium(&user, &1, &1000);

    // Clear mocked auths so oracle_consensus check will fail
    env.set_auths(&[]);

    let recipient = Address::generate(&env);
    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.execute_payout(&1, &recipient, &100, &symbol_short!("evt1"));
    }));
    assert!(result.is_err());
}

#[test]
fn test_set_oracle_consensus() {
    let (env, admin, token) = setup_env();
    let old_oracle = Address::generate(&env);
    let (_pool_id, client) = init_pool(&env, &admin, &old_oracle, &token);

    let new_oracle_id = env.register(mock_oracle::MockOracle, ());
    let _new_oracle_client = mock_oracle::MockOracleClient::new(&env, &new_oracle_id);

    env.mock_all_auths();
    client.set_oracle_consensus(&new_oracle_id);

    let config = client.get_config();
    assert_eq!(config.oracle_consensus, new_oracle_id);
}

#[test]
fn test_payout_insufficient_balance() {
    let (env, admin, token) = setup_env();
    let oracle_id = env.register(mock_oracle::MockOracle, ());
    let oracle_client = mock_oracle::MockOracleClient::new(&env, &oracle_id);

    let (risk_pool_id, client) = init_pool(&env, &admin, &oracle_id, &token);

    let user = Address::generate(&env);
    env.mock_all_auths();
    mint_tokens(&env, &token, &user, 1000);

    client.deposit_premium(&user, &1, &100);

    let recipient = Address::generate(&env);
    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        oracle_client.trigger_payout(&risk_pool_id, &1, &recipient, &500);
    }));
    assert!(result.is_err());
}

#[test]
fn test_health_ratio() {
    let (env, admin, token) = setup_env();
    let oracle = Address::generate(&env);
    let (_, client) = init_pool(&env, &admin, &oracle, &token);

    let user = Address::generate(&env);
    env.mock_all_auths();
    mint_tokens(&env, &token, &user, 5000);

    client.deposit_premium(&user, &1, &2000);

    // pool_balance=2000, max_exposure=100_000_000 => (2000*100)/100_000_000 = 0
    let ratio = client.get_health_ratio();
    assert_eq!(ratio, 0);
}

#[test]
fn test_pause_unpause() {
    let (env, admin, token) = setup_env();
    let oracle = Address::generate(&env);
    let (_pool_id, client) = init_pool(&env, &admin, &oracle, &token);

    env.mock_all_auths();

    client.pause();
    let state = client.get_state();
    assert!(state.paused);

    let user = Address::generate(&env);
    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.deposit_premium(&user, &1, &100);
    }));
    assert!(result.is_err());

    client.unpause();
    let state = client.get_state();
    assert!(!state.paused);
}

#[test]
fn test_set_max_exposure() {
    let (env, admin, token) = setup_env();
    let oracle = Address::generate(&env);
    let (_pool_id, client) = init_pool(&env, &admin, &oracle, &token);

    env.mock_all_auths();
    client.set_max_exposure(&500_000);
    let state = client.get_state();
    assert_eq!(state.max_exposure, 500_000);
}
