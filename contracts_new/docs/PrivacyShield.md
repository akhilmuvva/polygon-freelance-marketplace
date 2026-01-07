# Solidity API

## PrivacyShield

ZK-lite implementation for private Reputation verification.

### identityHashes

```solidity
mapping(address => bytes32) identityHashes
```

### verifiedUsers

```solidity
mapping(address => bool) verifiedUsers
```

### IdentityCommitted

```solidity
event IdentityCommitted(address user, bytes32 commitment)
```

### ProofVerified

```solidity
event ProofVerified(address user, string proofType)
```

### constructor

```solidity
constructor(address initialOwner) public
```

### commitIdentity

```solidity
function commitIdentity(bytes32 commitment) external
```

Users commit a hash of their private data (Reputation, KYC, etc.)

### verifyReputationProof

```solidity
function verifyReputationProof(address user, bytes, uint256 threshold) external returns (bool)
```

Mock ZK-Verification function.
In a real system, this would use a Circom/SnarkJS verifier contract.

### isVerified

```solidity
function isVerified(address user) external view returns (bool)
```

