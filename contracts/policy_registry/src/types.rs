use soroban_sdk::{contracttype, Address, Map, Symbol};

pub type PolicyId = u64;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Policy {
    pub id: PolicyId,
    pub holder: Address,
    pub product_id: Symbol,
    pub coverage_params: Map<Symbol, i128>, // Using i128 for generic params like lat/lng or IDs
    pub enrolled_at: u64,
    pub last_premium_at: u64,
    pub premium_amount: i128,
    pub premium_interval: u64,
    pub active: bool,
    pub total_claimed: i128,
}
