/**
 * Celoscan API helpers for ComplianceCheck.
 *
 * Rate limit: 5 requests/second on the free tier.
 * We serialize calls with a 250 ms gap and retry once on 429 / NOTOK with
 * an exponential back-off so the user never sees a raw API error for a
 * temporary quota hit.
 *
 * cUSD / USDm contract on Celo Mainnet (18 decimals):
 *   0x765DE816845861e75A25fCA122bb6898B8B1282a
 */

// Etherscan V2 unified API — chainid selects the network
const CELOSCAN_BASE = "https://api.etherscan.io/v2/api";
const CHAIN_ID = "42220"; // Celo Mainnet
const CUSD_CONTRACT = "0x765DE816845861e75A25fCA122bb6898B8B1282a";

/** Data returned by fetchWalletData, ready for riskScore(). */
export interface WalletData {
  /** Age of wallet in days (0 if no transactions found). */
  ageDays: number;
  /** Total number of normal outbound + inbound transactions. */
  totalTxCount: number;
  /** cUSD transfer volume in USD (sum of sent + received amounts). */
  cusdVolumeUsd: number;
}

// ─── internal helpers ───────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetches one Celoscan endpoint.
 * Retries once after 600 ms on rate-limit responses to absorb transient quota hits.
 */
async function celoscanFetch(params: Record<string, string>): Promise<unknown> {
  const apiKey = process.env.NEXT_PUBLIC_CELOSCAN_API_KEY ?? "";
  const url = new URL(CELOSCAN_BASE);
  Object.entries({ chainid: CHAIN_ID, ...params, apikey: apiKey }).forEach(([k, v]) =>
    url.searchParams.set(k, v)
  );

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(url.toString());

    // HTTP-level rate limit (should be rare with 250 ms gaps)
    if (res.status === 429) {
      await sleep(600 * (attempt + 1));
      continue;
    }

    const json = (await res.json()) as {
      status: string;
      message: string;
      result: unknown;
    };

    // Celoscan signals rate limit with status "0" and a specific message
    if (
      json.status === "0" &&
      typeof json.result === "string" &&
      json.result.toLowerCase().includes("rate limit")
    ) {
      await sleep(600 * (attempt + 1));
      continue;
    }

    // "No transactions found" is a valid empty result, not an error
    if (json.status === "0" && json.message === "No transactions found") {
      return [];
    }

    return json.result;
  }

  throw new Error("Celoscan rate limit exceeded — please try again in a moment");
}

// ─── public API ─────────────────────────────────────────────────────────────

/**
 * Fetches all signals needed to calculate a risk score for `address`.
 *
 * Makes two sequential Celoscan calls with a 250 ms gap to stay well
 * under the 5 req/s limit.
 */
export async function fetchWalletData(address: string): Promise<WalletData> {
  // ── Call 1: normal transaction list (oldest-first, cap 150) ──────────────
  // We fetch 150 so we can detect both "< 5 txs" and "> 100 txs" in one call.
  const txList = (await celoscanFetch({
    module: "account",
    action: "txlist",
    address,
    startblock: "0",
    endblock: "99999999",
    sort: "asc",
    page: "1",
    offset: "150",
  })) as Array<{ timeStamp: string }>;

  // Respect the 5 req/s rate limit between calls
  await sleep(250);

  // ── Call 2: cUSD (USDm) token transfers ──────────────────────────────────
  const tokenTxList = (await celoscanFetch({
    module: "account",
    action: "tokentx",
    contractaddress: CUSD_CONTRACT,
    address,
    page: "1",
    offset: "200",
    sort: "asc",
  })) as Array<{ value: string; tokenDecimal: string }>;

  // ── Derive wallet age ─────────────────────────────────────────────────────
  let ageDays = 0;
  if (Array.isArray(txList) && txList.length > 0) {
    const firstTsSeconds = parseInt(txList[0].timeStamp, 10);
    const nowSeconds = Math.floor(Date.now() / 1000);
    ageDays = Math.floor((nowSeconds - firstTsSeconds) / 86400);
  }

  // ── Derive tx count (capped at 150 for scoring purposes) ─────────────────
  const totalTxCount = Array.isArray(txList) ? txList.length : 0;

  // ── Derive cUSD volume in USD ─────────────────────────────────────────────
  // USDm has 18 decimals; divide raw BigInt value by 1e18 to get USD units.
  let cusdVolumeUsd = 0;
  if (Array.isArray(tokenTxList)) {
    for (const tx of tokenTxList) {
      const decimals = parseInt(tx.tokenDecimal ?? "18", 10);
      const raw = BigInt(tx.value ?? "0");
      cusdVolumeUsd += Number(raw) / Math.pow(10, decimals);
    }
  }

  console.log("[celoscan] result:", { ageDays, totalTxCount, cusdVolumeUsd });
  return { ageDays, totalTxCount, cusdVolumeUsd };
}
