// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

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
    ReentrancyGuardUpgradeable, 
    UUPSUpgradeable,
    IAny2EVMMessageReceiver,
    OApp
{
    uint256 private _nextTokenId;

    address public arbitrator;
    address private _trustedForwarder; 
    address public ccipRouter; 
    address public insurancePool;
    address public polyToken;
    address public sbtContract;
    uint256 public constant REWARD_AMOUNT = 100 * 10**18;
    
    mapping(address => bool) public whitelistedTokens;
    
    uint256 public constant FREELANCER_STAKE_PERCENT = 10; 
    uint256 public constant INSURANCE_FEE_BPS = 100; // 1%

    mapping(uint64 => bool) public allowlistedSourceChains;
    mapping(address => bool) public allowlistedSenders;

    enum JobStatus { Created, Accepted, Ongoing, Disputed, Completed, Cancelled }

    struct Milestone {
        uint256 amount;
        string description;
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
        string resultUri;
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
    
    uint256 public jobCount;
    uint256 public constant APPLICATION_STAKE_PERCENT = 5; 

    struct Review {
        uint8 rating; 
        string comment;
        address reviewer;
    }

    event JobCreated(uint256 indexed jobId, address indexed client, address indexed freelancer, uint256 amount, uint256 deadline);
    event JobApplied(uint256 indexed jobId, address indexed freelancer, uint256 stake);
    event FreelancerSelected(uint256 indexed jobId, address indexed freelancer);
    event JobAccepted(uint256 indexed jobId, address indexed freelancer, uint256 stake);
    event WorkSubmitted(uint256 indexed jobId, string resultUri);
    event FundsReleased(uint256 indexed jobId, address indexed freelancer, uint256 amount, uint256 nftId);
    event JobCancelled(uint256 indexed jobId);
    event JobDisputed(uint256 indexed jobId);
    event Ruling(address indexed _arbitrator, uint256 indexed _disputeID, uint256 _ruling);
    event CCIPMessageReceived(bytes32 indexed messageId, uint64 indexed sourceChainSelector, address sender);
    event InsurancePaid(uint256 indexed jobId, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address _lzEndpoint) OApp(_lzEndpoint) {
        _disableInitializers();
    }

    function initialize(
        address initialOwner, 
        address trustedForwarder, 
        address _ccipRouter,
        address _insurancePool
    ) public initializer {
        __ERC721_init("FreelanceWork", "FWORK");
        __ERC721URIStorage_init();
        __ERC2981_init();
        __Ownable_init(initialOwner);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        arbitrator = initialOwner;
        _trustedForwarder = trustedForwarder;
        ccipRouter = _ccipRouter;
        insurancePool = _insurancePool;
        
        whitelistedTokens[address(0)] = true; 
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

    function supportsInterface(bytes4 interfaceId) public view override(ERC721URIStorageUpgradeable, ERC2981Upgradeable) returns (bool) {
        return interfaceId == type(IAny2EVMMessageReceiver).interfaceId || super.supportsInterface(interfaceId);
    }

    function ccipReceive(Client.Any2EVMMessage calldata message) external override {
        require(msg.sender == ccipRouter, "Not router");
        require(allowlistedSourceChains[message.sourceChainSelector], "Chain not allowed");
        address sender = abi.decode(message.sender, (address));
        require(allowlistedSenders[sender], "Sender not allowed");

        (address freelancer, string memory metadataUri, uint256 deadline) = abi.decode(message.data, (address, string, uint256));
        address token = message.destTokenAmounts[0].token;
        uint256 amount = message.destTokenAmounts[0].amount;

        _createJobInternal(sender, freelancer, token, amount, metadataUri, deadline);
        emit CCIPMessageReceived(message.messageId, message.sourceChainSelector, sender);
    }

    function _createJobInternal(
        address client,
        address freelancer,
        address token,
        uint256 amount,
        string memory _initialMetadataUri,
        uint256 deadline
    ) internal {
        require(freelancer == address(0) || freelancer != client, "Self-hiring");

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
            resultUri: _initialMetadataUri,
            paid: false,
            deadline: deadline,
            milestoneCount: 0
        });

        emit JobCreated(jobCount, client, freelancer, amount, deadline);
    }

    function createJob(
        address freelancer, 
        address token, 
        uint256 amount, 
        string memory _initialMetadataUri,
        uint256 durationDays
    ) external payable nonReentrant {
        require(whitelistedTokens[token], "Token not whitelisted");
        address sender = _msgSender();
        if (token == address(0)) {
            require(msg.value == amount, "Amount mismatch");
        } else {
            IERC20(token).transferFrom(sender, address(this), amount);
        }

        uint256 deadline = durationDays > 0 ? block.timestamp + (durationDays * 1 days) : 0;
        _createJobInternal(sender, freelancer, token, amount, _initialMetadataUri, deadline);
    }

    /**
     * @dev Freelancers apply for a job by providing a small stake.
     * Prevents spam and ensures commitment.
     */
    function applyForJob(uint256 jobId) external payable nonReentrant {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Created, "Not in application phase");
        require(job.freelancer == address(0), "Job already assigned");
        require(_msgSender() != job.client, "Client cannot apply");
        require(!hasApplied[jobId][_msgSender()], "Already applied");

        uint256 stake = (job.amount * APPLICATION_STAKE_PERCENT) / 100;
        if (job.token == address(0)) {
            require(msg.value == stake, "Incorrect native stake");
        } else {
            IERC20(job.token).transferFrom(_msgSender(), address(this), stake);
        }

        jobApplications[jobId].push(Application({
            freelancer: _msgSender(),
            stake: stake
        }));
        hasApplied[jobId][_msgSender()] = true;

        emit JobApplied(jobId, _msgSender(), stake);
    }

    /**
     * @dev Client picks a freelancer from the applicants.
     * Unselected applicants get their stake refunded.
     */
    function pickFreelancer(uint256 jobId, address freelancer) external nonReentrant {
        Job storage job = jobs[jobId];
        require(_msgSender() == job.client, "Only client can pick");
        require(job.status == JobStatus.Created, "Invalid status");
        require(job.freelancer == address(0), "Already assigned");
        require(hasApplied[jobId][freelancer], "Freelancer didn't apply");

        job.freelancer = freelancer;
        job.status = JobStatus.Accepted;

        Application[] storage apps = jobApplications[jobId];
        for (uint256 i = 0; i < apps.length; i++) {
            if (apps[i].freelancer == freelancer) {
                job.freelancerStake = apps[i].stake;
            } else {
                _sendFunds(apps[i].freelancer, job.token, apps[i].stake);
            }
        }

        emit FreelancerSelected(jobId, freelancer);
        emit JobAccepted(jobId, freelancer, job.freelancerStake);
    }

    function releaseFunds(uint256 jobId) external nonReentrant {
        Job storage job = jobs[jobId];
        require(_msgSender() == job.client, "Not client");
        require(job.status == JobStatus.Ongoing || job.status == JobStatus.Accepted, "Invalid status");
        require(!job.paid, "Paid");

        job.paid = true;
        job.status = JobStatus.Completed;

        uint256 insuranceFee = (job.amount * INSURANCE_FEE_BPS) / 10000;
        uint256 remainingAmount = job.amount - job.totalPaidOut - insuranceFee;
        uint256 totalPayout = remainingAmount + job.freelancerStake;

        if (insuranceFee > 0 && insurancePool != address(0)) {
            if (job.token == address(0)) {
                payable(insurancePool).transfer(insuranceFee);
            } else {
                IERC20(job.token).transfer(insurancePool, insuranceFee);
            }
            emit InsurancePaid(jobId, insuranceFee);
        }

        if (totalPayout > 0) {
            if (job.token == address(0)) {
                payable(job.freelancer).transfer(totalPayout);
            } else {
                IERC20(job.token).transfer(job.freelancer, totalPayout);
            }
        }

        uint256 tokenId = _nextTokenId++;
        _safeMint(job.freelancer, tokenId);
        _setTokenURI(tokenId, job.resultUri);

        emit FundsReleased(jobId, job.freelancer, totalPayout, tokenId);
    }

    function acceptJob(uint256 jobId) external payable nonReentrant {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Created, "Not created");
        require(job.freelancer != address(0), "No freelancer assigned");
        require(_msgSender() == job.freelancer, "Not freelancer");

        uint256 stake = (job.amount * FREELANCER_STAKE_PERCENT) / 100;
        if (job.token == address(0)) {
            require(msg.value == stake, "Stake mismatch");
        } else {
            IERC20(job.token).transferFrom(_msgSender(), address(this), stake);
        }

        job.freelancerStake = stake;
        job.status = JobStatus.Accepted;
        emit JobAccepted(jobId, _msgSender(), stake);
    }

    function submitWork(uint256 jobId, string calldata resultUri) external nonReentrant {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Accepted, "Not accepted");
        require(_msgSender() == job.freelancer, "Not freelancer");

        job.resultUri = resultUri;
        job.status = JobStatus.Ongoing;
        emit WorkSubmitted(jobId, resultUri);
    }

    function submitReview(uint256 jobId, uint8 rating, string calldata reviewUri) external nonReentrant {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Completed, "Job not completed");
        require(_msgSender() == job.client, "Only client can review");
        require(rating >= 1 && rating <= 5, "Invalid rating");

        reviews[jobId] = Review({
            rating: rating,
            comment: reviewUri,
            reviewer: _msgSender()
        });

        if (sbtContract != address(0)) {
            IFreelanceSBT(sbtContract).safeMint(job.freelancer, reviewUri);
        }
    }

    function rule(uint256 _disputeID, uint256 _ruling) external {
        require(msg.sender == arbitrator, "Only arbitrator");
        uint256 jobId = disputeIdToJobId[_disputeID];
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Disputed, "Not disputed");

        job.paid = true;
        if (_ruling == 1) { // Refund Client
            job.status = JobStatus.Cancelled;
            _sendFunds(job.client, job.token, job.amount + job.freelancerStake);
        } else { // Pay Freelancer
            job.status = JobStatus.Completed;
            _sendFunds(job.freelancer, job.token, job.amount + job.freelancerStake);
        }
        emit Ruling(msg.sender, _disputeID, _ruling);
    }

    function _sendFunds(address to, address token, uint256 amount) internal {
        if (token == address(0)) {
            payable(to).transfer(amount);
        } else {
            IERC20(token).transfer(to, amount);
        }
    }

    mapping(uint256 => uint256) public disputeIdToJobId;
}
