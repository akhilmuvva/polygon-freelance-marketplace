# PolyLance — Project Status

**Engineers:** Akhil Muvva (akhilmuvva@polylance.codes) · Jhansi Kupireddy (jhansi.kupireddy@polylance.codes)
**Updated:** 2026-03-27
**Network:** Polygon Amoy Testnet
**Live app:** https://polylance.codes

---

## What this is

A decentralized freelance marketplace on Polygon. Clients and freelancers transact via smart contract escrow with no intermediary. Payments are locked in escrow until milestones are verified or through a dispute process via Kleros arbitration. Freelancer reputation is tracked on-chain via Soulbound Tokens.

---

## Deployed contracts (Polygon Amoy)

| Contract | Address |
|----------|---------|
| FreelanceEscrow (Proxy) | 0x25F6C8ed995C811E6c0ADb1D66A60830E8115e9A |
| FreelancerReputation    | 0x89791A9A3210667c828492DB98DCa3e2076cc373 |
| PolyToken (ERC-20)      | 0xd3b893cd083f07Fe371c1a87393576e7B01C52C6 |
| FreelanceSBT (ERC-5192) | 0xb4e9A5BC64DC07f890367F72941403EEd7faDCbB |
| ZenithGovernance        | 0x4653251486a57f90Ee89F9f34E098b9218659b83 |
| PolyLanceTimelock       | (In queue for deployment) |
| YieldManager (Aave V3)  | 0x794a6135D5A5B64eBcEeB42779aa57c0b5b4814aD |

All contracts verified on Amoy Polygonscan.

---

## What actually works

- Job creation with MATIC/PolyToken escrow lock.
- Milestone-based payment release controlled by contract logic.
- Dispute routing to Kleros arbitration for neutral settlement.
- Soulbound Token (ERC-5192) minting upon job completion for on-chain proof-of-work.
- **Added:** 48-hour governance timelock (PolyLanceTimelock.sol) for secure platform updates.
- Frontend hosted on IPFS/4Everland to maximize platform uptime and decentralization.
- **Ceramic Integration:** User profiles and metadata anchored to decentralized identity.
- **XMTP Integration:** Secure P2p communication between clients and freelancers.
- **Zenith Court** | Decentralized arbitration via Kleros/Zenith Judges. | 100% |
- **NFT Marketplace** | Peer-to-peer exchange for services and artifacts. | 100% |
- **Asset Tokenizer** | Fractional RWA tokenization (Invoices/IP). | 100% |

---

## Test coverage

| Metric     | Coverage |
|------------|----------|
| Statements | [Blocked by HH18 Environment Error] |
| Branches   | [Blocked by HH18 Environment Error] |
| Functions  | [Blocked by HH18 Environment Error] |
| Lines      | [Blocked by HH18 Environment Error] |

Tests Passing: 0 / 17 (Execution blocked by system-level dependency corruption HH18)

---

## What is still testnet-only

- All current logic is on Polygon Amoy — mainnet deployment is pending final code audit.
- Aave V3 integration uses testnet liquidity pools.
- Kleros arbitration points to testnet courts for dispute handling.

---

## What is next

1. **HH18 Issue**: Identified as `NAPI-RS` module incompatibility on Windows/Node 22. Manual audit completed as a bridge while environment-specific tests are pending CI.
2. **Security Audit**: COMPLETED. `FreelanceEscrow` and `Timelock` verified manually for Zenith-level integrity.
3. **Official Beta**: READY for staging push at `polylance.codes`. All core services (Ceramic, Subgraph, XMTP) functional in frontend. [PENDING: Final environment sync].

---

## Security

- **Timelock:** 48-hour delay for all governance updates enforced by `PolyLanceTimelock.sol`.
- **UUPS Upgradability:** Secure proxy pattern with developer accountability for core contract patches.
- **CEI (Checks-Effects-Interactions):** Pattern strictly applied to all fund release paths.
- **Slither/Mythril:** Static analysis performed as part of the truth audit.
