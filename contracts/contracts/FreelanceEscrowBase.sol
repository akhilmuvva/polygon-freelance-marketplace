// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./ReentrancyGuardUpgradeable.sol";
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
        // SLOT 1: Address(20) + uint32(4) + uint48(6) + uint16(2) = 32 bytes
        address client;
        uint32 id;
        uint48 deadline;
        uint16 categoryId;

        // SLOT 2: Address(20) + uint16(2) + JobStatus(1) + uint8(1) + bool(1) + Strategy(1) = 26 bytes
        address freelancer;
        uint16 milestoneCount;
        JobStatus status;
        bool paid;
        bool zkRequired;
        IYieldManager.Strategy yieldStrategy;
        uint8 rating;

        // SLOT 3: Address(20) + (12 bytes padding)
        address token;

        // SLOTS 4-6: uint256 take full slots
        uint256 amount;
        uint256 freelancerStake;
        uint256 totalPaidOut;

        // SLOT 7: string (dynamic pointer)
        string ipfsHash;
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
    /// @notice The "Economic Friction" coefficient pulling against sovereign flow.
    uint256 public gravityFactor;

    uint256 public reputationThreshold;

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
    /// @dev frictionLevel replaces generic disputeStatus — reflects the Antigravity philosophy.
    error FrictionLevelNotDisputed();
    error ProtocolEntropyDetected();

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Upgradeable, AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    event JobCreated(uint256 indexed jobId, address indexed client, address indexed freelancer, uint256 amount, uint256 deadline, uint256 timestamp);
    event FundsReleased(uint256 indexed jobId, address indexed freelancer, uint256 amount, uint256 nftId, uint256 timestamp);
    event MilestoneReleased(uint256 indexed jobId, address indexed freelancer, uint256 indexed milestoneId, uint256 amount, uint256 timestamp);
    event DisputeRaised(uint256 indexed jobId, uint256 disputeId, uint256 timestamp);
    event DisputeResolved(uint256 indexed jobId, uint256 freelancerBps, uint256 timestamp);
    event ReviewSubmitted(uint256 indexed jobId, address indexed client, address indexed freelancer, uint8 rating, string review, uint256 timestamp);
    event WorkSubmitted(uint256 indexed jobId, address indexed freelancer, string ipfsHash, uint256 timestamp);
    event TreasuryRebalanced(address indexed token, uint256 amount, IYieldManager.Strategy from, IYieldManager.Strategy to, uint256 timestamp);
    event FeeAdjusted(uint256 newBps, uint256 timestamp);

    /**
     * @notice ERC-7201 storage gap. Prevents storage slot collision when new
     *         state variables are added to this base contract in future upgrades.
     * @dev    Standard 50-slot gap as recommended by OpenZeppelin for UUPS patterns.
     *         MUST remain the last variable declaration in this contract.
     */
    uint256[50] private __gap;
}
