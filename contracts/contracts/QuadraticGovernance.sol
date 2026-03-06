// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/governance/GovernorUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorSettingsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorCountingSimpleUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesQuorumFractionUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

/**
 * @title QuadraticGovernance
 * @notice Advanced governance with quadratic voting and creator royalties
 * @dev Implements quadratic voting to reduce whale influence
 */
contract QuadraticGovernance is
    GovernorUpgradeable,
    GovernorSettingsUpgradeable,
    GovernorCountingSimpleUpgradeable,
    GovernorVotesUpgradeable,
    GovernorVotesQuorumFractionUpgradeable,
    UUPSUpgradeable,
    AccessControlUpgradeable
{
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");

    /// @notice Voting mechanism types
    enum VotingMechanism {
        LINEAR,         // Standard 1 token = 1 vote
        QUADRATIC,      // Square root of tokens
        REPUTATION      // Based on reputation score
    }

    /// @notice Proposal types
    enum ProposalType {
        STANDARD,           // Regular governance proposal
        TREASURY,           // Treasury fund allocation
        PROTOCOL_UPGRADE,   // Smart contract upgrade
        CATEGORY_ADDITION,  // Add new specialist category
        FEE_ADJUSTMENT,     // Platform fee changes
        CREATOR_GRANT       // Grant to content creators
    }

    /// @notice Proposal metadata
    struct ProposalMetadata {
        ProposalType proposalType;
        VotingMechanism votingMechanism;
        address proposer;
        uint256 createdAt;
        uint256 executedAt;
        uint256 totalVotingPower;
        bool isExecuted;
        string ipfsHash;  // Detailed proposal on IPFS
    }

    /// @notice Creator royalty configuration
    struct CreatorRoyalty {
        address creator;
        uint256 percentage;  // Basis points (100 = 1%)
        uint256 totalEarned;
        bool isActive;
    }

    // State variables
    mapping(uint256 => ProposalMetadata) public proposalMetadata;
    mapping(uint256 => mapping(address => uint256)) public quadraticVotes;
    mapping(address => CreatorRoyalty) public creatorRoyalties;
    mapping(address => uint256) public reputationScores;
    
    // Quadratic voting parameters
    uint256 public quadraticVotingMultiplier = 100; // 1.00x
    
    // Creator royalty pool
    uint256 public creatorRoyaltyPool;
    uint256 public totalRoyaltiesDistributed;

    // Events
    event ProposalCreatedWithMetadata(
        uint256 indexed proposalId,
        ProposalType proposalType,
        VotingMechanism votingMechanism,
        address indexed proposer
    );
    event QuadraticVoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        uint256 tokenAmount,
        uint256 votingPower
    );
    event CreatorRoyaltySet(address indexed creator, uint256 percentage);
    event CreatorRoyaltyPaid(address indexed creator, uint256 amount);
    event ReputationUpdated(address indexed user, uint256 newScore);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        IVotes _token,
        string memory _name
    ) public initializer {
        __Governor_init(_name);
        __GovernorSettings_init(
            1,      // 1 block voting delay
            50400,  // ~1 week voting period (assuming 12s blocks)
            0       // No proposal threshold initially
        );
        __GovernorCountingSimple_init();
        __GovernorVotes_init(_token);
        __GovernorVotesQuorumFraction_init(4); // 4% quorum

        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        _grantRole(PROPOSER_ROLE, msg.sender);
    }

    /**
     * @notice Create proposal with metadata
     * @param targets Target addresses
     * @param values ETH values
     * @param calldatas Function call data
     * @param description Proposal description
     * @param proposalType Type of proposal
     * @param votingMechanism Voting mechanism to use
     * @param ipfsHash IPFS hash of detailed proposal
     */
    function proposeWithMetadata(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        ProposalType proposalType,
        VotingMechanism votingMechanism,
        string memory ipfsHash
    ) public returns (uint256) {
        // Check if proposer has PROPOSER_ROLE or meets token threshold
        require(
            hasRole(PROPOSER_ROLE, msg.sender) || 
            getVotes(msg.sender, block.number - 1) >= proposalThreshold(),
            "Insufficient voting power"
        );

        uint256 proposalId = propose(targets, values, calldatas, description);

        proposalMetadata[proposalId] = ProposalMetadata({
            proposalType: proposalType,
            votingMechanism: votingMechanism,
            proposer: msg.sender,
            createdAt: block.timestamp,
            executedAt: 0,
            totalVotingPower: 0,
            isExecuted: false,
            ipfsHash: ipfsHash
        });

        emit ProposalCreatedWithMetadata(
            proposalId,
            proposalType,
            votingMechanism,
            msg.sender
        );

        return proposalId;
    }

    /**
     * @notice Cast vote with quadratic calculation
     * @param proposalId Proposal to vote on
     * @param support Vote direction (0=Against, 1=For, 2=Abstain)
     * @param tokenAmount Amount of tokens to use for voting
     */
    function castQuadraticVote(
        uint256 proposalId,
        uint8 support,
        uint256 tokenAmount
    ) external returns (uint256) {
        ProposalMetadata storage metadata = proposalMetadata[proposalId];
        require(metadata.votingMechanism == VotingMechanism.QUADRATIC, "Not quadratic voting");

        uint256 votingPower = _calculateQuadraticVotingPower(msg.sender, tokenAmount);
        
        quadraticVotes[proposalId][msg.sender] = votingPower;
        metadata.totalVotingPower += votingPower;

        emit QuadraticVoteCast(proposalId, msg.sender, tokenAmount, votingPower);

        return _castVote(proposalId, msg.sender, support, "");
    }

    /**
     * @notice Cast vote with reputation weighting
     * @param proposalId Proposal to vote on
     * @param support Vote direction
     */
    function castReputationVote(
        uint256 proposalId,
        uint8 support
    ) external returns (uint256) {
        ProposalMetadata storage metadata = proposalMetadata[proposalId];
        require(metadata.votingMechanism == VotingMechanism.REPUTATION, "Not reputation voting");

        uint256 votingPower = _calculateReputationVotingPower(msg.sender);
        metadata.totalVotingPower += votingPower;

        return _castVote(proposalId, msg.sender, support, "");
    }

    /**
     * @notice Set creator royalty
     * @param creator Creator address
     * @param percentage Royalty percentage in basis points
     */
    function setCreatorRoyalty(
        address creator,
        uint256 percentage
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(percentage <= 1000, "Max 10%"); // Max 10%

        creatorRoyalties[creator] = CreatorRoyalty({
            creator: creator,
            percentage: percentage,
            totalEarned: 0,
            isActive: true
        });

        emit CreatorRoyaltySet(creator, percentage);
    }

    /**
     * @notice Distribute creator royalties
     * @param creator Creator to pay
     * @param amount Amount to distribute
     */
    function distributeCreatorRoyalty(
        address creator,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(creatorRoyalties[creator].isActive, "Creator not active");
        require(amount <= creatorRoyaltyPool, "Insufficient pool");

        creatorRoyalties[creator].totalEarned += amount;
        creatorRoyaltyPool -= amount;
        totalRoyaltiesDistributed += amount;

        // Transfer from pool (assumes pool is funded)
        payable(creator).transfer(amount);

        emit CreatorRoyaltyPaid(creator, amount);
    }

    /**
     * @notice Update user reputation score
     * @param user User address
     * @param score New reputation score
     */
    function updateReputation(
        address user,
        uint256 score
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        reputationScores[user] = score;
        emit ReputationUpdated(user, score);
    }

    /**
     * @notice Fund creator royalty pool
     */
    function fundCreatorRoyaltyPool() external payable {
        creatorRoyaltyPool += msg.value;
    }

    /**
     * @notice Calculate quadratic voting power
     * @param voter Voter address
     * @param tokenAmount Tokens to use
     */
    function _calculateQuadraticVotingPower(
        address voter,
        uint256 tokenAmount
    ) internal view returns (uint256) {
        require(getVotes(voter, block.number - 1) >= tokenAmount, "Insufficient tokens");
        
        // Square root calculation (simplified)
        uint256 sqrtTokens = sqrt(tokenAmount);
        
        // Apply multiplier
        return (sqrtTokens * quadraticVotingMultiplier) / 100;
    }

    /**
     * @notice Calculate reputation-based voting power
     * @param voter Voter address
     */
    function _calculateReputationVotingPower(address voter) internal view returns (uint256) {
        uint256 tokenVotes = getVotes(voter, block.number - 1);
        uint256 reputation = reputationScores[voter];
        
        // Combine token votes with reputation (50/50 weight)
        return (tokenVotes / 2) + (reputation * 1e18 / 2);
    }

    /**
     * @notice Square root function (Babylonian method)
     */
    function sqrt(uint256 x) internal pure returns (uint256 y) {
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    /**
     * @notice Get proposal metadata
     */
    function getProposalMetadata(uint256 proposalId) external view returns (
        ProposalType proposalType,
        VotingMechanism votingMechanism,
        address proposer,
        uint256 createdAt,
        uint256 totalVotingPower,
        string memory ipfsHash
    ) {
        ProposalMetadata memory metadata = proposalMetadata[proposalId];
        return (
            metadata.proposalType,
            metadata.votingMechanism,
            metadata.proposer,
            metadata.createdAt,
            metadata.totalVotingPower,
            metadata.ipfsHash
        );
    }

    /**
     * @notice Get creator royalty info
     */
    function getCreatorRoyalty(address creator) external view returns (
        uint256 percentage,
        uint256 totalEarned,
        bool isActive
    ) {
        CreatorRoyalty memory royalty = creatorRoyalties[creator];
        return (royalty.percentage, royalty.totalEarned, royalty.isActive);
    }

    // Required overrides
    function votingDelay()
        public
        view
        override(GovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(GovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(GovernorUpgradeable, GovernorVotesQuorumFractionUpgradeable)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function proposalThreshold()
        public
        view
        override(GovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {}

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(GovernorUpgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
