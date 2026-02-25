# PolyLance Developer Quick Reference
**By Akhil Muvva & Jhansi Kupireddy**

## 🚀 Quick Start

### Setup
```bash
cd contracts
npm install
cp .env.example .env
# Add your PRIVATE_KEY and POLYGONSCAN_API_KEY
```

### Compile
```bash
npx hardhat compile
```

### Test
```bash
npx hardhat test
npx hardhat coverage
```

### Deploy
```bash
# Deploy to Polygon Amoy testnet
npx hardhat run scripts/deploy_all.js --network polygon_amoy

# Deploy RWA module
npx hardhat run scripts/deploy_rwa_simple.js --network polygon_amoy
```

---

## 📝 Contract Addresses (Polygon Amoy)

```javascript
// Update after deployment
const CONTRACTS = {
  FreelanceEscrow: "0x...",
  FreelanceSBT: "0x...",
  FreelanceGovernance: "0x...",
  YieldManager: "0x...",
  SwapManager: "0x...",
  AssetTokenizer: "0x...",
  InvoiceNFT: "0x...",
  AIOracle: "0x..."
};
```

---

## 🔧 Common Operations

### Create a Job
```javascript
const tx = await escrow.createJob(
  freelancerAddress,
  categoryId,
  deadline,
  ipfsHash,
  { value: ethers.parseEther("1.0") } // 1 MATIC
);
```

### Tokenize an Asset
```javascript
const tx = await assetTokenizer.tokenizeAsset(
  2, // AssetType.REVENUE_SHARE
  USDC_ADDRESS,
  ethers.parseUnits("100000", 6), // $100k
  10000, // 10,000 tokens
  maturityDate,
  "ipfs://Qm...",
  legalHash
);
```

### Finance an Invoice
```javascript
const tx = await invoiceNFT.financeInvoice(
  invoiceId,
  ethers.parseUnits("9500", 6) // $9,500 offer
);
```

### Claim Rewards
```javascript
const tx = await assetTokenizer.claimRewards(tokenId);
```

---

## 🎨 Frontend Integration

### Setup wagmi
```javascript
import { createConfig, configureChains } from 'wagmi';
import { polygonMumbai } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';

const { chains, publicClient } = configureChains(
  [polygonMumbai],
  [publicProvider()]
);

const config = createConfig({
  autoConnect: true,
  publicClient,
});
```

### Use Contract Hooks
```javascript
import { useContractWrite, useWaitForTransaction } from 'wagmi';
import AssetTokenizerABI from './abis/AssetTokenizer.json';

const { data, write } = useContractWrite({
  address: ASSET_TOKENIZER_ADDRESS,
  abi: AssetTokenizerABI,
  functionName: 'tokenizeAsset'
});

const { isLoading, isSuccess } = useWaitForTransaction({
  hash: data?.hash
});
```

---

## 📊 Gas Estimates

| Operation | Gas Cost | USD @ 50 Gwei |
|-----------|----------|---------------|
| Create Job | ~430,000 | $0.52 |
| Complete Job | ~115,000 | $0.14 |
| Tokenize Asset | ~250,000 | $0.30 |
| Create Milestone | ~80,000 | $0.10 |
| Finance Invoice | ~150,000 | $0.18 |
| Claim Rewards | ~70,000 | $0.08 |

---

## 🔐 Security Best Practices

### 1. Always validate inputs
```solidity
require(amount > 0, "Amount must be positive");
require(deadline > block.timestamp, "Invalid deadline");
```

### 2. Use reentrancy guards
```solidity
function claimRewards(uint256 tokenId) external nonReentrant {
    // ... implementation
}
```

### 3. Check role permissions
```solidity
function verifyMilestone(uint256 tokenId) 
    external 
    onlyRole(ORACLE_ROLE) 
{
    // ... implementation
}
```

### 4. Emit events
```solidity
emit AssetTokenized(tokenId, msg.sender, totalValue);
```

---

## 🧪 Testing Patterns

### Unit Test Example
```javascript
describe("AssetTokenizer", function() {
  it("Should tokenize an asset", async function() {
    const tx = await assetTokenizer.tokenizeAsset(
      2, // REVENUE_SHARE
      USDC,
      parseUnits("100000", 6),
      10000,
      maturityDate,
      "ipfs://...",
      legalHash
    );
    
    await expect(tx)
      .to.emit(assetTokenizer, "AssetTokenized")
      .withArgs(1, owner.address, parseUnits("100000", 6));
  });
});
```

---

## 🐛 Common Issues & Solutions

### Issue: "Insufficient funds"
**Solution**: Ensure wallet has enough MATIC for gas + transaction value

### Issue: "Transaction reverted"
**Solution**: Check require() statements and ensure all conditions are met

### Issue: "Nonce too high"
**Solution**: Reset MetaMask account or wait for pending transactions

### Issue: "Contract not verified"
**Solution**: Run `npx hardhat verify --network polygon_amoy <address>`

---

## 📚 Useful Commands

```bash
# Check contract size
npx hardhat size-contracts

# Run specific test
npx hardhat test test/AssetTokenizer.test.js

# Deploy to local node
npx hardhat node
npx hardhat run scripts/deploy_all.js --network localhost

# Verify contract
npx hardhat verify --network polygon_amoy <address> <constructor-args>

# Clean artifacts
npx hardhat clean

# Generate TypeChain types
npx hardhat typechain
```

---

## 🔗 Important Links

- **Hardhat Docs**: https://hardhat.org/docs
- **OpenZeppelin**: https://docs.openzeppelin.com/
- **wagmi Docs**: https://wagmi.sh/
- **Polygon Docs**: https://docs.polygon.technology/
- **IPFS Docs**: https://docs.ipfs.tech/

---

## 💡 Pro Tips

1. **Use .env for secrets** - Never commit private keys
2. **Test on testnet first** - Always deploy to Amoy before mainnet
3. **Verify contracts** - Makes debugging easier
4. **Use events** - Essential for frontend integration
5. **Gas optimization** - Pack structs, use calldata, batch operations
6. **Upgrade carefully** - Test upgrades on testnet first
7. **Monitor transactions** - Use PolygonScan to track deployments

---

## 🆘 Support

- **Discord**: discord.gg/polylance
- **GitHub Issues**: github.com/polylance/issues
- **Email**: dev@polylance.io

---

**Happy Building! 🚀**
