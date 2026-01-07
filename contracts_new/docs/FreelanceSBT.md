# Solidity API

## IERC5192

### Locked

```solidity
event Locked(uint256 tokenId)
```

### Unlocked

```solidity
event Unlocked(uint256 tokenId)
```

### locked

```solidity
function locked(uint256 tokenId) external view returns (bool)
```

## FreelanceSBT

_Soulbound Token (non-transferable) for freelancer reputation and ratings.
Each token representing a successfully completed job and its associated rating._

### MINTER_ROLE

```solidity
bytes32 MINTER_ROLE
```

### SoulboundTokenNonTransferable

```solidity
error SoulboundTokenNonTransferable()
```

### constructor

```solidity
constructor(address defaultAdmin, address minter) public
```

### safeMint

```solidity
function safeMint(address to, string uri) public
```

_Mints a reputation token to a freelancer._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | The freelancer address. |
| uri | string | The IPFS hash (CID) of the job metadata and rating. |

### _update

```solidity
function _update(address to, uint256 tokenId, address auth) internal returns (address)
```

_Overrides the _update function to prevent any transfers after minting.
Only allow minting (from address(0)) and burning (to address(0))._

### locked

```solidity
function locked(uint256 tokenId) external view returns (bool)
```

### tokenURI

```solidity
function tokenURI(uint256 tokenId) public view returns (string)
```

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view returns (bool)
```

