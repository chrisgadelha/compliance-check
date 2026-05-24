import { createPublicClient, createWalletClient, custom, http } from "viem";
import { celo } from "viem/chains";

declare global {
  interface Window {
    ethereum?: Record<string, unknown>;
  }
}

/**
 * Read-only client backed by Celo Mainnet's public forno RPC.
 * Used for: readContract (totalChecks), any off-wallet queries.
 */
export const publicClient = createPublicClient({
  chain: celo,
  transport: http("https://forno.celo.org"),
});

/**
 * Returns a wallet client wired to MiniPay's injected window.ethereum.
 * Called lazily (not at module load) so SSR doesn't crash on window access.
 */
export function getMiniPayWalletClient() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MiniPay wallet not available");
  }
  return createWalletClient({
    chain: celo,
    transport: custom(window.ethereum),
  });
}

/** Returns true only when running inside MiniPay's WebView. */
export function isMiniPay(): boolean {
  return (
    typeof window !== "undefined" &&
    window.ethereum !== undefined &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.ethereum as any).isMiniPay === true
  );
}
