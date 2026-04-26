# PolyLance Smart Contracts

Technical reference for all Solidity contracts in the PolyLance protocol.

**Compiler:** Solidity `^0.8.20`  
**Framework:** Hardhat  
**Dependencies:** OpenZeppelin Contracts Upgradeable v5, Kleros `IArbitrator`

---

## Contract Index

| Contract | Category | Proxy |
|---|---|---|
| [FreelanceEscrow](#freelanceescrowsol) | Core | UUPS |
| [FreelancerReputation](#freelancerreputationsol) | Core | UUPS |
| [FreelanceSBT](#freelancesbt-sol) | Core | None |
| [PolyToken](#polytokensol) | Token | None |
| [YieldManager](#yieldmanagersol) | DeFi | None |
| [FreelanceGovernance](#freelancegovernancesol) | Governance | None |
| [QuadraticGovernance](#quadraticgovernancesol) | Governance | UUPS |
| [PolyLanceTimelock](#polylancetimellocksol) | Governance | None |
| [InvoiceNFT](#invoicenftsol) | RWA | None |
| [AssetTokenizer](#assettokenizersol) | RWA | None |
| [PolyLanceForwarder](#polylanceforwardersol) | AA / Gasless | None |
| [StreamingEscrow](#streamingesccrowsol) | Payments | None |
| [SpecializedSkillRegistry](#specializedskillregistrysol) | Registry | None |

---

## FreelanceEscrow.sol

The core protocol contract. Manages the full job lifecycle from creation to completion and dispute.

**Proxy Pattern:** UUPS (`UUPSUpgradeable`)  
**Inherits:** `FreelanceEscrowBase`, `UUPSUpgradeable`, `AccessControlUpgradeable`, `ReentrancyGuardUpgradeable`

### Key Functions

| Function | Visibility | Description |
|---|---|---|
| `createJob(CreateParams)` | `external payable` | Creates a new job and locks funds in escrow. Accepts MATIC or whitelisted ERC-20. |
| `applyForJob(uint256 jobId)` | `external payable` | Apply for a job; requires staking 5% of job amount. |
| `pickFreelancer(uint256 jobId, address freelancer)` | `external` | Client selects applicant; refunds all other applicants. |
| `acceptJob(uint256 jobId)` | `external` | Freelancer confirms acceptance; status → Ongoing. |
| `submitWork(uint256 jobId, string ipfsHash)` | `external` | Freelancer submits deliverable IPFS CID. |
| `releaseMilestone(uint256 jobId, uint256 milestoneIndex)` | `external nonReentrant` | Client approves a milestone; credits freelancer balance. |
| `completeJob(uint256 jobId)` | `external nonReentrant` | Finalizes job; mints SBT, distributes platform fee, mints reward tokens. |
| `refundExpiredJob(uint256 jobId)` | `external nonReentrant` | Refunds client if deadline passed with no delivery. |
| `raiseDispute(uint256 jobId)` | `external payable` | Escalates job to Kleros arbitration; requires arbitration fee. |
| `resolveDisputeManual(uint256 jobId, uint8 ruling)` | `external` | `ARBITRATOR_ROLE` internal dispute resolution (Kleros fallback). |
| `rule(uint256 disputeId, uint256 ruling)` | `external` | Kleros `IArbitrable` callback. Ruling 1 → freelancer wins, 2 → client wins. |
| `withdraw()` | `external nonReentrant` | Pull-pattern withdrawal of credited balance. |
| `sovereignFreeze(bool freeze)` | `external` | `AGENT_ROLE` emergency freeze; halts all state-modifying functions. |
| `sovereignWithdraw(uint256 amount, address to)` | `external nonReentrant` | Emergency withdrawal of protocol funds (not user balances). |
| `setYieldManager(address)` | `external` | `DEFAULT_ADMIN_ROLE` — sets the `YieldManager` contract address. |
| `setTokenWhitelist(address token, bool allowed)` | `external` | `MANAGER_ROLE` — allows ERC-20 tokens as payment currency. |

### Events

| Event | Parameters | When emitted |
|---|---|---|
| `JobCreated` | `jobId, client, amount, token` | `createJob()` |
| `FreelancerPicked` | `jobId, freelancer` | `pickFreelancer()` |
| `WorkSubmitted` | `jobId, ipfsHash` | `submitWork()` |
| `MilestoneReleased` | `jobId, milestoneIndex, amount` | `releaseMilestone()` |
| `FundsReleased` | `jobId, to, amount` | `completeJob()` |
| `DisputeRaised` | `jobId, disputeId` | `raiseDispute()` |
| `DisputeResolved` | `jobId, ruling` | `rule()` / `resolveDisputeManual()` |
| `SovereignFreezeActuated` | `frozen` | `sovereignFreeze()` |

### Security Considerations

- **Reentrancy:** `nonReentrant` modifier on all fund-moving functions. CEI pattern enforced.
- **Pull over push:** All payments credited to `balances[address]`; user calls `withdraw()`.
- **[OPEN] S-04:** `sovereignWithdraw` does not update `totalPaidOut` correctly — could misreport accounting.
- **[OPEN] M-02:** Kleros ruling `0` (refuse to arbitrate) leaves job permanently in `Disputed` state.
- **[OPEN] A-02:** `_authorizeUpgrade` checks `DEFAULT_ADMIN_ROLE` but is not bound to Timelock — upgrades bypass governance.

---

## FreelancerReputation.sol

ERC-1155 token registry for skill-based experience points (XP).

**Proxy Pattern:** UUPS  
**Inherits:** `ERC1155Upgradeable`, `AccessControlUpgradeable`, `UUPSUpgradeable`

### Roles

| Role | Description |
|---|---|
| `MINTER_ROLE` | Bound to `FreelanceEscrow` — mints XP on job completion |
| `DEFAULT_ADMIN_ROLE` | Can grant/revoke all roles and upgrade implementation |

### Key Functions

| Function | Description |
|---|---|
| `actuateSovereignXP(address user, uint256 skillId, uint256 amount)` | `MINTER_ROLE` — mints skill XP; 1.5× multiplier for POL stakers |
| `actuateRating(address user, uint256 newRating)` | Updates rolling average rating (10-point scale) |
| `calibrateGravity(address user)` | Computes gravity score from completion rate + avg rating — used by RWA module |
| `getGravityScore(address user)` | Returns current gravity score (0–1000) |

### Events

| Event | When emitted |
|---|---|
| `SovereignRatingActuated` | `actuateRating()` |
| `GravityCalibrated` | `calibrateGravity()` |

### Security Considerations

- **[INFO] M-04:** Rating calculation uses integer division — ratings < 10 are subject to truncation rounding.

---

## FreelanceSBT.sol

ERC-5192 non-transferable Soulbound Token representing verified job completions.

**Inherits:** `ERC721`, `IERC5192`

### Key Functions

| Function | Description |
|---|---|
| `mint(address to, string memory uri)` | `MINTER_ROLE` — mints a new SBT with IPFS metadata URI |
| `locked(uint256 tokenId)` | Returns `true` for all tokens (non-transferable) |
| `transferFrom(...)` | Reverts — SBTs cannot be transferred |

---

## PolyToken.sol

ERC-20 reward token distributed to freelancers on job completion.

**Inherits:** `ERC20`, `ERC20Burnable`, `Ownable`

### Key Functions

| Function | Description |
|---|---|
| `mint(address to, uint256 amount)` | `onlyOwner` (bound to Escrow) — mints reward tokens |
| `setEscrow(address)` | Sets the authorized minter address |

---

## YieldManager.sol

Routes idle escrow capital to external yield protocols (Aave V3, Compound V3, Morpho).

**Inherits:** `Ownable`, `ReentrancyGuard`

### Interest Split

- 75% → user/job balance
- 20% → protocol treasury
- 5% → safety module reserve

### Key Functions

| Function | Description |
|---|---|
| `deposit(address token, uint256 amount, uint8 protocol)` | Deposits into selected yield protocol (0=Aave, 1=Compound, 2=Morpho) |
| `withdraw(address token, uint256 amount, uint8 protocol)` | Withdraws from yield protocol |
| `rebalanceYield(address token)` | Moves capital between protocols to optimize APY |
| `withdrawSurplus(address token, address to)` | `governanceTimelock` only — pulls accumulated surplus |
| `harvestInterest(address token)` | Calculates and distributes accrued interest |

### Security Considerations

- **[OPEN] S-05:** `withdraw()` does not verify the target strategy is still active before calling external protocol.
- **[OPEN] S-03:** Failed deposits may leave residual ERC-20 approvals to external protocols.

---

## FreelanceGovernance.sol

Reputation-gated governance with multi-mode voting and Timelock integration.

**Inherits:** `Ownable`

### Voting Modes

| Mode | Mechanism |
|---|---|
| Standard | Linear SBT-weighted vote |
| Quadratic | `√SBT_balance` weight to reduce whale dominance |
| Secret | Commit-reveal scheme (vote hidden until reveal period) |
| ZK-anonymous | Nullifier-based anonymous vote (mock verifier — snark integration pending) |
| Conviction | Time-weighted stake accrual over 365-day window |

### Key Functions

| Function | Description |
|---|---|
| `createProposal(...)` | Creates proposal; requires `MIN_REPUTATION_FOR_PROPOSAL = 5` SBTs |
| `vote(uint256 proposalId, bool support)` | Casts standard / conviction vote |
| `anonymousVote(proposalId, support, nullifier, zkProof)` | ZK-anonymous vote with nullifier deduplication |
| `commitVote(proposalId, bytes32 hashedVote)` | Commits secret vote hash |
| `revealVote(proposalId, support, salt)` | Reveals vote after voting period ends |
| `queueProposal(uint256 proposalId)` | Schedules passed proposal in 48h Timelock |
| `executeProposal(uint256 proposalId)` | Executes proposal via Timelock after delay |
| `delegate(address delegatee)` | Delegates voting power (liquid democracy, 1-level) |
| `setTimelock(address)` | `onlyOwner` — one-time Timelock address binding |

### Security Considerations

- **[OPEN] M-03:** `distributeCreatorRoyalty` (in `QuadraticGovernance`) uses `.transfer()` — will revert for smart contract wallets (2300 gas stipend).

---

## QuadraticGovernance.sol

OpenZeppelin `Governor`-based contract with quadratic vote weight and ZK-anonymous voting.

**Inherits:** `GovernorUpgradeable`, `GovernorSettingsUpgradeable`, `GovernorCountingSimpleUpgradeable`

---

## PolyLanceTimelock.sol

48-hour mandatory execution delay for all governance-passed proposals.

**Inherits:** `TimelockController` (OpenZeppelin)

- `minDelay`: 172800 seconds (48 hours)
- Proposers: `FreelanceGovernance` address
- Executors: Address zero (anyone can execute after delay)

---

## InvoiceNFT.sol

ERC-721 representing outstanding receivables from completed jobs.

**Key functions:** `mintInvoice(jobId, amount, dueDate, discount)`, `settleInvoice(tokenId)`, `discountRate(freelancerAddress)`

Discount rate is computed from the freelancer's gravity score (lower gravity → higher discount cost).

---

## AssetTokenizer.sol

Tokenizes real-world assets (IP, physical assets) as ERC-1155 tokens with fractional ownership.

---

## PolyLanceForwarder.sol

ERC-2771 trusted forwarder enabling Biconomy-powered gasless transactions.

The forwarder verifies EIP-712 typed-data signatures and forwards calls with the original `msg.sender` appended to calldata. `FreelanceEscrow._msgSender()` reads the real sender from calldata when called via the forwarder.

---

## StreamingEscrow.sol

Continuous time-based payment streams (beta). Funds drip from client to freelancer per second based on agreed rate.

---

## SpecializedSkillRegistry.sol

On-chain skill taxonomy with 16 categories. Freelancers register skill attestations here; used by the Specialist Marketplace for filtering.

---

## Running Tests

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test

# With gas report
REPORT_GAS=true npx hardhat test

# Static analysis
npx solhint 'contracts/**/*.sol'
```

## Security Reports

See [`docs/security/`](../docs/security/) for the full Slither static analysis and Mythril symbolic execution reports.
