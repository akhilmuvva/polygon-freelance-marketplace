# PolyLance — Decentralized Freelance Marketplace

**A protocol for trustless recruitment, escrow-based settlement, and on-chain professional reputation on Polygon.**

[![Website](https://img.shields.io/badge/Website-polylance.codes-blue)](https://polylance.codes)
[![Network](https://img.shields.io/badge/Network-Polygon_Amoy-purple)](https://amoy.polygonscan.com)
[![Tests](https://img.shields.io/badge/Tests-17_Files-green)](#)
[![Contracts](https://img.shields.io/badge/Contracts-60_Files-blue)](#)
![Tests](https://img.shields.io/badge/Tests-not%20verified-lightgrey)
![Coverage](https://img.shields.io/badge/Coverage-not%20run-lightgrey)

---

## About PolyLance

PolyLance is a decentralized alternative to traditional freelance platforms. It replaces centralized intermediaries and high fees with smart contract escrow and on-chain professional identity. 

- **Official Website:** [https://polylance.codes](https://polylance.codes)
- **Engineers:** [Akhil Muvva](mailto:akhilmuvva@polylance.codes) · [Jhansi Kupireddy](mailto:jhansi.kupireddy@polylance.codes)
- **Security:** [security@polylance.codes](mailto:security@polylance.codes)

---

## Core Protocol Features

### 1. Smart Contract Escrow
- **Milestone-Based Payments:** Funds are locked in `FreelanceEscrow.sol` and released upon client approval or arbitration victory.
- **Yield Generation:** Idle escrowed funds can be routed to Aave V3 on Polygon to generate yield for the platform or users.
- **Dispute Resolution:** Integration with Kleros decentralized courts for neutral arbitration.

### 2. Professional Reputation (SBTs)
- **Soulbound Tokens (ERC-5192):** Completed jobs mint a non-transferable token (`FreelanceSBT.sol`) recording skills and client ratings.
- **On-chain CV:** A verifiable, sybil-resistant history of professional performance.

### 3. Governance & Security
- **Quadratic Governance:** Platform upgrades are voted on by long-term contributors via `FreelanceGovernance.sol`.
- **48-Hour Timelock:** All successful governance proposals must pass through a 48-hour delay in `PolyLanceTimelock.sol` before execution.
- **UUPS Upgradeability:** Protocol core contracts use UUPS proxies to allow for secure upgrades with developer accountability.

---

## 🛠️ Protocol Architecture

The protocol is built on a modular stack:

- **Identity Layer:** Soulbound Tokens and ZK-identity hooks (Privado ID).
- **Settlement Layer:** ERC-20 (MATIC/PolyToken) escrow contracts with reentrancy protection.
- **Governance Layer:** Governor-based quadratic voting system.
- **Infrastructure:** Frontend hosted with IPFS/4Everland, metadata on Ceramic.

### Contract Registry (Polygon Amoy)

| Contract | Address |
| :--- | :--- |
| **FreelanceEscrow** | `0x25F6C8ed995C811E6c0ADb1D66A60830E8115e9A` |
| **FreelancerReputation** | `0x89791A9A3210667c828492DB98DCa3e2076cc373` |
| **FreelanceGovernance** | `0x4653251486a57f90Ee89F9f34E098b9218659b83` |
| **PolyLanceTimelock** | (Deployed as part of governance upgrade) |

---

## 🚀 Getting Started

1. **Visit the app:** [https://polylance.codes](https://polylance.codes)
2. **Connect Wallet:** Use MetaMask or any WalletConnect provider on the Polygon Amoy network.
3. **Register Profile:** Initialize your professional identity with a Soulbound Token.

---

## 🛡️ Security & Audits

- **Timelock Enforcement:** 48-hour mandatory delay for all system-level changes.
- **Open-Source:** All contract logic is verified on Polygonscan.
- **Responsible Disclosure:** If you find a security vulnerability, please contact [security@polylance.codes](mailto:security@polylance.codes).

---

© 2026 PolyLance. Created by [Akhil Muvva](https://github.com/akhilmuvva) & [Jhansi Kupireddy](https://github.com/jhansikupireddy).
