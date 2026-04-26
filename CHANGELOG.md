# Changelog

All notable changes to PolyLance are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### In Progress
- Streaming escrow payments via `StreamingEscrow.sol`
- Morpho market parameter registry for per-token yield configuration
- Hardhat test coverage for `YieldManager` and `QuadraticGovernance`
- Fix: `sovereignWithdraw` accounting mismatch (S-04 from security audit)
- Fix: Handle Kleros ruling `0` (refused to arbitrate) in `rule()` to prevent fund freeze

---

## [2.0.0] — RWA Tokenization Module

### Added
- `InvoiceNFT.sol` — ERC-721 invoice NFTs representing on-chain receivables with discount rate calculation
- `AssetTokenizer.sol` — General RWA tokenization framework for IP and physical asset representation
- `ComplianceRegistry.sol` — KYC/AML compliance hooks for regulated asset flows
- `YieldManager.sol` — Multi-protocol yield routing (Aave V3, Compound V3, Morpho) for idle escrow capital
  - Interest split: 75% users, 20% protocol treasury, 5% safety module
  - `rebalanceYield()` with strict Checks-Effects-Interactions ordering
  - `withdrawSurplus()` gated to `governanceTimelock` address
- `SwapManager.sol` — On-chain token conversion at job creation (pay in USDC, escrow in MATIC)
- `StreamingEscrow.sol` — Time-based continuous payment streams (beta)
- `SpecializedSkillRegistry.sol` — On-chain skill taxonomy with 16-category classification
- Wormhole NTT bridge integration for cross-chain token transfers
- LayerZero messaging for cross-chain governance signal propagation
- Solana Anchor program (`solana/`) for cross-chain freelancer identity

### Changed
- `FreelanceEscrow.createJob()` now accepts `CreateParams` struct (breaking change from v1.5)
- `FreelancerReputation` migrated from ERC-20 to ERC-1155 (skill-specific token IDs)
- All `require(false, "string")` replaced with custom errors throughout (gas reduction ~30%)
- `_authorizeUpgrade` now gated to `DEFAULT_ADMIN_ROLE` (upgrade path documented)

### Fixed
- Reentrancy guard missing on `releaseMilestone` in v1.5 (now covered by custom `ReentrancyGuardUpgradeable`)
- `tokenWhitelist` check added to `createJob` to prevent arbitrary ERC-20 injection

---

## [1.5.0] — Governance & ZK Voting

### Added
- `FreelanceGovernance.sol` — Reputation-gated governance with SBT threshold for proposal creation
  - Quadratic voting (`_applyQuadratic`) to reduce whale influence
  - Commit-reveal scheme for secret ballot proposals
  - ZK-anonymous voting with nullifier tracking (mock verifier — full snark integration pending)
  - Conviction voting with time-weighted accrual
  - Liquid democracy delegation (`delegates` mapping)
- `QuadraticGovernance.sol` — OpenZeppelin Governor-based contract with quadratic vote weight
- `PolyLanceTimelock.sol` — 48-hour mandatory delay for all governance-passed proposals
- `AntigravityGovernance.sol` — Emergency governance override for critical protocol fixes
- `PrivacyShield.sol` — ZK-identity gating for job applications (`zkRequired` flag in `createJob`)
- `SecureMessenger.sol` — On-chain encrypted messaging fallback (XMTP v3 is primary)
- `FreelanceEscrowRWAAdapter.sol` — Connector between escrow outcomes and RWA invoice lifecycle
- `ReputationStaking.sol` — Stake reputation tokens for amplified yield and priority dispute routing
- The Graph subgraph (`subgraph/`) with schema for jobs, milestones, disputes, and reputation events
- XMTP v3 integration in frontend for end-to-end encrypted client ↔ freelancer negotiation

### Changed
- Platform fee mechanism updated to basis points (`gravityFactor`) — max 10% enforced on-chain
- `pickFreelancer()` now automatically refunds losing applicants via `balances` pull pattern

### Fixed
- DoS vulnerability: applicant refunds now use pull-over-push pattern (no direct ETH push to arbitrary addresses)
- Storage gap (`__gap[50]`) added to `FreelanceEscrowBase` and `FreelancerReputation` for upgrade safety

---

## [1.0.0] — Core Escrow & SBT Reputation

### Added
- `FreelanceEscrow.sol` — Milestone-based escrow with UUPS upgradeable proxy
  - `createJob()`, `applyForJob()`, `pickFreelancer()`, `acceptJob()`, `submitWork()`
  - `releaseMilestone()`, `completeJob()`, `refundExpiredJob()`
  - `raiseDispute()` / `rule()` — Kleros `IArbitrable` compatible dispute interface
  - `sovereignFreeze()` / `sovereignWithdraw()` — emergency failsafes
- `FreelancerReputation.sol` — ERC-1155 skill token registry
  - `actuateSovereignXP()` — MINTER_ROLE callable, POL staker 1.5x multiplier
  - `actuateRating()` — rolling average rating with engagement tracking
  - `calibrateGravity()` — completion rate and gravity score for RWA discount calculation
- `FreelanceSBT.sol` — ERC-5192 non-transferable job completion certificate
- `PolyToken.sol` — Native reward token, mintable on job completion with reputation multipliers
- `PolyLanceForwarder.sol` — ERC-2771 trusted forwarder for Biconomy gasless meta-transactions
- `MyProxy.sol` — UUPS proxy deployment wrapper
- `IArbitrator.sol` — Kleros arbitrator interface
- React frontend with MetaMask and Biconomy SDK integration
- Hardhat deployment scripts for Polygon Amoy testnet
- `FreelanceEscrow.test.js` — Core lifecycle test suite

### Security
- All ERC-20 transfers use `SafeERC20.safeTransfer` / `safeTransferFrom`
- `forceApprove` pattern for yield protocol approvals (prevents ERC-20 approval race)
- `ReentrancyGuardUpgradeable` on all fund-moving functions
- `MAX_PLATFORM_FEE_BPS = 1000` (10%) hard cap enforced on-chain

---

[Unreleased]: https://github.com/akhilmuvva/polygon-freelance-marketplace/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/akhilmuvva/polygon-freelance-marketplace/compare/v1.5.0...v2.0.0
[1.5.0]: https://github.com/akhilmuvva/polygon-freelance-marketplace/compare/v1.0.0...v1.5.0
[1.0.0]: https://github.com/akhilmuvva/polygon-freelance-marketplace/releases/tag/v1.0.0
