# PolyLance Development Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Smart Contracts](#smart-contracts)
3. [Frontend Application](#frontend-application)
4. [Backend Services](#backend-services)
5. [Account Abstraction](#account-abstraction)
6. [Chainlink Integration](#chainlink-integration)
7. [Dynamic NFTs](#dynamic-nfts)
8. [Subgraph & Indexing](#subgraph--indexing)
9. [Development Workflow](#development-workflow)
10. [Testing Strategy](#testing-strategy)
11. [Deployment Guide](#deployment-guide)
12. [Security Considerations](#security-considerations)

---

## Architecture Overview

PolyLance is a decentralized freelance marketplace built on Polygon with enterprise-grade features:

- **Smart Contracts**: Upgradeable escrow system with milestone payments
- **Frontend**: React + Vite with Web3 integration (Wagmi + RainbowKit)
- **Backend**: Node.js API for metadata and authentication
- **Subgraph**: The Graph for indexing blockchain events
- **Account Abstraction**: Biconomy for gasless transactions
- **Oracles**: Chainlink Price Feeds for USD pegging
- **Messaging**: XMTP V3 for decentralized chat
- **Cross-chain**: Chainlink CCIP + LayerZero integration

### Tech Stack

```
Frontend:
- React 18 + Vite
- Wagmi v2 + RainbowKit
- Framer Motion (animations)
- XMTP Browser SDK (messaging)
- Biconomy Account SDK (gasless tx)

Smart Contracts:
- Solidity ^0.8.20
- OpenZeppelin Contracts (upgradeable)
- Chainlink Price Feeds
- Chainlink CCIP
- LayerZero OApp

Backend:
- Node.js + Express
- SIWE (Sign-In with Ethereum)
- IPFS (Pinata) for metadata

Indexing:
- The Graph (subgraph)
- GraphQL queries
```

---

## Smart Contracts

### Core Contracts

#### FreelanceEscrow.sol

The main escrow contract handling job lifecycle, payments, and NFT minting.

**Key Features:**
- ✅ **100% Custom Error Coverage** - All reverts use custom errors for gas efficiency
- ✅ **Chainlink Price Feeds** - USD-pegged budgets
- ✅ **Dynamic NFTs** - Rating-based colors (Gold/Silver/Bronze)
- ✅ **Account Abstraction Ready** - Meta-transaction support
- ✅ **UUPS Upgradeable** - Proxy pattern for future upgrades
- ✅ **Role-based Access** - Arbitrator, Manager roles via AccessControl
- ✅ **Milestone Payments** - Split payments across multiple checkpoints

**Custom Errors:**
```solidity
error NotAuthorized();
error SelfHiring();
error TokenNotWhitelisted();
error InsufficientPayment();
error InvalidAmount();
error JobAlreadyAssigned();
error InvalidStatus();
error AlreadyApplied();
error InsufficientStake();
error NoRefundAvailable();
error AlreadyPaid();
error MilestoneAlreadyReleased();
error InvalidMilestone();
error InvalidRating();
error DeadlineNotPassed();
error TransferFailed();
error InvalidAddress();
error FeeTooHigh();
// ... and more
```

**Job Lifecycle:**
```
Created → Accepted → Ongoing → Completed
         ↓           ↓
      Cancelled   Disputed → Arbitration
```

**Key Functions:**

```solidity
// Create a job with USD budget (via Chainlink)
function createJob(
    address freelancer,
    address token,
    uint256 amount,
    string memory ipfsHash,
    uint256 durationDays,
    uint256 categoryId
) external payable;

// Submit work (gasless via Biconomy)
function submitWork(uint256 jobId, string calldata ipfsHash) external;

// Release payment with NFT minting
function releaseFunds(uint256 jobId) external;

// Submit review (updates NFT colors)
function submitReview(uint256 jobId, uint8 rating, string calldata ipfsHash) external;

// USD value conversion
function getUSDValue(address token, uint256 amount) public view returns (uint256);
```

#### PriceConverter.sol

Library for Chainlink Price Feed integration.

```solidity
// Get USD value of token amount
function getUSDValue(uint256 tokenAmount, address priceFeed) internal view returns (uint256);

// Get token amount for USD value
function getTokenAmount(uint256 usdAmount, address priceFeed) internal view returns (uint256);
```

**Staleness Protection:**
- 3-hour threshold for price updates
- Automatic reversion on invalid/stale prices

### Contract Deployment

```bash
# Compile contracts
cd contracts_new
npx hardhat compile

# Deploy to Polygon Amoy
npx hardhat run scripts/deploy.js --network polygonAmoy

# Verify on PolygonScan
npx hardhat verify --network polygonAmoy <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

**Environment Variables:**
```env
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
PRIVATE_KEY=your_private_key
POLYGONSCAN_API_KEY=your_polygonscan_key
```

---

## Frontend Application

### Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx
│   │   ├── Chat.jsx (+ Contract Context Bar)
│   │   ├── CreateJob.jsx
│   │   ├── JobList.jsx
│   │   ├── NFTGallery.jsx
│   │   └── ...
│   ├── hooks/
│   │   ├── useEthersSigner.js
│   │   └── useSubgraphJobs.js
│   ├── utils/
│   │   ├── biconomy.js (Account Abstraction)
│   │   └── ipfs.js
│   ├── Web3Provider.jsx
│   ├── App.jsx
│   └── main.jsx
└── package.json
```

### Key Components

#### Web3Provider

Configures Wagmi, RainbowKit, and SIWE authentication.

```jsx
import { Web3Provider } from './Web3Provider';

function App() {
    return (
        <Web3Provider>
            <YourApp />
        </Web3Provider>
    );
}
```

#### Chat with Contract Context Bar

**Features:**
- XMTP V3 encrypted messaging
- Real-time subgraph integration
- Displays job status, budget, deadline
- Visual status indicators

```jsx
<Chat initialPeerAddress={freelancerAddress} />
```

**Contract Context Display:**
- 📄 Job ID
- 💵 Budget (MATIC)
- ✅ Status (color-coded)
- ⏰ Deadline

### Running the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your values

# Start dev server
npm run dev

# Build for production
npm run build
```

**Environment Variables:**
```env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
VITE_ALCHEMY_ID=your_alchemy_id
VITE_API_BASE_URL=http://localhost:3001/api
VITE_SUBGRAPH_URL=http://localhost:8000/subgraphs/name/polylance
VITE_BICONOMY_PAYMASTER_URL=your_paymaster_url
VITE_BICONOMY_BUNDLER_URL=your_bundler_url
```

---

## Backend Services

### API Server

Node.js Express server handling authentication and metadata.

**Endpoints:**

```
POST /api/auth/nonce/:address - Get SIWE nonce
POST /api/auth/verify - Verify SIWE signature
POST /api/jobs - Create job metadata
GET /api/jobs/:id - Get job details
POST /api/reviews - Submit review metadata
```

### Running the Backend

```bash
cd backend

npm install
npm start
```

---

## Account Abstraction

### Biconomy Integration

Enable gasless work submissions for freelancers.

**Setup:**

1. Create Biconomy account at https://dashboard.biconomy.io
2. Get Paymaster and Bundler URLs
3. Add to `.env`:
   ```env
   VITE_BICONOMY_PAYMASTER_URL=https://paymaster.biconomy.io/api/v1/...
   VITE_BICONOMY_BUNDLER_URL=https://bundler.biconomy.io/api/v2/...
   ```

**Usage:**

```javascript
import { createBiconomySmartAccount, submitWorkGasless } from './utils/biconomy';

// Create Smart Account
const smartAccount = await createBiconomySmartAccount(signer);

// Submit work gaslessly
const txHash = await submitWorkGasless(
    smartAccount,
    contractAddress,
    contractABI,
    jobId,
    ipfsHash
);
```

**Supported Operations:**
- ✅ Submit Work (primary use case)
- ✅ Accept Job
- ✅ Dispute Submission

---

## Chainlink Integration

### Price Feeds (USD Pegging)

**Supported Networks:**
- Polygon Mainnet
- Polygon Amoy (testnet)

**Configure Price Feeds:**

```solidity
// Set price feed for MATIC/USD
freelanceEscrow.setPriceFeed(
    address(0), // native token
    0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada // Polygon Amoy MATIC/USD
);

// Set price feed for USDC/USD
freelanceEscrow.setPriceFeed(
    USDC_ADDRESS,
    0x1d622f6EE7B8a4FBf02F9F1aeAd1cAa42E01D81A // Polygon Amoy USDC/USD
);
```

**Get USD Value:**

```javascript
const usdValue = await contract.getUSDValue(tokenAddress, amount);
console.log(`USD Value: $${usdValue / 1e8}`); // 8 decimals
```

**Price Feed Addresses:**

| Network | Pair | Address |
|---------|------|---------|
| Polygon Amoy | MATIC/USD | `0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada` |
| Polygon Amoy | USDC/USD | `0x1d622f6EE7B8a4FBf02F9F1aeAd1cAa42E01D81A` |
| Polygon Mainnet | MATIC/USD | `0xAB594600376Ec9fD91F8e885dADF0CE036862dE0` |

---

## Dynamic NFTs

### Rating-Based Color Schemes

NFTs dynamically change background colors based on job ratings:

**Color Tiers:**
- 🥇 **Gold** (4-5 stars): `#FFD700` → `#FFA500`
- 🥈 **Silver** (3 stars): `#C0C0C0` → `#808080`
- 🥉 **Bronze** (1-2 stars): `#CD7F32` → `#8B4513`
- 💜 **Default** (no rating): `#4f46e5` → `#9333ea`

**Implementation:**

```solidity
function _getRatingColors(uint8 rating) internal pure returns (
    string memory color1,
    string memory color2,
    string memory badge
) {
    if (rating >= 4) return ("#FFD700", "#FFA500", "GOLD");
    if (rating == 3) return ("#C0C0C0", "#808080", "SILVER");
    if (rating > 0) return ("#CD7F32", "#8B4513", "BRONZE");
    return ("#4f46e5", "#9333ea", "");
}
```

**SVG Generation:**
- On-chain SVG creation
- Dynamic gradients
- Star rating visualization (★★★★★)
- Job metadata (category, budget)

**View NFT:**
```javascript
const tokenURI = await contract.tokenURI(tokenId);
// Returns base64-encoded JSON with embedded SVG
```

---

## Subgraph & Indexing

### The Graph Setup

**Schema Entities:**
- Job
- Milestone
- Review
- FreelancerProfile
- Transaction

**Deploy Subgraph:**

```bash
cd subgraph

# Install Graph CLI
npm install -g @graphprotocol/graph-cli

# Generate code
graph codegen

# Build
graph build

# Deploy to hosted service
graph deploy --product hosted-service username/polylance

# Deploy to local node
graph create polylance --node http://localhost:8020
graph deploy polylance --ipfs http://localhost:5001 --node http://localhost:8020
```

**Query Example:**

```graphql
query GetJobs {
    jobs(first: 10, orderBy: createdAt, orderDirection: desc) {
        id
        jobId
        client
        freelancer
        amount
        status
        deadline
        category
    }
}
```

---

## Development Workflow

### Local Development

1. **Start Hardhat Node:**
   ```bash
   cd contracts_new
   npx hardhat node
   ```

2. **Deploy Contracts:**
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

3. **Start Subgraph:**
   ```bash
   cd subgraph
   docker-compose up -d
   graph create polylance --node http://localhost:8020
   graph deploy polylance
   ```

4. **Start Backend:**
   ```bash
   cd backend
   npm start
   ```

5. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes, commit
git add .
git commit -m "feat: your feature description"

# Push and create PR
git push origin feature/your-feature
```

---

## Testing Strategy

### Contract Tests

```bash
cd contracts_new
npx hardhat test
npx hardhat coverage
```

**Test Categories:**
- Unit tests (individual functions)
- Integration tests (full workflows)
- Gas optimization tests
- Security tests (reentrancy, access control)

### Frontend Tests

```bash
cd frontend
npm run test
```

**Test Tools:**
- Vitest
- React Testing Library
- Wagmi test utilities

---

## Deployment Guide

### Production Deployment

**1. Deploy Contracts:**
```bash
npx hardhat run scripts/deploy.js --network polygon
```

**2. Verify Contracts:**
```bash
npx hardhat verify --network polygon <ADDRESS> <ARGS>
```

**3. Deploy Subgraph:**
```bash
graph deploy USERNAME/polylance --product hosted-service
```

**4. Deploy Frontend:**
```bash
npm run build
# Upload dist/ to hosting (Vercel, Netlify, etc.)
```

**5. Deploy Backend:**
```bash
# Deploy to cloud provider (AWS, GCP, Railway, etc.)
```

---

## Security Considerations

### Smart Contract Security

✅ **Implemented:**
- Reentrancy guards (ReentrancyGuard)
- Access control (AccessControl)
- Pausable mechanism
- Custom errors (gas-efficient)
- Input validation
- Safe ERC20 operations
- Upgrade safety (UUPS)

⚠️ **Best Practices:**
- Use multi-sig for admin operations
- Time-lock critical functions
- Regular security audits
- Bug bounty program

### Frontend Security

- Never expose private keys
- Validate all user inputs
- Use HTTPS only
- Implement rate limiting
- Sanitize metadata

### API Security

- Rate limiting
- CORS configuration
- Input sanitization
- SIWE authentication
- API key rotation

---

## Environment Variables Reference

### Frontend (.env)
```env
VITE_WALLETCONNECT_PROJECT_ID=
VITE_ALCHEMY_ID=
VITE_INFURA_ID=
VITE_API_BASE_URL=
VITE_SUBGRAPH_URL=
VITE_BICONOMY_PAYMASTER_URL=
VITE_BICONOMY_BUNDLER_URL=
```

### Backend (.env)
```env
PORT=3001
MONGODB_URI=
PINATA_API_KEY=
PINATA_SECRET_KEY=
```

### Contracts (.env)
```env
POLYGON_AMOY_RPC_URL=
POLYGON_MAINNET_RPC_URL=
PRIVATE_KEY=
POLYGONSCAN_API_KEY=
ALCHEMY_API_KEY=
```

---

## Troubleshooting

### Common Issues

**Issue: Contract not verifying on PolygonScan**
- Ensure compiler version matches exactly
- Check constructor arguments
- Use `--force` flag if needed

**Issue: Subgraph not indexing**
- Check subgraph logs: `docker logs <container_id>`
- Verify contract addresses in subgraph.yaml
- Ensure events are emitted

**Issue: XMTP messages not sending**
- Check browser console for errors
- Verify XMTP client initialization
- Ensure peer has enabled XMTP

**Issue: Biconomy transactions failing**
- Verify Paymaster has funds
- Check Bundler URL is correct
- Ensure contract is whitelisted in Biconomy dashboard

---

## Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Wagmi Documentation](https://wagmi.sh)
- [The Graph Documentation](https://thegraph.com/docs)
- [Chainlink Price Feeds](https://docs.chain.link/data-feeds/price-feeds)
- [Biconomy Documentation](https://docs.biconomy.io)
- [XMTP Documentation](https://xmtp.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details
