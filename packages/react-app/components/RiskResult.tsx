"use client";

import type { ScoreBreakdown } from "@/lib/riskScore";

interface Props {
  address: string;
  result: ScoreBreakdown;
  onLogOnChain: () => void;
  logging: boolean;
  txHash?: string;
  txError?: string;
}

const LEVEL_STYLES = {
  low:    { ring: "ring-green-400",  bg: "bg-green-50",  text: "text-green-700",  badge: "bg-green-100 text-green-800",  label: "Low Risk" },
  medium: { ring: "ring-yellow-400", bg: "bg-yellow-50", text: "text-yellow-700", badge: "bg-yellow-100 text-yellow-800", label: "Medium Risk" },
  high:   { ring: "ring-red-400",    bg: "bg-red-50",    text: "text-red-700",    badge: "bg-red-100 text-red-800",       label: "High Risk" },
};

/**
 * Displays the computed risk score, factor breakdown, plain-language
 * summary, and the "Log on-chain" action button.
 */
export default function RiskResult({
  address,
  result,
  onLogOnChain,
  logging,
  txHash,
  txError,
}: Props) {
  const styles = LEVEL_STYLES[result.level];

  return (
    <div className={`rounded-xl ${styles.bg} ring-2 ${styles.ring} p-4 space-y-4`}>
      {/* Score header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 font-mono truncate max-w-[180px]" title={address}>
            {address.slice(0, 10)}…{address.slice(-6)}
          </p>
          <p className={`text-4xl font-bold ${styles.text}`}>{result.score}<span className="text-lg font-normal">/100</span></p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${styles.badge}`}>
          {styles.label}
        </span>
      </div>

      {/* Plain-language summary */}
      <p className="text-sm text-gray-700 leading-relaxed">{result.summary}</p>

      {/* Factor breakdown */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Score factors
        </p>
        <ul className="space-y-1">
          {result.factors.map((f, i) => (
            <li key={i} className="text-sm text-gray-600 flex gap-2">
              <span className="text-gray-400">•</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Log on-chain button */}
      {!txHash && (
        <button
          onClick={onLogOnChain}
          disabled={logging}
          className="w-full rounded-lg bg-gray-800 py-3 text-sm font-semibold text-white
                     disabled:opacity-50 active:scale-95 transition-transform"
        >
          {logging ? "Logging on-chain…" : "Log this check on-chain"}
        </button>
      )}

      {txError && (
        <p className="text-xs text-red-600 text-center" role="alert">
          {txError}
        </p>
      )}

      {/* Celoscan receipt link after successful log */}
      {txHash && (
        <div className="rounded-lg bg-white/70 p-3 text-center space-y-1">
          <p className="text-xs font-semibold text-gray-600">Check logged on Celo</p>
          <a
            href={`https://celoscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 underline font-mono break-all"
          >
            {txHash.slice(0, 14)}…{txHash.slice(-8)}
          </a>
        </div>
      )}

      {/* Disclaimer — always visible */}
      <p className="text-xs text-gray-400 text-center leading-snug">
        Heuristic model only. Not professional AML/KYC. Not Chainalysis.
      </p>
    </div>
  );
}
