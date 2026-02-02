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

    struct Job {
        address client;          
        uint32 id;               
        uint48 deadline;         
        JobStatus status;        
        uint8 rating;            
        address freelancer;      
        uint16 categoryId;       
        uint16 milestoneCount;   
        bool paid;               
        address token;           
        uint256 amount;
        uint256 freelancerStake;
        uint256 totalPaidOut;
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

    address public arbitrator;
    address public sbtContract;
    address internal _trustedForwarder; 
    address public entryPoint;
    address public vault;
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
    event ReviewSubmitted(uint256 indexed jobId, address indexed client, address indexed freelancer, uint8 rating, string review);
}
