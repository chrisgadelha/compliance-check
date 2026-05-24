import type { WalletData } from "./celoscan";

export interface ScoreBreakdown {
  /** Final clamped score: 0 (lowest risk) – 100 (highest risk). */
  score: number;
  /** Human-readable list of factors that influenced the score. */
  factors: string[];
  /** Short plain-language verdict. */
  summary: string;
  /** UI colour bucket. */
  level: "low" | "medium" | "high";
}

/**
 * Applies the heuristic scoring model to on-chain wallet signals.
 *
 * All deltas are additive; the result is clamped to [0, 100].
 * This is an intentionally simple, transparent model — it is NOT
 * a professional AML/KYC system. See README for limitations.
 *
 * Starting from 0 (assume clean) and adding risk points keeps the
 * model interpretable: each factor explains why the score is higher.
 */
export function calculateRiskScore(data: WalletData): ScoreBreakdown {
  let score = 0;
  const factors: string[] = [];

  // ── Wallet age heuristics ────────────────────────────────────────────────
  if (data.ageDays === 0) {
    score += 40;
    factors.push("Brand-new wallet (no transaction history) +40");
  } else if (data.ageDays < 7) {
    score += 40;
    factors.push(`Very new wallet (${data.ageDays}d old) +40`);
  } else if (data.ageDays < 30) {
    score += 20;
    factors.push(`Recently created wallet (${data.ageDays}d old) +20`);
  } else if (data.ageDays > 180) {
    score -= 10;
    factors.push(`Established wallet (${data.ageDays}d old) -10`);
  }

  // ── Transaction count heuristics ─────────────────────────────────────────
  if (data.totalTxCount < 5) {
    score += 20;
    factors.push(`Very few transactions (${data.totalTxCount}) +20`);
  } else if (data.totalTxCount > 100) {
    score -= 10;
    factors.push(`High transaction volume (100+ txs) -10`);
  }

  // ── cUSD (USDm) transfer volume heuristics ───────────────────────────────
  if (data.cusdVolumeUsd < 1) {
    score += 15;
    factors.push(`Negligible cUSD activity (<$1 total) +15`);
  } else if (data.cusdVolumeUsd > 1000) {
    score -= 5;
    factors.push(`Significant cUSD history (>$1,000 total) -5`);
  }

  // ── Clamp ─────────────────────────────────────────────────────────────────
  score = Math.min(100, Math.max(0, score));

  const level: ScoreBreakdown["level"] =
    score <= 30 ? "low" : score <= 60 ? "medium" : "high";

  const summary = buildSummary(score, level, data);

  return { score, factors, summary, level };
}

/** Produces a plain-English one-paragraph verdict readable by non-technical users. */
function buildSummary(
  score: number,
  level: ScoreBreakdown["level"],
  data: WalletData
): string {
  const ageText =
    data.ageDays === 0
      ? "no on-chain history"
      : `${data.ageDays} day${data.ageDays !== 1 ? "s" : ""} of history`;

  const txText = `${data.totalTxCount} transaction${data.totalTxCount !== 1 ? "s" : ""}`;

  const volText =
    data.cusdVolumeUsd < 0.01
      ? "no cUSD activity"
      : `$${data.cusdVolumeUsd.toFixed(2)} cUSD volume`;

  const levelMap = {
    low:    "This wallet appears relatively established. Proceed with normal caution.",
    medium: "This wallet shows some unusual patterns. Consider smaller test transactions first.",
    high:   "This wallet has multiple risk indicators. Exercise caution before sending funds.",
  };

  return (
    `Risk score ${score}/100 (${level} risk). ` +
    `Wallet has ${ageText}, ${txText}, and ${volText}. ` +
    levelMap[level] +
    " Remember: this is a heuristic tool, not a professional compliance check."
  );
}
