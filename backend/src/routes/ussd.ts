import { Router, Request, Response } from "express";

const router = Router();

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

interface UssdSession {
  state: string;
  phoneNumber: string;
  data: Record<string, string>;
}

const sessions = new Map<string, UssdSession>();

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

  const input = text?.trim() || "";
  let response = "";
  let endSession = false;

  if (!text) {
    // Initial request - show main menu
    response = `CON ${MENU_MAIN}`;
    session.state = "main";
  } else {
    const parts = text.split("*");
    const currentInput = parts[parts.length - 1];

    switch (session.state) {
      case "main":
        if (currentInput === "1") {
          session.state = "product_select";
          response = `CON ${MENU_PRODUCTS}`;
        } else if (currentInput === "2") {
          session.state = "pay_premium";
          response = "CON Enter your policy number:";
        } else if (currentInput === "3") {
          session.state = "check_status";
          response = "CON Enter your policy number:";
        } else if (currentInput === "4") {
          session.state = "claim_status";
          response = "CON Enter your policy number:";
        } else if (currentInput === "5") {
          response = "END Call our support line at 01-234-5678 or visit coverchain.io/help";
          endSession = true;
        } else {
          response = `CON Invalid option. ${MENU_MAIN}`;
        }
        break;

      case "product_select":
        if (currentInput === "0") {
          session.state = "main";
          response = `CON ${MENU_MAIN}`;
        } else if (["1", "2", "3"].includes(currentInput)) {
          session.data["product"] = currentInput;
          session.state = "confirm_enroll";
          response = "CON Enter your Stellar wallet address (G...):";
        } else {
          response = `CON Invalid option. ${MENU_PRODUCTS}`;
        }
        break;

      case "confirm_enroll":
        session.data["wallet"] = currentInput;
        // TODO: Submit enrollment to PolicyRegistry contract
        // TODO: Create policy record in database
        response = "END Enrollment submitted! You will receive an SMS confirmation shortly.";
        endSession = true;
        sessions.delete(sessionId);
        break;

      case "pay_premium":
        session.data["policyNumber"] = currentInput;
        // TODO: Look up policy and process premium payment
        response = "END Payment link sent via SMS. Thank you!";
        endSession = true;
        sessions.delete(sessionId);
        break;

      case "check_status":
        session.data["policyNumber"] = currentInput;
        // TODO: Look up policy status from database/contract
        response = `END Policy ${currentInput}: ACTIVE. Next premium due: N/A. Contact support for details.`;
        endSession = true;
        sessions.delete(sessionId);
        break;

      case "claim_status":
        session.data["policyNumber"] = currentInput;
        // TODO: Look up claim status
        response = `END Policy ${currentInput}: No active claims found.`;
        endSession = true;
        sessions.delete(sessionId);
        break;

      default:
        response = `CON ${MENU_MAIN}`;
        session.state = "main";
    }
  }

  if (!endSession && !response.startsWith("CON ") && !response.startsWith("END ")) {
    response = `CON ${response}`;
  }

  res.set("Content-Type", "text/plain");
  res.send(response);
});

export default router;
