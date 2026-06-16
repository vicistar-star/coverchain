import { Router, Request, Response } from "express";
import { z } from "zod";
import { loadKeypair, getAccountBalance, fundTestnetAccount, isTestnet } from "../services/stellar";
import { enrollPolicy, depositPremium, getPolicy, isPolicyActive, getContractAddresses, hasRequiredContracts } from "../services/soroban";

const router = Router();

const enrollSchema = z.object({
  holderSecretKey: z.string().min(1, "Holder secret key is required"),
  productId: z.enum(["FLOOD_SHIELD", "RIDER_GUARD", "HARVEST_SAFE"]),
  premiumAmount: z.string().min(1),
  premiumInterval: z.number().int().positive(),
  coverageParams: z.object({}).passthrough(),
});

const premiumSchema = z.object({
  holderSecretKey: z.string().min(1, "Holder secret key is required"),
  amount: z.string().min(1),
});

router.post("/enroll", async (req: Request, res: Response) => {
  try {
    if (!hasRequiredContracts()) {
      return res.status(503).json({ error: "Contract addresses not configured" });
    }

    const parsed = enrollSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    }

    const { holderSecretKey, productId, premiumAmount, premiumInterval, coverageParams } = parsed.data;

    const holderKeypair = loadKeypair(holderSecretKey);
    const holderAddress = holderKeypair.publicKey();

    let balance = "0";
    try {
      balance = await getAccountBalance(holderAddress);
    } catch {
      if (isTestnet()) {
        await fundTestnetAccount(holderAddress);
        balance = "10000";
      } else {
        return res.status(400).json({ error: `Account ${holderAddress} not found on network` });
      }
    }

    const policyId = await enrollPolicy(
      {
        holder: holderAddress,
        productId,
        coverageParams,
        premiumAmount,
        premiumInterval,
      },
      holderKeypair
    );

    res.status(201).json({
      policyId: Number(policyId),
      holderAddress,
      productId,
      premiumAmount,
      premiumInterval,
      balance,
      status: "enrolled",
    });
  } catch (error: any) {
    console.error("Enroll error:", error);
    res.status(500).json({ error: error.message || "Enrollment failed" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const policyId = parseInt(id, 10);
    if (isNaN(policyId)) {
      return res.status(400).json({ error: "Invalid policy ID" });
    }

    const policy = await getPolicy(policyId);
    if (!policy) {
      return res.status(404).json({ error: "Policy not found" });
    }

    res.json({ policyId, policy });
  } catch (error: any) {
    console.error("Get policy error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch policy" });
  }
});

router.get("/user/:address", async (req: Request, res: Response) => {
  const { address } = req.params;
  res.status(501).json({ error: `Not implemented: policies for ${address}` });
});

router.post("/:id/premium", async (req: Request, res: Response) => {
  try {
    if (!hasRequiredContracts()) {
      return res.status(503).json({ error: "Contract addresses not configured" });
    }

    const { id } = req.params;
    const policyId = parseInt(id, 10);
    if (isNaN(policyId)) {
      return res.status(400).json({ error: "Invalid policy ID" });
    }

    const parsed = premiumSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    }

    const { holderSecretKey, amount } = parsed.data;
    const holderKeypair = loadKeypair(holderSecretKey);

    await depositPremium(holderKeypair, policyId, amount);

    res.json({ policyId, amount, status: "premium_paid" });
  } catch (error: any) {
    console.error("Premium payment error:", error);
    res.status(500).json({ error: error.message || "Premium payment failed" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  res.status(501).json({ error: `Not implemented: cancel policy ${id}` });
});

export default router;
