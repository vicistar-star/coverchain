export interface PolicyData {
  contractId: number;
  productType: "FLOOD_SHIELD" | "RIDER_GUARD" | "HARVEST_SAFE";
  status: "ACTIVE" | "LAPSED" | "CANCELLED" | "EXPIRED";
  premiumAmount: number;      // in naira
  premiumInterval: number;    // seconds
  lastPremiumAt: string | null;
  totalClaimed: number;       // in cents
}

const PRODUCT_META: Record<PolicyData["productType"], { label: string; emoji: string; color: string }> = {
  FLOOD_SHIELD: { label: "Flood Shield", emoji: "🌊", color: "bg-blue-100 text-blue-800" },
  RIDER_GUARD:  { label: "RiderGuard",   emoji: "🏍️", color: "bg-orange-100 text-orange-800" },
  HARVEST_SAFE: { label: "HarvestSafe",  emoji: "🌾", color: "bg-green-100 text-green-800" },
};

const STATUS_COLOR: Record<PolicyData["status"], string> = {
  ACTIVE:    "bg-green-100 text-green-700",
  LAPSED:    "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
  EXPIRED:   "bg-yellow-100 text-yellow-700",
};

interface Props {
  policy: PolicyData;
  onPayPremium: (policyId: number) => void;
  paying?: boolean;
}

function daysUntilDue(lastPremiumAt: string | null, intervalSec: number): number | null {
  if (!lastPremiumAt) return null;
  const nextDueMs = new Date(lastPremiumAt).getTime() + intervalSec * 1000;
  return Math.ceil((nextDueMs - Date.now()) / 86_400_000);
}

export default function PolicyCard({ policy, onPayPremium, paying = false }: Props) {
  const meta = PRODUCT_META[policy.productType];
  const days = daysUntilDue(policy.lastPremiumAt, policy.premiumInterval);
  const isDue = days !== null && days <= 0;

  return (
    <div className="bg-white rounded-2xl shadow p-5 flex flex-col gap-3 border border-gray-100">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-2xl">{meta.emoji}</span>
          <h3 className="font-semibold text-gray-900 mt-1">{meta.label}</h3>
          <p className="text-xs text-gray-400">Policy #{policy.contractId}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLOR[policy.status]}`}>
          {policy.status}
        </span>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-gray-400 text-xs">Premium</p>
          <p className="font-medium">₦{policy.premiumAmount.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Total Claimed</p>
          <p className="font-medium">${(policy.totalClaimed / 100).toFixed(2)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-gray-400 text-xs">Next Premium</p>
          {days === null ? (
            <p className="text-gray-500 text-sm">Not set</p>
          ) : days <= 0 ? (
            <p className="text-red-600 font-medium text-sm">Overdue by {Math.abs(days)} day(s)</p>
          ) : (
            <p className="font-medium text-sm">In {days} day(s)</p>
          )}
        </div>
      </div>

      {/* Action */}
      {policy.status !== "CANCELLED" && (
        <button
          onClick={() => onPayPremium(policy.contractId)}
          disabled={paying}
          className={`w-full py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
            isDue
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-brand-500 hover:bg-brand-600 text-white"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {paying ? "Processing…" : isDue ? "Pay Now (Overdue)" : "Pay Premium"}
        </button>
      )}
    </div>
  );
}
