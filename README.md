<div align="center">

# PolyLance

**Trustless freelance infrastructure on Polygon — escrow, reputation, and governance without intermediaries.**

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?logo=solidity)](https://soliditylang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Network](https://img.shields.io/badge/Network-Polygon_Amoy-8247e5?logo=polygon)](https://amoy.polygonscan.com)
[![CI](https://github.com/akhilmuvva/polygon-freelance-marketplace/actions/workflows/ci.yml/badge.svg)](https://github.com/akhilmuvva/polygon-freelance-marketplace/actions/workflows/ci.yml)
[![Website](https://img.shields.io/badge/Live-polylance.codes-00d395)](https://polylance.codes)

</div>

---

PolyLance replaces centralized freelance platforms (Upwork, Fiverr) with a smart contract protocol on Polygon. Funds flow through a milestone-based escrow secured by Kleros arbitration; professional history is encoded as non-transferable Soulbound NFTs; and platform upgrades are decided by reputation-weighted quadratic governance — all with gasless onboarding via Biconomy Account Abstraction.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Smart Contracts** | Solidity 0.8.20, Hardhat, OpenZeppelin (UUPS upgradeable), Kleros `IArbitrable` |
| **Yield / DeFi** | Aave V3, Compound V3, Morpho (idle escrow capital routing) |
| **Frontend** | React 18, Ethers.js v6, Biconomy SDK (gasless meta-transactions) |
| **Identity** | ERC-5192 Soulbound Tokens, ERC-1155 reputation tokens, ERC-4337 Account Abstraction |
| **Governance** | Quadratic voting, commit-reveal ZK-anonymous votes, OpenZeppelin `TimelockController` (48h delay) |
| **Indexing** | The Graph Protocol (Zenith Subgraph) |
| **Storage** | IPFS / Fleek (job metadata, work submissions, portfolio CIDs via Ceramic) |
| **Messaging** | XMTP v3 (end-to-end encrypted client ↔ freelancer negotiation) |
| **RWA** | ERC-1400 Invoice NFTs with on-chain discount rate (Aave / Morpho factoring) |
| **Cross-chain** | Wormhole NTT bridge, LayerZero messaging, Solana Anchor program |
| **Infrastructure** | Vercel (frontend), Render (relayer), GitHub Actions CI |

---

## Architecture

```mermaid
graph TD
    User["User (Browser / Mobile)"]
    Biconomy["Biconomy Bundler\n(gasless AA)"]
    Frontend["React Frontend\npolylance.codes"]
    Escrow["FreelanceEscrow.sol\n(UUPS Proxy)"]
    Reputation["FreelancerReputation.sol\n(ERC-1155)"]
    SBT["FreelanceSBT.sol\n(ERC-5192)"]
    Governance["FreelanceGovernance.sol\n+ PolyLanceTimelock (48h)"]
    YieldMgr["YieldManager.sol"]
    Aave["Aave V3 / Compound / Morpho"]
    Kleros["Kleros Court\n(IArbitrable)"]
    Graph["The Graph\n(Subgraph indexer)"]
    IPFS["IPFS / Fleek\n(metadata, work files)"]
    XMTP["XMTP v3\n(encrypted messaging)"]

    User -->|EIP-712 signed UserOp| Biconomy
    Biconomy --> Frontend
    Frontend -->|ethers.js calls| Escrow
    Escrow -->|mint on completion| SBT
    Escrow -->|levelUp / updateRating| Reputation
    Escrow -->|deposit / withdraw| YieldMgr
    YieldMgr --> Aave
    Escrow -->|createDispute| Kleros
    Kleros -->|rule()| Escrow
    Governance -->|upgrade auth| Escrow
    Escrow -->|events| Graph
    Reputation -->|events| Graph
    Graph -->|GraphQL| Frontend
    Escrow -->|ipfsHash| IPFS
    User -->|negotiation| XMTP
```

---

## Key Features

### Milestone-Based Escrow (`FreelanceEscrow.sol`)
- Funds lock on `createJob()` and release per milestone via `releaseMilestone()`.
- Supports both native MATIC and any whitelisted ERC-20 token.
- UUPS upgradeable proxy — implementation can be patched without migrating user funds.
- Emergency `sovereignFreeze()` / `sovereignWithdraw()` failsafes for crisis response.

### Yield on Idle Funds (`YieldManager.sol`)
- Locked escrow capital is automatically deposited into Aave V3, Compound V3, or Morpho.
- Interest is split: 75% to users, 20% to protocol treasury, 5% to safety module.
- All harvesting follows strict Checks-Effects-Interactions ordering.

### Soulbound Reputation (`FreelancerReputation.sol` + `FreelanceSBT.sol`)
- ERC-1155 skill tokens accumulate as XP on each milestone completion.
- ERC-5192 non-transferable SBTs record verified job completions on-chain.
- Reputation score feeds into invoice discount rates (RWA module) and fee waiver eligibility.

### Decentralized Dispute Resolution
- Any party can call `raiseDispute()` to escalate to Kleros Court.
- The `rule()` callback distributes funds per court ruling (split / client wins / freelancer wins).
- Internal `resolveDisputeManual()` allows ARBITRATOR_ROLE holders to resolve without Kleros.

### Quadratic Governance (`FreelanceGovernance.sol`)
- Proposal creation requires ≥ 5 SBTs (reputation gate against spam).
- Voting supports: standard, quadratic (√tokens), commit-reveal, ZK-anonymous, conviction.
- Passed proposals queue into a 48-hour `PolyLanceTimelock` before execution.

### RWA Invoice Financing (`InvoiceNFT.sol`)
- Completed jobs mint an ERC-721 Invoice NFT representing outstanding receivables.
- Discount rates are computed on-chain from the freelancer's gravity score and completion rate.
- Invoices can be sold to liquidity providers for instant settlement.

### Gasless Onboarding
- ERC-2771 trusted forwarder pattern + Biconomy Bundler for zero-gas UX.
- ERC-4337 `EntryPoint` compatible for smart contract wallet users.

---

## Deployed Contracts (Polygon Amoy Testnet)

| Contract | Address | Explorer |
|---|---|---|
| FreelanceEscrow (UUPS Proxy) | `0x25F6C8ed995C811E6c0ADb1D66A60830E8115e9A` | [View](https://amoy.polygonscan.com/address/0x25F6C8ed995C811E6c0ADb1D66A60830E8115e9A) |
| FreelancerReputation | `0x89791A9A3210667c828492DB98DCa3e2076cc373` | [View](https://amoy.polygonscan.com/address/0x89791A9A3210667c828492DB98DCa3e2076cc373) |
| PolyToken | `0xd3b893cd083f07Fe371c1a87393576e7B01C52C6` | [View](https://amoy.polygonscan.com/address/0xd3b893cd083f07Fe371c1a87393576e7B01C52C6) |
| FreelanceSBT | `0xb4e9A5BC64DC07f890367F72941403EEd7faDCbB` | [View](https://amoy.polygonscan.com/address/0xb4e9A5BC64DC07f890367F72941403EEd7faDCbB) |
| Zenith Governance | `0x4653251486a57f90Ee89F9f34E098b9218659b83` | [View](https://amoy.polygonscan.com/address/0x4653251486a57f90Ee89F9f34E098b9218659b83) |

---

## Quick Start

```bash
# 1. Clone and install all dependencies
git clone https://github.com/akhilmuvva/polygon-freelance-marketplace.git
cd polygon-freelance-marketplace
npm install && cd contracts && npm install && cd ../frontend && npm install && cd ..

# 2. Configure environment
cp contracts/.env.example contracts/.env   # Add PRIVATE_KEY, RPC_URL, etc.
cp frontend/.env.example frontend/.env     # Add VITE_CONTRACT_ADDRESSES, etc.

# 3. Run locally
cd frontend && npm run dev
```

---

## Testing

```bash
# Smart contract tests (Hardhat)
cd contracts
npx hardhat test

# Run with gas report
REPORT_GAS=true npx hardhat test

# Static analysis
npx slither . --config slither.config.json
```

**Coverage:** Core escrow lifecycle (create → milestone → complete → dispute → rule), access control, emergency mode, and yield routing are covered. See [`docs/security/`](docs/security/) for Slither and Mythril reports.

---

## Project Structure

```
polygon-freelance-marketplace/
├── contracts/                  # Hardhat project — all Solidity source
│   ├── contracts/              # 42 Solidity contracts
│   │   ├── FreelanceEscrow.sol     # Core escrow logic (UUPS proxy)
│   │   ├── YieldManager.sol        # Multi-protocol yield routing
│   │   ├── FreelancerReputation.sol# ERC-1155 reputation registry
│   │   ├── FreelanceGovernance.sol # Reputation-gated governance
│   │   ├── QuadraticGovernance.sol # Quadratic + ZK voting
│   │   ├── InvoiceNFT.sol          # RWA invoice financing
│   │   └── interfaces/             # Shared contract interfaces
│   ├── scripts/                # Deployment and verification scripts
│   ├── test/                   # Hardhat test suites
│   └── hardhat.config.js
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── services/           # Graph queries, messaging, storage
│   │   └── utils/              # metaTx, intents, helpers
│   └── vite.config.js
├── subgraph/                   # The Graph subgraph (schema + mappings)
├── solana/                     # Anchor program for cross-chain integration
├── docs/                       # Architecture, security, deployment guides
│   └── security/               # Slither report, Mythril audit
└── .github/workflows/          # CI/CD pipelines
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, branch conventions, and PR checklist.

Bugs and feature requests → [open an issue](https://github.com/akhilmuvva/polygon-freelance-marketplace/issues).

---

## Security

Responsible disclosure: [security@polylance.codes](mailto:security@polylance.codes)

Do not open public issues for security vulnerabilities. See [SECURITY.md](SECURITY.md) for our disclosure policy and supported versions.

---

## Team

| Name | Role |
|---|---|
| [Akhil Muvva](mailto:akhilmuvva@polylance.codes) | Lead Architect & Solidity Developer |
| [Jhansi Kupireddy](https://www.linkedin.com/in/jhansi-kupireddy-54393235a/) | Co-Founder |
| [Balram Taddi](mailto:balramtaddi@polylance.codes) | Protocol Engineer |

---

## Repository Setup

> **For the repository owner:** Set the following on the GitHub repository settings page to maximize discoverability.
>
> **Description:** `Decentralized freelance marketplace on Polygon with trustless escrow, RWA tokenization, and gasless onboarding via Account Abstraction.`
>
> **Topics:** `polygon` `solidity` `defi` `web3` `freelance` `smart-contracts` `ethereum` `hardhat` `ipfs` `the-graph` `account-abstraction` `kleros` `nft` `react` `uups-proxy`
>
> **Website:** `https://polylance.codes`

---

## License

MIT © 2024 PolyLance Contributors. See [LICENSE](LICENSE).
