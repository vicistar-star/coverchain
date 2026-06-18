import { useOracle, OracleEvent } from "../../hooks/useOracle";

const EVENT_LABELS: Record<OracleEvent["eventType"], string> = {
  FLOOD: "🌊 Flood",
  ACCIDENT: "🏍️ Accident",
  CROP_FAILURE: "🌾 Crop Failure",
};

const STATUS_STYLES: Record<OracleEvent["status"], string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONSENSUS_REACHED: "bg-blue-100 text-blue-800",
  PAYOUT_TRIGGERED: "bg-green-100 text-green-800",
  EXPIRED: "bg-gray-100 text-gray-500",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function OracleEventFeed() {
  const { events, loading } = useOracle();

  return (
    <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-700">Live Oracle Events</h3>
        <span className="flex items-center gap-1 text-xs text-green-600">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
          Live
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-6">No oracle events yet.</p>
      ) : (
        <ul className="space-y-2">
          {events.map((ev) => (
            <li key={ev.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {EVENT_LABELS[ev.eventType]} — {ev.locationHash}
                </p>
                <p className="text-xs text-gray-400">
                  Severity: {ev.severity}/100 · Oracles: {ev.consensusCount}/3 · {timeAgo(ev.createdAt)}
                </p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${STATUS_STYLES[ev.status]}`}>
                {ev.status === "PAYOUT_TRIGGERED" ? "✅ Paid" :
                 ev.status === "CONSENSUS_REACHED" ? "🔵 Consensus" :
                 ev.status === "PENDING" ? "⏳ Pending" : "Expired"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
