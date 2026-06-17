import { useState, useEffect, useCallback } from "react";
import { useStellar } from "../hooks/useStellar";
import PolicyCard, { PolicyData } from "../components/Dashboard/PolicyCard";

// ── Mock data (replaced by real API calls once backend is running) ──────────

const MOCK_POLICIES: PolicyData[] = [
  {
    contractId: 42001,
    productType: "FLOOD_SHIELD",
    status: "ACTIVE",
    premiumAmount: 500,
    premiumInterval: 604800,
    lastPremiumAt: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
    totalClaimed: 0,
  },
  {
    contractId: 42002,
    productType: "RIDER_GUARD",
    status: "LAPSED",
    premiumAmount: 1000,
    premiumInterval: 604800,
    lastPremiumAt: new Date(Date.now() - 14 * 86400 * 1000).toISOString(),
    totalClaimed: 10000,
  },
];

// ── Pool health mock ───────────────────────────────────────────────────────

function PoolHealthBar({ ratio }: { ratio: number }) {
  const pct = Math.min(Math.round(ratio * 100), 100);
  const color = pct >= 60 ? "bg-green-500" : pct >= 30 ? "bg-yellow-400" : "bg-red-500";
  return (
    <div className="bg-white rounded-2xl shadow p-5 border border-gray-100">
      <h3 className="font-semibold text-gray-700 mb-2">Risk Pool Health</h3>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div className={`${color} h-3 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-gray-400 mt-1">{pct}% funded</p>
    </div>
  );
}

// ── Dashboard page ─────────────────────────────────────────────────────────

export default function Dashboard() {
  const { connected, publicKey, balances, loading, error, connect, disconnect } = useStellar();
  const [policies, setPolicies] = useState<PolicyData[]>([]);
  const [payingId, setPayingId] = useState<number | null>(null);

  // Load policies from backend (falls back to mock if backend not running)
  useEffect(() => {
    if (!publicKey) return;
    fetch(`/api/v1/policies/user/${publicKey}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.policies)) setPolicies(data.policies);
        else setPolicies(MOCK_POLICIES); // dev fallback
      })
      .catch(() => setPolicies(MOCK_POLICIES)); // dev fallback
  }, [publicKey]);

  const handlePayPremium = useCallback(async (policyId: number) => {
    setPayingId(policyId);
    try {
      await new Promise((r) => setTimeout(r, 1500)); // simulate async
      alert(`Premium paid for policy #${policyId}! (mock — wire real tx here)`);
      setPolicies((prev) =>
        prev.map((p) =>
          p.contractId === policyId
            ? { ...p, lastPremiumAt: new Date().toISOString(), status: "ACTIVE" }
            : p
        )
      );
    } finally {
      setPayingId(null);
    }
  }, []);

  // ── Not connected ──────────────────────────────────────────────────────
  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
        <div className="text-5xl">🛡️</div>
        <h1 className="text-2xl font-bold text-gray-800">CoverChain Dashboard</h1>
        <p className="text-gray-500 max-w-sm">
          Connect your Freighter wallet to view and manage your insurance policies.
        </p>
        {error && <p className="text-red-500 text-sm max-w-sm">{error}</p>}
        <button
          onClick={connect}
          disabled={loading}
          className="bg-brand-500 hover:bg-brand-600 text-white font-medium px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? "Connecting…" : "Connect Freighter Wallet"}
        </button>
        <p className="text-xs text-gray-400">
          Don't have Freighter?{" "}
          <a href="https://freighter.app" target="_blank" rel="noreferrer" className="underline">
            Install it here
          </a>
        </p>
      </div>
    );
  }

  // ── Connected ──────────────────────────────────────────────────────────
  const xlmBalance = balances.find((b) => b.asset === "XLM")?.balance ?? "—";
  const usdcBalance = balances.find((b) => b.asset === "USDC")?.balance ?? "—";

  return (
    <div className="flex flex-col gap-6">
      {/* Wallet summary */}
      <div className="bg-brand-500 text-white rounded-2xl p-5 shadow flex items-start justify-between">
        <div>
          <p className="text-xs opacity-70">Connected Wallet</p>
          <p className="font-mono text-sm mt-1">
            {publicKey!.slice(0, 8)}…{publicKey!.slice(-6)}
          </p>
          <div className="flex gap-4 mt-2 text-sm">
            <span>XLM: <strong>{xlmBalance}</strong></span>
            <span>USDC: <strong>{usdcBalance}</strong></span>
          </div>
        </div>
        <button onClick={disconnect} className="text-xs opacity-70 hover:opacity-100 underline">
          Disconnect
        </button>
      </div>

      {/* Pool health */}
      <PoolHealthBar ratio={0.72} />

      {/* Policies */}
      <div>
        <h2 className="font-semibold text-gray-700 mb-3">Your Policies</h2>
        {policies.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center border border-gray-100">
            <p className="text-gray-400">No active policies found.</p>
            <p className="text-sm text-gray-400 mt-1">Dial *384# or use the Enroll flow to get covered.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {policies.map((p) => (
              <PolicyCard
                key={p.contractId}
                policy={p}
                onPayPremium={handlePayPremium}
                paying={payingId === p.contractId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
