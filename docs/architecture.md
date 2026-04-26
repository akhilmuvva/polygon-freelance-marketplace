# PolyLance — Architecture Overview

This document describes the high-level architecture of the PolyLance protocol, covering smart contract layers, frontend integration, and infrastructure.

---

## System Overview

```
User (Browser)
    │
    ├── EIP-712 signed UserOperation
    │       │
    │       ▼
    │   Biconomy Bundler (AA / gasless)
    │       │
    ▼       ▼
React Frontend (polylance.codes)
    │
    ├── ethers.js ──────────────────────────────────────────────────────┐
    │                                                                   │
    ▼                                                                   │
FreelanceEscrow.sol (UUPS Proxy)                                        │
    ├── YieldManager.sol ──► Aave V3 / Compound V3 / Morpho             │
    ├── FreelancerReputation.sol (ERC-1155)                             │
    ├── FreelanceSBT.sol (ERC-5192)                                     │
    ├── FreelanceGovernance.sol ──► PolyLanceTimelock (48h)             │
    ├── InvoiceNFT.sol (RWA)                                            │
    └── Kleros IArbitrator ──► raiseDispute() / rule()                  │
                                                                        │
The Graph Subgraph ◄──── contract events ─────────────────────────────┘
    │
    ▼ GraphQL
React Frontend
    │
    ├── IPFS / Fleek (job metadata, work files, portfolio CIDs)
    └── XMTP v3 (encrypted messaging)
```

---

## Smart Contract Layer

### Core Contracts

| Contract | Pattern | Purpose |
|---|---|---|
| `FreelanceEscrow.sol` | UUPS Proxy | Central escrow, milestone release, dispute routing |
| `FreelanceEscrowBase.sol` | Abstract | Storage layout + shared structs |
| `YieldManager.sol` | Ownable | Multi-protocol yield routing for idle funds |
| `FreelancerReputation.sol` | UUPS Proxy | ERC-1155 skill experience point registry |
| `FreelanceSBT.sol` | ERC-5192 | Non-transferable job completion certificates |
| `PolyToken.sol` | ERC-20Votes | Native reward token with governance voting power |
| `FreelanceGovernance.sol` | Ownable | Reputation-gated governance with timelock integration |
| `QuadraticGovernance.sol` | UUPS + Governor | OZ Governor with quadratic + ZK vote modes |
| `PolyLanceTimelock.sol` | TimelockController | 48-hour execution delay for governance proposals |

### RWA Module

| Contract | Purpose |
|---|---|
| `InvoiceNFT.sol` | ERC-721 representing outstanding receivables |
| `AssetTokenizer.sol` | General RWA tokenization framework |
| `ComplianceRegistry.sol` | KYC/AML hooks for regulated flows |
| `FreelanceEscrowRWAAdapter.sol` | Bridges escrow outcomes to invoice lifecycle |
| `PriceConverter.sol` | Chainlink-based USD → token price feeds |

### Access Control Model

```
DEFAULT_ADMIN_ROLE
    ├── Can upgrade proxy implementation
    ├── Can set all protocol addresses
    └── Can grant/revoke all roles

MANAGER_ROLE
    └── Can whitelist payment tokens

ARBITRATOR_ROLE
    └── Can call resolveDisputeManual()

AGENT_ROLE
    ├── Can call sovereignFreeze()
    └── Can call rebalanceTreasury()

MINTER_ROLE (Reputation contract)
    └── Bound to FreelanceEscrow address post-deployment
```

---

## Data Flow: Job Lifecycle

```
createJob() ──► Job.status = Created
    │
    ▼
applyForJob() ──► stake 5% of job amount
    │
    ▼
pickFreelancer() ──► Job.status = Accepted
    │              └─► refund other applicants' stakes
    ▼
acceptJob() ──► Job.status = Ongoing
    │
    ▼
submitWork() ──► stores IPFS hash on-chain
    │
    ├──[client approves]──► releaseMilestone() ──► credit freelancer balance
    │                       completeJob() ──────► mint SBT + pay fee + reward token
    │
    └──[dispute]──────────► raiseDispute() ──► Job.status = Disputed
                                │
                                ├── Kleros: IArbitrator.createDispute()
                                │         └─► rule() callback
                                │
                                └── Internal: resolveDisputeManual()
```

---

## The Graph Subgraph

The Graph indexes all events emitted by `FreelanceEscrow` and `FreelancerReputation`:

- `JobCreated` → `Job` entity
- `MilestoneReleased` → `Milestone` entity update
- `FundsReleased` → `Job.status = Completed`
- `DisputeRaised` / `DisputeResolved` → `Dispute` entity
- `SovereignRatingActuated` → `FreelancerProfile.averageRating`

Frontend queries The Graph via GraphQL instead of direct RPC calls for all historical and aggregate data, reducing RPC load and enabling fast UI rendering.

---

## Gasless Transaction Flow (ERC-2771 + Biconomy)

```
User signs EIP-712 typed data (no gas needed)
    │
    ▼
Biconomy Paymaster validates and sponsors gas
    │
    ▼
PolyLanceForwarder.sol verifies signature
    │
    ▼
FreelanceEscrow._msgSender() extracts original signer from calldata
    │
    ▼
Function executes as if called directly by user
```

---

## Cross-Chain Module

- **Wormhole NTT:** Bridges `PolyToken` to Solana SPL token
- **LayerZero:** Propagates governance signals cross-chain
- **Solana Anchor Program** (`solana/`): Enables Solana-native freelancer identity anchoring

---

## Deployment Target

| Environment | Network | Chain ID |
|---|---|---|
| Testnet | Polygon Amoy | 80002 |
| Production (planned) | Polygon Mainnet | 137 |

See [deployment.md](deployment.md) for deployment scripts and upgrade procedures.
