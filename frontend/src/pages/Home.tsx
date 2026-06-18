import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-12">
      <div className="text-6xl">🛡️</div>
      <h1 className="text-3xl font-bold text-gray-900">CoverChain</h1>
      <p className="text-gray-500 max-w-md text-lg">
        Parametric microinsurance for informal workers — powered by Stellar & Soroban.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Link
          to="/enroll"
          className="bg-brand-500 hover:bg-brand-600 text-white font-medium px-6 py-3 rounded-xl transition-colors"
        >
          Get Covered Now
        </Link>
        <a
          href="https://docs.coverchain.io"
          target="_blank"
          rel="noreferrer"
          className="border border-brand-500 text-brand-500 hover:bg-brand-50 font-medium px-6 py-3 rounded-xl transition-colors"
        >
          Read Docs
        </a>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-6 w-full max-w-lg text-sm">
        {[
          { emoji: "🌊", label: "Flood Shield", sub: "₦500/week" },
          { emoji: "🏍️", label: "RiderGuard",   sub: "₦1,000/week" },
          { emoji: "🌾", label: "HarvestSafe",  sub: "₦2,000/season" },
        ].map((p) => (
          <div key={p.label} className="bg-white rounded-xl p-4 shadow border border-gray-100">
            <div className="text-3xl mb-1">{p.emoji}</div>
            <p className="font-medium text-gray-800">{p.label}</p>
            <p className="text-gray-400 text-xs">{p.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
