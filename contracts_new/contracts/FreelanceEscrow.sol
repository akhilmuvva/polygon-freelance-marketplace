// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./ccip/Client.sol";
import "./ccip/IAny2EVMMessageReceiver.sol";
import "./lz/OApp.sol";

interface IPolyToken is IERC20 {
    function mint(address to, uint256 amount) external;
}

interface IInsurancePool {
    function deposit(address token, uint256 amount) external;
    function depositNative() external payable;
}

interface IFreelanceSBT {
    function safeMint(address to, string memory uri) external;
}

interface IArbitrator {
    function createDispute(uint256 _choices, bytes calldata _extraData) external payable returns (uint256 disputeID);
    function arbitrationCost(bytes calldata _extraData) external view returns (uint256 cost);
}

contract FreelanceEscrow is 
    Initializable, 
    ERC721URIStorageUpgradeable, 
    ERC2981Upgradeable, 
    OwnableUpgradeable, 
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable, 
    PausableUpgradeable,
    UUPSUpgradeable,
    IAny2EVMMessageReceiver,
    OApp
{
    using SafeERC20 for IERC20;

    bytes32 public constant ARBITRATOR_ROLE = keccak256("ARBITRATOR_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    uint256 private _nextTokenId;

    address public arbitrator;
    address private _trustedForwarder; 
    address public ccipRouter; 
    address public insurancePool;
    address public polyToken;
    address public sbtContract;
    address public vault;
    uint256 public constant REWARD_AMOUNT = 100 * 10**18;
    uint256 public platformFeeBps; // e.g., 250 for 2.5%
    
    mapping(address => bool) public whitelistedTokens;
    
    uint256 public constant FREELANCER_STAKE_PERCENT = 10; 
    uint256 public constant INSURANCE_FEE_BPS = 100; // 1%

    mapping(uint64 => bool) public allowlistedSourceChains;
    mapping(address => bool) public allowlistedSenders;

    error NotAuthorized();
    error SelfHiring();
    error TokenNotWhitelisted();
    error InsufficientPayment();
    error InvalidAmount();
    error JobAlreadyAssigned();
    error InvalidStatus();
    error AlreadyApplied();
    error InsufficientStake();
    error NoRefundAvailable();
    error AlreadyPaid();
    error MilestoneAlreadyReleased();
    error InvalidMilestone();
    error InvalidRating();
    error DeadlineNotPassed();
    error TransferFailed();
    error InvalidAddress();
    error FeeTooHigh();

    enum JobStatus { Created, Accepted, Ongoing, Disputed, Arbitration, Completed, Cancelled }

    struct Milestone {
        uint256 amount;
        string ipfsHash;
        bool isReleased;
    }

    struct Job {
        uint256 id;
        address client;
        address freelancer;
        address token; 
        uint256 amount;
        uint256 freelancerStake;
        uint256 totalPaidOut;
        JobStatus status;
        string ipfsHash;
        bool paid;
        uint256 deadline;
        uint256 milestoneCount;
    }

    struct Application {
        address freelancer;
        uint256 stake;
    }

    mapping(uint256 => Job) public jobs;
    mapping(uint256 => mapping(uint256 => Milestone)) public jobMilestones;
    mapping(uint256 => Review) public reviews;
    mapping(uint256 => Application[]) public jobApplications;
    mapping(uint256 => mapping(address => bool)) public hasApplied;
    mapping(address => mapping(address => uint256)) public pendingRefunds; // user => token => amount
    
    uint256 public jobCount;
    uint256 public constant APPLICATION_STAKE_PERCENT = 5; 

    struct Review {
        uint8 rating; 
        string ipfsHash;
        address reviewer;
    }

    event JobCreated(uint256 indexed jobId, address indexed client, address indexed freelancer, uint256 amount, uint256 deadline);
    event JobApplied(uint256 indexed jobId, address indexed freelancer, uint256 stake);
    event FreelancerSelected(uint256 indexed jobId, address indexed freelancer);
    event JobAccepted(uint256 indexed jobId, address indexed freelancer, uint256 stake);
    event WorkSubmitted(uint256 indexed jobId, address indexed freelancer, string ipfsHash);
    event FundsReleased(uint256 indexed jobId, address indexed freelancer, uint256 amount, uint256 nftId);
    event MilestoneReleased(uint256 indexed jobId, uint256 indexed milestoneId, uint256 amount);
    event MilestonesDefined(uint256 indexed jobId, uint256[] amounts, string[] ipfsHashes);
    event JobCancelled(uint256 indexed jobId);
    event JobDisputed(uint256 indexed jobId);
    event DisputeRaised(uint256 indexed jobId, address indexed raiser);
    event Ruling(address indexed _arbitrator, uint256 indexed _disputeID, uint256 _ruling);
    event ReviewSubmitted(uint256 indexed jobId, address indexed reviewer, uint8 rating, string ipfsHash);
    event CCIPMessageReceived(bytes32 indexed messageId, uint64 indexed sourceChainSelector, address sender);
    event InsurancePaid(uint256 indexed jobId, uint256 amount);
    event RefundClaimed(address indexed user, address indexed token, uint256 indexed amount);
    event VaultUpdated(address indexed oldVault, address indexed newVault);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address initialOwner, 
        address trustedForwarder, 
        address _ccipRouter,
        address _insurancePool,
        address _lzEndpoint
    ) public initializer {
        __ERC721_init("FreelanceWork", "FWORK");
        __ERC721URIStorage_init();
        __ERC2981_init();
        __Ownable_init(initialOwner);
        __AccessControl_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        __OApp_init(_lzEndpoint);

        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(ARBITRATOR_ROLE, initialOwner);
        _grantRole(MANAGER_ROLE, initialOwner);

        arbitrator = initialOwner;
        _trustedForwarder = trustedForwarder;
        ccipRouter = _ccipRouter;
        insurancePool = _insurancePool;
        vault = initialOwner;
        platformFeeBps = 250; // 2.5% default
    }

    function setSBTContract(address _sbt) external onlyOwner {
        sbtContract = _sbt;
    }

    function setTokenWhitelist(address token, bool allowed) external onlyOwner {
        whitelistedTokens[token] = allowed;
    }

    function setInsurancePool(address _pool) external onlyOwner {
        insurancePool = _pool;
    }

    function setPolyToken(address _token) external onlyOwner {
        polyToken = _token;
    }

    function setVault(address _vault) external onlyOwner {
        if (_vault == address(0)) revert InvalidAddress();
        emit VaultUpdated(vault, _vault);
        vault = _vault;
    }

    function setPlatformFee(uint256 _bps) external onlyOwner {
        if (_bps > 1000) revert FeeTooHigh();
        platformFeeBps = _bps;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _contextSuffixLength() internal view virtual override(ContextUpgradeable) returns (uint256) {
        return 0;
    }

    function _msgSender() internal view virtual override(ContextUpgradeable) returns (address sender) {
        if (msg.sender == _trustedForwarder && _trustedForwarder != address(0)) {
             assembly { sender := shr(96, calldataload(sub(calldatasize(), 20))) }
        } else {
            return super._msgSender();
        }
    }
    
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function supportsInterface(bytes4 interfaceId) public view override(ERC721URIStorageUpgradeable, ERC2981Upgradeable, AccessControlUpgradeable) returns (bool) {
        return interfaceId == type(IAny2EVMMessageReceiver).interfaceId || super.supportsInterface(interfaceId);
    }

    function ccipReceive(Client.Any2EVMMessage calldata message) external override {
        if (msg.sender != ccipRouter) revert NotAuthorized();
        if (!allowlistedSourceChains[message.sourceChainSelector]) revert NotAuthorized();
        address sender = abi.decode(message.sender, (address));
        if (!allowlistedSenders[sender]) revert NotAuthorized();

        (address freelancer, string memory ipfsHash, uint256 deadline) = abi.decode(message.data, (address, string, uint256));
        address token = message.destTokenAmounts[0].token;
        uint256 amount = message.destTokenAmounts[0].amount;

        _createJobInternal(sender, freelancer, token, amount, ipfsHash, deadline);
        emit CCIPMessageReceived(message.messageId, message.sourceChainSelector, sender);
    }

    function _createJobInternal(
        address client,
        address freelancer,
        address token,
        uint256 amount,
        string memory _ipfsHash,
        uint256 deadline
    ) internal {
        if (freelancer != address(0) && freelancer == client) revert SelfHiring();

        jobCount++;
        jobs[jobCount] = Job({
            id: jobCount,
            client: client,
            freelancer: freelancer,
            token: token,
            amount: amount,
            freelancerStake: 0,
            totalPaidOut: 0,
            status: JobStatus.Created,
            ipfsHash: _ipfsHash,
            paid: false,
            deadline: deadline,
            milestoneCount: 0
        });

        emit JobCreated(jobCount, client, freelancer, amount, deadline);
    }

    function saveIPFSHash(uint256 jobId, string calldata ipfsHash) external {
        Job storage job = jobs[jobId];
        address sender = _msgSender();
        if (sender != job.client && sender != job.freelancer) revert NotAuthorized();
        job.ipfsHash = ipfsHash;
    }

    function createJob(
        address freelancer, 
        address token, 
        uint256 amount, 
        string memory _ipfsHash,
        uint256 durationDays
    ) external payable whenNotPaused nonReentrant {
        if (token != address(0)) {
            if (!whitelistedTokens[token]) revert TokenNotWhitelisted();
            IERC20(token).safeTransferFrom(_msgSender(), address(this), amount);
        } else {
            if (msg.value < amount) revert InsufficientPayment();
        }
        
        uint256 deadline = durationDays > 0 ? block.timestamp + (durationDays * 1 days) : 0;
        _createJobInternal(_msgSender(), freelancer, token, amount, _ipfsHash, deadline);
    }

    function createJobWithMilestones(
        address freelancer,
        address token,
        uint256 amount,
        string memory _ipfsHash,
        uint256[] memory milestoneAmounts,
        string[] memory milestoneIpfsHashes
    ) external payable whenNotPaused nonReentrant {
        uint256 totalMilestoneAmount = 0;
        uint256 len = milestoneAmounts.length;
        for (uint256 i = 0; i < len; ) {
            totalMilestoneAmount += milestoneAmounts[i];
            unchecked { ++i; }
        }
        if (totalMilestoneAmount != amount) revert InvalidAmount();

        if (token != address(0)) {
            if (!whitelistedTokens[token]) revert TokenNotWhitelisted();
            IERC20(token).safeTransferFrom(_msgSender(), address(this), amount);
        } else {
            if (msg.value < amount) revert InsufficientPayment();
        }

        uint256 deadline = 0; 
        _createJobInternal(_msgSender(), freelancer, token, amount, _ipfsHash, deadline);
        
        uint256 jobId = jobCount;
        jobs[jobId].milestoneCount = len;
        for (uint256 i = 0; i < len; ) {
            jobMilestones[jobId][i] = Milestone({
                amount: milestoneAmounts[i],
                ipfsHash: milestoneIpfsHashes[i],
                isReleased: false
            });
            unchecked { ++i; }
        }
        emit MilestonesDefined(jobId, milestoneAmounts, milestoneIpfsHashes);
    }

    /**
     * @dev Freelancers apply for a job by providing a small stake.
     * Prevents spam and ensures commitment.
     */
    function applyForJob(uint256 jobId) external payable nonReentrant {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Created) revert InvalidStatus();
        if (job.freelancer != address(0)) revert JobAlreadyAssigned();
        address sender = _msgSender();
        if (sender == job.client) revert NotAuthorized();
        if (hasApplied[jobId][sender]) revert AlreadyApplied();

        uint256 stake = (job.amount * APPLICATION_STAKE_PERCENT) / 100;
        if (job.token != address(0)) {
            IERC20(job.token).safeTransferFrom(sender, address(this), stake);
        } else {
            if (msg.value < stake) revert InsufficientStake();
        }

        jobApplications[jobId].push(Application({
            freelancer: sender,
            stake: stake
        }));
        hasApplied[jobId][sender] = true;

        emit JobApplied(jobId, sender, stake);
    }

    /**
     * @dev Client picks a freelancer from the applicants.
     * Unselected applicants get their stake refunded.
     */
    function pickFreelancer(uint256 jobId, address freelancer) external whenNotPaused nonReentrant {
        Job storage job = jobs[jobId];
        if (_msgSender() != job.client) revert NotAuthorized();
        if (job.status != JobStatus.Created) revert InvalidStatus();
        if (job.freelancer != address(0)) revert JobAlreadyAssigned();
        if (!hasApplied[jobId][freelancer]) revert NotAuthorized();

        job.freelancer = freelancer;
        job.status = JobStatus.Accepted;

        Application[] storage apps = jobApplications[jobId];
        uint256 len = apps.length;
        for (uint256 i = 0; i < len; ) {
            if (apps[i].freelancer == freelancer) {
                job.freelancerStake = apps[i].stake;
            } else {
                pendingRefunds[apps[i].freelancer][job.token] += apps[i].stake;
            }
            unchecked { ++i; }
        }

        emit FreelancerSelected(jobId, freelancer);
        emit JobAccepted(jobId, freelancer, job.freelancerStake);
    }

    function claimRefund(address token) external nonReentrant {
        uint256 amount = pendingRefunds[_msgSender()][token];
        if (amount == 0) revert NoRefundAvailable();

        pendingRefunds[_msgSender()][token] = 0;
        _sendFunds(_msgSender(), token, amount);

        emit RefundClaimed(_msgSender(), token, amount);
    }

    function releaseFunds(uint256 jobId) external whenNotPaused nonReentrant {
        Job storage job = jobs[jobId];
        if (_msgSender() != job.client) revert NotAuthorized();
        if (job.status != JobStatus.Ongoing && job.status != JobStatus.Accepted) revert InvalidStatus();
        if (job.paid) revert AlreadyPaid();

        job.paid = true;
        job.status = JobStatus.Completed;

        uint256 insuranceFee = (job.amount * INSURANCE_FEE_BPS) / 10000;
        uint256 platformFee = (job.amount * platformFeeBps) / 10000;
        uint256 remainingAmount = job.amount - job.totalPaidOut - insuranceFee - platformFee;
        uint256 totalPayout = remainingAmount + job.freelancerStake;

        if (insuranceFee > 0 && insurancePool != address(0)) {
            if (job.token == address(0)) {
                IInsurancePool(insurancePool).depositNative{value: insuranceFee}();
            } else {
                IERC20(job.token).safeIncreaseAllowance(insurancePool, insuranceFee);
                IInsurancePool(insurancePool).deposit(job.token, insuranceFee);
            }
            emit InsurancePaid(jobId, insuranceFee);
        }

        if (platformFee > 0 && vault != address(0)) {
            _sendFunds(vault, job.token, platformFee);
        }

        if (totalPayout > 0) {
            _sendFunds(job.freelancer, job.token, totalPayout);
        }

        uint256 tokenId = _nextTokenId++;
        _safeMint(job.freelancer, tokenId);
        _setTokenURI(tokenId, job.ipfsHash);
        
        _rewardParties(jobId);

        emit FundsReleased(jobId, job.freelancer, totalPayout, tokenId);
    }

    function releaseMilestone(uint256 jobId, uint256 milestoneId) external whenNotPaused nonReentrant {
        Job storage job = jobs[jobId];
        if (_msgSender() != job.client) revert NotAuthorized();
        if (milestoneId >= job.milestoneCount) revert InvalidMilestone();
        
        Milestone storage m = jobMilestones[jobId][milestoneId];
        if (m.isReleased) revert MilestoneAlreadyReleased();

        m.isReleased = true;
        job.totalPaidOut += m.amount;

        _sendFunds(job.freelancer, job.token, m.amount);
        emit MilestoneReleased(jobId, milestoneId, m.amount);
    }

    function acceptJob(uint256 jobId) external payable nonReentrant {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Created) revert InvalidStatus();
        if (job.freelancer == address(0)) revert InvalidStatus();
        address sender = _msgSender();
        if (sender != job.freelancer) revert NotAuthorized();

        uint256 stake = (job.amount * FREELANCER_STAKE_PERCENT) / 100;
        if (job.token != address(0)) {
            IERC20(job.token).safeTransferFrom(sender, address(this), stake);
        } else {
            if (msg.value < stake) revert InsufficientStake();
        }

        job.freelancerStake = stake;
        job.status = JobStatus.Accepted;
        emit JobAccepted(jobId, _msgSender(), stake);
    }

    function submitWork(uint256 jobId, string calldata ipfsHash) external nonReentrant {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Accepted) revert InvalidStatus();
        address sender = _msgSender();
        if (sender != job.freelancer) revert NotAuthorized();

        job.ipfsHash = ipfsHash;
        job.status = JobStatus.Ongoing;
        emit WorkSubmitted(jobId, sender, ipfsHash);
    }

    function dispute(uint256 jobId) external payable nonReentrant {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Ongoing && job.status != JobStatus.Accepted) revert InvalidStatus();
        address sender = _msgSender();
        if (sender != job.client && sender != job.freelancer) revert NotAuthorized();

        job.status = JobStatus.Arbitration;
        emit DisputeRaised(jobId, _msgSender());
    }

    function resolveDispute(uint256 jobId, address winner, uint256 freelancerPayout) external onlyOwner nonReentrant {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Arbitration) revert InvalidStatus();

        job.paid = true;
        job.status = JobStatus.Completed;

        _sendFunds(winner, job.token, freelancerPayout);
        
        // Refund remaining to client if any
        uint256 totalEscrow = job.amount + job.freelancerStake;
        if (totalEscrow > freelancerPayout) {
            _sendFunds(job.client, job.token, totalEscrow - freelancerPayout);
        }

        emit FundsReleased(jobId, winner, freelancerPayout, 0); // Simplified
    }

    function submitReview(uint256 jobId, uint8 rating, string calldata ipfsHash) external nonReentrant {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Completed) revert InvalidStatus();
        if (_msgSender() != job.client) revert NotAuthorized();
        if (rating < 1 || rating > 5) revert InvalidRating();

        reviews[jobId] = Review({
            rating: rating,
            ipfsHash: ipfsHash,
            reviewer: _msgSender()
        });

        if (sbtContract != address(0)) {
            IFreelanceSBT(sbtContract).safeMint(job.freelancer, ipfsHash);
        }
        emit ReviewSubmitted(jobId, _msgSender(), rating, ipfsHash);
    }

    function rule(uint256 _disputeID, uint256 _ruling) external nonReentrant {
        if (msg.sender != arbitrator) revert NotAuthorized();
        uint256 jobId = disputeIdToJobId[_disputeID];
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Disputed) revert InvalidStatus();

        job.paid = true;
        if (_ruling == 1) { // Refund Client
            job.status = JobStatus.Cancelled;
            _sendFunds(job.client, job.token, job.amount + job.freelancerStake);
        } else { // Pay Freelancer
            job.status = JobStatus.Completed;
            _sendFunds(job.freelancer, job.token, job.amount + job.freelancerStake);
            _rewardParties(jobId);
        }
        emit Ruling(msg.sender, _disputeID, _ruling);
    }

    function _sendFunds(address to, address token, uint256 amount) internal {
        if (token == address(0)) {
            (bool success, ) = payable(to).call{value: amount}("");
            if (!success) revert TransferFailed();
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    function _rewardParties(uint256 jobId) internal {
        if (polyToken == address(0)) return;
        Job storage job = jobs[jobId];
        try IPolyToken(polyToken).mint(job.freelancer, REWARD_AMOUNT) {} catch {}
        try IPolyToken(polyToken).mint(job.client, REWARD_AMOUNT / 2) {} catch {}
    }

    /**
     * @dev Allows the client to reclaim funds if the job deadline is passed 
     * and no freelancer was assigned or they failed to submit work.
     */
    function refundExpiredJob(uint256 jobId) external nonReentrant {
        Job storage job = jobs[jobId];
        if (job.client != _msgSender()) revert NotAuthorized();
        if (job.deadline == 0 || block.timestamp <= job.deadline) revert DeadlineNotPassed();
        if (job.status != JobStatus.Created && job.status != JobStatus.Accepted) revert InvalidStatus();
        if (job.paid) revert AlreadyPaid();

        job.paid = true;
        job.status = JobStatus.Cancelled;

        uint256 totalRefund = job.amount;
        _sendFunds(job.client, job.token, totalRefund);

        // Also refund freelancer stake if they accepted but failed to finish
        if (job.freelancerStake > 0 && job.freelancer != address(0)) {
            _sendFunds(job.freelancer, job.token, job.freelancerStake);
        }

        emit JobCancelled(jobId);
    }

    mapping(uint256 => uint256) public disputeIdToJobId;
}
