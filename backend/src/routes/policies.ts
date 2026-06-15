import { Router, Request, Response } from "express";

const router = Router();

router.post("/enroll", async (_req: Request, res: Response) => {
  // TODO: Validate input with zod
  // TODO: Call PolicyRegistry contract to enroll
  // TODO: Create policy record in database
  res.status(501).json({ error: "Not implemented" });
});

router.get("/:id", async (req: Request, res: Response) => {
  // TODO: Fetch policy from database by ID
  // TODO: Optionally verify status on-chain
  const { id } = req.params;
  res.status(501).json({ error: `Not implemented: get policy ${id}` });
});

router.get("/user/:address", async (req: Request, res: Response) => {
  // TODO: List all policies for a given wallet address
  const { address } = req.params;
  res.status(501).json({ error: `Not implemented: policies for ${address}` });
});

router.post("/:id/premium", async (req: Request, res: Response) => {
  // TODO: Record premium payment
  const { id } = req.params;
  res.status(501).json({ error: `Not implemented: pay premium for ${id}` });
});

router.delete("/:id", async (req: Request, res: Response) => {
  // TODO: Cancel policy
  const { id } = req.params;
  res.status(501).json({ error: `Not implemented: cancel policy ${id}` });
});

export default router;
