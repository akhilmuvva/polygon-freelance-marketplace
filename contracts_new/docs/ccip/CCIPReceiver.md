# Solidity API

## CCIPReceiver

### i_router

```solidity
address i_router
```

### constructor

```solidity
constructor(address router) internal
```

### getRouter

```solidity
function getRouter() public view virtual returns (address)
```

### onlyRouter

```solidity
modifier onlyRouter()
```

_Only calls from the set router are accepted._

### ccipReceive

```solidity
function ccipReceive(struct Client.Any2EVMMessage message) external virtual
```

Called by the Router to deliver a message.
If this reverts, any token transfers also revert. The message
will move to a FAILED state and can be manually executed later.

_Note ensure you check the msg.sender is the OffRampRouter!_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| message | struct Client.Any2EVMMessage | CCIP Message |

### _ccipReceive

```solidity
function _ccipReceive(struct Client.Any2EVMMessage message) internal virtual
```

Override this function in your contract.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| message | struct Client.Any2EVMMessage | Any2EVMMessage |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_Returns true if this contract implements the interface defined by
`interfaceId`. See the corresponding
https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[ERC section]
to learn more about how these ids are created.

This function call must use less than 30 000 gas._

