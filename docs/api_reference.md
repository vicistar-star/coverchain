# CoverChain API Reference

Base URL:
- Development: `http://localhost:4000/api/v1`
- Production: `https://api.coverchain.io/api/v1`

All protected endpoints require `Authorization: Bearer <jwt>`.

---

## Health

### `GET /health`

```json
{ "status": "ok", "service": "coverchain-backend", "timestamp": "..." }
```

---

## Policies

### `POST /policies/enroll`

Enrol a new policy on-chain.

**Body:**
```json
{
  "holderSecretKey": "S...",
  "productId": "FLOOD_SHIELD | RIDER_GUARD | HARVEST_SAFE",
  "premiumAmount": "5000000",
  "premiumInterval": 604800,
  "coverageParams": {
    "market_id": "BALOGUN_MARKET_LAGOS",
    "market_lat": 6.455,
    "market_lng": 3.3841
  }
}
```

**Response `201`:**
```json
{
  "policyId": 42001,
  "holderAddress": "GABC...XYZ",
  "productId": "FLOOD_SHIELD",
  "premiumAmount": "5000000",
  "premiumInterval": 604800,
  "balance": "10000",
  "status": "enrolled"
}
```

---

### `GET /policies/:id`

Returns on-chain policy data for the given numeric contract ID.

---

### `GET /policies/user/:address`

Returns policies linked to a Stellar address. _(Returns 501 until DB integration is complete.)_

---

### `POST /policies/:id/premium`

Pay a premium for an active policy.

**Body:**
```json
{ "holderSecretKey": "S...", "amount": "5000000" }
```

---

### `DELETE /policies/:id`

Cancel a policy. _(Returns 501 — not yet implemented.)_

---

## Oracle Events

### `GET /oracle/events`

Returns the 10 most recent oracle events.

**Response:**
```json
{
  "events": [
    {
      "id": "evt-001",
      "contractEventId": 1001,
      "eventType": "FLOOD",
      "locationHash": "LAGOS",
      "severity": 85,
      "status": "PAYOUT_TRIGGERED",
      "submissions": 3,
      "consensusCount": 3,
      "createdAt": "...",
      "triggeredAt": "..."
    }
  ]
}
```

---

### `GET /oracle/events/:id`

Returns a single oracle event by ID.

---

### `POST /oracle/submit`

Submit an oracle event report (oracle nodes only — add auth in production).

**Body:**
```json
{
  "eventType": "FLOOD",
  "locationHash": "LAGOS",
  "severity": 85,
  "timestamp": 1718700000,
  "evidenceCid": "coverchain-mock://lagos-1718700000"
}
```

---

## USSD

### `POST /ussd`

Africa's Talking USSD webhook. Handled internally — not called directly.

**Form params:** `sessionId`, `serviceCode`, `phoneNumber`, `text`

---

## Error Responses

All errors follow:
```json
{ "error": "Human-readable message", "details": { ... } }
```

| Status | Meaning |
|---|---|
| 400 | Validation error |
| 404 | Resource not found |
| 501 | Not yet implemented |
| 503 | Contract addresses not configured |
| 500 | Internal server error |
