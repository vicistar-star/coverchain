# CoverChain USSD Flow Documentation

## Dial: `*384*COVER#` or `*384#`

---

## Main Menu

```
CON Welcome to CoverChain
Your Insurance, Simplified

1. Buy Insurance
2. Pay Premium
3. Check Policy Status
4. Claim Status
5. Help
```

---

## Flow 1: Buy Insurance (Enrollment)

```
User selects 1 → Product Menu

CON Choose your cover:

1. Flood Shield (Traders) - N500/week
2. RiderGuard (Okada/Keke) - N1,000/week
3. HarvestSafe (Farmers) - N2,000/season
0. Back

User selects product → Enter wallet

CON Enter your Stellar wallet address (G...):

User enters wallet → Confirm

CON Confirm enrollment:
Product: Flood Shield
Wallet: GABC...XYZ
Premium: N500/week

1. Confirm
2. Cancel

User selects 1 →

END Enrollment submitted! You will receive
an SMS confirmation shortly.
Policy ID: POL-XXXX
```

---

## Flow 2: Pay Premium

```
User selects 2 →

CON Enter your policy number:

User enters policy number →

END Payment processed successfully.
Policy: POL-XXXX
Amount: N500
Next due: 7 days
Thank you!
```

---

## Flow 3: Check Policy Status

```
User selects 3 →

CON Enter your policy number:

User enters policy number →

END Policy: POL-XXXX
Status: ACTIVE
Product: Flood Shield
Next premium: 3 days
Total claimed: $0
```

---

## Flow 4: Claim Status

```
User selects 4 →

CON Enter your policy number:

User enters policy number →

END Policy: POL-XXXX
No active claims found.
Last event: None
Contact support: 01-234-5678
```

---

## Flow 5: Help

```
User selects 5 →

END CoverChain Support:
Call: 01-234-5678
Web: coverchain.io/help
Hours: Mon-Sat 8am-8pm
```

---

## State Machine

```
[START] → main
main:
  1 → product_select
  2 → pay_premium_input
  3 → check_status_input
  4 → claim_status_input
  5 → END (help)

product_select:
  1/2/3 → enroll_wallet
  0     → main

enroll_wallet:
  <wallet> → enroll_confirm

enroll_confirm:
  1 → END (submit enrollment)
  2 → main

pay_premium_input:
  <policyId> → END (process payment)

check_status_input:
  <policyId> → END (show status)

claim_status_input:
  <policyId> → END (show claims)
```

---

## Session Notes

- Sessions expire after 120 seconds of inactivity (Africa's Talking default)
- `CON` prefix = continue session (show next menu)
- `END` prefix = terminate session
- Phone number used as user identifier; linked to DB user record on enrollment
- Product codes: `1` = FLOOD_SHIELD, `2` = RIDER_GUARD, `3` = HARVEST_SAFE
