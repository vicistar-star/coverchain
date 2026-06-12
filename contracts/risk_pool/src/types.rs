use soroban_sdk::{contracttype, Address};

pub type PolicyId = u64;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Config {
    pub admin: Address,
    pub oracle_consensus: Address,
    pub token: Address,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PoolState {
    pub total_deposits: i128,
    pub total_payouts: i128,
    pub max_exposure: i128,
    pub paused: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PolicyBalance {
    pub deposited: i128,
    pub claimed: i128,
}
