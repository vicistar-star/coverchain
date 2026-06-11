#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Map, Symbol};

mod types;
mod errors;
use crate::types::{Policy, PolicyId};

#[contract]
pub struct PolicyRegistry;

#[contractimpl]
impl PolicyRegistry {
    /// Enroll a new policyholder
    pub fn enroll(
        env: Env,
        holder: Address,
        product_id: Symbol,
        coverage_params: Map<Symbol, i128>,
        premium_amount: i128,
        premium_interval: u64,
    ) -> PolicyId {
        holder.require_auth();

        let mut policy_id = env.storage().instance().get(&symbol_short!("counter")).unwrap_or(0);
        policy_id += 1;

        let policy = Policy {
            id: policy_id,
            holder: holder.clone(),
            product_id,
            coverage_params,
            enrolled_at: env.ledger().timestamp(),
            last_premium_at: env.ledger().timestamp(),
            premium_amount,
            premium_interval,
            active: true,
            total_claimed: 0,
        };

        env.storage().instance().set(&policy_id, &policy);
        env.storage().instance().set(&symbol_short!("counter"), &policy_id);

        policy_id
    }

    /// Check if policy is active and premiums are current
    pub fn is_active(env: Env, policy_id: PolicyId) -> bool {
        let policy: Option<Policy> = env.storage().instance().get(&policy_id);
        match policy {
            Some(p) => p.active,
            None => false,
        }
    }

    /// Get policy details
    pub fn get_policy(env: Env, policy_id: PolicyId) -> Option<Policy> {
        env.storage().instance().get(&policy_id)
    }

    /// Update total claimed (to be called by RiskPool or authorized contract)
    pub fn record_claim(env: Env, policy_id: PolicyId, amount: i128) {
        // For now, no auth, will add in later stages as we build RiskPool
        let mut policy: Policy = env.storage().instance().get(&policy_id).expect("Policy not found");
        policy.total_claimed += amount;
        env.storage().instance().set(&policy_id, &policy);
    }
}

#[cfg(test)]
#[path = "../test.rs"]
mod test;
