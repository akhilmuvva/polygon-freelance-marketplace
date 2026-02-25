# PolyLance Zenith
**Maintained and Developed by:** [Akhil Muvva](https://github.com/akhilmuvva) & [Jhansi Kupireddy](https://github.com/jhansikupireddy-lang)
## 👥 Contributors
| Name | GitHub |
| :--- | :--- |
| **Akhil Muvva** | [@akhilmuvva](https://github.com/akhilmuvva) |
| **Jhansi Kupireddy** | [@jhansikupireddy-lang](https://github.com/jhansikupireddy-lang) |

PolyLance Zenith is a state-of-the-art, professional freelance ecosystem achieving the "Supreme Level" of decentralization on Polygon. It integrates advanced governance, AI-agentic autonomy, social-layer connectivity, and **groundbreaking Real-World Asset (RWA) tokenization** to create the world's most robust freelance coordination engine.

## 🆕 RWA Tokenization Module
**The first freelance platform to enable asset tokenization and invoice financing!**

- **📄 Invoice Financing**: Sell invoices at 5-30% discount for instant liquidity
- **🎨 IP Rights Tokenization**: Fractional ownership of intellectual property
- **💰 Revenue Share Tokens**: Tokenize future earnings with automated distribution
- **🤖 AI-Powered Verification**: Automated milestone completion verification
- **📈 Milestone Escrows**: Progressive value release upon verified completion

**Use Cases:**
- Freelancers get instant cash instead of waiting 30-90 days for payment
- Investors earn 10-30% APR by financing invoices
- Creators monetize IP rights without selling their company
- Clients ensure payment only upon verified delivery


## 🏛️ Zenith Governance Engine
The protocol features a high-fidelity governance system with support for:
- **Quadratic Voting**: Dampening the influence of whales to ensure community-driven decisions.
- **ZK-Anonymity**: Zero-Knowledge identity masking for privacy-preserving voting.
- **Secret Voting**: Commit-reveal schemes to prevent voter coercion and front-running.
- **Liquid Democracy**: Dynamic delegation of reputation weight to subject-matter experts.

## 🤖 AI & Web3 UX Enhancements
- **Gasless Sponsorship**: Integrated Biconomy Account Abstraction to sponsor the first job post fee for new users.
- **Kleros Justice**: Fully decentralized arbitration court for resolving marketplace disputes via trustless juries.
- **Escrow Manager UI**: A real-time monitoring dashboard for tracking active smart contract escrows and project progress.
- **Farcaster Frame Sharing**: Viral governance allows any proposal to be cast as an interactive Frame on Warpcast.

## 🖼️ Architecture Overview

```mermaid
graph TD
    User((User))
    Frontend[React Frontend]
    Backend[Express Backend]
    IPFS[(IPFS)]
    DB[(MongoDB)]
    
    subgraph "Polygon Amoy Testnet"
        Escrow[FreelanceEscrow Proxy]
        SBT[FreelanceSBT]
        Rep[FreelancerReputation]
        Poly[PolyToken]
        AA[Biconomy Paymaster]
    end
    
    subgraph "Data Indexing"
        Graph[The Graph Protocol]
    end
    
    User <-->|Connect / Gasless| Frontend
    Frontend <--> Backend
    Backend <--> DB
    Backend <--> IPFS
    Frontend <-->|Transactions| Escrow
    Frontend <..>|Query Data| Graph
    Escrow -.->|Events| Graph
    Escrow <--> SBT
    Escrow <--> Rep
    Escrow <--> Poly
    AA -.->|Sponsorship| Escrow
    Escrow <-->|Dispute| Kleros[Kleros Court]
```


## 🚀 Deployed Contracts (Polygon Amoy)

| Contract | Address |
|----------|---------|
| **FreelanceEscrow (Proxy)** | `0x25F6C8ed995C811E6c0ADb1D66A60830E8115e9A` |
| **FreelancerReputation** | `0x89791A9A3210667c828492DB98DCa3e2076cc373` |
| **PolyToken** | `0xd3b893cd083f07Fe371c1a87393576e7B01C52C6` |
| **FreelanceSBT** | `0xb4e9A5BC64DC07f890367F72941403EEd7faDCbB` |
| **Zenith Governance** | `0x4653251486a57f90Ee89F9f34E098b9218659b83` |

### 🌐 Live Application
**[Launch PolyLance Zenith (Vercel)](https://polylance-zenith.vercel.app)**

## 🛡️ Security & Testing

### Automated Testing
The protocol is backed by a comprehensive suite of tests covering:
- Standard Job Lifecycles (Creation -> Submission -> Release)
- Milestone-based Escrow Logic
- Dispute Resolution (Internal & Kleros)
- Supreme Tier Fee Logic (0% fees for elite users)
- ERC-5192 Soulbound Token compliance

To run tests:
```bash
cd contracts
npx hardhat test
```

### Verification
All contracts are verified on [Amoy Polygonscan](https://amoy.polygonscan.com).

## 🛡️ Security Features
- **Proxy Pattern**: UUPS (Universal Upgradeable Proxy Standard) for contract maintainability.
- **DoS Resilience**: Gas-efficient "pull-based" settlements.
- **Sybil Resistance**: Reputation-gated governance.
- **XSS & Injection Protection**: Backend-level input sanitization.

## 🚀 Getting Started

1. **Clone and install**
```bash
git clone https://github.com/akhilmuvva/polygon-freelance-marketplace.git
cd polygon-freelance-marketplace
npm install
cd frontend && npm install
cd ../backend && npm install
cd ../contracts && npm install
```

2. **Run Development Servers**
- Backend: `cd backend && npm run dev`
- Frontend: `cd frontend && npm run dev`

## 🎥 Application Demo
**[Watch the Full Walkthrough (Loom)](https://www.loom.com/share/placeholder-video-link)**
*Processing flow: Job Creation (Gasless) -> Milestone Release -> NFT Minting*

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

## 🔍 Contract Verification
If deploying to a new network, verify contracts using Hardhat:
```bash
npx hardhat verify --network polygon_amoy <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```
*Ensure `POLYGONSCAN_API_KEY` is set in your `.env` file.*
## 👥 Developers
| Name | GitHub |
| :--- | :--- |
| **Muvva Akhil Yadav** | [@akhilmuvva](https://github.com/akhilmuvva) |
| **Jhansi Kupireddy** | [@jhansikupireddy-lang](https://github.com/jhansikupireddy-lang) |

## 📜 License
This project is licensed under the **Apache License 2.0**. See the [LICENSE](LICENSE) file for the full text.
