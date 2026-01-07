# Solidity API

## IFreelanceSBT

### balanceOf

```solidity
function balanceOf(address owner) external view returns (uint256)
```

## FreelanceGovernance

### sbtContract

```solidity
contract IFreelanceSBT sbtContract
```

### Proposal

```solidity
struct Proposal {
  uint256 id;
  address proposer;
  string description;
  uint256 forVotes;
  uint256 againstVotes;
  uint256 startTime;
  uint256 endTime;
  bool executed;
  mapping(address => bool) hasVoted;
}
```

### proposalCount

```solidity
uint256 proposalCount
```

### proposals

```solidity
mapping(uint256 => struct FreelanceGovernance.Proposal) proposals
```

### VOTING_PERIOD

```solidity
uint256 VOTING_PERIOD
```

### MIN_REPUTATION_FOR_PROPOSAL

```solidity
uint256 MIN_REPUTATION_FOR_PROPOSAL
```

### ProposalCreated

```solidity
event ProposalCreated(uint256 proposalId, address proposer, string description)
```

### Voted

```solidity
event Voted(uint256 proposalId, address voter, bool support, uint256 weight)
```

### ProposalExecuted

```solidity
event ProposalExecuted(uint256 proposalId)
```

### constructor

```solidity
constructor(address _sbtContract) public
```

### createProposal

```solidity
function createProposal(string description) external
```

### vote

```solidity
function vote(uint256 proposalId, bool support) external
```

### executeProposal

```solidity
function executeProposal(uint256 proposalId) external
```

