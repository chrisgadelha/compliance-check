"use client";

import { useState } from "react";
import { isAddress } from "viem";

interface Props {
  onSubmit: (address: string) => void;
  loading: boolean;
}

/**
 * Controlled address input with client-side validation.
 *
 * Validates with viem's isAddress() before surfacing to parent so the
 * Celoscan API is never called with a malformed address.
 */
export default function AddressInput({ onSubmit, loading }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();

    if (!trimmed) {
      setError("Please enter a wallet address");
      return;
    }
    if (!isAddress(trimmed)) {
      setError("Not a valid Celo address (must start with 0x, 42 hex chars)");
      return;
    }

    setError("");
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <label
        htmlFor="wallet-address"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Wallet address to check
      </label>

      <div className="flex gap-2">
        <input
          id="wallet-address"
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          placeholder="0x..."
          disabled={loading}
          autoComplete="off"
          spellCheck={false}
          className={`
            flex-1 rounded-lg border px-3 py-3 text-sm font-mono
            focus:outline-none focus:ring-2 focus:ring-celo-green
            disabled:opacity-50
            ${error ? "border-red-400" : "border-gray-300"}
          `}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-celo-green px-4 py-3 text-sm font-semibold text-white
                     disabled:opacity-50 active:scale-95 transition-transform"
        >
          {loading ? "Checking…" : "Check"}
        </button>
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
