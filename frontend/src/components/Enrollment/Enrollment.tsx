import { useState } from "react";

// ── Step 1: Product Selection ──────────────────────────────────────────────

const PRODUCTS = [
  {
    id: "FLOOD_SHIELD",
    emoji: "🌊",
    name: "Flood Shield",
    sub: "Market Traders",
    premium: "₦500/week (~$0.33)",
    payout: "$50 per flood event",
    trigger: "Rainfall > 80mm/24hr within 5km",
  },
  {
    id: "RIDER_GUARD",
    emoji: "🏍️",
    name: "RiderGuard",
    sub: "Okada & Keke Riders",
    premium: "₦1,000/week (~$0.65)",
    payout: "$100 hospitalisation, $200 disability",
    trigger: "Verified hospital admission",
  },
  {
    id: "HARVEST_SAFE",
    emoji: "🌾",
    name: "HarvestSafe",
    sub: "Smallholder Farmers",
    premium: "₦2,000/season (~$1.30/ha)",
    payout: "$80–$150 per hectare",
    trigger: "NDVI drop >40% or rainfall deficit >30%",
  },
] as const;

type ProductId = (typeof PRODUCTS)[number]["id"];

function ProductStep({
  selected,
  onSelect,
}: {
  selected: ProductId | null;
  onSelect: (id: ProductId) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-gray-500 text-sm mb-4">
        Choose the insurance product that fits your work.
      </p>
      {PRODUCTS.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(p.id)}
          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
            selected === p.id
              ? "border-brand-500 bg-brand-50"
              : "border-gray-200 hover:border-brand-300"
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-3xl">{p.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800">
                {p.name}{" "}
                <span className="text-xs font-normal text-gray-400">— {p.sub}</span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Premium: {p.premium}</p>
              <p className="text-xs text-gray-500">Payout: {p.payout}</p>
              <p className="text-xs text-gray-400 mt-0.5 italic">Trigger: {p.trigger}</p>
            </div>
            {selected === p.id && (
              <span className="text-brand-500 font-bold text-lg">✓</span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

// ── Step 2: KYC (Mock) ─────────────────────────────────────────────────────

interface KYCData {
  phone: string;
  bvn: string;
  name: string;
}

function KYCStep({
  data,
  onChange,
}: {
  data: KYCData;
  onChange: (d: KYCData) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-gray-500 text-sm">
        We verify your identity using your BVN (Bank Verification Number) via Dojah.
        No bank account required.
      </p>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
          placeholder="e.g. Amaka Okafor"
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <input
          type="tel"
          value={data.phone}
          onChange={(e) => onChange({ ...data, phone: e.target.value })}
          placeholder="+234 8012 345 678"
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          BVN <span className="text-xs text-gray-400">(11 digits)</span>
        </label>
        <input
          type="text"
          value={data.bvn}
          onChange={(e) => onChange({ ...data, bvn: e.target.value.replace(/\D/g, "").slice(0, 11) })}
          placeholder="22123456789"
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
        🔒 Your BVN is used only for identity verification and never stored in plaintext. This is a
        mock integration — no real KYC call is made in demo mode.
      </p>
    </div>
  );
}

// ── Step 3: Wallet Sign ────────────────────────────────────────────────────

function WalletStep({
  address,
  productId,
  onSign,
  signing,
}: {
  address: string | null;
  productId: ProductId;
  onSign: () => void;
  signing: boolean;
}) {
  const product = PRODUCTS.find((p) => p.id === productId)!;

  return (
    <div className="space-y-5">
      <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Product</span>
          <span className="font-medium text-gray-800">
            {product.emoji} {product.name}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Premium</span>
          <span className="font-medium text-gray-800">{product.premium}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Wallet</span>
          <span className="font-mono text-xs text-gray-800">
            {address ? `${address.slice(0, 8)}…${address.slice(-6)}` : "Not connected"}
          </span>
        </div>
      </div>

      {!address && (
        <p className="text-sm text-red-500">
          ⚠️ No wallet connected. Please connect your Freighter wallet from the Dashboard first.
        </p>
      )}

      <p className="text-xs text-gray-500">
        Clicking "Sign & Enroll" will submit a Soroban transaction to the Stellar Testnet to
        register your policy on-chain. Your first premium will be collected immediately.
      </p>

      <button
        onClick={onSign}
        disabled={!address || signing}
        className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {signing ? "Signing transaction…" : "Sign & Enroll"}
      </button>
    </div>
  );
}

// ── Step 4: Confirmation ───────────────────────────────────────────────────

function ConfirmationStep({
  policyId,
  txHash,
  productId,
  onDone,
}: {
  policyId: number;
  txHash: string;
  productId: ProductId;
  onDone: () => void;
}) {
  const product = PRODUCTS.find((p) => p.id === productId)!;

  return (
    <div className="text-center space-y-5">
      <div className="text-6xl">✅</div>
      <div>
        <h3 className="text-xl font-bold text-gray-800">You're Covered!</h3>
        <p className="text-gray-500 text-sm mt-1">
          {product.emoji} {product.name} policy is now active on Stellar Testnet.
        </p>
      </div>
      <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Policy ID</span>
          <span className="font-mono font-medium text-gray-800">#{policyId}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500 shrink-0">Tx Hash</span>
          <span className="font-mono text-xs text-gray-600 truncate">{txHash}</span>
        </div>
      </div>
      <p className="text-xs text-gray-400">
        You'll receive an SMS confirmation at your registered phone number.
      </p>
      <button
        onClick={onDone}
        className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        Go to Dashboard
      </button>
    </div>
  );
}

// ── Enrollment wizard ──────────────────────────────────────────────────────

type Step = "product" | "kyc" | "wallet" | "confirm";

const STEPS: Step[] = ["product", "kyc", "wallet", "confirm"];
const STEP_LABELS = ["Choose Plan", "Verify Identity", "Sign & Enroll", "Confirmed"];

interface EnrollmentProps {
  walletAddress: string | null;
  onDone: () => void;
}

export default function Enrollment({ walletAddress, onDone }: EnrollmentProps) {
  const [step, setStep] = useState<Step>("product");
  const [productId, setProductId] = useState<ProductId | null>(null);
  const [kyc, setKyc] = useState<KYCData>({ phone: "", bvn: "", name: "" });
  const [signing, setSigning] = useState(false);
  const [result, setResult] = useState<{ policyId: number; txHash: string } | null>(null);

  const stepIndex = STEPS.indexOf(step);

  const canAdvance = () => {
    if (step === "product") return productId !== null;
    if (step === "kyc") return kyc.name.trim() && kyc.phone.trim() && kyc.bvn.length === 11;
    return true;
  };

  const advance = () => {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  };

  const handleSign = async () => {
    setSigning(true);
    try {
      // In production this calls the backend /policies/enroll which invokes the Soroban contract.
      // In demo mode we simulate the round-trip.
      await new Promise((r) => setTimeout(r, 1800));
      setResult({
        policyId: Math.floor(40000 + Math.random() * 9999),
        txHash: Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join(""),
      });
      setStep("confirm");
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress bar */}
      {step !== "confirm" && (
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {STEP_LABELS.slice(0, 3).map((label, i) => (
              <span
                key={label}
                className={`text-xs font-medium ${
                  i < stepIndex ? "text-brand-500" :
                  i === stepIndex ? "text-brand-600 font-semibold" : "text-gray-400"
                }`}
              >
                {i < stepIndex ? "✓ " : `${i + 1}. `}{label}
              </span>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-brand-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${((stepIndex) / 2) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
        {step === "product" && (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Choose your coverage</h2>
            <ProductStep selected={productId} onSelect={setProductId} />
          </>
        )}
        {step === "kyc" && (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Verify your identity</h2>
            <KYCStep data={kyc} onChange={setKyc} />
          </>
        )}
        {step === "wallet" && productId && (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Review & sign</h2>
            <WalletStep
              address={walletAddress}
              productId={productId}
              onSign={handleSign}
              signing={signing}
            />
          </>
        )}
        {step === "confirm" && productId && result && (
          <ConfirmationStep
            policyId={result.policyId}
            txHash={result.txHash}
            productId={productId}
            onDone={onDone}
          />
        )}

        {/* Navigation buttons (not shown on wallet or confirm step) */}
        {step !== "wallet" && step !== "confirm" && (
          <div className="flex justify-between mt-6">
            {stepIndex > 0 ? (
              <button
                onClick={() => setStep(STEPS[stepIndex - 1])}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={advance}
              disabled={!canAdvance()}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white font-medium px-6 py-2.5 rounded-xl transition-colors text-sm"
            >
              Continue →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
