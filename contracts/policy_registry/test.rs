#![cfg(test)]
use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::{symbol_short, Address, Env, Map};

#[test]
fn test_enrollment() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PolicyRegistry);
    let client = PolicyRegistryClient::new(&env, &contract_id);

    let holder = Address::generate(&env);
    let product_id = symbol_short!("FLOOD");
    let mut coverage_params = Map::new(&env);
    coverage_params.set(symbol_short!("lat"), 64550);
    coverage_params.set(symbol_short!("lng"), 33841);

    let premium_amount = 500;
    let premium_interval = 604800; // 1 week

    env.mock_all_auths();

    let policy_id = client.enroll(
        &holder,
        &product_id,
        &coverage_params,
        &premium_amount,
        &premium_interval,
    );

    assert_eq!(policy_id, 1);
    assert!(client.is_active(&policy_id));

    let policy = client.get_policy(&policy_id).unwrap();
    assert_eq!(policy.holder, holder);
    assert_eq!(policy.product_id, product_id);
    assert_eq!(policy.premium_amount, premium_amount);
}

#[test]
fn test_multiple_enrollments() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PolicyRegistry);
    let client = PolicyRegistryClient::new(&env, &contract_id);

    let holder_1 = Address::generate(&env);
    let holder_2 = Address::generate(&env);
    
    let product_id = symbol_short!("FLOOD");
    let coverage_params = Map::new(&env);
    let premium_amount = 500;
    let premium_interval = 604800;

    env.mock_all_auths();

    let id_1 = client.enroll(&holder_1, &product_id, &coverage_params, &premium_amount, &premium_interval);
    let id_2 = client.enroll(&holder_2, &product_id, &coverage_params, &premium_amount, &premium_interval);

    assert_eq!(id_1, 1);
    assert_eq!(id_2, 2);
}

#[test]
fn test_record_claim() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PolicyRegistry);
    let client = PolicyRegistryClient::new(&env, &contract_id);

    let holder = Address::generate(&env);
    env.mock_all_auths();

    let policy_id = client.enroll(
        &holder,
        &symbol_short!("FLOOD"),
        &Map::new(&env),
        &500,
        &604800,
    );

    client.record_claim(&policy_id, &100);
    let policy = client.get_policy(&policy_id).unwrap();
    assert_eq!(policy.total_claimed, 100);

    client.record_claim(&policy_id, &200);
    let policy = client.get_policy(&policy_id).unwrap();
    assert_eq!(policy.total_claimed, 300);
}
