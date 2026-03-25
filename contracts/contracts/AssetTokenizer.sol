// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface AggregatorV3Interface {
  function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

/**
 * @title AssetTokenizer
 * @notice Tokenizes real-world assets (invoices, IP rights, revenue shares) as fractional ERC-1155 tokens
 * @dev Supports fractional ownership, automated distributions, and oracle-verified milestone releases
 */
contract AssetTokenizer is 
    Initializable,
    ERC1155Upgradeable,
    AccessControlUpgradeable,
    ReentrancyGuard,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    bytes32 public constant TOKENIZER_ROLE = keccak256("TOKENIZER_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    enum AssetType { INVOICE, IP_RIGHTS, REVENUE_SHARE, FUTURE_EARNINGS, PHYSICAL_ASSET }
    enum AssetStatus { PENDING, ACTIVE, COMPLETED, DEFAULTED, DISPUTED }

    /**
     * @notice Structure representing a tokenized real-world asset
     */
    struct RWAToken {
        uint256 tokenId;              // Unique token identifier
        AssetType assetType;          // Type of asset being tokenized
        AssetStatus status;           // Current status of the asset
        address issuer;               // Entity that created/tokenized the asset
        address paymentToken;         // ERC20 token for payments (address(0) for native)
        uint256 totalValue;           // Total value of the asset
        uint256 totalSupply;          // Total fractional tokens issued
        uint256 maturityDate;         // When the asset matures/completes
        uint256 distributedValue;     // Total value already distributed
        string metadataURI;           // IPFS hash with asset documentation
        bytes32 legalHash;            // Hash of legal agreement
        bool isVerified;              // Oracle/Kleros verification status
        uint256 milestoneCount;       // Number of milestones for this asset
    }

    /**
     * @notice Milestone structure for progressive value release
     */
    struct Milestone {
        uint256 assetId;              // Associated asset token ID
        uint256 milestoneId;          // Sequential milestone identifier
        string description;           // Milestone description
        uint256 valueToRelease;       // Amount to release upon completion
        uint256 deadline;             // Expected completion timestamp
        bool isCompleted;             // Completion status
        bool isVerified;              // Oracle/Kleros verification
        address verifier;             // Address that verified completion
        bytes32 proofHash;            // IPFS hash of completion proof
    }

    // State variables
    uint256 public nextTokenId;
    uint256 public platformFeeBps;  // Platform fee in basis points (100 = 1%)
    address public feeCollector;
    address public klerosArbitrator;
    address public aiOracle;
    address public priceFeed;

    mapping(uint256 => RWAToken) public rwaTokens;
    mapping(uint256 => mapping(uint256 => Milestone)) public milestones;
    mapping(uint256 => uint256) public claimableRewards; // tokenId => total claimable
    mapping(uint256 => mapping(address => uint256)) public userClaims; // tokenId => user => claimed amount
    
    error ZeroValue();
    error ZeroSupply();
    error InvalidMaturity();
    error NotIssuer();
    error AlreadyVerified();
    error IncorrectValue();
    error FeeTransferFailed();
    error NoTokensHeld();
    error NothingToClaim();
    error TransferFailed();
    error Unauthorized();
    error InvalidAssetStatus();

    // Events
    event AssetTokenized(
        uint256 indexed tokenId,
        AssetType assetType,
        address indexed issuer,
        uint256 totalValue,
        uint256 totalSupply,
        uint256 timestamp
    );
    event MilestoneCreated(uint256 indexed assetId, uint256 indexed milestoneId, uint256 valueToRelease, uint256 timestamp);
    event MilestoneCompleted(uint256 indexed assetId, uint256 indexed milestoneId, address verifier, uint256 timestamp);
    event ValueDistributed(uint256 indexed tokenId, uint256 amount, uint256 timestamp);
    event RewardsClaimed(uint256 indexed tokenId, address indexed holder, uint256 amount, uint256 timestamp);
    event AssetVerified(uint256 indexed tokenId, address indexed verifier, uint256 timestamp);
    event AssetStatusChanged(uint256 indexed tokenId, AssetStatus newStatus, uint256 timestamp);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the AssetTokenizer contract
     * @param _uri Base URI for token metadata
     * @param _feeCollector Address to receive platform fees
     * @param _platformFeeBps Platform fee in basis points
     */
    function initialize(
        string memory _uri,
        address _feeCollector,
        uint256 _platformFeeBps
    ) public initializer {
        __ERC1155_init(_uri);
        __AccessControl_init();



        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TOKENIZER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        feeCollector = _feeCollector;
        platformFeeBps = _platformFeeBps;
        nextTokenId = 1;
    }

    /**
     * @notice Tokenizes a real-world asset as fractional ERC-1155 tokens
     * @param assetType Type of asset being tokenized
     * @param paymentToken Token used for payments (address(0) for native)
     * @param totalValue Total value of the asset
     * @param totalSupply Number of fractional tokens to mint
     * @param maturityDate When the asset matures
     * @param metadataURI IPFS hash with asset documentation
     * @param legalHash Hash of the legal agreement
     * @return tokenId The newly created token ID
     */
    function tokenizeAsset(
        AssetType assetType,
        address paymentToken,
        uint256 totalValue,
        uint256 totalSupply,
        uint256 maturityDate,
        string calldata metadataURI,
        bytes32 legalHash
    ) external nonReentrant returns (uint256 tokenId) {
        if (totalValue == 0) revert ZeroValue();
        if (totalSupply == 0) revert ZeroSupply();
        if (maturityDate <= block.timestamp) revert InvalidMaturity();

        tokenId = nextTokenId++;

        rwaTokens[tokenId] = RWAToken({
            tokenId: tokenId,
            assetType: assetType,
            status: AssetStatus.PENDING,
            issuer: msg.sender,
            paymentToken: paymentToken,
            totalValue: totalValue,
            totalSupply: totalSupply,
            maturityDate: maturityDate,
            distributedValue: 0,
            metadataURI: metadataURI,
            legalHash: legalHash,
            isVerified: false,
            milestoneCount: 0
        });

        // Mint fractional tokens to issuer
        _mint(msg.sender, tokenId, totalSupply, "");

        emit AssetTokenized(tokenId, assetType, msg.sender, totalValue, totalSupply, block.timestamp);
    }

    /**
     * @notice Creates a milestone for progressive value release
     * @param assetId The asset token ID
     * @param description Milestone description
     * @param valueToRelease Amount to release upon completion
     * @param deadline Expected completion timestamp
     */
    function createMilestone(
        uint256 assetId,
        string calldata description,
        uint256 valueToRelease,
        uint256 deadline
    ) external {
        RWAToken storage asset = rwaTokens[assetId];
        if (msg.sender != asset.issuer) revert NotIssuer();
        if (asset.status != AssetStatus.PENDING && asset.status != AssetStatus.ACTIVE) revert InvalidAssetStatus();
        if (valueToRelease == 0) revert ZeroValue();

        uint256 milestoneId = asset.milestoneCount++;

        milestones[assetId][milestoneId] = Milestone({
            assetId: assetId,
            milestoneId: milestoneId,
            description: description,
            valueToRelease: valueToRelease,
            deadline: deadline,
            isCompleted: false,
            isVerified: false,
            verifier: address(0),
            proofHash: bytes32(0)
        });

        emit MilestoneCreated(assetId, milestoneId, valueToRelease, block.timestamp);
    }

    /**
     * @notice Verifies milestone completion (callable by oracle or Kleros)
     * @param assetId The asset token ID
     * @param milestoneId The milestone identifier
     * @param proofHash IPFS hash of completion proof
     */
    function verifyMilestone(
        uint256 assetId,
        uint256 milestoneId,
        bytes32 proofHash
    ) external {
        if (!hasRole(ORACLE_ROLE, msg.sender) && msg.sender != klerosArbitrator && msg.sender != aiOracle) revert Unauthorized();

        Milestone storage milestone = milestones[assetId][milestoneId];
        if (milestone.isVerified) revert AlreadyVerified();

        milestone.isCompleted = true;
        milestone.isVerified = true;
        milestone.verifier = msg.sender;
        milestone.proofHash = proofHash;

        // Make value claimable for token holders
        claimableRewards[assetId] += milestone.valueToRelease;

        emit MilestoneCompleted(assetId, milestoneId, msg.sender, block.timestamp);
    }

    /**
     * @notice Distributes value to token holders (callable by issuer after funding)
     * @param assetId The asset token ID
     * @param amount Amount to distribute
     */
    function fundAsset(uint256 assetId, uint256 amount) external payable nonReentrant {
        RWAToken storage asset = rwaTokens[assetId];
        if (msg.sender != asset.issuer) revert NotIssuer();
        if (amount == 0) revert ZeroValue();

        if (asset.paymentToken == address(0)) {
            if (msg.value != amount) revert IncorrectValue();
        } else {
            IERC20(asset.paymentToken).safeTransferFrom(msg.sender, address(this), amount);
        }

        // Deduct platform fee
        uint256 fee = (amount * platformFeeBps) / 10000;
        uint256 netAmount = amount - fee;

        if (fee > 0) {
            if (asset.paymentToken == address(0)) {
                (bool success, ) = payable(feeCollector).call{value: fee}("");
                if (!success) revert FeeTransferFailed();
            } else {
                IERC20(asset.paymentToken).safeTransfer(feeCollector, fee);
            }
        }

        claimableRewards[assetId] += netAmount;
        asset.distributedValue += netAmount;

        emit ValueDistributed(assetId, netAmount, block.timestamp);
    }

    /**
     * @notice Allows token holders to claim their proportional share of distributed value
     * @param assetId The asset token ID
     */
    function claimRewards(uint256 assetId) external nonReentrant {
        RWAToken storage asset = rwaTokens[assetId];
        uint256 holderBalance = balanceOf(msg.sender, assetId);
        if (holderBalance == 0) revert NoTokensHeld();

        uint256 totalClaimable = claimableRewards[assetId];
        uint256 userShare = (totalClaimable * holderBalance) / asset.totalSupply;
        uint256 alreadyClaimed = userClaims[assetId][msg.sender];
        uint256 toClaim = userShare - alreadyClaimed;

        if (toClaim == 0) revert NothingToClaim();

        userClaims[assetId][msg.sender] += toClaim;

        if (asset.paymentToken == address(0)) {
            (bool success, ) = payable(msg.sender).call{value: toClaim}("");
            if (!success) revert TransferFailed();
        } else {
            IERC20(asset.paymentToken).safeTransfer(msg.sender, toClaim);
        }

        emit RewardsClaimed(assetId, msg.sender, toClaim, block.timestamp);
    }

    /**
     * @notice Verifies an asset (by oracle or admin)
     * @param assetId The asset token ID
     */
    function verifyAsset(uint256 assetId) external {
        if (!hasRole(ORACLE_ROLE, msg.sender) && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) revert Unauthorized();

        RWAToken storage asset = rwaTokens[assetId];
        asset.isVerified = true;
        asset.status = AssetStatus.ACTIVE;

        emit AssetVerified(assetId, msg.sender, block.timestamp);
        emit AssetStatusChanged(assetId, AssetStatus.ACTIVE, block.timestamp);
    }

    /**
     * @notice Updates asset status
     * @param assetId The asset token ID
     * @param newStatus New status
     */
    function updateAssetStatus(uint256 assetId, AssetStatus newStatus) external {
        RWAToken storage asset = rwaTokens[assetId];
        if (msg.sender != asset.issuer && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) revert Unauthorized();

        asset.status = newStatus;
        emit AssetStatusChanged(assetId, newStatus, block.timestamp);
    }

    /**
     * @notice Sets the Kleros arbitrator address
     * @param _arbitrator Kleros arbitrator contract
     */
    function setKlerosArbitrator(address _arbitrator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        klerosArbitrator = _arbitrator;
    }

    /**
     * @notice Sets the AI oracle address
     * @param _oracle AI oracle contract
     */
    function setAIOracle(address _oracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        aiOracle = _oracle;
    }

    function setPriceFeed(address _feed) external onlyRole(DEFAULT_ADMIN_ROLE) {
        priceFeed = _feed;
    }

    function getInvoiceValueInUSD(uint256 amount, address feed) public view returns (uint256) {
        (, int256 price, , , ) = AggregatorV3Interface(feed).latestRoundData();
        return (uint256(price) * amount) / 1e8;
    }

    /**
     * @notice Returns claimable amount for a specific holder
     * @param assetId The asset token ID
     * @param holder Address of the token holder
     */
    function getClaimableAmount(uint256 assetId, address holder) external view returns (uint256) {
        RWAToken storage asset = rwaTokens[assetId];
        uint256 holderBalance = balanceOf(holder, assetId);
        if (holderBalance == 0) return 0;

        uint256 totalClaimable = claimableRewards[assetId];
        uint256 userShare = (totalClaimable * holderBalance) / asset.totalSupply;
        uint256 alreadyClaimed = userClaims[assetId][holder];
        
        return userShare > alreadyClaimed ? userShare - alreadyClaimed : 0;
    }

    /**
     * @notice Returns asset details
     * @param assetId The asset token ID
     */
    function getAssetDetails(uint256 assetId) external view returns (RWAToken memory) {
        return rwaTokens[assetId];
    }

    /**
     * @notice Returns milestone details
     * @param assetId The asset token ID
     * @param milestoneId The milestone identifier
     */
    function getMilestone(uint256 assetId, uint256 milestoneId) external view returns (Milestone memory) {
        return milestones[assetId][milestoneId];
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        return rwaTokens[tokenId].metadataURI;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
