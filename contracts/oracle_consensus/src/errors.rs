use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotAuthorized = 1,
    OracleAlreadyRegistered = 2,
    OracleNotFound = 3,
    EventNotFound = 4,
    ConsensusAlreadyReached = 5,
    InsufficientConsensus = 6,
    PayoutAlreadyTriggered = 7,
}
