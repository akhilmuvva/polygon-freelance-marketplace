# PolyLance — Deployment Guide

This document covers deploying the PolyLance protocol to Polygon Amoy (testnet) and Polygon Mainnet.

---

## Prerequisites

- Node.js 18+
- `contracts/.env` configured (see `contracts/.env.example`)
- MATIC for gas on target network
- Polygonscan API key for contract verification

---

## Step 1: Compile Contracts

```bash
cd contracts
npm install
npx hardhat compile
```

---

## Step 2: Deploy Core Protocol

```bash
# Deploy to Polygon Amoy testnet
npx hardhat run scripts/deploy.js --network amoy

# Deploy to Polygon Mainnet (production)
npx hardhat run scripts/deploy.js --network polygon
```

The deploy script outputs contract addresses. Update your `.env` and `frontend/.env` with the new addresses.

**Deployment order matters:**
1. `PolyToken` (ERC-20 reward token)
2. `FreelanceSBT` (ERC-5192 SBT)
3. `FreelancerReputation` (ERC-1155, UUPS proxy)
4. `PolyLanceTimelock` (48h timelock controller)
5. `FreelanceGovernance` (reputation-gated governance)
6. `FreelanceEscrow` (UUPS proxy — references SBT + Reputation addresses)
7. `YieldManager` (yield routing — set via `setYieldManager()`)

---

## Step 3: Post-Deployment Configuration

After deploying, call these configuration functions:

```javascript
// Grant MINTER_ROLE on Reputation contract to the Escrow proxy
await reputation.grantRole(MINTER_ROLE, escrowProxyAddress);

// Set deployed contract addresses on the Escrow
await escrow.setSBTContract(sbtAddress);
await escrow.setReputationContract(reputationAddress);
await escrow.setYieldManager(yieldManagerAddress);
await escrow.setVault(treasuryMultisigAddress);

// Whitelist accepted payment tokens
await escrow.setTokenWhitelist(usdcAddress, true);
await escrow.setTokenWhitelist(usdtAddress, true);
```

---

## Step 4: Verify Contracts on Polygonscan

```bash
# Verify implementation contract (not proxy)
npx hardhat verify --network amoy <IMPLEMENTATION_ADDRESS> <CONSTRUCTOR_ARGS>

# For UUPS proxies, verify both proxy and implementation
npx hardhat verify --network amoy <PROXY_ADDRESS>
```

---

## Step 5: Deploy The Graph Subgraph

```bash
cd subgraph

# Authenticate with The Graph Studio
graph auth --studio <YOUR_DEPLOY_KEY>

# Update subgraph.yaml with deployed contract addresses
# Then deploy
graph deploy --studio polylance
```

---

## Upgrading the Protocol (UUPS)

1. Write the new implementation contract (e.g., `FreelanceEscrowV2.sol`)
2. Ensure no storage layout collisions (check `__gap` is consumed correctly)
3. Deploy the new implementation
4. Create a governance proposal to call `upgradeTo(newImplAddress)` via Timelock
5. After 48-hour Timelock delay, execute the upgrade

> ⚠️ Never call `_authorizeUpgrade` directly — only the Timelock should execute upgrades.

---

## Network Configuration (Hardhat)

```javascript
// hardhat.config.js
networks: {
  amoy: {
    url: process.env.AMOY_RPC_URL,
    accounts: [process.env.PRIVATE_KEY],
    chainId: 80002
  },
  polygon: {
    url: process.env.POLYGON_RPC_URL,
    accounts: [process.env.PRIVATE_KEY],
    chainId: 137
  }
}
```
