# Solidity API

## PolyToken

### MINTER_ROLE

```solidity
bytes32 MINTER_ROLE
```

### constructor

```solidity
constructor(address initialAdmin) public
```

### mint

```solidity
function mint(address to, uint256 amount) external
```

### _update

```solidity
function _update(address from, address to, uint256 value) internal
```

### nonces

```solidity
function nonces(address owner) public view returns (uint256)
```

