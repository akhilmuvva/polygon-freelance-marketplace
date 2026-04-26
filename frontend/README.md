# PolyLance Frontend

React application for the PolyLance decentralized freelance marketplace.

**Tech:** React 18, Vite, Ethers.js v6, wagmi v2, RainbowKit, Biconomy SDK, Framer Motion, Anime.js

---

## Getting Started

```bash
cd frontend
cp .env.example .env        # Configure environment variables
npm install
npm run dev                  # http://localhost:5173
```

---

## Pages & Views

The app is a single-page application. All routing is handled by `activeTab` state in `App.jsx` (no React Router — tab-based navigation for performance). Each view is **lazy-loaded** via `React.lazy`.

| Tab ID | Component | Description | Auth Required |
|---|---|---|---|
| `landing` | `LandingPage.jsx` | Marketing landing page with wallet connect | No |
| `dashboard` | `Dashboard.jsx` | Overview stats, active jobs, recent activity | Yes |
| `jobs` | `JobsList.jsx` | Browse and apply for open jobs | Yes |
| `create-job` | `CreateJob.jsx` | Post a new job with milestone configuration | Yes |
| `specialists` | `SpecialistMarketplace.jsx` | Browse verified specialist network | Yes |
| `leaderboard` | `Leaderboard.jsx` | Top freelancers by reputation score | Yes |
| `portfolio` | `Portfolio.jsx` | Freelancer profile with SBTs and history | Yes |
| `identity` | `IdentityManager.jsx` | Manage on-chain identity, skills, Polygon ID | Yes |
| `governance` | `DaoDashboard.jsx` | Browse and vote on governance proposals | Yes |
| `court` | `ArbitrationDashboard.jsx` | Active disputes and Kleros court cases | Yes |
| `strata` | `YieldManagerDashboard.jsx` | Yield positions from idle escrow capital | Yes |
| `liquidity` | `InvoiceMarketplace.jsx` | RWA invoice financing marketplace | Yes |
| `cross-chain` | `CrossChainDashboard.jsx` | Wormhole / LayerZero bridge interface | Yes |
| `sbt-gallery` | `SBTGallery.jsx` | View Soulbound Token collection | Yes |
| `marketplace` | `NFTMarketplace.jsx` | NFT exchange and listings | Yes |
| `insurance` | `InsuranceDashboard.jsx` | Protocol insurance pool interface | Yes |
| `ai-oracle` | `AICommandCenter.jsx` | AI agent oracle (admin only) | Admin |
| `protocol` | `ProtocolDashboard.jsx` | Protocol-level metrics (admin only) | Admin |
| `analytics` | `AnalyticsDashboard.jsx` | Network analytics (admin only) | Admin |
| `chat` | `Chat.jsx` | XMTP v3 encrypted messaging | Yes |
| `privacy` | `PrivacyCenter.jsx` | ZK proofs and privacy settings | Yes |
| `onramp` | `FiatOnramp.jsx` | Fiat → crypto onramp | Yes |
| `manifesto` | `Manifesto.jsx` | Protocol manifesto and team page | No |
| `terms` | `TermsOfService.jsx` | Terms of Service | No |

---

## Key Components

### Shell (`App.jsx`)
Top-level application shell. Manages:
- Wallet connection state via `wagmi` + `RainbowKit`
- Gasless mode toggle via Biconomy Smart Account
- Social login via Particle Auth + Biconomy
- `activeTab` navigation state
- Lazy-loading of all page components
- Mobile bottom nav + desktop sidebar rendering

### `Web3Provider.jsx`
Wraps the entire app with `wagmi`, `RainbowKit`, and `AuthContext`. Configures supported chains (Polygon Amoy), wallet connectors, and the global auth state (`loading | unauthenticated | authenticated`).

### Component Directory (`src/components/`)

| Component | Purpose |
|---|---|
| `LandingPage.jsx` | Hero section, protocol stats, wallet/social connect CTA |
| `Dashboard.jsx` | Summary cards: active jobs, balance, reputation, recent txns |
| `JobsList.jsx` | Filterable job board; calls `SubgraphService` for data |
| `CreateJob.jsx` | Multi-step form: title, skills, milestones, token, amount |
| `ArbitrationDashboard.jsx` | Dispute list; integrates Kleros evidence submission |
| `DaoDashboard.jsx` | Proposal cards; calls `GovernanceWatcherService` |
| `YieldManagerDashboard.jsx` | Yield positions, APY comparison, rebalance controls |
| `InvoiceMarketplace.jsx` | RWA invoice listing, discount rate display, purchase flow |
| `Chat.jsx` | XMTP v3 conversation list + message thread |
| `SBTGallery.jsx` | On-chain SBT collection with metadata from IPFS |
| `IdentityManager.jsx` | Polygon ID credential management, skill registration |
| `NotificationManager.jsx` | Toast system + Push Protocol notifications |
| `CourtErrorBoundary.jsx` | Error boundary wrapping the arbitration view |

---

## Services (`src/services/`)

| Service | Description |
|---|---|
| `SubgraphService.js` | GraphQL queries to The Graph for jobs, reputation, disputes |
| `JobService.js` | Direct contract calls for job CRUD (wraps ethers.js) |
| `GaslessService.js` | Biconomy UserOperation construction and submission |
| `MessagingService.js` | XMTP v3 client initialization and message sending |
| `StorageService.js` | IPFS upload/fetch via Fleek and `nft.storage` |
| `GovernanceWatcherService.js` | Polls governance proposals and vote counts |
| `GravityScoreService.js` | Computes and caches freelancer gravity scores |
| `CeramicService.js` | Ceramic ComposeDB profile data read/write |
| `ProfileService.js` | Aggregates on-chain + Ceramic profile data |
| `IdentityProofService.js` | Polygon ID credential verification |
| `TreasuryButlerService.js` | Protocol treasury balance and fee data |
| `MarketplaceService.js` | NFT listing and purchase flow |

---

## Hooks (`src/hooks/`)

| Hook | Description |
|---|---|
| `useEthersSigner.js` | Converts `wagmi` WalletClient to ethers.js `Signer` |
| `useTx.js` | Wraps contract calls with loading/error toast state |
| `useTokenBalance.js` | Fetches ERC-20 balance for a given address and token |
| `useTokenPrice.js` | Fetches token price from Chainlink / Coingecko |
| `useArbitration.js` | Kleros dispute state and evidence submission |
| `useAnimeAnimations.js` | Anime.js animation helpers (stagger, fade, pulse) |
| `useIdentity.js` | Polygon ID credential state |
| `useOptimisticTransaction.js` | Optimistic UI update before tx confirmation |
| `useSocket.js` | WebSocket connection for real-time job feed |
| `useSovereignLogic.js` | Protocol-level admin action hooks |
| `useMultiChain.js` | Cross-chain network switching and state |

---

## Utilities (`src/utils/`)

| Utility | Description |
|---|---|
| `metaTx.js` | EIP-712 meta-transaction signing for gasless flow |
| `biconomy.js` | Biconomy Smart Account initialization |
| `intents.js` | ERC-7683 cross-chain intent encoding |
| `gas.js` | Gas estimation helpers |
| `chainGuard.js` | Network validation — enforces correct chain before tx |
| `protocolUtils.js` | Contract ABI loading, address resolution |
| `IPFSResolver.js` | IPFS CID → gateway URL resolution with fallback |

---

## State Management

There is **no global state library** (no Redux, no Zustand). State is managed via:

1. **`wagmi` hooks** — all wallet and on-chain state (address, balance, network)
2. **React Context** — `AuthContext` in `Web3Provider.jsx` for auth status
3. **Local component state** — `useState` + `useEffect` for UI state
4. **Custom hooks** — each hook owns its domain state and fetching logic
5. **Event bus** — `window.dispatchEvent(new CustomEvent('REFRESH_DASHBOARD'))` for cross-component refresh without prop drilling

---

## Build & Test

```bash
# Development server
npm run dev

# Production build
npm run build

# Run unit tests (Vitest)
npm run test

# Lint
npm run lint
```

---

## Environment Variables

See [`.env.example`](.env.example) for a full list of required variables with descriptions.

Key variables:
- `VITE_CHAIN_ID` — target network chain ID (80002 = Amoy)
- `VITE_ESCROW_ADDRESS` — deployed `FreelanceEscrow` proxy address
- `VITE_GRAPH_URL` — The Graph subgraph endpoint
- `VITE_BICONOMY_PAYMASTER_API_KEY` — for gasless meta-transactions
