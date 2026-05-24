# ComplianceCheck

A heuristic risk-check tool for [MiniPay](https://minipay.xyz) users to evaluate any Celo wallet address before sending or receiving cUSD (USDm). Returns a transparent, score-based risk indicator using only public on-chain data from the Celoscan API.

> **Honest disclaimer:** This is a simple heuristic model built for educational and exploratory purposes. It is **not** professional AML/KYC compliance software. It does **not** replicate or approach the sophistication of Chainalysis, Elliptic, TRM Labs, or similar tools. Do not use it to make high-stakes financial or legal decisions. The score reflects publicly observable on-chain patterns — it cannot detect mixer usage, cross-chain flows, off-chain risk signals, or most money-laundering patterns. Use it as a starting-point sanity check, not a definitive verdict.

---

## What it does

1. User opens the Mini App inside MiniPay (auto-connects — no "Connect Wallet" button)
2. Inputs any Celo wallet address
3. App fetches from Celoscan API:
   - First transaction date (wallet age in days)
   - Total transaction count
   - cUSD / USDm transfer volume
4. Applies a transparent heuristic model to produce a score from 0 (low risk) to 100 (high risk)
5. Displays score with colour, a factor breakdown, and a plain-language summary
6. Optional: log the result on-chain via `ComplianceLog.sol` for a public, immutable record
7. Shows the running total of on-chain checks from the contract

---

## Scoring model (transparent heuristics)

| Signal | Rule | Score delta |
|--------|------|-------------|
| Wallet age | < 7 days | +40 |
| Wallet age | 7 – 30 days | +20 |
| Wallet age | > 180 days | −10 |
| Transaction count | < 5 txs | +20 |
| Transaction count | > 100 txs | −10 |
| cUSD volume | < $1 USD total | +15 |
| cUSD volume | > $1,000 USD total | −5 |

Final score is clamped to [0, 100]. Green ≤ 30, Yellow 31–60, Red > 60.

Starting from 0 (assume clean) keeps the model interpretable: every factor explains why the score increased.

---

## Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Scaffold | Celo Composer MiniPay template | Batteries-included: Next.js, pre-wired for Celo, monorepo layout with Hardhat |
| Frontend | Next.js 14 (App Router) | React Server Components + easy API routes; Celo Composer default |
| Styling | Tailwind CSS | Utility-first, keeps bundle tiny — critical for 2 MB MiniPay limit |
| Web3 | **viem v2** | MiniPay does not support ethers.js; viem is the official recommendation |
| Smart contract | Solidity 0.8.28, Hardhat | Minimal logging contract; Hardhat for familiar workflow and Celoscan verification |
| On-chain data | Celoscan API | Public, no auth needed for basic queries; Ethereum-family API so well documented |
| Network | Celo Mainnet (Chain ID 42220) | Where MiniPay users live; ~$0.0005 average gas fee |
| Fee abstraction | USDm / cUSD as `feeCurrency` | Users never need CELO; MiniPay handles fees in stablecoins via CIP-64 |

---

## About the author

Economist transitioning to on-chain analytics. Arbitrum Ambassador. Interested in transparent, public-good tooling for DeFi risk assessment — starting with simple heuristics and working toward more rigorous models as time and data allow. Find me building in public on the Celo ecosystem.

---

## Local development

### Prerequisites

- Node.js 18+
- npm 9+
- Physical Android or iOS device with MiniPay installed (emulators do **not** work)
- [ngrok](https://ngrok.com) for HTTPS tunnelling to your device
- A Celoscan API key (free at https://celoscan.io/myapikey)

### 1. Clone and install

```bash
git clone <your-repo-url> compliance-check
cd compliance-check
npm install
```

### 2. Set up environment variables

```bash
# Frontend
cp packages/react-app/.env.example packages/react-app/.env.local
# Edit and fill in NEXT_PUBLIC_CELOSCAN_API_KEY
# NEXT_PUBLIC_CONTRACT_ADDRESS will be filled after step 4

# Hardhat (for deployment)
cp packages/hardhat/.env.example packages/hardhat/.env
# Edit and fill in PRIVATE_KEY and CELOSCAN_API_KEY
```

### 3. Compile the smart contract

```bash
npm run compile
```

### 4. Deploy to Celo Sepolia (testnet) first

```bash
npm run deploy:sepolia
# Copy the printed address into packages/react-app/.env.local as NEXT_PUBLIC_CONTRACT_ADDRESS
```

Get testnet CELO from https://faucet.celo.org/celo-sepolia before deploying.

### 5. Start the dev server

```bash
npm run dev
# Runs on http://localhost:3000
```

### 6. Expose via ngrok

```bash
ngrok http 3000
# Copy the HTTPS URL (e.g. https://abc123.ngrok-free.app)
```

### 7. Load in MiniPay

1. Open MiniPay on your device
2. Settings → About → tap **Version** 7 times to unlock Developer Settings
3. Enable **Developer Mode** and **Use Testnet**
4. Paste your ngrok HTTPS URL in **Load Test Page**

### 8. Deploy to Mainnet

When ready, fund your deployer wallet with CELO for gas, then:

```bash
npm run deploy:mainnet
# Update NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local with the new address
# Then verify:
cd packages/hardhat && npx hardhat verify --network celo <ADDRESS>
```

---

## Project structure

```
compliance-check/
├── packages/
│   ├── react-app/              # Next.js Mini App
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx        # Main UI — auto-connect, check flow, results
│   │   ├── components/
│   │   │   ├── AddressInput.tsx
│   │   │   └── RiskResult.tsx
│   │   └── lib/
│   │       ├── viemClients.ts  # viem public + wallet client setup
│   │       ├── celoscan.ts     # Celoscan API calls with rate-limit handling
│   │       ├── riskScore.ts    # Heuristic scoring model
│   │       └── contractClient.ts  # logCheck() + totalChecks() via viem
│   └── hardhat/
│       ├── contracts/
│       │   └── ComplianceLog.sol   # On-chain log contract (< 30 lines)
│       └── scripts/
│           └── deploy.ts
└── README.md
```

---

## MiniPay submission checklist (before listing)

- [x] Zero-click connect (`window.ethereum.isMiniPay` detection, no Connect button)
- [x] No `personal_sign` / `eth_signTypedData` anywhere
- [x] UI copy: "Network fee" not "Gas", "Deposit" not "Onramp"
- [x] Only USDm / cUSD — no CELO displayed to users
- [x] Tested at 360 × 640 mobile resolution
- [ ] PageSpeed Insights score captured for production URL
- [ ] Contract verified on Celoscan
- [ ] In-app support link added
- [ ] Terms of Service + Privacy Policy pages created
- [ ] Submit intake form at https://minipay.to/mini-apps

---

## License

Apache-2.0 — see [LICENSE](LICENSE)
