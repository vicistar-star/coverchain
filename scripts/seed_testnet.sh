#!/usr/bin/env bash
# seed_testnet.sh — Seed the Stellar testnet with a test user, policy, and oracle event.
# Prerequisites: contracts deployed, .env configured, backend running on localhost:4000
set -euo pipefail

source "$(dirname "$0")/../.env" 2>/dev/null || true

BASE_URL="${BACKEND_URL:-http://localhost:4000}/api/v1"
IDENTITY="${DEPLOYER_IDENTITY:-deployer}"
NETWORK="testnet"

echo "==> CoverChain Testnet Seed"
echo "    Backend: $BASE_URL"
echo ""

# ── 1. Fund a test keypair via Friendbot ───────────────────────────────────
echo "[1/5] Generating test keypair..."
TEST_KEYPAIR=$(stellar keys generate --network "$NETWORK" seed-test 2>&1 || true)
TEST_ADDRESS=$(stellar keys address seed-test 2>/dev/null || echo "")
if [[ -z "$TEST_ADDRESS" ]]; then
  echo "      Keypair already exists, reusing."
  TEST_ADDRESS=$(stellar keys address seed-test)
fi
TEST_SECRET=$(stellar keys show seed-test --secret 2>/dev/null || echo "MOCK_SECRET")
echo "      Address: $TEST_ADDRESS"

echo "[2/5] Funding via Friendbot..."
curl -s "https://friendbot.stellar.org?addr=$TEST_ADDRESS" > /dev/null
echo "      Funded."

# ── 2. Register test user ──────────────────────────────────────────────────
echo "[3/5] Registering test user..."
curl -s -X POST "$BASE_URL/users/register" \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"+2348000000001\", \"stellarWallet\": \"$TEST_ADDRESS\"}" \
  | python3 -m json.tool 2>/dev/null || true

# ── 3. Enrol a Flood Shield policy ────────────────────────────────────────
echo "[4/5] Enrolling Flood Shield policy..."
ENROLL_RESP=$(curl -s -X POST "$BASE_URL/policies/enroll" \
  -H "Content-Type: application/json" \
  -d "{
    \"holderSecretKey\": \"$TEST_SECRET\",
    \"productId\": \"FLOOD_SHIELD\",
    \"premiumAmount\": \"5000000\",
    \"premiumInterval\": 604800,
    \"coverageParams\": {
      \"market_id\": \"BALOGUN_MARKET_LAGOS\",
      \"market_lat\": 6.4550,
      \"market_lng\": 3.3841
    }
  }")
echo "$ENROLL_RESP" | python3 -m json.tool 2>/dev/null || echo "$ENROLL_RESP"

# ── 4. Simulate a flood oracle event ──────────────────────────────────────
echo "[5/5] Submitting mock flood oracle event..."
curl -s -X POST "$BASE_URL/oracle/submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"eventType\": \"FLOOD\",
    \"locationHash\": \"LAGOS\",
    \"severity\": 85,
    \"timestamp\": $(date +%s),
    \"evidenceCid\": \"coverchain-mock://seed-testnet\"
  }" | python3 -m json.tool 2>/dev/null || true

echo ""
echo "Testnet seed complete ✅"
echo "Test address: $TEST_ADDRESS"
