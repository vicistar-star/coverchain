# CoverChain 🛡️

> **Parametric Microinsurance for Informal Workers — Powered by Stellar & Soroban**

[![Stellar](https://img.shields.io/badge/Built%20on-Stellar-7B61FF?style=flat-square&logo=stellar)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Smart%20Contracts-Soroban-00B4D8?style=flat-square)](https://soroban.stellar.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![SDF Grant](https://img.shields.io/badge/SDF-Grant%20Applicant-FFD700?style=flat-square)](https://stellar.org/grants)
[![Network](https://img.shields.io/badge/Network-Testnet%20%7C%20Mainnet-blue?style=flat-square)]()

---

## Table of Contents

- [Overview](#overview)
- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [How It Works](#how-it-works)
- [Insurance Products](#insurance-products)
- [Architecture](#architecture)
- [Smart Contract Design](#smart-contract-design)
- [Oracle System](#oracle-system)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running Tests](#running-tests)
- [Deployment](#deployment)
- [API Reference](#api-reference)
- [Frontend](#frontend)
- [USSD Interface](#ussd-interface)
- [Stellar Integration](#stellar-integration)
- [Security](#security)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**CoverChain** is a decentralized parametric microinsurance platform built on the Stellar blockchain using Soroban smart contracts. It provides instant, automated insurance coverage to the **40M+ informal workers** in Nigeria — market traders, motorcycle taxi (okada) riders, artisans, and smallholder farmers — who have historically been excluded from financial protection.

Traditional insurance requires a bank account, complex paperwork, and a claims adjuster. CoverChain replaces all of that with **transparent smart contracts**, **real-world data oracles**, and **instant USDC payouts** delivered straight to a mobile wallet — no bank account required.

> **Mission:** Make insurance as easy to access as sending an SMS, and as trustworthy as math.

---

## The Problem

Nigeria's informal economy is one of the largest in Africa, yet it is almost entirely uninsured:

| Metric | Value |
|---|---|
| Informal workers in Nigeria | ~40 million |
| Insurance penetration (Nigeria) | ~0.5% of GDP |
| Insurance penetration (Global avg) | ~7% of GDP |
| Workers with any form of insurance | < 3% |
| Average annual income (informal worker) | $800–$2,400 |

**Why traditional insurance fails this population:**

- **Premiums are too small** — collecting ₦500/week is uneconomical on traditional banking rails
- **Claims are too slow** — adjusters, documentation, and bank transfers take weeks to months
- **No bank account** — most informal workers operate entirely in cash or mobile money
- **Language & literacy barriers** — complex policy documents are inaccessible
- **Trust deficit** — historical experience of claim denials has destroyed confidence in insurers
- **No credit history** — standard underwriting models cannot assess risk

The result: when a flood wipes out a market trader's inventory, when an okada rider is injured, when a crop fails — there is no safety net. Families fall into poverty cycles that persist for generations.

---

## The Solution

CoverChain solves each of these problems directly:

| Problem | CoverChain Solution |
|---|---|
| Premiums too small | Stellar's ~$0.00001/tx fee makes micropremiums economical |
| Claims too slow | Soroban smart contracts trigger payouts automatically in seconds |
| No bank account | USDC delivered via mobile money anchors (YellowCard, Flutterwave) |
| Language barriers | USSD interface works on any mobile phone, in local language |
| Trust deficit | Fully transparent on-chain rules — anyone can audit the contract |
| No underwriting | Parametric model requires no credit history — only event verification |

**Parametric insurance** is the key innovation: instead of reimbursing actual losses (which requires assessment), CoverChain pays a **fixed amount when a verifiable event occurs**. No adjuster. No paperwork. No disputes.

---

## How It Works

```
┌─────────────────────────────────────────────────────────────────────┐
│                         COVERCHAIN FLOW                             │
└─────────────────────────────────────────────────────────────────────┘

  1. ENROLL          2. PAY PREMIUM         3. EVENT OCCURS
  ┌──────────┐       ┌──────────────┐       ┌──────────────────┐
  │  Worker  │──────▶│  USSD / App  │──────▶│  Real World      │
  │  dials   │       │  ₦500/week   │       │  (flood, crash,  │
  │  *384#   │       │  via mobile  │       │   crop failure)  │
  └──────────┘       └──────────────┘       └────────┬─────────┘
                                                      │
  4. ORACLE CONFIRMS                    5. CONTRACT PAYS OUT
  ┌──────────────────────────┐          ┌─────────────────────────┐
  │  2-of-3 Oracle Consensus │          │  Soroban Contract       │
  │  • Weather API           │─────────▶│  auto-releases USDC     │
  │  • Satellite (NDVI)      │          │  to worker's wallet     │
  │  • Hospital/Gov feed     │          │  within 60 seconds      │
  └──────────────────────────┘          └─────────────────────────┘
                                                      │
                                         6. WORKER RECEIVES
                                         ┌─────────────────────────┐
                                         │  Mobile money (M-Pesa,  │
                                         │  OPay, Kuda, YellowCard)│
                                         │  or XLM/USDC wallet     │
                                         └─────────────────────────┘
```

---

## Insurance Products

### 🌊 Flood Shield — Market Trader Coverage

Protects market traders against loss of trading days due to flooding.

| Parameter | Detail |
|---|---|
| **Target** | Open market traders (Balogun, Onitsha, Nnewi, etc.) |
| **Premium** | ₦500 / week (~$0.33) |
| **Payout** | $50 flat per qualifying flood event |
| **Trigger** | Rainfall > 80mm/24hr within 5km of registered market |
| **Oracle** | OpenWeatherMap + Nigeria Meteorological Agency (NiMet) |
| **Max claims** | 4 per policy year |
| **Settlement** | USDC → mobile money, within 60 seconds of oracle confirmation |

---

### 🏍️ RiderGuard — Okada & Keke Rider Accident Cover

Provides accident and hospitalization coverage for motorcycle and tricycle taxi operators.

| Parameter | Detail |
|---|---|
| **Target** | Registered okada / keke napep riders |
| **Premium** | ₦1,000 / week (~$0.65) |
| **Payout** | $100 for hospitalization, $200 for permanent disability |
| **Trigger** | Verified hospital admission + police/accident report hash submitted on-chain |
| **Oracle** | Hospital API partner + FRSC (Federal Road Safety Corps) data feed |
| **Waiting period** | 7 days after enrollment |
| **Settlement** | USDC → OPay / Kuda wallet |

---

### 🌾 HarvestSafe — Smallholder Farmer Crop Insurance

Satellite-indexed crop insurance for smallholder farmers.

| Parameter | Detail |
|---|---|
| **Target** | Farmers with 0.5–5 hectare plots |
| **Premium** | ₦2,000 / season (~$1.30) per hectare |
| **Payout** | $80 per hectare (partial loss), $150 per hectare (total loss) |
| **Trigger** | NDVI (Normalized Difference Vegetation Index) drop > 40% from seasonal baseline, or rainfall deficit > 30% below 10-year average |
| **Oracle** | NASA MODIS satellite data + FAO GIEWS crop monitoring |
| **Coverage period** | Per growing season (wet: Apr–Sep, dry: Oct–Mar) |
| **Settlement** | USDC → Flutterwave / YellowCard anchor |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          COVERCHAIN ARCHITECTURE                            │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────┐     ┌──────────────────────────────────────┐
  │       CLIENT LAYER           │     │            ORACLE LAYER              │
  │                              │     │                                      │
  │  ┌────────────┐              │     │  ┌──────────────┐  ┌──────────────┐ │
  │  │  React PWA │              │     │  │ Weather APIs │  │ Satellite    │ │
  │  │  (Web App) │              │     │  │ OpenWeather  │  │ NASA MODIS   │ │
  │  └────────────┘              │     │  │ NiMet        │  │ Sentinel-2   │ │
  │  ┌────────────┐              │     │  └──────────────┘  └──────────────┘ │
  │  │   USSD     │              │     │  ┌──────────────┐  ┌──────────────┐ │
  │  │  (*384#)   │              │     │  │ Hospital API │  │ FRSC / Gov   │ │
  │  └────────────┘              │     │  │ Partners     │  │ Data Feeds   │ │
  │  ┌────────────┐              │     │  └──────────────┘  └──────────────┘ │
  │  │  Mobile    │              │     │            │                         │
  │  │  App (PWA) │              │     │            ▼                         │
  │  └────────────┘              │     │  ┌──────────────────────────────┐   │
  └──────────┬───────────────────┘     │  │   Oracle Aggregator Node     │   │
             │                         │  │   (2-of-3 consensus)         │   │
             ▼                         │  │   Signed event submissions   │   │
  ┌──────────────────────────────┐     │  └──────────────┬───────────────┘   │
  │       BACKEND LAYER          │     └─────────────────┼───────────────────┘
  │                              │                        │
  │  ┌────────────────────────┐  │                        │
  │  │  Node.js / Express API │  │                        │
  │  │  - Policy management   │  │                        │
  │  │  - KYC / BVN verify    │◀─┼────────────────────────┘
  │  │  - Premium scheduling  │  │
  │  │  - Notification svc    │  │
  │  └────────────┬───────────┘  │
  │               │              │
  │  ┌────────────▼───────────┐  │
  │  │  PostgreSQL + Redis     │  │
  │  │  - User profiles        │  │
  │  │  - Policy records       │  │
  │  │  - Event log cache      │  │
  │  └────────────────────────┘  │
  └──────────────┬───────────────┘
                 │
                 ▼
  ┌──────────────────────────────────────────────────────────────────────────┐
  │                         STELLAR / SOROBAN LAYER                          │
  │                                                                          │
  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
  │  │  PolicyRegistry  │  │   RiskPool       │  │  OracleConsensus     │  │
  │  │  Contract        │  │   Contract       │  │  Contract            │  │
  │  │                  │  │                  │  │                      │  │
  │  │  - Enroll policy │  │  - Hold premiums │  │  - Receive oracle    │  │
  │  │  - Store params  │  │  - Manage USDC   │  │    submissions       │  │
  │  │  - Emit events   │  │  - Auto-payout   │  │  - Verify 2-of-3     │  │
  │  └──────────────────┘  └──────────────────┘  │  - Trigger payout   │  │
  │                                               └──────────────────────┘  │
  │                                                                          │
  │  ┌───────────────────────────────────────────────────────────────────┐  │
  │  │               STELLAR NETWORK (Mainnet / Testnet)                 │  │
  │  │   USDC Anchor: YellowCard, Flutterwave, Circle                    │  │
  │  │   Wallets: Freighter, LOBSTR, Rabet, custom mobile wallet         │  │
  │  └───────────────────────────────────────────────────────────────────┘  │
  └──────────────────────────────────────────────────────────────────────────┘
```

---

## Smart Contract Design

CoverChain deploys **three Soroban contracts** on Stellar:

### 1. `PolicyRegistry` Contract

Manages policy enrollment, parameters, and lifecycle.

```rust
// contracts/policy_registry/src/lib.rs

#[contract]
pub struct PolicyRegistry;

#[contractimpl]
impl PolicyRegistry {
    /// Enroll a new policyholder
    pub fn enroll(
        env: Env,
        holder: Address,
        product_id: Symbol,       // "FLOOD_SHIELD" | "RIDER_GUARD" | "HARVEST_SAFE"
        coverage_params: Map<Symbol, Val>,
        premium_amount: i128,     // in stroops
        premium_interval: u64,    // in seconds
    ) -> PolicyId { ... }

    /// Record a premium payment
    pub fn pay_premium(
        env: Env,
        policy_id: PolicyId,
        payer: Address,
        amount: i128,
    ) -> bool { ... }

    /// Check if policy is active and premiums are current
    pub fn is_active(env: Env, policy_id: PolicyId) -> bool { ... }

    /// Get policy details
    pub fn get_policy(env: Env, policy_id: PolicyId) -> Policy { ... }
}

#[contracttype]
pub struct Policy {
    pub id: PolicyId,
    pub holder: Address,
    pub product_id: Symbol,
    pub coverage_params: Map<Symbol, Val>,
    pub enrolled_at: u64,
    pub last_premium_at: u64,
    pub premium_amount: i128,
    pub premium_interval: u64,
    pub active: bool,
    pub total_claimed: i128,
}
```

---

### 2. `RiskPool` Contract

Holds pooled premiums and executes payouts when authorized by the OracleConsensus contract.

```rust
// contracts/risk_pool/src/lib.rs

#[contract]
pub struct RiskPool;

#[contractimpl]
impl RiskPool {
    /// Deposit premium into the pool
    pub fn deposit_premium(
        env: Env,
        policy_id: PolicyId,
        amount: i128,
        token: Address,     // USDC contract address
    ) -> bool { ... }

    /// Execute payout — only callable by OracleConsensus contract
    pub fn execute_payout(
        env: Env,
        policy_id: PolicyId,
        recipient: Address,
        amount: i128,
        event_id: Symbol,
    ) -> bool { ... }

    /// Get pool balance
    pub fn get_balance(env: Env) -> i128 { ... }

    /// Get pool health ratio (reserves / max_exposure)
    pub fn get_health_ratio(env: Env) -> i128 { ... }

    /// Emergency pause — multisig admin only
    pub fn pause(env: Env, admin: Address) -> bool { ... }
}
```

---

### 3. `OracleConsensus` Contract

Receives signed event submissions from oracle nodes and triggers payouts when 2-of-3 oracles agree.

```rust
// contracts/oracle_consensus/src/lib.rs

#[contract]
pub struct OracleConsensus;

#[contractimpl]
impl OracleConsensus {
    /// Register a new oracle node (admin only)
    pub fn register_oracle(env: Env, oracle: Address) -> bool { ... }

    /// Submit an event report from an oracle node
    pub fn submit_event(
        env: Env,
        oracle: Address,
        event_type: Symbol,       // "FLOOD" | "ACCIDENT" | "CROP_FAILURE"
        location_hash: BytesN<32>, // hashed lat/lng or market ID
        severity: u32,            // normalized 0–100
        timestamp: u64,
        evidence_cid: String,     // IPFS CID of raw oracle data
    ) -> EventId { ... }

    /// Check consensus and trigger payout if threshold met
    pub fn check_and_execute(
        env: Env,
        event_id: EventId,
    ) -> Vec<PolicyId> { ... }

    /// Get event status
    pub fn get_event(env: Env, event_id: EventId) -> OracleEvent { ... }
}

#[contracttype]
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
```

---

## Oracle System

CoverChain uses a **2-of-3 oracle consensus model** to prevent single-point manipulation.

### Oracle Sources by Product

| Product | Oracle 1 | Oracle 2 | Oracle 3 |
|---|---|---|---|
| Flood Shield | OpenWeatherMap API | NiMet (Nigerian Met Agency) | Floodlist.com feed |
| RiderGuard | Hospital partner API | FRSC accident database | Policyholder self-report + photo hash |
| HarvestSafe | NASA MODIS (NDVI) | Sentinel-2 satellite | FAO GIEWS crop monitor |

### Oracle Node Architecture

```
External Data Sources
        │
        ▼
┌───────────────────────────┐
│   Oracle Aggregator Node  │  (Node.js service, runs independently)
│                           │
│  1. Fetch raw data        │
│  2. Normalize to schema   │
│  3. Apply trigger logic   │
│  4. Sign with oracle key  │
│  5. Submit to Soroban     │
└───────────────────────────┘
        │
        ▼ (Stellar transaction)
OracleConsensus Contract
```

Each oracle submission is signed with the oracle node's Stellar keypair. The contract verifies signatures and only proceeds when ≥ 2 of 3 registered oracles agree on the event parameters within a 6-hour window.

---

## Tech Stack

### Smart Contracts
- **Soroban SDK** (Rust) — smart contract development
- **Stellar Testnet / Mainnet** — deployment target
- **soroban-cli** — contract build, deploy, invoke

### Backend
- **Node.js + Express** — REST API
- **PostgreSQL** — user data, policy records, event log
- **Redis** — session cache, premium scheduling queue
- **Bull** — job queue for premium collection and oracle polling
- **Africa's Talking** — USSD gateway
- **Twilio** — SMS notifications

### Frontend
- **React + TypeScript** — web app
- **Tailwind CSS** — styling
- **Freighter API** — Stellar wallet connection
- **Stellar SDK (JS)** — transaction building

### Oracle Services
- **Node.js** — oracle aggregator service
- **OpenWeatherMap API** — weather data
- **NASA EarthData API** — NDVI/satellite data
- **IPFS (web3.storage)** — evidence storage
- **Stellar Keypair** — oracle signing

### Infrastructure
- **Docker + Docker Compose** — containerization
- **GitHub Actions** — CI/CD
- **Railway / Render** — backend hosting
- **Vercel** — frontend hosting

---

## Project Structure

```
coverchain/
├── contracts/                          # Soroban smart contracts (Rust)
│   ├── policy_registry/
│   │   ├── src/
│   │   │   ├── lib.rs                  # Main contract logic
│   │   │   ├── types.rs                # Policy, PolicyId types
│   │   │   └── errors.rs               # Contract error codes
│   │   ├── Cargo.toml
│   │   └── test.rs                     # Contract unit tests
│   ├── risk_pool/
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── types.rs
│   │   │   └── errors.rs
│   │   ├── Cargo.toml
│   │   └── test.rs
│   ├── oracle_consensus/
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── types.rs
│   │   │   └── errors.rs
│   │   ├── Cargo.toml
│   │   └── test.rs
│   └── Cargo.toml                      # Workspace manifest
│
├── backend/                            # Node.js API server
│   ├── src/
│   │   ├── routes/
│   │   │   ├── policies.ts             # Policy CRUD endpoints
│   │   │   ├── premiums.ts             # Premium payment endpoints
│   │   │   ├── claims.ts               # Claims status endpoints
│   │   │   ├── kyc.ts                  # BVN/NIN verification
│   │   │   └── ussd.ts                 # USSD webhook handler
│   │   ├── services/
│   │   │   ├── stellar.ts              # Stellar SDK wrapper
│   │   │   ├── soroban.ts              # Soroban contract calls
│   │   │   ├── kyc.ts                  # KYC provider integration
│   │   │   ├── notifications.ts        # SMS / push notifications
│   │   │   └── premiumScheduler.ts     # Bull queue for premiums
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Policy.ts
│   │   │   └── Event.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   └── rateLimit.ts
│   │   └── index.ts                    # App entry point
│   ├── prisma/
│   │   └── schema.prisma               # Database schema
│   ├── package.json
│   └── tsconfig.json
│
├── oracle/                             # Oracle aggregator service
│   ├── src/
│   │   ├── oracles/
│   │   │   ├── weather.ts              # OpenWeatherMap + NiMet
│   │   │   ├── satellite.ts            # NASA MODIS / Sentinel-2
│   │   │   ├── hospital.ts             # Hospital partner API
│   │   │   └── frsc.ts                 # Road safety data
│   │   ├── consensus/
│   │   │   ├── aggregator.ts           # Multi-oracle aggregation
│   │   │   └── submitter.ts            # Stellar transaction builder
│   │   ├── triggers/
│   │   │   ├── floodTrigger.ts         # Flood threshold logic
│   │   │   ├── accidentTrigger.ts      # Accident verification
│   │   │   └── cropTrigger.ts          # NDVI drop detection
│   │   └── index.ts
│   └── package.json
│
├── frontend/                           # React web application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard/
│   │   │   │   ├── PolicyCard.tsx
│   │   │   │   ├── ClaimsHistory.tsx
│   │   │   │   └── PoolHealth.tsx
│   │   │   ├── Enrollment/
│   │   │   │   ├── ProductSelector.tsx
│   │   │   │   ├── KYCForm.tsx
│   │   │   │   └── WalletConnect.tsx
│   │   │   └── shared/
│   │   │       ├── TransactionStatus.tsx
│   │   │       └── OracleEventFeed.tsx
│   │   ├── hooks/
│   │   │   ├── useStellar.ts
│   │   │   ├── usePolicy.ts
│   │   │   └── useOracle.ts
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Enroll.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── Claims.tsx
│   │   └── App.tsx
│   ├── package.json
│   └── tsconfig.json
│
├── scripts/                            # Deployment & utility scripts
│   ├── deploy_contracts.sh             # Deploy all Soroban contracts
│   ├── fund_pool.sh                    # Initial USDC pool funding
│   ├── register_oracles.sh             # Register oracle keys on-chain
│   └── seed_testnet.sh                 # Seed testnet with test data
│
├── docs/                               # Documentation
│   ├── contract_addresses.md           # Deployed contract addresses
│   ├── api_reference.md                # REST API docs
│   ├── oracle_spec.md                  # Oracle data schema spec
│   └── ussd_flows.md                   # USSD menu flow diagrams
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **Rust** >= 1.70 + `wasm32-unknown-unknown` target
- **soroban-cli** >= 0.9.4
- **Docker** + Docker Compose
- **PostgreSQL** >= 14
- A **Stellar testnet account** funded via [Friendbot](https://friendbot.stellar.org)

### 1. Clone the Repository

```bash
git clone https://github.com/yourorg/coverchain.git
cd coverchain
```

### 2. Install Rust and Soroban CLI

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add WASM target
rustup target add wasm32-unknown-unknown

# Install Soroban CLI
cargo install --locked soroban-cli
```

### 3. Build Smart Contracts

```bash
cd contracts
cargo build --target wasm32-unknown-unknown --release

# Or build individual contract
soroban contract build --package policy_registry
soroban contract build --package risk_pool
soroban contract build --package oracle_consensus
```

### 4. Deploy to Stellar Testnet

```bash
# Configure Stellar testnet identity
soroban config network add testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"

soroban config identity generate deployer

# Fund the identity
soroban config identity fund deployer --network testnet

# Run deploy script
chmod +x scripts/deploy_contracts.sh
./scripts/deploy_contracts.sh
```

### 5. Set Up Backend

```bash
cd backend
cp ../.env.example .env
# Edit .env with your credentials

npm install
npx prisma migrate dev
npm run dev
```

### 6. Set Up Oracle Service

```bash
cd oracle
npm install
npm run dev
```

### 7. Start Frontend

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

### 8. Start with Docker Compose

```bash
# Start all services
docker-compose up --build

# Services:
# - Frontend:  http://localhost:3000
# - Backend:   http://localhost:4000
# - Oracle:    http://localhost:5000
# - PostgreSQL: localhost:5432
```

---

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# ── Stellar / Soroban ────────────────────────────────────────────────
STELLAR_NETWORK=testnet                          # testnet | mainnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
DEPLOYER_SECRET_KEY=S...                         # Contract deployer keypair

# Contract Addresses (populated after deploy)
POLICY_REGISTRY_CONTRACT_ID=C...
RISK_POOL_CONTRACT_ID=C...
ORACLE_CONSENSUS_CONTRACT_ID=C...

# USDC token contract on Stellar
USDC_CONTRACT_ID=C...

# ── Oracle Keys ──────────────────────────────────────────────────────
ORACLE_1_SECRET_KEY=S...
ORACLE_2_SECRET_KEY=S...
ORACLE_3_SECRET_KEY=S...

# ── External APIs ────────────────────────────────────────────────────
OPENWEATHER_API_KEY=...
NASA_EARTHDATA_TOKEN=...
NIMET_API_KEY=...
FRSC_API_KEY=...

# ── Database ─────────────────────────────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/coverchain
REDIS_URL=redis://localhost:6379

# ── USSD / SMS ───────────────────────────────────────────────────────
AFRICASTALKING_API_KEY=...
AFRICASTALKING_USERNAME=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# ── KYC ──────────────────────────────────────────────────────────────
DOJAH_API_KEY=...                                # BVN / NIN verification

# ── IPFS (Oracle Evidence) ───────────────────────────────────────────
WEB3_STORAGE_TOKEN=...

# ── App ──────────────────────────────────────────────────────────────
JWT_SECRET=...
PORT=4000
NODE_ENV=development
```

---

## Running Tests

### Smart Contract Tests

```bash
cd contracts

# Run all contract tests
cargo test

# Run tests for a specific contract
cargo test --package policy_registry
cargo test --package risk_pool
cargo test --package oracle_consensus

# Run with verbose output
cargo test -- --nocapture
```

### Backend Tests

```bash
cd backend

# Unit tests
npm run test

# Integration tests (requires running DB)
npm run test:integration

# Test coverage
npm run test:coverage
```

### End-to-End Tests (Testnet)

```bash
# Ensure testnet contracts are deployed and .env is configured

cd backend
npm run test:e2e
```

### Oracle Simulation Tests

```bash
cd oracle

# Simulate a flood event end-to-end
npm run simulate:flood -- --lat=6.5244 --lng=3.3792 --rainfall=90

# Simulate a crop failure event
npm run simulate:crop -- --lat=12.0022 --lng=8.5920 --ndvi_drop=45
```

---

## Deployment

### Testnet Deployment

```bash
./scripts/deploy_contracts.sh --network testnet
./scripts/register_oracles.sh --network testnet
./scripts/fund_pool.sh --network testnet --amount 10000
```

### Mainnet Deployment Checklist

- [ ] All contract tests passing
- [ ] External security audit completed
- [ ] Oracle keys stored in HSM / secure key management
- [ ] NAICOM sandbox approval obtained
- [ ] Multisig admin keys configured (3-of-5)
- [ ] Initial liquidity pool funded ($50,000 USDC minimum)
- [ ] Monitoring and alerting configured (Datadog / Grafana)
- [ ] Incident response runbook documented

```bash
./scripts/deploy_contracts.sh --network mainnet
```

---

## API Reference

### Base URL

```
Development: http://localhost:4000/api/v1
Production:  https://api.coverchain.io/api/v1
```

### Authentication

All protected endpoints require a JWT Bearer token:

```
Authorization: Bearer <token>
```

### Endpoints

#### Policies

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/policies/enroll` | Enroll a new policy |
| `GET` | `/policies/:id` | Get policy details |
| `GET` | `/policies/user/:address` | List policies for a wallet address |
| `POST` | `/policies/:id/premium` | Pay a premium |
| `DELETE` | `/policies/:id` | Cancel a policy |

#### Claims

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/claims/:policyId` | Get claims history for a policy |
| `GET` | `/claims/event/:eventId` | Get claims triggered by an oracle event |

#### Oracle

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/oracle/events` | List recent oracle events |
| `GET` | `/oracle/events/:id` | Get oracle event details |
| `POST` | `/oracle/submit` | Submit oracle event (oracle nodes only) |

#### Users / KYC

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/users/register` | Register a new user |
| `POST` | `/users/kyc/verify` | Submit BVN/NIN for verification |
| `GET` | `/users/kyc/status` | Check KYC verification status |

#### Example: Enroll a Policy

```bash
curl -X POST https://api.coverchain.io/api/v1/policies/enroll \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "FLOOD_SHIELD",
    "stellar_address": "GABC...XYZ",
    "coverage_params": {
      "market_id": "BALOGUN_MARKET_LAGOS",
      "market_lat": 6.4550,
      "market_lng": 3.3841
    },
    "premium_interval": "weekly"
  }'
```

#### Example Response

```json
{
  "success": true,
  "policy": {
    "id": "POL-2024-00042",
    "contract_policy_id": "00042",
    "product": "FLOOD_SHIELD",
    "holder_address": "GABC...XYZ",
    "premium_xlm": "5000000",
    "premium_usdc": "0.33",
    "next_premium_due": "2024-02-07T00:00:00Z",
    "stellar_tx_hash": "abc123...",
    "status": "active"
  }
}
```

---

## Frontend

The React frontend provides:

- **Enrollment flow** — product selection, KYC, wallet connection, policy activation
- **Dashboard** — active policies, premium schedule, claims history, pool health
- **Oracle Event Feed** — real-time feed of oracle events and triggered payouts
- **Wallet Integration** — Freighter wallet for signing Stellar transactions

### Connecting a Wallet

```typescript
import { getPublicKey, signTransaction } from "@stellar/freighter-api";

// Connect Freighter
const publicKey = await getPublicKey();

// Sign a premium payment transaction
const signedTx = await signTransaction(xdrTransaction, {
  network: "TESTNET",
});
```

---

## USSD Interface

CoverChain is accessible via USSD on **any mobile phone** — no smartphone or internet required.

### Dial: `*384*COVER#`

```
┌─────────────────────────────────────────────────┐
│  Welcome to CoverChain                          │
│  Your Insurance, Simplified                     │
│                                                 │
│  1. Buy Insurance                               │
│  2. Pay Premium                                 │
│  3. Check Policy Status                         │
│  4. Claim Status                                │
│  5. Help                                        │
└─────────────────────────────────────────────────┘

> 1

┌─────────────────────────────────────────────────┐
│  Choose your cover:                             │
│                                                 │
│  1. Flood Shield (Traders) - ₦500/week          │
│  2. RiderGuard (Okada/Keke) - ₦1,000/week       │
│  3. HarvestSafe (Farmers) - ₦2,000/season       │
└─────────────────────────────────────────────────┘
```

USSD sessions are handled by the backend via Africa's Talking webhook, which interacts with the Soroban contracts and sends SMS confirmations.

---

## Stellar Integration

### Why Stellar?

| Feature | How CoverChain Uses It |
|---|---|
| Low fees (~$0.00001/tx) | Makes ₦500 micropremiums economical |
| USDC native support | Payouts in stable dollar-denominated value |
| Fast finality (3–5 sec) | Payouts delivered in seconds, not days |
| Anchor network | YellowCard, Flutterwave bridge USDC → mobile money |
| Soroban smart contracts | Trustless, auditable insurance logic |
| African fintech partnerships | Native offramp rails in Nigeria, Ghana, Kenya |

### Anchor Partners

| Anchor | Countries | Off-ramp Method |
|---|---|---|
| YellowCard | Nigeria, Ghana, Kenya, South Africa | Bank transfer, mobile money |
| Flutterwave | Nigeria + 30 African countries | Bank, USSD, mobile |
| Circle (USDC issuer) | Global | Direct USDC |

### Transaction Flow

```
Policyholder pays premium
        │
        ▼ (Stellar transaction)
USDC transferred to RiskPool contract
        │
        ▼
Event triggered by oracle consensus
        │
        ▼ (Soroban contract execution)
USDC released from RiskPool → policyholder address
        │
        ▼ (Stellar Anchor)
Policyholder redeems USDC via YellowCard → OPay/Kuda/Bank
```

---

## Security

### Smart Contract Security

- All contracts have been designed for formal verification
- Emergency pause functionality with multisig admin (3-of-5 keys)
- Reentrancy protection on all payout functions
- Integer overflow protection via Soroban's native `i128` type bounds
- Access control: payout function only callable by OracleConsensus contract

### Oracle Security

- 2-of-3 consensus prevents single oracle manipulation
- All oracle submissions signed with registered Stellar keypairs
- 6-hour consensus window limits retroactive manipulation
- IPFS evidence storage for auditability
- Oracle keys stored in hardware security modules (HSM) in production

### Backend Security

- JWT authentication with short expiry (15 minutes) + refresh tokens
- Rate limiting on all endpoints
- BVN/NIN verification via licensed KYC provider (Dojah)
- All data encrypted at rest (AES-256)
- Environment secrets managed via Railway / Doppler

### Responsible Disclosure

Found a vulnerability? Please email **security@coverchain.io** before public disclosure. We operate a bug bounty program and will respond within 48 hours.

---

## Roadmap

### Phase 1 — Foundation
- [x] Soroban smart contract development
- [x] Oracle aggregator architecture
- [x] Backend API (Node.js)
- [x] Testnet deployment
- [ ] Africa's Talking USSD integration
- [ ] Basic React dashboard

### Phase 2 — Pilot
- [ ] KYC integration (Dojah BVN/NIN)
- [ ] YellowCard anchor integration
- [ ] USSD live on Africa's Talking
- [ ] 100-person pilot: Balogun Market, Lagos
- [ ] Flood Shield product live on mainnet

### Phase 3 — Expansion 
- [ ] RiderGuard product launch
- [ ] HarvestSafe product launch
- [ ] Mobile PWA (React Native)
- [ ] Flutterwave anchor integration
- [ ] Expand to Kano, Abuja, Port Harcourt

### Phase 4 — Scale 
- [ ] Ghana & Kenya markets
- [ ] Reinsurance layer (on-chain treaty)
- [ ] DAO governance for risk pool
- [ ] Third-party product integrations via SDK
- [ ] 10,000 active policies

---

## Contributor Onboarding

This section gets you from zero to a running local environment in under 15 minutes.

### 1. Clone & install

```bash
git clone https://github.com/yourorg/coverchain.git
cd coverchain
```

### 2. Start infrastructure (PostgreSQL + Redis)

```bash
docker-compose up -d db redis
```

### 3. Build and deploy contracts to Testnet

```bash
# Install Rust + WASM target + Stellar CLI (once)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown
cargo install --locked stellar-cli --features opt

# Generate a deployer identity and fund it
stellar keys generate deployer --network testnet
stellar keys fund deployer --network testnet

# Build + deploy all three contracts, writes addresses to docs/contract_addresses.md
./scripts/deploy_contracts.sh --network testnet
```

### 4. Configure environment

```bash
cp .env.example .env
# Fill in the three CONTRACT_ID values printed by deploy_contracts.sh
# Add ORACLE_1_SECRET_KEY, OPENWEATHER_API_KEY, etc.
```

### 5. Run backend

```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run dev           # http://localhost:4000
```

### 6. Run oracle service

```bash
cd oracle
npm install
npm run dev           # polls weather every 5 min, submits to OracleConsensus
```

### 7. Run frontend

```bash
cd frontend
npm install
npm run dev           # http://localhost:3000
```

### 8. Seed testnet with test data

```bash
./scripts/seed_testnet.sh
# Creates a funded test keypair, enrolls a Flood Shield policy,
# and submits a mock oracle event via the backend API.
```

### 9. Run all tests

```bash
cd contracts && cargo test        # Soroban unit + integration tests
cd backend   && npm test          # Express route + service tests
cd frontend  && npm test          # Component tests (Vitest)
cd oracle    && npm test          # Trigger + aggregator unit tests
```

### What's ready vs. what needs work

| Area | Status | Good first issues |
|---|---|---|
| Contracts | ✅ 90% complete | Additional event types (ACCIDENT, CROP_FAILURE) |
| Backend API | 🏗️ 60% | `GET /policies/user/:address` (DB query), KYC route |
| Oracle | 🏗️ 50% | `satellite.ts` NASA MODIS provider, `cropTrigger.ts` |
| Frontend | 🏗️ 70% | Connect real backend to enrollment flow, PWA manifest |
| Docs | ✅ Baseline | Oracle spec (`docs/oracle_spec.md`), localization |

See the open issues on GitHub for tagged `good first issue` tasks.

---

## Contributing

We welcome contributions from the community. Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting a PR.

### Development Workflow

```bash
# 1. Fork and clone
git clone https://github.com/yourorg/coverchain.git

# 2. Create a feature branch
git checkout -b feature/your-feature-name

# 3. Make your changes and run tests
cargo test          # contracts
npm test            # backend / oracle / frontend

# 4. Commit with conventional commits
git commit -m "feat(oracle): add NiMet weather provider"

# 5. Open a pull request
```

### Areas We Need Help

- **Rust / Soroban** — additional contract features, optimizations
- **Oracle data providers** — hospital API integrations, new satellite sources
- **Frontend** — improved mobile UX, accessibility
- **Research** — actuarial modeling for premium pricing
- **Localization** — Hausa, Yoruba, Igbo translations

---

## Acknowledgments

- **Stellar Development Foundation** — for the Soroban platform and grant support
- **Africa's Talking** — USSD infrastructure
- **YellowCard** — USDC anchor partnership
- **OpenWeatherMap** — weather data API
- **NASA EarthData** — NDVI satellite data

---

## License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ for the informal workers of Africa**

[Website](https://coverchain.io) · [Docs](https://docs.coverchain.io) · [Twitter](https://twitter.com/coverchain_io) · [Discord](https://discord.gg/coverchain)

*Powered by Stellar & Soroban*

</div>
