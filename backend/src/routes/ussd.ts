import { Router, Request, Response } from "express";
import { PrismaClient, ProductType } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// ── Menus ──────────────────────────────────────────────────────────────────

const MENU_MAIN = `Welcome to CoverChain
Your Insurance, Simplified

1. Buy Insurance
2. Pay Premium
3. Check Policy Status
4. Claim Status
5. Help`;

const MENU_PRODUCTS = `Choose your cover:

1. Flood Shield (Traders) - N500/week
2. RiderGuard (Okada/Keke) - N1,000/week
3. HarvestSafe (Farmers) - N2,000/season
0. Back`;

const PRODUCT_LABELS: Record<string, string> = {
  "1": "Flood Shield",
  "2": "RiderGuard",
  "3": "HarvestSafe",
};

const PRODUCT_TYPE_MAP: Record<string, ProductType> = {
  "1": ProductType.FLOOD_SHIELD,
  "2": ProductType.RIDER_GUARD,
  "3": ProductType.HARVEST_SAFE,
};

const PREMIUM_LABELS: Record<string, string> = {
  "1": "N500/week",
  "2": "N1,000/week",
  "3": "N2,000/season",
};

const PREMIUM_AMOUNTS: Record<string, number> = {
  "1": 500,
  "2": 1000,
  "3": 2000,
};

const PREMIUM_INTERVALS: Record<string, number> = {
  "1": 604800,   // 1 week
  "2": 604800,
  "3": 15552000, // ~6 months (season)
};

// ── In-memory sessions ─────────────────────────────────────────────────────

type SessionState =
  | "main"
  | "product_select"
  | "enroll_wallet"
  | "enroll_confirm"
  | "pay_premium_input"
  | "check_status_input"
  | "claim_status_input";

interface UssdSession {
  state: SessionState;
  phoneNumber: string;
  data: Record<string, string>;
}

const sessions = new Map<string, UssdSession>();

// ── Helpers ────────────────────────────────────────────────────────────────

function con(text: string) { return `CON ${text}`; }
function end(text: string) { return `END ${text}`; }

async function getOrCreateUser(phoneNumber: string) {
  return prisma.user.upsert({
    where: { phone: phoneNumber },
    update: {},
    create: { phone: phoneNumber },
  });
}

async function findPolicy(policyId: string) {
  const contractId = parseInt(policyId.replace(/[^0-9]/g, ""), 10);
  if (isNaN(contractId)) return null;
  return prisma.policy.findFirst({ where: { contractId } });
}

// ── Route ──────────────────────────────────────────────────────────────────

router.post("/", async (req: Request, res: Response) => {
  const { sessionId, phoneNumber, text } = req.body;

  if (!sessionId || !phoneNumber) {
    return res.status(400).json({ error: "Missing sessionId or phoneNumber" });
  }

  let session = sessions.get(sessionId);
  if (!session) {
    session = { state: "main", phoneNumber, data: {} };
    sessions.set(sessionId, session);
  }

  // Africa's Talking sends cumulative input separated by "*"
  const parts = (text || "").split("*");
  const input = parts[parts.length - 1]?.trim() || "";
  const isInitial = !text;

  let response: string;

  if (isInitial) {
    session.state = "main";
    response = con(MENU_MAIN);
  } else {
    switch (session.state) {
      // ── Main ──────────────────────────────────────────────────────────────
      case "main": {
        if (input === "1") {
          session.state = "product_select";
          response = con(MENU_PRODUCTS);
        } else if (input === "2") {
          session.state = "pay_premium_input";
          response = con("Enter your policy number:");
        } else if (input === "3") {
          session.state = "check_status_input";
          response = con("Enter your policy number:");
        } else if (input === "4") {
          session.state = "claim_status_input";
          response = con("Enter your policy number:");
        } else if (input === "5") {
          sessions.delete(sessionId);
          response = end(
            "CoverChain Support:\nCall: 01-234-5678\nWeb: coverchain.io/help\nHours: Mon-Sat 8am-8pm"
          );
        } else {
          response = con(`Invalid option.\n\n${MENU_MAIN}`);
        }
        break;
      }

      // ── Product Select ────────────────────────────────────────────────────
      case "product_select": {
        if (input === "0") {
          session.state = "main";
          response = con(MENU_MAIN);
        } else if (["1", "2", "3"].includes(input)) {
          session.data.product = input;
          session.state = "enroll_wallet";
          response = con("Enter your Stellar wallet address (G...):");
        } else {
          response = con(`Invalid option.\n\n${MENU_PRODUCTS}`);
        }
        break;
      }

      // ── Enroll: Wallet Input ──────────────────────────────────────────────
      case "enroll_wallet": {
        if (!input.startsWith("G") || input.length < 10) {
          response = con("Invalid address. Enter your Stellar wallet (starts with G):");
        } else {
          session.data.wallet = input;
          session.state = "enroll_confirm";
          const p = session.data.product;
          response = con(
            `Confirm enrollment:\nProduct: ${PRODUCT_LABELS[p]}\nWallet: ${input.slice(0, 8)}...${input.slice(-4)}\nPremium: ${PREMIUM_LABELS[p]}\n\n1. Confirm\n2. Cancel`
          );
        }
        break;
      }

      // ── Enroll: Confirm ───────────────────────────────────────────────────
      case "enroll_confirm": {
        if (input === "1") {
          sessions.delete(sessionId);
          try {
            const user = await getOrCreateUser(phoneNumber);
            const p = session.data.product;

            // Update wallet if provided
            if (session.data.wallet) {
              await prisma.user.update({
                where: { id: user.id },
                data: { stellarWallet: session.data.wallet },
              });
            }

            const policy = await prisma.policy.create({
              data: {
                contractId: Math.floor(Math.random() * 90000) + 10000,
                productType: PRODUCT_TYPE_MAP[p],
                holderAddress: session.data.wallet,
                premiumAmount: PREMIUM_AMOUNTS[p],
                premiumInterval: PREMIUM_INTERVALS[p],
                userId: user.id,
              },
            });

            response = end(
              `Enrollment submitted!\nProduct: ${PRODUCT_LABELS[p]}\nPolicy ID: ${policy.contractId}\nPremium: ${PREMIUM_LABELS[p]}\nYou will receive an SMS confirmation shortly.`
            );
          } catch (err) {
            console.error("USSD enroll error:", err);
            response = end("Enrollment failed. Please try again or call 01-234-5678.");
          }
        } else if (input === "2") {
          session.state = "main";
          response = con(MENU_MAIN);
        } else {
          const p = session.data.product;
          response = con(
            `Confirm enrollment:\nProduct: ${PRODUCT_LABELS[p]}\nWallet: ${session.data.wallet?.slice(0, 8)}...${session.data.wallet?.slice(-4)}\nPremium: ${PREMIUM_LABELS[p]}\n\n1. Confirm\n2. Cancel`
          );
        }
        break;
      }

      // ── Pay Premium ───────────────────────────────────────────────────────
      case "pay_premium_input": {
        sessions.delete(sessionId);
        const policy = await findPolicy(input);
        if (!policy) {
          response = end(`Policy ${input} not found. Check your policy number and try again.`);
        } else {
          const nextDue = new Date(Date.now() + policy.premiumInterval * 1000);
          await prisma.policy.update({
            where: { id: policy.id },
            data: { lastPremiumAt: new Date() },
          });
          response = end(
            `Payment processed!\nPolicy: ${policy.contractId}\nAmount: N${policy.premiumAmount}\nNext due: ${nextDue.toLocaleDateString("en-NG")}\nThank you!`
          );
        }
        break;
      }

      // ── Check Status ──────────────────────────────────────────────────────
      case "check_status_input": {
        sessions.delete(sessionId);
        const policy = await findPolicy(input);
        if (!policy) {
          response = end(`Policy ${input} not found.`);
        } else {
          const nextDue = policy.lastPremiumAt
            ? new Date(policy.lastPremiumAt.getTime() + policy.premiumInterval * 1000)
            : null;
          const daysUntilDue = nextDue
            ? Math.ceil((nextDue.getTime() - Date.now()) / 86400000)
            : null;
          response = end(
            `Policy: ${policy.contractId}\nStatus: ${policy.status}\nProduct: ${policy.productType.replace(/_/g, " ")}\nNext premium: ${daysUntilDue != null ? `${daysUntilDue} day(s)` : "N/A"}\nTotal claimed: $${(policy.totalClaimed / 100).toFixed(2)}`
          );
        }
        break;
      }

      // ── Claim Status ──────────────────────────────────────────────────────
      case "claim_status_input": {
        sessions.delete(sessionId);
        const policy = await findPolicy(input);
        if (!policy) {
          response = end(`Policy ${input} not found.`);
        } else {
          response = end(
            `Policy: ${policy.contractId}\nNo active claims found.\nTotal paid out: $${(policy.totalClaimed / 100).toFixed(2)}\nSupport: 01-234-5678`
          );
        }
        break;
      }

      default: {
        session.state = "main";
        response = con(MENU_MAIN);
      }
    }
  }

  res.set("Content-Type", "text/plain");
  res.send(response);
});

export default router;
