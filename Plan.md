
# CoverChain 10-Day Intensive Development Plan 🚀

This plan outlines 10 days of rapid development to reach approximately **65% completion** of the CoverChain MVP. The focus is on building a "Robust Foundation" where core logic, integration points, and testing frameworks are established, allowing contributors to step in and build specific features (like additional oracle providers or UI refinements).

## Completion Target (65%)
- ✅ **Contracts (90%):** All three core Soroban contracts implemented, unit-tested, and deployable.
- 🏗️ **Backend (60%):** Database schema, USSD routing, and core service layers for Stellar/Soroban interaction.
- 🏗️ **Oracle (50%):** Aggregator logic functional with at least one primary trigger (Weather).
- 🖼️ **Frontend (40%):** Dashboard skeleton, wallet connection, and mock enrollment flow.
- 🔗 **Integration (50%):** Backend-to-Contract and Oracle-to-Contract pathways verified.

---

## Daily Schedule

### Day 1: Project Foundation & PolicyRegistry Contract
**Goal:** Initialize the workspace and implement the first core contract.
**Prompt:**
> "Initialize the CoverChain project structure exactly as described in the README.md. Create the Soroban workspace and implement the `PolicyRegistry` contract in `contracts/policy_registry`. Include the data structures for `Policy` and `Product` as defined. Write unit tests to verify policy enrollment and retrieval. Ensure `Cargo.toml` is correctly configured for WASM builds."

### Day 2: RiskPool & Financial Logic
**Goal:** Implement the contract that handles the money (USDC).
**Prompt:**
> "Implement the `RiskPool` contract in `contracts/risk_pool`. It must handle premium deposits (interacting with a mock USDC token) and execute payouts. Payouts should only be authorized by a future `OracleConsensus` contract. Add unit tests for deposit logic, balance tracking, and access-controlled payouts."

### Day 3: OracleConsensus & Contract Integration
**Goal:** Implement the 2-of-3 consensus logic on-chain.
**Prompt:**
> "Implement the `OracleConsensus` contract in `contracts/oracle_consensus`. It must support oracle registration, signed event submission, and 2-of-3 consensus logic to trigger `RiskPool.execute_payout`. Write an integration test where two oracles submit matching data and a payout is successfully triggered."

### Day 4: Backend Infrastructure & Database
**Goal:** Setup the Node.js API and data persistence.
**Prompt:**
> "Set up the `backend/` directory. Initialize a Prisma schema with `User`, `Policy`, and `OracleEvent` models based on the README. Create a basic Express server with routes for `/policies` and a USSD webhook skeleton at `/ussd`. Configure Docker Compose to run a PostgreSQL instance for the backend."

### Day 5: Stellar & Soroban Service Layer
**Goal:** Create the bridge between the Backend and the Blockchain.
**Prompt:**
> "In the backend, implement the `stellar.ts` and `soroban.ts` services. Use the Stellar SDK to build functions that: 1. Generate/load keys. 2. Invoke contract methods (enroll, pay_premium) on the Testnet. 3. Listen for contract events. Ensure these services are used by the `/policies/enroll` endpoint."

### Day 6: Oracle Aggregator - Weather Module
**Goal:** Build the service that talks to the real world.
**Prompt:**
> "Set up the `oracle/` service. Implement the base `aggregator.ts` and a `weather.ts` provider that fetches data (using mocks for now, but structured for OpenWeatherMap). Create a `floodTrigger.ts` that determines if a rainfall event meets the 'Flood Shield' threshold. Ensure it can sign and submit reports to the `OracleConsensus` contract."

### Day 7: USSD Logic & Premium Scheduling
**Goal:** Finalize the core accessibility and automated tasks.
**Prompt:**
> "Implement the USSD state machine in `backend/src/routes/ussd.ts` following the flow in `docs/ussd_flows.md` (Enrollment -> Product Select). Set up a Bull/Redis queue in `backend/src/services/premiumScheduler.ts` to simulate checking for due premiums and sending reminders via mock SMS."

### Day 8: Frontend - Wallet & Dashboard Base
**Goal:** Connect the user to the blockchain visually.
**Prompt:**
> "Initialize the `frontend/` React app with Tailwind CSS. Implement the `useStellar.ts` hook for Freighter wallet connection and account balance fetching. Create a `Dashboard` page with a `PolicyCard` component that displays (mock) policy status and a 'Pay Premium' button."

### Day 9: Frontend - Enrollment Flow & Event Feed
**Goal:** Complete the primary user journey.
**Prompt:**
> "Build the multi-step `Enrollment` flow in the frontend: Product Selection -> KYC (Mock) -> Wallet Sign -> Confirmation. Add an `OracleEventFeed` component that polls the backend for recent on-chain events to show real-time payouts occurring in the network."

### Day 10: Final Integration & Contributor Guide
**Goal:** Polish, document, and prepare for handoff.
**Prompt:**
> "Write `scripts/deploy_contracts.sh` and `scripts/seed_testnet.sh` to automate environment setup. Finalize the `docs/` folder with `contract_addresses.md` and `api_reference.md`. Run a full end-to-end simulation: Enrol via USSD -> Pay via Frontend -> Trigger Flood via Oracle -> Verify Payout on-chain. Update the README with a 'Contributor Onboarding' section."
