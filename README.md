# PolyLance: Sovereign Freelance Protocol & Yield-Aggregating Escrow
> **Infrastructure-grade decentralized marketplace for Web3 talent.**

[![Security: Audited](https://img.shields.io/badge/Security-Audited-brightgreen.svg)](#security--audit-findings)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Network: Polygon Amoy](https://img.shields.io/badge/Network-Polygon_Amoy-7b3fe4.svg)](https://amoy.polygonscan.com/)

PolyLance is a decentralized freelance protocol built on Polygon that replaces centralized intermediaries with smart contract escrow, yield-aggregating capital management, and Kleros-powered arbitration. It is designed for high-trust, high-stakes Web3 engineering engagements.

---

## 🛡️ Security & Audit Findings
**Security is the primary engineering pillar of PolyLance.** The protocol has undergone automated static analysis and symbolic execution to ensure capital safety.

### Audit Summary (Trail of Bits / ConsenSys Standards)
| Finding ID | Title | Severity | Status |
| :--- | :--- | :--- | :--- |
| **S-04** | **`sovereignWithdraw` accounting mismatch** | **High** | 🛠️ Fix Pending |
| **M-03** | **`transfer()` breaks Smart Contract Wallets** | **High** | 🛠️ Fix Pending |
| **S-01** | Ignored return values on external calls | Medium | 🛠️ Fix Pending |
| **S-05** | Yield strategy active check bypass | Medium | 🛠️ Fix Pending |
| **M-02** | Kleros ruling 0 fund freeze | Medium | 🛠️ Fix Pending |
| **A-02** | UUPS Upgrade lacks Timelock binding | Medium | 🛠️ Fix Pending |

> [!IMPORTANT]
> Detailed technical analysis for all 13 findings can be found in [AUDIT_SUMMARY.md](docs/security/AUDIT_SUMMARY.md).

---

## 🏗️ Technical Architecture

### 1. Capital Efficiency (Yield-Aggregating Escrow)
Idle capital locked in escrow is routed to Aave V3 and Compound V3. Interest is split between the freelancer (75%), protocol treasury (20%), and safety module (5%).

### 2. Trustless Arbitration (Kleros Integration)
Disputes are escalated to the Kleros Court. PolyLance implements the `IArbitrable` interface, ensuring that neither the client nor the platform can unilaterally seize funds.

### 3. Identity & Reputation (ERC-5192)
Verified completions mint non-transferable Soulbound Tokens (SBTs). Reputation is calculated on-chain using a "Gravity Score" (Completion Rate × Rating × Volume).

### 4. Gasless UX (Biconomy AA)
Leverages EIP-2771 and Biconomy Smart Accounts for social login and gasless transactions, abstracting blockchain complexity for non-native users.

---

## 🔗 Deployed Contracts (Polygon Amoy)

| Contract | Address |
| :--- | :--- |
| **FreelanceEscrow** | [`0x25F6C8ed995C811E6c0ADb1D66A60830E8115e9A`](https://amoy.polygonscan.com/address/0x25F6C8ed995C811E6c0ADb1D66A60830E8115e9A) |
| **FreelancerReputation** | [`0x6d907B6e804fB48797D6E907B6e804fB48797D6E`](https://amoy.polygonscan.com/address/0x6d907B6e804fB48797D6E907B6e804fB48797D6E) |
| **FreelanceSBT** | [`0x907B6e804fB48797D6E907B6e804fB48797D6E907B`](https://amoy.polygonscan.com/address/0x907B6e804fB48797D6E907B6e804fB48797D6E907B) |

---

## 🔬 Research & Academic Foundation
The protocol logic is supported by academic research in blockchain-based identity and security.
- **IEEE Publication:** [10.1109/ISSSC63660.2025.11389114](https://doi.org/10.1109/ISSSC63660.2025.11389114)
- **Focus:** Decentralized Trust Frameworks & Smart Contract Vulnerability Mitigation.

---

## 🛠️ Local Development

### Prerequisites
- Node.js v18+
- Hardhat
- A Polygon Amoy RPC Key

### Installation
```bash
# Clone the repository
git clone https://github.com/akhilmuvva/polygon-freelance-marketplace.git

# Install dependencies
npm install

# Compile contracts
cd contracts && npx hardhat compile

# Run test suite
npx hardhat test
```

---

## 👥 Team & Contributors
- **Akhil Muvva** ([@akhilmuvva](https://github.com/akhilmuvva)) — Lead Architect & Solidity Engineer
- **Jhansi** — Co-Founder & Frontend Lead
- **Balram** — UI/UX Strategist

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
