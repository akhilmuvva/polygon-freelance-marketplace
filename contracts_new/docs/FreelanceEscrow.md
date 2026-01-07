# Solidity API

## IPolyToken

### mint

```solidity
function mint(address to, uint256 amount) external
```

## IInsurancePool

### deposit

```solidity
function deposit(address token, uint256 amount) external
```

### depositNative

```solidity
function depositNative() external payable
```

## IFreelanceSBT

### safeMint

```solidity
function safeMint(address to, string uri) external
```

## IArbitrator

### createDispute

```solidity
function createDispute(uint256 _choices, bytes _extraData) external payable returns (uint256 disputeID)
```

### arbitrationCost

```solidity
function arbitrationCost(bytes _extraData) external view returns (uint256 cost)
```

## FreelanceEscrow

### ARBITRATOR_ROLE

```solidity
bytes32 ARBITRATOR_ROLE
```

### MANAGER_ROLE

```solidity
bytes32 MANAGER_ROLE
```

### arbitrator

```solidity
address arbitrator
```

### ccipRouter

```solidity
address ccipRouter
```

### insurancePool

```solidity
address insurancePool
```

### polyToken

```solidity
address polyToken
```

### sbtContract

```solidity
address sbtContract
```

### vault

```solidity
address vault
```

### REWARD_AMOUNT

```solidity
uint256 REWARD_AMOUNT
```

### platformFeeBps

```solidity
uint256 platformFeeBps
```

### whitelistedTokens

```solidity
mapping(address => bool) whitelistedTokens
```

### FREELANCER_STAKE_PERCENT

```solidity
uint256 FREELANCER_STAKE_PERCENT
```

### INSURANCE_FEE_BPS

```solidity
uint256 INSURANCE_FEE_BPS
```

### allowlistedSourceChains

```solidity
mapping(uint64 => bool) allowlistedSourceChains
```

### allowlistedSenders

```solidity
mapping(address => bool) allowlistedSenders
```

### NotAuthorized

```solidity
error NotAuthorized()
```

### SelfHiring

```solidity
error SelfHiring()
```

### TokenNotWhitelisted

```solidity
error TokenNotWhitelisted()
```

### InsufficientPayment

```solidity
error InsufficientPayment()
```

### InvalidAmount

```solidity
error InvalidAmount()
```

### JobAlreadyAssigned

```solidity
error JobAlreadyAssigned()
```

### InvalidStatus

```solidity
error InvalidStatus()
```

### AlreadyApplied

```solidity
error AlreadyApplied()
```

### InsufficientStake

```solidity
error InsufficientStake()
```

### NoRefundAvailable

```solidity
error NoRefundAvailable()
```

### AlreadyPaid

```solidity
error AlreadyPaid()
```

### MilestoneAlreadyReleased

```solidity
error MilestoneAlreadyReleased()
```

### InvalidMilestone

```solidity
error InvalidMilestone()
```

### InvalidRating

```solidity
error InvalidRating()
```

### DeadlineNotPassed

```solidity
error DeadlineNotPassed()
```

### TransferFailed

```solidity
error TransferFailed()
```

### InvalidAddress

```solidity
error InvalidAddress()
```

### FeeTooHigh

```solidity
error FeeTooHigh()
```

### JobStatus

```solidity
enum JobStatus {
  Created,
  Accepted,
  Ongoing,
  Disputed,
  Arbitration,
  Completed,
  Cancelled
}
```

### Milestone

```solidity
struct Milestone {
  uint256 amount;
  string ipfsHash;
  bool isReleased;
}
```

### Job

```solidity
struct Job {
  uint256 id;
  address client;
  address freelancer;
  address token;
  uint256 amount;
  uint256 freelancerStake;
  uint256 totalPaidOut;
  enum FreelanceEscrow.JobStatus status;
  string ipfsHash;
  bool paid;
  uint256 deadline;
  uint256 milestoneCount;
}
```

### Application

```solidity
struct Application {
  address freelancer;
  uint256 stake;
}
```

### jobs

```solidity
mapping(uint256 => struct FreelanceEscrow.Job) jobs
```

### jobMilestones

```solidity
mapping(uint256 => mapping(uint256 => struct FreelanceEscrow.Milestone)) jobMilestones
```

### reviews

```solidity
mapping(uint256 => struct FreelanceEscrow.Review) reviews
```

### jobApplications

```solidity
mapping(uint256 => struct FreelanceEscrow.Application[]) jobApplications
```

### hasApplied

```solidity
mapping(uint256 => mapping(address => bool)) hasApplied
```

### pendingRefunds

```solidity
mapping(address => mapping(address => uint256)) pendingRefunds
```

### jobCount

```solidity
uint256 jobCount
```

### APPLICATION_STAKE_PERCENT

```solidity
uint256 APPLICATION_STAKE_PERCENT
```

### Review

```solidity
struct Review {
  uint8 rating;
  string ipfsHash;
  address reviewer;
}
```

### JobCreated

```solidity
event JobCreated(uint256 jobId, address client, address freelancer, uint256 amount, uint256 deadline)
```

### JobApplied

```solidity
event JobApplied(uint256 jobId, address freelancer, uint256 stake)
```

### FreelancerSelected

```solidity
event FreelancerSelected(uint256 jobId, address freelancer)
```

### JobAccepted

```solidity
event JobAccepted(uint256 jobId, address freelancer, uint256 stake)
```

### WorkSubmitted

```solidity
event WorkSubmitted(uint256 jobId, address freelancer, string ipfsHash)
```

### FundsReleased

```solidity
event FundsReleased(uint256 jobId, address freelancer, uint256 amount, uint256 nftId)
```

### MilestoneReleased

```solidity
event MilestoneReleased(uint256 jobId, uint256 milestoneId, uint256 amount)
```

### MilestonesDefined

```solidity
event MilestonesDefined(uint256 jobId, uint256[] amounts, string[] ipfsHashes)
```

### JobCancelled

```solidity
event JobCancelled(uint256 jobId)
```

### JobDisputed

```solidity
event JobDisputed(uint256 jobId)
```

### DisputeRaised

```solidity
event DisputeRaised(uint256 jobId, address raiser)
```

### Ruling

```solidity
event Ruling(address _arbitrator, uint256 _disputeID, uint256 _ruling)
```

### ReviewSubmitted

```solidity
event ReviewSubmitted(uint256 jobId, address reviewer, uint8 rating, string ipfsHash)
```

### CCIPMessageReceived

```solidity
event CCIPMessageReceived(bytes32 messageId, uint64 sourceChainSelector, address sender)
```

### InsurancePaid

```solidity
event InsurancePaid(uint256 jobId, uint256 amount)
```

### RefundClaimed

```solidity
event RefundClaimed(address user, address token, uint256 amount)
```

### VaultUpdated

```solidity
event VaultUpdated(address oldVault, address newVault)
```

### constructor

```solidity
constructor() public
```

### initialize

```solidity
function initialize(address initialOwner, address trustedForwarder, address _ccipRouter, address _insurancePool, address _lzEndpoint) public
```

### setSBTContract

```solidity
function setSBTContract(address _sbt) external
```

### setTokenWhitelist

```solidity
function setTokenWhitelist(address token, bool allowed) external
```

### setInsurancePool

```solidity
function setInsurancePool(address _pool) external
```

### setPolyToken

```solidity
function setPolyToken(address _token) external
```

### setVault

```solidity
function setVault(address _vault) external
```

### setPlatformFee

```solidity
function setPlatformFee(uint256 _bps) external
```

### pause

```solidity
function pause() external
```

### unpause

```solidity
function unpause() external
```

### _contextSuffixLength

```solidity
function _contextSuffixLength() internal view virtual returns (uint256)
```

### _msgSender

```solidity
function _msgSender() internal view virtual returns (address sender)
```

### _authorizeUpgrade

```solidity
function _authorizeUpgrade(address newImplementation) internal
```

_Function that should revert when `msg.sender` is not authorized to upgrade the contract. Called by
{upgradeToAndCall}.

Normally, this function will use an xref:access.adoc[access control] modifier such as {Ownable-onlyOwner}.

```solidity
function _authorizeUpgrade(address) internal onlyOwner {}
```_

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view returns (bool)
```

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

### _createJobInternal

```solidity
function _createJobInternal(address client, address freelancer, address token, uint256 amount, string _ipfsHash, uint256 deadline) internal
```

### saveIPFSHash

```solidity
function saveIPFSHash(uint256 jobId, string ipfsHash) external
```

### createJob

```solidity
function createJob(address freelancer, address token, uint256 amount, string _ipfsHash, uint256 durationDays) external payable
```

### createJobWithMilestones

```solidity
function createJobWithMilestones(address freelancer, address token, uint256 amount, string _ipfsHash, uint256[] milestoneAmounts, string[] milestoneIpfsHashes) external payable
```

### applyForJob

```solidity
function applyForJob(uint256 jobId) external payable
```

_Freelancers apply for a job by providing a small stake.
Prevents spam and ensures commitment._

### pickFreelancer

```solidity
function pickFreelancer(uint256 jobId, address freelancer) external
```

_Client picks a freelancer from the applicants.
Unselected applicants get their stake refunded._

### claimRefund

```solidity
function claimRefund(address token) external
```

### releaseFunds

```solidity
function releaseFunds(uint256 jobId) external
```

### releaseMilestone

```solidity
function releaseMilestone(uint256 jobId, uint256 milestoneId) external
```

### acceptJob

```solidity
function acceptJob(uint256 jobId) external payable
```

### submitWork

```solidity
function submitWork(uint256 jobId, string ipfsHash) external
```

### dispute

```solidity
function dispute(uint256 jobId) external payable
```

### resolveDispute

```solidity
function resolveDispute(uint256 jobId, address winner, uint256 freelancerPayout) external
```

### submitReview

```solidity
function submitReview(uint256 jobId, uint8 rating, string ipfsHash) external
```

### rule

```solidity
function rule(uint256 _disputeID, uint256 _ruling) external
```

### _sendFunds

```solidity
function _sendFunds(address to, address token, uint256 amount) internal
```

### _rewardParties

```solidity
function _rewardParties(uint256 jobId) internal
```

### refundExpiredJob

```solidity
function refundExpiredJob(uint256 jobId) external
```

_Allows the client to reclaim funds if the job deadline is passed 
and no freelancer was assigned or they failed to submit work._

### disputeIdToJobId

```solidity
mapping(uint256 => uint256) disputeIdToJobId
```

