"use client";

import { useEffect, useState, useCallback } from "react";
import AddressInput from "@/components/AddressInput";
import RiskResult from "@/components/RiskResult";
import { fetchWalletData } from "@/lib/celoscan";
import { calculateRiskScore, type ScoreBreakdown } from "@/lib/riskScore";
import { getTotalChecks, logCheckOnChain } from "@/lib/contractClient";
import { getMiniPayWalletClient, isMiniPay } from "@/lib/viemClients";

/**
 * ComplianceCheck — main Mini App page.
 *
 * Flow inside MiniPay:
 *   1. Auto-connect (no Connect Wallet button — MiniPay requirement)
 *   2. User enters any Celo address to evaluate
 *   3. Two Celoscan calls fetch wallet age, tx count, and cUSD volume
 *   4. Heuristic score rendered with color + plain-language summary
 *   5. Optional: log result on-chain via ComplianceLog contract
 *   6. Total checks counter pulled from contract at bottom
 */
export default function Home() {
  const [account, setAccount] = useState<string | null>(null);
  const [connectError, setConnectError] = useState("");

  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState("");

  const [checkedAddress, setCheckedAddress] = useState("");
  const [result, setResult] = useState<ScoreBreakdown | null>(null);

  const [logging, setLogging] = useState(false);
  const [txHash, setTxHash] = useState<string | undefined>();
  const [txError, setTxError] = useState<string | undefined>();

  const [totalChecks, setTotalChecks] = useState<bigint | null>(null);

  // ── Auto-connect on mount (MiniPay injects window.ethereum automatically) ──
  useEffect(() => {
    async function connect() {
      try {
        const walletClient = getMiniPayWalletClient();
        const [addr] = await walletClient.getAddresses();
        setAccount(addr);
      } catch {
        // Outside MiniPay: show a helpful message instead of crashing
        setConnectError(
          isMiniPay()
            ? "Could not connect to MiniPay wallet."
            : "Open this app inside MiniPay to connect your wallet."
        );
      }
    }
    connect();
  }, []);

  // ── Fetch total checks counter once on mount ──────────────────────────────
  const refreshTotalChecks = useCallback(async () => {
    try {
      const total = await getTotalChecks();
      setTotalChecks(total);
    } catch {
      // Non-fatal — counter is cosmetic
    }
  }, []);

  useEffect(() => { refreshTotalChecks(); }, [refreshTotalChecks]);

  // ── Run the risk check ────────────────────────────────────────────────────
  async function handleCheck(address: string) {
    setChecking(true);
    setCheckError("");
    setResult(null);
    setTxHash(undefined);
    setTxError(undefined);
    setCheckedAddress(address);

    try {
      const data = await fetchWalletData(address);
      const breakdown = calculateRiskScore(data);
      setResult(breakdown);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setCheckError(msg);
    } finally {
      setChecking(false);
    }
  }

  // ── Log on-chain ──────────────────────────────────────────────────────────
  async function handleLogOnChain() {
    if (!result) return;
    setLogging(true);
    setTxError(undefined);

    try {
      const hash = await logCheckOnChain(checkedAddress, result.score);
      setTxHash(hash);
      // Refresh counter after a successful log
      await refreshTotalChecks();
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Transaction failed";
      // Surface a friendly message for common rejections
      setTxError(
        raw.includes("rejected") || raw.includes("denied")
          ? "Transaction was cancelled."
          : raw
      );
    } finally {
      setLogging(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <main className="mx-auto max-w-sm px-4 py-6 space-y-6">

      {/* App header */}
      <header className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">ComplianceCheck</h1>
        <p className="text-sm text-gray-500">
          Heuristic risk check for any Celo wallet address
        </p>
      </header>

      {/* Wallet status */}
      {account ? (
        <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700 text-center">
          Connected: {account.slice(0, 8)}…{account.slice(-6)}
        </div>
      ) : connectError ? (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 text-center">
          {connectError}
        </div>
      ) : (
        <div className="rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-500 text-center animate-pulse">
          Connecting wallet…
        </div>
      )}

      {/* Address input */}
      <AddressInput onSubmit={handleCheck} loading={checking} />

      {/* Loading state */}
      {checking && (
        <div className="text-center py-8 space-y-2">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-celo-green" />
          <p className="text-sm text-gray-500">Fetching on-chain data…</p>
        </div>
      )}

      {/* Error state */}
      {checkError && !checking && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4" role="alert">
          <p className="text-sm font-semibold text-red-700">Check failed</p>
          <p className="text-xs text-red-600 mt-1">{checkError}</p>
        </div>
      )}

      {/* Risk result card */}
      {result && !checking && (
        <RiskResult
          address={checkedAddress}
          result={result}
          onLogOnChain={handleLogOnChain}
          logging={logging}
          txHash={txHash}
          txError={txError}
        />
      )}

      {/* Spacer so the counter floats near the bottom on short content */}
      <div className="flex-1" />

      {/* Total checks counter — read from ComplianceLog.totalChecks() */}
      <footer className="text-center space-y-1 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Total checks logged on Celo:{" "}
          <span className="font-semibold text-gray-600">
            {totalChecks !== null ? totalChecks.toString() : "—"}
          </span>
        </p>
        <p className="text-xs text-gray-300">
          ComplianceCheck · Apache-2.0 · Not financial or legal advice
        </p>
      </footer>
    </main>
  );
}
