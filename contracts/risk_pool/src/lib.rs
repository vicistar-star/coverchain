#![no_std]
use soroban_sdk::{contract, contractimpl, token, Address, Env, Symbol};

mod types;
mod errors;
use crate::types::{Config, PolicyBalance, PolicyId, PoolState};

const CONFIG_KEY: &str = "config";
const STATE_KEY: &str = "state";

#[contract]
pub struct RiskPool;

#[contractimpl]
impl RiskPool {
    pub fn initialize(env: Env, admin: Address, oracle_consensus: Address, token: Address, max_exposure: i128) {
        if env.storage().instance().has(&Symbol::new(&env, CONFIG_KEY)) {
            panic!("already initialized");
        }
        let config = Config {
            admin,
            oracle_consensus,
            token,
        };
        env.storage().instance().set(&Symbol::new(&env, CONFIG_KEY), &config);

        let state = PoolState {
            total_deposits: 0,
            total_payouts: 0,
            max_exposure,
            paused: false,
        };
        env.storage().instance().set(&Symbol::new(&env, STATE_KEY), &state);
    }

    pub fn deposit_premium(env: Env, from: Address, policy_id: PolicyId, amount: i128) {
        from.require_auth();

        if amount <= 0 {
            panic!("amount must be positive");
        }

        let config: Config = env.storage().instance().get(&Symbol::new(&env, CONFIG_KEY)).unwrap();
        let mut state: PoolState = env.storage().instance().get(&Symbol::new(&env, STATE_KEY)).unwrap();
        if state.paused {
            panic!("contract is paused");
        }

        let token_client = token::Client::new(&env, &config.token);
        token_client.transfer(&from, &env.current_contract_address(), &amount);

        state.total_deposits += amount;
        env.storage().instance().set(&Symbol::new(&env, STATE_KEY), &state);

        let mut bal: PolicyBalance = env.storage().instance().get(&policy_id).unwrap_or(PolicyBalance { deposited: 0, claimed: 0 });
        bal.deposited += amount;
        env.storage().instance().set(&policy_id, &bal);
    }

    pub fn execute_payout(env: Env, policy_id: PolicyId, recipient: Address, amount: i128, _event_id: Symbol) {
        if amount <= 0 {
            panic!("amount must be positive");
        }

        let config: Config = env.storage().instance().get(&Symbol::new(&env, CONFIG_KEY)).unwrap();
        config.oracle_consensus.require_auth();

        let mut state: PoolState = env.storage().instance().get(&Symbol::new(&env, STATE_KEY)).unwrap();
        if state.paused {
            panic!("contract is paused");
        }

        let token_client = token::Client::new(&env, &config.token);
        if token_client.balance(&env.current_contract_address()) < amount {
            panic!("insufficient pool balance");
        }

        token_client.transfer(&env.current_contract_address(), &recipient, &amount);

        state.total_payouts += amount;
        env.storage().instance().set(&Symbol::new(&env, STATE_KEY), &state);

        let mut bal: PolicyBalance = env.storage().instance().get(&policy_id).unwrap_or(PolicyBalance { deposited: 0, claimed: 0 });
        bal.claimed += amount;
        env.storage().instance().set(&policy_id, &bal);
    }

    pub fn pool_balance(env: Env) -> i128 {
        let config: Config = env.storage().instance().get(&Symbol::new(&env, CONFIG_KEY)).unwrap();
        let token_client = token::Client::new(&env, &config.token);
        token_client.balance(&env.current_contract_address())
    }

    pub fn get_health_ratio(env: Env) -> i128 {
        let state: PoolState = env.storage().instance().get(&Symbol::new(&env, STATE_KEY)).unwrap();
        let balance = Self::pool_balance(env);
        if state.max_exposure == 0 {
            return 1000;
        }
        (balance * 100) / state.max_exposure
    }

    pub fn get_policy_balance(env: Env, policy_id: PolicyId) -> PolicyBalance {
        env.storage().instance().get(&policy_id).unwrap_or(PolicyBalance { deposited: 0, claimed: 0 })
    }

    pub fn set_oracle_consensus(env: Env, new_oracle: Address) {
        let mut config: Config = env.storage().instance().get(&Symbol::new(&env, CONFIG_KEY)).unwrap();
        config.admin.require_auth();
        config.oracle_consensus = new_oracle;
        env.storage().instance().set(&Symbol::new(&env, CONFIG_KEY), &config);
    }

    pub fn set_max_exposure(env: Env, new_max: i128) {
        let config: Config = env.storage().instance().get(&Symbol::new(&env, CONFIG_KEY)).unwrap();
        config.admin.require_auth();
        let mut state: PoolState = env.storage().instance().get(&Symbol::new(&env, STATE_KEY)).unwrap();
        state.max_exposure = new_max;
        env.storage().instance().set(&Symbol::new(&env, STATE_KEY), &state);
    }

    pub fn pause(env: Env) {
        let config: Config = env.storage().instance().get(&Symbol::new(&env, CONFIG_KEY)).unwrap();
        config.admin.require_auth();
        let mut state: PoolState = env.storage().instance().get(&Symbol::new(&env, STATE_KEY)).unwrap();
        state.paused = true;
        env.storage().instance().set(&Symbol::new(&env, STATE_KEY), &state);
    }

    pub fn unpause(env: Env) {
        let config: Config = env.storage().instance().get(&Symbol::new(&env, CONFIG_KEY)).unwrap();
        config.admin.require_auth();
        let mut state: PoolState = env.storage().instance().get(&Symbol::new(&env, STATE_KEY)).unwrap();
        state.paused = false;
        env.storage().instance().set(&Symbol::new(&env, STATE_KEY), &state);
    }

    pub fn get_config(env: Env) -> Config {
        env.storage().instance().get(&Symbol::new(&env, CONFIG_KEY)).unwrap()
    }

    pub fn get_state(env: Env) -> PoolState {
        env.storage().instance().get(&Symbol::new(&env, STATE_KEY)).unwrap()
    }
}

#[cfg(test)]
#[path = "../test.rs"]
mod test;
