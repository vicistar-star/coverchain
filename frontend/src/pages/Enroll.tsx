import { useNavigate } from "react-router-dom";
import { useStellar } from "../hooks/useStellar";
import Enrollment from "../components/Enrollment/Enrollment";

export default function EnrollPage() {
  const navigate = useNavigate();
  const { publicKey, connected, connect, loading } = useStellar();

  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Get Covered</h1>

      {!connected && (
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow border border-gray-100 p-6 mb-6 text-center">
          <p className="text-gray-500 text-sm mb-4">
            Connect your Freighter wallet to sign the enrollment transaction.
          </p>
          <button
            onClick={connect}
            disabled={loading}
            className="bg-brand-500 hover:bg-brand-600 text-white font-medium px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? "Connecting…" : "Connect Freighter Wallet"}
          </button>
        </div>
      )}

      <Enrollment
        walletAddress={publicKey}
        onDone={() => navigate("/dashboard")}
      />
    </div>
  );
}
