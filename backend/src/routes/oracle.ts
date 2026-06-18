import { Router, Request, Response } from "express";

const router = Router();

// Mock events — replaced by DB queries once Prisma is wired with a live DB
const MOCK_EVENTS = [
  {
    id: "evt-001",
    contractEventId: 1001,
    eventType: "FLOOD",
    locationHash: "LAGOS",
    severity: 85,
    status: "PAYOUT_TRIGGERED",
    submissions: 3,
    consensusCount: 3,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    triggeredAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
  {
    id: "evt-002",
    contractEventId: 1002,
    eventType: "FLOOD",
    locationHash: "PORT HARCOURT",
    severity: 72,
    status: "CONSENSUS_REACHED",
    submissions: 2,
    consensusCount: 2,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    triggeredAt: null,
  },
];

router.get("/events", (_req: Request, res: Response) => {
  res.json({ events: MOCK_EVENTS });
});

router.get("/events/:id", (req: Request, res: Response) => {
  const ev = MOCK_EVENTS.find((e) => e.id === req.params.id);
  if (!ev) return res.status(404).json({ error: "Event not found" });
  res.json({ event: ev });
});

// Oracle node submission endpoint (auth should be added in production)
router.post("/submit", (req: Request, res: Response) => {
  const { eventType, locationHash, severity, timestamp, evidenceCid } = req.body;
  if (!eventType || !locationHash || severity == null) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  // In production: persist to DB, invoke OracleConsensus contract via soroban service
  const id = `evt-${Date.now()}`;
  res.status(201).json({
    id,
    eventType,
    locationHash,
    severity,
    timestamp,
    evidenceCid,
    status: "PENDING",
    message: "Submission received (mock — wire Soroban call in production)",
  });
});

export default router;
