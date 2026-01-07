# Solidity API

## Client

### EVMTokenAmount

```solidity
struct EVMTokenAmount {
  address token;
  uint256 amount;
}
```

### Any2EVMMessage

```solidity
struct Any2EVMMessage {
  bytes32 messageId;
  uint64 sourceChainSelector;
  bytes sender;
  bytes data;
  struct Client.EVMTokenAmount[] destTokenAmounts;
}
```

### EVM2AnyMessage

```solidity
struct EVM2AnyMessage {
  bytes receiver;
  bytes data;
  struct Client.EVMTokenAmount[] tokenAmounts;
  address feeToken;
  bytes extraArgs;
}
```

