import { useState, useEffect, useCallback } from "react";

export interface OracleEvent {
  id: string;
  contractEventId: number;
  eventType: "FLOOD" | "ACCIDENT" | "CROP_FAILURE";
  locationHash: string;
  severity: number;
  status: "PENDING" | "CONSENSUS_REACHED" | "PAYOUT_TRIGGERED" | "EXPIRED";
  submissions: number;
  consensusCount: number;
  createdAt: string;
  triggeredAt: string | null;
}

// Mock events used as fallback when backend is not running
const MOCK_EVENTS: OracleEvent[] = [
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
  {
    id: "evt-003",
    contractEventId: 1003,
    eventType: "CROP_FAILURE",
    locationHash: "KANO",
    severity: 55,
    status: "PENDING",
    submissions: 1,
    consensusCount: 1,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    triggeredAt: null,
  },
];

export function useOracle(pollIntervalMs = 15000) {
  const [events, setEvents] = useState<OracleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/oracle/events?limit=10");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEvents(Array.isArray(data.events) ? data.events : MOCK_EVENTS);
      setError(null);
    } catch {
      setEvents(MOCK_EVENTS);
      setError(null); // silent fallback to mocks in dev
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    const id = setInterval(fetchEvents, pollIntervalMs);
    return () => clearInterval(id);
  }, [fetchEvents, pollIntervalMs]);

  return { events, loading, error, refresh: fetchEvents };
}
