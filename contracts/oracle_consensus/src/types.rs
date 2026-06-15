use soroban_sdk::{contracttype, Address, BytesN, String, Symbol, Vec};

pub type EventId = u64;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct OracleSubmission {
    pub oracle: Address,
    pub severity: u32,
    pub evidence_cid: String,
    pub submitted_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct OracleEvent {
    pub id: EventId,
    pub event_type: Symbol,
    pub location_hash: BytesN<32>,
    pub severity: u32,
    pub submissions: Vec<OracleSubmission>,
    pub consensus_reached: bool,
    pub payout_triggered: bool,
    pub created_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EventLookupKey {
    pub event_type: Symbol,
    pub location_hash: BytesN<32>,
    pub period: u64,
}
