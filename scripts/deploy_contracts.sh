#!/usr/bin/env bash
# deploy_contracts.sh — Build and deploy all CoverChain Soroban contracts
# Usage: ./scripts/deploy_contracts.sh [--network testnet|mainnet]
set -euo pipefail

NETWORK="${1:---network}"
NETWORK_NAME="${2:-testnet}"
if [[ "$1" == "--network" ]]; then
  NETWORK_NAME="$2"
fi

CONTRACTS_DIR="$(cd "$(dirname "$0")/../contracts" && pwd)"
IDENTITY="${DEPLOYER_IDENTITY:-deployer}"

echo "==> CoverChain Contract Deployment"
echo "    Network : $NETWORK_NAME"
echo "    Identity: $IDENTITY"
echo ""

# ── Build ──────────────────────────────────────────────────────────────────
echo "[1/4] Building contracts..."
cd "$CONTRACTS_DIR"
cargo build --target wasm32-unknown-unknown --release --quiet
echo "      Build complete."

# ── Deploy PolicyRegistry ──────────────────────────────────────────────────
echo "[2/4] Deploying PolicyRegistry..."
POLICY_REGISTRY_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/policy_registry.wasm \
  --source "$IDENTITY" \
  --network "$NETWORK_NAME")
echo "      PolicyRegistry: $POLICY_REGISTRY_ID"

# ── Deploy RiskPool ────────────────────────────────────────────────────────
echo "[3/4] Deploying RiskPool..."
RISK_POOL_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/risk_pool.wasm \
  --source "$IDENTITY" \
  --network "$NETWORK_NAME")
echo "      RiskPool: $RISK_POOL_ID"

# ── Deploy OracleConsensus ─────────────────────────────────────────────────
echo "[4/4] Deploying OracleConsensus..."
ORACLE_CONSENSUS_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/oracle_consensus.wasm \
  --source "$IDENTITY" \
  --network "$NETWORK_NAME")
echo "      OracleConsensus: $ORACLE_CONSENSUS_ID"

# ── Write addresses ────────────────────────────────────────────────────────
ADDRESSES_FILE="$(dirname "$0")/../docs/contract_addresses.md"
cat > "$ADDRESSES_FILE" <<EOF
# CoverChain Contract Addresses

Network: **$NETWORK_NAME**
Deployed: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

| Contract | Address |
|---|---|
| PolicyRegistry | \`$POLICY_REGISTRY_ID\` |
| RiskPool | \`$RISK_POOL_ID\` |
| OracleConsensus | \`$ORACLE_CONSENSUS_ID\` |
EOF
echo ""
echo "Addresses written to docs/contract_addresses.md"

# ── Print env vars ─────────────────────────────────────────────────────────
echo ""
echo "Add these to your .env:"
echo "  POLICY_REGISTRY_CONTRACT_ID=$POLICY_REGISTRY_ID"
echo "  RISK_POOL_CONTRACT_ID=$RISK_POOL_ID"
echo "  ORACLE_CONSENSUS_CONTRACT_ID=$ORACLE_CONSENSUS_ID"
echo ""
echo "Deployment complete ✅"
