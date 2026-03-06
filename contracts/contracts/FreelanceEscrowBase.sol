// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./FreelanceEscrowLibrary.sol";

import "./IArbitrator.sol";

interface IYieldManager {
    enum Strategy { NONE, AAVE, COMPOUND, MORPHO }
    function deposit(Strategy strategy, address token, uint256 amount) external;
    function withdraw(Strategy strategy, address token, uint256 amount, address receiver) external;
}

interface ISwapManager {
    function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOutMin, address recipient) external payable returns (uint256);
}

/**
 * @title FreelanceEscrowBase
 * @notice Base storage and core structures for the PolyLance Escrow system.
 * @dev Contains state variables, structs, and common events used across the protocol.
 * Designed to be inherited by the main FreelanceEscrow logic contract.
 */
abstract contract FreelanceEscrowBase is 
    Initializable, 
    ERC721Upgradeable, 
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable, 
    UUPSUpgradeable
{
    enum JobStatus { Created, Accepted, Ongoing, Disputed, Arbitration, Completed, Cancelled }

    struct Milestone {
        uint256 amount;
        string ipfsHash;
        bool isReleased;
        bool isUpfront;
    }

    /**
     * @dev Structure representing a freelance job in the system.
     */
    struct Job {
        address client;          /// @dev The individual/entity creating the job
        uint32 id;               /// @dev Unique job identifier
        uint48 deadline;         /// @dev Unix timestamp for job deadline
        JobStatus status;        /// @dev Current status in the lifecycle
        uint8 rating;            /// @dev Rating given upon completion (0-5)
        address freelancer;      /// @dev The individual/entity performing the work
        uint16 categoryId;       /// @dev Job Category (Dev, Design, etc.)
        uint16 milestoneCount;   /// @dev Total number of milestones
        bool paid;               /// @dev Whether final payment has been processed
        IYieldManager.Strategy yieldStrategy; /// @dev Selected DeFi yield strategy
        address token;           /// @dev ERC20 token address (0 for native)
        uint256 amount;          /// @dev Total job budget/amount
        uint256 freelancerStake; /// @dev Amount staked by freelancer (anti-spam)
        uint256 totalPaidOut;    /// @dev Total amount released to freelancer so far
        string ipfsHash;         /// @dev IPFS hash for job details/work submission
    }

    struct Application {
        address freelancer;
        uint256 stake;
    }

    mapping(uint256 => Job) public jobs;
    mapping(uint256 => mapping(uint256 => Milestone)) public jobMilestones;
    mapping(uint256 => Application[]) public jobApplications;
    mapping(uint256 => mapping(address => bool)) public hasApplied;
    mapping(address => mapping(address => uint256)) public balances; 
    mapping(uint256 => uint256) public milestoneBitmask;
    mapping(uint256 => uint256) public disputeIdToJobId;
    
    uint256 public jobCount;
    uint256 public constant APPLICATION_STAKE_PERCENT = 5; 

    bytes32 public constant ARBITRATOR_ROLE = keccak256("ARBITRATOR_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");

    address public arbitrator;
    address public sbtContract;
    address internal _trustedForwarder; 
    address public entryPoint;
    address public vault;
    address public yieldManager;
    address public swapManager;
    uint256 public platformFeeBps;

    error NotAuthorized();
    error InvalidStatus();
    error AlreadyPaid();
    error MilestoneAlreadyReleased();
    error InvalidMilestone();
    error InvalidAddress();
    error LowStake();
    error LowValue();
    error TransferFailed();
    error TokenNotWhitelisted();

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Upgradeable, AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    event JobCreated(uint256 indexed jobId, address indexed client, address indexed freelancer, uint256 amount, uint256 deadline);
    event FundsReleased(uint256 indexed jobId, address indexed freelancer, uint256 amount, uint256 nftId);
    event MilestoneReleased(uint256 indexed jobId, address indexed freelancer, uint256 indexed milestoneId, uint256 amount);
    event DisputeRaised(uint256 indexed jobId, uint256 disputeId);
    event DisputeResolved(uint256 indexed jobId, uint256 freelancerBps);
    event ReviewSubmitted(uint256 indexed jobId, address indexed client, address indexed freelancer, uint8 rating, string review);
    event WorkSubmitted(uint256 indexed jobId, address indexed freelancer, string ipfsHash);
    event TreasuryRebalanced(address indexed token, uint256 amount, IYieldManager.Strategy from, IYieldManager.Strategy to);
    event FeeAdjusted(uint256 newBps);
}
