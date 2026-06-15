#![cfg(test)]
extern crate std;

use soroban_sdk::testutils::Address as _;
use soroban_sdk::{contract, contractimpl, symbol_short, token, Address, BytesN, Env, String, Symbol};

use crate::types::{EventId, OracleEvent};

// Mock RiskPool that tracks pool balance and allows authorized payouts
mod mock_risk_pool {
    use soroban_sdk::{contract, contractimpl, token, Address, Env, Symbol};

    #[contract]
    pub struct MockRiskPool;

    #[contractimpl]
    impl MockRiskPool {
        pub fn initialize(env: Env, admin: Address, token: Address) {
            env.storage().instance().set(&Symbol::new(&env, "admin"), &admin);
            env.storage().instance().set(&Symbol::new(&env, "token"), &token);
            env.storage().instance().set(&Symbol::new(&env, "balance"), &0i128);
        }

        pub fn deposit(env: Env, from: Address, amount: i128) {
            from.require_auth();
            let token_addr: Address = env.storage().instance().get(&Symbol::new(&env, "token")).unwrap();
            let token_client = token::Client::new(&env, &token_addr);
            token_client.transfer(&from, &env.current_contract_address(), &amount);
            let bal: i128 = env.storage().instance().get(&Symbol::new(&env, "balance")).unwrap_or(0);
            env.storage().instance().set(&Symbol::new(&env, "balance"), &(bal + amount));
        }

        pub fn execute_payout(env: Env, _policy_id: u64, recipient: Address, amount: i128, _event_id: Symbol) {
            // No auth check for simplicity in tests; any contract can trigger payout
            // This mock behaves like the real RiskPool
            let token_addr: Address = env.storage().instance().get(&Symbol::new(&env, "token")).unwrap();
            let token_client = token::Client::new(&env, &token_addr);
            token_client.transfer(&env.current_contract_address(), &recipient, &amount);
            let bal: i128 = env.storage().instance().get(&Symbol::new(&env, "balance")).unwrap_or(0);
            env.storage().instance().set(&Symbol::new(&env, "balance"), &(bal - amount));
        }

        pub fn pool_balance(env: Env) -> i128 {
            env.storage().instance().get(&Symbol::new(&env, "balance")).unwrap_or(0)
        }
    }
}

fn generate_location_hash(env: &Env, val: u8) -> BytesN<32> {
    let mut arr = [0u8; 32];
    arr[0] = val;
    BytesN::from_array(env, &arr)
}

fn setup_env() -> (Env, Address, Address) {
    let env = Env::default();
    let admin = Address::generate(&env);
    let token_sac = env.register_stellar_asset_contract_v2(admin.clone());
    let token = token_sac.address();
    (env, admin, token)
}

fn init_oracle_consensus<'a>(
    env: &'a Env,
    admin: &Address,
) -> (Address, crate::OracleConsensusClient<'a>) {
    let contract_id = env.register(crate::OracleConsensus, ());
    let client = crate::OracleConsensusClient::new(env, &contract_id);
    client.initialize(admin);
    (contract_id, client)
}

fn init_mock_risk_pool<'a>(
    env: &'a Env,
    admin: &Address,
    token: &Address,
) -> (Address, mock_risk_pool::MockRiskPoolClient<'a>) {
    let contract_id = env.register(mock_risk_pool::MockRiskPool, ());
    let client = mock_risk_pool::MockRiskPoolClient::new(env, &contract_id);
    client.initialize(admin, token);
    (contract_id, client)
}

fn mint_tokens(env: &Env, token: &Address, to: &Address, amount: i128) {
    let token_admin = token::StellarAssetClient::new(env, token);
    token_admin.mint(to, &amount);
}

#[test]
fn test_initialize() {
    let (env, admin, _token) = setup_env();
    let (_id, client) = init_oracle_consensus(&env, &admin);

    let oracle_count = client.get_oracle_count();
    assert_eq!(oracle_count, 0);
}

#[test]
fn test_double_initialize_fails() {
    let (env, admin, _token) = setup_env();
    let (_id, client) = init_oracle_consensus(&env, &admin);

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.initialize(&admin);
    }));
    assert!(result.is_err());
}

#[test]
fn test_register_oracle() {
    let (env, admin, _token) = setup_env();
    let (_id, client) = init_oracle_consensus(&env, &admin);

    env.mock_all_auths();

    let oracle1 = Address::generate(&env);
    let oracle2 = Address::generate(&env);

    let idx1 = client.register_oracle(&oracle1);
    assert_eq!(idx1, 0);
    assert!(client.is_registered(&oracle1));

    let idx2 = client.register_oracle(&oracle2);
    assert_eq!(idx2, 1);
    assert!(client.is_registered(&oracle2));
    assert!(!client.is_registered(&Address::generate(&env)));

    assert_eq!(client.get_oracle_count(), 2);
}

#[test]
fn test_register_duplicate_oracle_fails() {
    let (env, admin, _token) = setup_env();
    let (_id, client) = init_oracle_consensus(&env, &admin);

    env.mock_all_auths();

    let oracle = Address::generate(&env);
    client.register_oracle(&oracle);

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.register_oracle(&oracle);
    }));
    assert!(result.is_err());
}

#[test]
fn test_register_oracle_unauthorized() {
    let (env, admin, _token) = setup_env();
    let (_id, client) = init_oracle_consensus(&env, &admin);

    // Don't mock all auths - caller is not admin
    let oracle = Address::generate(&env);
    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.register_oracle(&oracle);
    }));
    assert!(result.is_err());
}

#[test]
fn test_oracle_submission_creates_event() {
    let (env, admin, _token) = setup_env();
    let (_oc_id, client) = init_oracle_consensus(&env, &admin);

    env.mock_all_auths();

    let oracle = Address::generate(&env);
    client.register_oracle(&oracle);

    let location = generate_location_hash(&env, 0xAB);
    let event_type = symbol_short!("FLOOD");
    let evidence = String::from_str(&env, "ipfs://QmTest123");

    let event_id = client.submit_event(
        &oracle,
        &event_type,
        &location,
        &75,
        &1234567890,
        &evidence,
    );

    assert_eq!(event_id, 1);

    let event = client.get_event(&event_id);
    assert_eq!(event.event_type, event_type);
    assert_eq!(event.location_hash, location);
    assert_eq!(event.severity, 75);
    assert_eq!(event.submissions.len(), 1);
    assert!(!event.consensus_reached);
    assert!(!event.payout_triggered);
}

#[test]
fn test_consensus_reached_on_second_submission() {
    let (env, admin, _token) = setup_env();
    let (_oc_id, client) = init_oracle_consensus(&env, &admin);

    env.mock_all_auths();

    let oracle1 = Address::generate(&env);
    let oracle2 = Address::generate(&env);
    client.register_oracle(&oracle1);
    client.register_oracle(&oracle2);

    let location = generate_location_hash(&env, 0xAB);
    let event_type = symbol_short!("FLOOD");
    let evidence = String::from_str(&env, "ipfs://QmTest123");

    let event_id = client.submit_event(
        &oracle1,
        &event_type,
        &location,
        &75,
        &1234567890,
        &evidence,
    );

    let event_id2 = client.submit_event(
        &oracle2,
        &event_type,
        &location,
        &80,
        &1234567890,
        &evidence,
    );

    assert_eq!(event_id, event_id2);

    let event = client.get_event(&event_id);
    assert_eq!(event.submissions.len(), 2);
    assert!(event.consensus_reached);
}

#[test]
fn test_unregistered_oracle_cannot_submit() {
    let (env, admin, _token) = setup_env();
    let (_oc_id, client) = init_oracle_consensus(&env, &admin);

    env.mock_all_auths();

    let oracle = Address::generate(&env);
    let location = generate_location_hash(&env, 0xAB);
    let evidence = String::from_str(&env, "ipfs://QmTest");

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.submit_event(
            &oracle,
            &symbol_short!("FLOOD"),
            &location,
            &75,
            &1234567890,
            &evidence,
        );
    }));
    assert!(result.is_err());
}

#[test]
fn test_duplicate_oracle_submission_rejected() {
    let (env, admin, _token) = setup_env();
    let (_oc_id, client) = init_oracle_consensus(&env, &admin);

    env.mock_all_auths();

    let oracle = Address::generate(&env);
    client.register_oracle(&oracle);

    let location = generate_location_hash(&env, 0xAB);
    let evidence = String::from_str(&env, "ipfs://QmTest");

    client.submit_event(
        &oracle,
        &symbol_short!("FLOOD"),
        &location,
        &75,
        &1234567890,
        &evidence,
    );

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.submit_event(
            &oracle,
            &symbol_short!("FLOOD"),
            &location,
            &75,
            &1234567890,
            &evidence,
        );
    }));
    assert!(result.is_err());
}

#[test]
fn test_check_and_execute_without_consensus_fails() {
    let (env, admin, token) = setup_env();
    let (oc_id, oc_client) = init_oracle_consensus(&env, &admin);
    let (_rp_id, _rp_client) = init_mock_risk_pool(&env, &admin, &token);

    env.mock_all_auths();

    let oracle = Address::generate(&env);
    oc_client.register_oracle(&oracle);

    let location = generate_location_hash(&env, 0xAB);
    let evidence = String::from_str(&env, "ipfs://QmTest");

    let event_id = oc_client.submit_event(
        &oracle,
        &symbol_short!("FLOOD"),
        &location,
        &75,
        &1234567890,
        &evidence,
    );

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        oc_client.check_and_execute(
            &event_id,
            &Address::generate(&env),
            &1,
            &Address::generate(&env),
            &100,
        );
    }));
    assert!(result.is_err());
}

#[test]
fn test_full_integration_oracle_to_payout() {
    let (env, admin, token) = setup_env();
    env.mock_all_auths();

    // Deploy OracleConsensus
    let (oc_id, oc_client) = init_oracle_consensus(&env, &admin);

    // Deploy MockRiskPool
    let (rp_id, rp_client) = init_mock_risk_pool(&env, &admin, &token);

    // Register 3 oracles
    let oracle1 = Address::generate(&env);
    let oracle2 = Address::generate(&env);
    let oracle3 = Address::generate(&env);

    oc_client.register_oracle(&oracle1);
    oc_client.register_oracle(&oracle2);
    oc_client.register_oracle(&oracle3);

    // A user deposits premium into MockRiskPool
    let user = Address::generate(&env);
    mint_tokens(&env, &token, &user, 10_000);
    rp_client.deposit(&user, &5_000);
    assert_eq!(rp_client.pool_balance(), 5_000);

    // Oracle 1 submits a flood event
    let location = generate_location_hash(&env, 0x42);
    let evidence = String::from_str(&env, "ipfs://QmFloodData");
    let event_id = oc_client.submit_event(
        &oracle1,
        &symbol_short!("FLOOD"),
        &location,
        &85,
        &1234567890,
        &evidence,
    );

    // Oracle 2 submits the same event -> consensus reached
    let event_id2 = oc_client.submit_event(
        &oracle2,
        &symbol_short!("FLOOD"),
        &location,
        &82,
        &1234567890,
        &evidence,
    );
    assert_eq!(event_id, event_id2);

    let event = oc_client.get_event(&event_id);
    assert!(event.consensus_reached);
    assert!(!event.payout_triggered);

    // Admin triggers payout via check_and_execute
    let recipient = Address::generate(&env);
    let executed = oc_client.check_and_execute(
        &event_id,
        &rp_id,
        &1,
        &recipient,
        &1_000,
    );
    assert!(executed);

    // Verify payout happened
    let event = oc_client.get_event(&event_id);
    assert!(event.payout_triggered);

    let pool_bal = rp_client.pool_balance();
    assert_eq!(pool_bal, 4_000);

    let user_bal = token::Client::new(&env, &token).balance(&recipient);
    assert_eq!(user_bal, 1_000);
}

#[test]
fn test_double_payout_fails() {
    let (env, admin, token) = setup_env();
    let (oc_id, oc_client) = init_oracle_consensus(&env, &admin);
    let (rp_id, rp_client) = init_mock_risk_pool(&env, &admin, &token);

    env.mock_all_auths();

    let funder = Address::generate(&env);
    mint_tokens(&env, &token, &funder, 10_000);
    rp_client.deposit(&funder, &5_000);

    let oracle1 = Address::generate(&env);
    let oracle2 = Address::generate(&env);
    oc_client.register_oracle(&oracle1);
    oc_client.register_oracle(&oracle2);

    let location = generate_location_hash(&env, 0x42);
    let evidence = String::from_str(&env, "ipfs://QmTest");

    let event_id = oc_client.submit_event(
        &oracle1,
        &symbol_short!("FLOOD"),
        &location,
        &85,
        &1234567890,
        &evidence,
    );
    oc_client.submit_event(
        &oracle2,
        &symbol_short!("FLOOD"),
        &location,
        &82,
        &1234567890,
        &evidence,
    );

    oc_client.check_and_execute(
        &event_id,
        &rp_id,
        &1,
        &Address::generate(&env),
        &100,
    );

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        oc_client.check_and_execute(
            &event_id,
            &rp_id,
            &1,
            &Address::generate(&env),
            &100,
        );
    }));
    assert!(result.is_err());
}

#[test]
fn test_multiple_oracle_submissions_same_period() {
    let (env, admin, _token) = setup_env();
    let (_oc_id, client) = init_oracle_consensus(&env, &admin);

    env.mock_all_auths();

    let oracle1 = Address::generate(&env);
    let oracle2 = Address::generate(&env);
    let oracle3 = Address::generate(&env);
    client.register_oracle(&oracle1);
    client.register_oracle(&oracle2);
    client.register_oracle(&oracle3);

    let location = generate_location_hash(&env, 0xAA);
    let evidence = String::from_str(&env, "ipfs://QmMulti");

    // All three oracles submit, but only 2 needed for consensus
    let eid1 = client.submit_event(&oracle1, &symbol_short!("FLOOD"), &location, &90, &1000000, &evidence);
    let eid2 = client.submit_event(&oracle2, &symbol_short!("FLOOD"), &location, &88, &1000000, &evidence);
    let eid3 = client.submit_event(&oracle3, &symbol_short!("FLOOD"), &location, &92, &1000000, &evidence);

    // All return same event_id
    assert_eq!(eid1, eid2);
    assert_eq!(eid2, eid3);

    let event = client.get_event(&eid1);
    assert_eq!(event.submissions.len(), 3);
    assert!(event.consensus_reached);
}
