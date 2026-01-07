# Solidity API

## IAny2EVMMessageReceiver

Application contracts that intend to receive messages from
the router should implement this interface.

### ccipReceive

```solidity
function ccipReceive(struct Client.Any2EVMMessage message) external
```

Called by the Router to deliver a message.
If this reverts, any token transfers also revert. The message
will move to a FAILED state and can be manually executed later.

_Note ensure you check the msg.sender is the OffRampRouter!_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| message | struct Client.Any2EVMMessage | CCIP Message |

