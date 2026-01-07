# Solidity API

## InsurancePool

Collects fees from jobs and provides a safety net for disputes.

### balances

```solidity
mapping(address => uint256) balances
```

### totalInsurancePool

```solidity
mapping(address => uint256) totalInsurancePool
```

### FundsAdded

```solidity
event FundsAdded(address token, uint256 amount)
```

### PayoutExecuted

```solidity
event PayoutExecuted(address token, address recipient, uint256 amount)
```

### constructor

```solidity
constructor(address initialOwner) public
```

### deposit

```solidity
function deposit(address token, uint256 amount) external
```

Allows the Escrow contract to deposit a portion of the fee.

### depositNative

```solidity
function depositNative() external payable
```

### payout

```solidity
function payout(address token, address to, uint256 amount) external
```

Executed by the DAO or Admin to resolve extreme cases.

### receive

```solidity
receive() external payable
```

