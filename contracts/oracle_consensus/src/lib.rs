#![no_std]
use soroban_sdk::{contract, contractclient, contractimpl, contracttype, Address, BytesN, Env, String, Symbol, Vec};

mod types;
mod errors;
use crate::types::{EventId, EventLookupKey, OracleEvent, OracleSubmission};

const CONSENSUS_WINDOW: u64 = 21600;
const REQUIRED_CONSENSUS: u32 = 2;

const ADMIN_KEY: &str = "admin";
const ORACLE_COUNT_KEY: &str = "orc_cnt";
const EVENT_COUNTER_KEY: &str = "evt_cnt";

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
enum DataKey {
    Oracle(u32),
    Event(EventId),
    EventLookup(EventLookupKey),
    EventToLookupKey(EventId),
}

#[contractclient(name = "ExternalRiskPoolClient")]
pub trait ExternalRiskPool {
    fn execute_payout(
        env: Env,
        policy_id: u64,
        recipient: Address,
        amount: i128,
        event_id: Symbol,
    );
}

#[contract]
pub struct OracleConsensus;

#[contractimpl]
impl OracleConsensus {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&Symbol::new(&env, ADMIN_KEY)) {
            panic!("already initialized");
        }
        env.storage().instance().set(&Symbol::new(&env, ADMIN_KEY), &admin);
    }

    pub fn register_oracle(env: Env, oracle: Address) -> u32 {
        let admin: Address = env.storage().instance().get(&Symbol::new(&env, ADMIN_KEY)).unwrap();
        admin.require_auth();

        let count: u32 = env.storage().instance().get(&Symbol::new(&env, ORACLE_COUNT_KEY)).unwrap_or(0);
        for i in 0..count {
            let stored: Address = env.storage().instance().get(&DataKey::Oracle(i)).unwrap();
            if stored == oracle {
                panic!("oracle already registered");
            }
        }

        env.storage().instance().set(&DataKey::Oracle(count), &oracle);
        let new_idx = count + 1;
        env.storage().instance().set(&Symbol::new(&env, ORACLE_COUNT_KEY), &new_idx);
        count
    }

    pub fn is_registered(env: Env, oracle: Address) -> bool {
        let count: u32 = env.storage().instance().get(&Symbol::new(&env, ORACLE_COUNT_KEY)).unwrap_or(0);
        for i in 0..count {
            let stored: Address = env.storage().instance().get(&DataKey::Oracle(i)).unwrap();
            if stored == oracle {
                return true;
            }
        }
        false
    }

    pub fn get_oracle_count(env: Env) -> u32 {
        env.storage().instance().get(&Symbol::new(&env, ORACLE_COUNT_KEY)).unwrap_or(0)
    }

    pub fn submit_event(
        env: Env,
        oracle: Address,
        event_type: Symbol,
        location_hash: BytesN<32>,
        severity: u32,
        timestamp: u64,
        evidence_cid: String,
    ) -> EventId {
        oracle.require_auth();
        if !Self::is_registered(env.clone(), oracle.clone()) {
            panic!("oracle not registered");
        }

        let period = timestamp / CONSENSUS_WINDOW;
        let lookup_key = EventLookupKey {
            event_type: event_type.clone(),
            location_hash: location_hash.clone(),
            period,
        };

        let existing_event_id: Option<EventId> =
            env.storage().instance().get(&DataKey::EventLookup(lookup_key.clone()));

        if let Some(eid) = existing_event_id {
            let mut event: OracleEvent = env.storage().instance().get(&DataKey::Event(eid)).unwrap();
            if event.payout_triggered {
                panic!("payout already triggered for this event");
            }
            for sub in event.submissions.iter() {
                if sub.oracle == oracle {
                    panic!("oracle already submitted to this event");
                }
            }
            let submission = OracleSubmission {
                oracle: oracle.clone(),
                severity,
                evidence_cid: evidence_cid.clone(),
                submitted_at: env.ledger().timestamp(),
            };
            event.submissions.push_back(submission);
            event.severity = severity;
            if event.submissions.len() >= REQUIRED_CONSENSUS {
                event.consensus_reached = true;
            }
            env.storage().instance().set(&DataKey::Event(eid), &event);
            eid
        } else {
            let counter: EventId =
                env.storage().instance().get(&Symbol::new(&env, EVENT_COUNTER_KEY)).unwrap_or(0);
            let new_id = counter + 1;

            let mut submissions: Vec<OracleSubmission> = Vec::new(&env);
            let submission = OracleSubmission {
                oracle: oracle.clone(),
                severity,
                evidence_cid: evidence_cid.clone(),
                submitted_at: env.ledger().timestamp(),
            };
            submissions.push_back(submission);

            let event = OracleEvent {
                id: new_id,
                event_type: event_type.clone(),
                location_hash: location_hash.clone(),
                severity,
                submissions,
                consensus_reached: false,
                payout_triggered: false,
                created_at: env.ledger().timestamp(),
            };
            env.storage().instance().set(&DataKey::Event(new_id), &event);
            env.storage().instance().set(&DataKey::EventLookup(lookup_key.clone()), &new_id);
            env.storage().instance().set(&DataKey::EventToLookupKey(new_id), &lookup_key);
            env.storage().instance().set(&Symbol::new(&env, EVENT_COUNTER_KEY), &new_id);
            new_id
        }
    }

    pub fn check_and_execute(
        env: Env,
        event_id: EventId,
        risk_pool: Address,
        policy_id: u64,
        recipient: Address,
        amount: i128,
    ) -> bool {
        let admin: Address = env.storage().instance().get(&Symbol::new(&env, ADMIN_KEY)).unwrap();
        admin.require_auth();

        let mut event: OracleEvent = env.storage().instance().get(&DataKey::Event(event_id)).unwrap();
        if !event.consensus_reached {
            panic!("consensus not reached");
        }
        if event.payout_triggered {
            panic!("payout already triggered");
        }

        let client = ExternalRiskPoolClient::new(&env, &risk_pool);
        client.execute_payout(&policy_id, &recipient, &amount, &event.event_type);

        event.payout_triggered = true;
        env.storage().instance().set(&DataKey::Event(event_id), &event);
        true
    }

    pub fn get_event(env: Env, event_id: EventId) -> OracleEvent {
        env.storage().instance().get(&DataKey::Event(event_id)).unwrap()
    }
}

#[cfg(test)]
#[path = "../test.rs"]
mod test;
