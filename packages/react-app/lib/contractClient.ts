import { isAddress, parseAbi, encodeFunctionData } from "viem";
import { publicClient, getMiniPayWalletClient } from "./viemClients";


const CONTRACT_ADDRESS = (
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? ""
) as `0x${string}`;

const USDT_ADDRESS = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e" as `0x${string}`;

const ABI = parseAbi([
  "function logCheck(address wallet, uint8 score) external",
  "function totalChecks() external view returns (uint256)",
]);

/**
 * Reads the running total of on-chain checks from ComplianceLog.
 * Uses the public (read-only) client — no wallet needed.
 */
export async function getTotalChecks(): Promise<bigint> {
  if (!isAddress(CONTRACT_ADDRESS)) return 0n;

  return publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "totalChecks",
  }) as Promise<bigint>;
}

/**
 * Calls ComplianceLog.logCheck() via MiniPay's injected wallet.
 *
 * Uses sendTransaction with manually encoded calldata and a fixed gas limit
 * to bypass MiniPay's gas estimation. Fee currency is USDT (CIP-64) so the
 * user pays gas without needing a CELO balance.
 *
 * Returns the transaction hash on success.
 */
export async function logCheckOnChain(
  wallet: string,
  score: number
): Promise<`0x${string}`> {
  if (!isAddress(CONTRACT_ADDRESS)) {
    throw new Error("Contract address not configured. Set NEXT_PUBLIC_CONTRACT_ADDRESS.");
  }
  if (!isAddress(wallet)) {
    throw new Error("Invalid wallet address");
  }
  if (score < 0 || score > 100) {
    throw new Error("Score must be 0–100");
  }

  const walletClient = getMiniPayWalletClient();
  const [account] = await walletClient.getAddresses();

  const data = encodeFunctionData({
    abi: ABI,
    functionName: "logCheck",
    args: [wallet as `0x${string}`, score],
  });

  const hash = await walletClient.sendTransaction({
    account,
    to: CONTRACT_ADDRESS,
    data,
    gas: 100_000n,
    feeCurrency: USDT_ADDRESS,
  });

  await publicClient.waitForTransactionReceipt({ hash });

  return hash;
}
