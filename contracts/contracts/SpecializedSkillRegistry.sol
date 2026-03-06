// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SpecializedSkillRegistry
 * @notice Manages Web3-specific skill categories and specialist verification
 * @dev Focuses on high-demand Web3 verticals with skill-based reputation
 */
contract SpecializedSkillRegistry is 
    AccessControlUpgradeable, 
    UUPSUpgradeable,
    ReentrancyGuard
{
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    /// @notice Web3 specialist categories
    enum SpecialistCategory {
        SMART_CONTRACT_DEV,      // Solidity, Rust, Move developers
        ZK_PROOF_ENGINEER,       // Zero-knowledge proof specialists
        DEFI_ANALYST,            // DeFi protocol analysts
        NFT_ARTIST,              // Digital artists and creators
        ONCHAIN_GAME_BUILDER,    // Blockchain game developers
        PROTOCOL_AUDITOR,        // Security auditors
        TOKENOMICS_DESIGNER,     // Token economics experts
        DAO_ARCHITECT,           // Governance system designers
        MEV_RESEARCHER,          // MEV and arbitrage specialists
        LAYER2_ENGINEER          // L2 scaling solutions
    }

    /// @notice Skill proficiency levels
    enum ProficiencyLevel {
        BEGINNER,       // 0-1 year experience
        INTERMEDIATE,   // 1-3 years experience
        ADVANCED,       // 3-5 years experience
        EXPERT,         // 5+ years experience
        MASTER          // Industry recognized expert
    }

    /// @notice Specialist profile
    struct SpecialistProfile {
        SpecialistCategory primaryCategory;
        SpecialistCategory[] secondaryCategories;
        ProficiencyLevel proficiency;
        uint256 verifiedProjects;
        uint256 totalEarnings;
        uint256 averageRating;      // Out of 100
        uint256 specialistSince;
        bool isVerified;
        string portfolioURI;        // IPFS hash
        string[] certifications;    // On-chain certifications
        uint256 communityVotes;     // Peer endorsements
    }

    /// @notice Category metadata
    struct CategoryMetadata {
        string name;
        string description;
        uint256 activeSpecialists;
        uint256 totalJobs;
        uint256 averageRate;        // In USD (6 decimals)
        uint256 demandScore;        // 0-100
        bool isActive;
    }

    /// @notice Skill endorsement
    struct Endorsement {
        address endorser;
        SpecialistCategory category;
        uint256 timestamp;
        string comment;
        uint256 weight;             // Based on endorser's reputation
    }

    // State variables
    mapping(address => SpecialistProfile) public specialists;
    mapping(SpecialistCategory => CategoryMetadata) public categories;
    mapping(address => mapping(SpecialistCategory => Endorsement[])) public endorsements;
    mapping(address => mapping(address => bool)) public hasEndorsed;
    
    // Category rankings
    mapping(SpecialistCategory => address[]) public categoryLeaderboard;
    
    // Specialist achievements
    mapping(address => string[]) public achievements;
    
    // Referral tracking
    mapping(address => address) public referredBy;
    mapping(address => address[]) public referrals;
    mapping(address => uint256) public referralRewards;

    // Events
    event SpecialistRegistered(address indexed specialist, SpecialistCategory category);
    event ProficiencyUpdated(address indexed specialist, ProficiencyLevel newLevel);
    event EndorsementReceived(address indexed specialist, address indexed endorser, SpecialistCategory category);
    event ProjectCompleted(address indexed specialist, uint256 earnings, uint256 rating);
    event CategoryUpdated(SpecialistCategory category, uint256 demandScore);
    event ReferralRecorded(address indexed referrer, address indexed referred);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __AccessControl_init();



        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        _initializeCategories();
    }

    /**
     * @notice Register as a specialist in a category
     * @param category Primary specialist category
     * @param proficiency Initial proficiency level
     * @param portfolioURI IPFS hash of portfolio
     * @param referrer Address of referrer (optional)
     */
    function registerSpecialist(
        SpecialistCategory category,
        ProficiencyLevel proficiency,
        string calldata portfolioURI,
        address referrer
    ) external {
        require(!specialists[msg.sender].isVerified, "Already registered");
        require(bytes(portfolioURI).length > 0, "Portfolio required");

        specialists[msg.sender] = SpecialistProfile({
            primaryCategory: category,
            secondaryCategories: new SpecialistCategory[](0),
            proficiency: proficiency,
            verifiedProjects: 0,
            totalEarnings: 0,
            averageRating: 0,
            specialistSince: block.timestamp,
            isVerified: false,
            portfolioURI: portfolioURI,
            certifications: new string[](0),
            communityVotes: 0
        });

        categories[category].activeSpecialists++;

        // Record referral
        if (referrer != address(0) && referrer != msg.sender) {
            referredBy[msg.sender] = referrer;
            referrals[referrer].push(msg.sender);
            emit ReferralRecorded(referrer, msg.sender);
        }

        emit SpecialistRegistered(msg.sender, category);
    }

    /**
     * @notice Add secondary specialty
     * @param category Additional category
     */
    function addSecondaryCategory(SpecialistCategory category) external {
        require(specialists[msg.sender].isVerified, "Not registered");
        require(specialists[msg.sender].primaryCategory != category, "Already primary");
        
        specialists[msg.sender].secondaryCategories.push(category);
    }

    /**
     * @notice Endorse a specialist
     * @param specialist Address to endorse
     * @param category Category to endorse for
     * @param comment Optional comment
     */
    function endorseSpecialist(
        address specialist,
        SpecialistCategory category,
        string calldata comment
    ) external {
        require(specialists[msg.sender].isVerified, "Must be verified to endorse");
        require(specialists[specialist].isVerified, "Specialist not verified");
        require(!hasEndorsed[msg.sender][specialist], "Already endorsed");
        require(specialist != msg.sender, "Cannot self-endorse");

        // Calculate endorsement weight based on endorser's reputation
        uint256 weight = _calculateEndorsementWeight(msg.sender);

        endorsements[specialist][category].push(Endorsement({
            endorser: msg.sender,
            category: category,
            timestamp: block.timestamp,
            comment: comment,
            weight: weight
        }));

        hasEndorsed[msg.sender][specialist] = true;
        specialists[specialist].communityVotes += weight;

        emit EndorsementReceived(specialist, msg.sender, category);
    }

    /**
     * @notice Record project completion (called by escrow contract)
     * @param specialist Address of specialist
     * @param earnings Amount earned
     * @param rating Rating received (0-100)
     */
    function recordProjectCompletion(
        address specialist,
        uint256 earnings,
        uint256 rating
    ) external onlyRole(VERIFIER_ROLE) {
        require(specialists[specialist].isVerified, "Not verified");
        require(rating <= 100, "Invalid rating");

        SpecialistProfile storage profile = specialists[specialist];
        
        // Update statistics
        profile.verifiedProjects++;
        profile.totalEarnings += earnings;
        
        // Update average rating
        if (profile.averageRating == 0) {
            profile.averageRating = rating;
        } else {
            profile.averageRating = (profile.averageRating * (profile.verifiedProjects - 1) + rating) / profile.verifiedProjects;
        }

        // Update category statistics
        SpecialistCategory category = profile.primaryCategory;
        categories[category].totalJobs++;

        // Check for proficiency upgrade
        _checkProficiencyUpgrade(specialist);

        // Award referral bonus
        _awardReferralBonus(specialist, earnings);

        emit ProjectCompleted(specialist, earnings, rating);
    }

    /**
     * @notice Verify specialist (manual verification by admin)
     * @param specialist Address to verify
     */
    function verifySpecialist(address specialist) external onlyRole(VERIFIER_ROLE) {
        require(!specialists[specialist].isVerified, "Already verified");
        specialists[specialist].isVerified = true;
    }

    /**
     * @notice Add certification to specialist
     * @param specialist Address of specialist
     * @param certificationURI IPFS hash of certification
     */
    function addCertification(
        address specialist,
        string calldata certificationURI
    ) external onlyRole(VERIFIER_ROLE) {
        specialists[specialist].certifications.push(certificationURI);
    }

    /**
     * @notice Update category demand score
     * @param category Category to update
     * @param demandScore New demand score (0-100)
     */
    function updateCategoryDemand(
        SpecialistCategory category,
        uint256 demandScore
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(demandScore <= 100, "Invalid score");
        categories[category].demandScore = demandScore;
        emit CategoryUpdated(category, demandScore);
    }

    /**
     * @notice Get specialist profile
     * @param specialist Address to query
     */
    function getSpecialistProfile(address specialist) external view returns (
        SpecialistCategory primaryCategory,
        ProficiencyLevel proficiency,
        uint256 verifiedProjects,
        uint256 totalEarnings,
        uint256 averageRating,
        uint256 communityVotes,
        bool isVerified
    ) {
        SpecialistProfile memory profile = specialists[specialist];
        return (
            profile.primaryCategory,
            profile.proficiency,
            profile.verifiedProjects,
            profile.totalEarnings,
            profile.averageRating,
            profile.communityVotes,
            profile.isVerified
        );
    }

    /**
     * @notice Get category statistics
     * @param category Category to query
     */
    function getCategoryStats(SpecialistCategory category) external view returns (
        uint256 activeSpecialists,
        uint256 totalJobs,
        uint256 averageRate,
        uint256 demandScore
    ) {
        CategoryMetadata memory meta = categories[category];
        return (
            meta.activeSpecialists,
            meta.totalJobs,
            meta.averageRate,
            meta.demandScore
        );
    }

    /**
     * @notice Get endorsements for specialist
     * @param specialist Address to query
     * @param category Category to query
     */
    function getEndorsements(
        address specialist,
        SpecialistCategory category
    ) external view returns (Endorsement[] memory) {
        return endorsements[specialist][category];
    }

    /**
     * @notice Get referral count
     * @param referrer Address to query
     */
    function getReferralCount(address referrer) external view returns (uint256) {
        return referrals[referrer].length;
    }

    /**
     * @notice Calculate endorsement weight based on reputation
     */
    function _calculateEndorsementWeight(address endorser) internal view returns (uint256) {
        SpecialistProfile memory profile = specialists[endorser];
        
        uint256 weight = 1;
        
        // Proficiency bonus
        if (profile.proficiency == ProficiencyLevel.EXPERT) weight += 2;
        if (profile.proficiency == ProficiencyLevel.MASTER) weight += 5;
        
        // Project completion bonus
        if (profile.verifiedProjects >= 10) weight += 1;
        if (profile.verifiedProjects >= 50) weight += 2;
        if (profile.verifiedProjects >= 100) weight += 3;
        
        // Rating bonus
        if (profile.averageRating >= 90) weight += 2;
        
        return weight;
    }

    /**
     * @notice Check and upgrade proficiency if eligible
     */
    function _checkProficiencyUpgrade(address specialist) internal {
        SpecialistProfile storage profile = specialists[specialist];
        
        if (profile.proficiency == ProficiencyLevel.BEGINNER && profile.verifiedProjects >= 5) {
            profile.proficiency = ProficiencyLevel.INTERMEDIATE;
            emit ProficiencyUpdated(specialist, ProficiencyLevel.INTERMEDIATE);
        } else if (profile.proficiency == ProficiencyLevel.INTERMEDIATE && profile.verifiedProjects >= 20) {
            profile.proficiency = ProficiencyLevel.ADVANCED;
            emit ProficiencyUpdated(specialist, ProficiencyLevel.ADVANCED);
        } else if (profile.proficiency == ProficiencyLevel.ADVANCED && profile.verifiedProjects >= 50 && profile.averageRating >= 90) {
            profile.proficiency = ProficiencyLevel.EXPERT;
            emit ProficiencyUpdated(specialist, ProficiencyLevel.EXPERT);
        }
    }

    /**
     * @notice Award referral bonus
     */
    function _awardReferralBonus(address specialist, uint256 earnings) internal {
        address referrer = referredBy[specialist];
        if (referrer != address(0)) {
            // 5% of earnings goes to referrer
            uint256 bonus = earnings * 5 / 100;
            referralRewards[referrer] += bonus;
        }
    }

    /**
     * @notice Initialize category metadata
     */
    function _initializeCategories() internal {
        categories[SpecialistCategory.SMART_CONTRACT_DEV] = CategoryMetadata({
            name: "Smart Contract Developer",
            description: "Solidity, Rust, Move blockchain developers",
            activeSpecialists: 0,
            totalJobs: 0,
            averageRate: 150 * 1e6,  // $150/hour
            demandScore: 95,
            isActive: true
        });

        categories[SpecialistCategory.ZK_PROOF_ENGINEER] = CategoryMetadata({
            name: "ZK Proof Engineer",
            description: "Zero-knowledge proof specialists",
            activeSpecialists: 0,
            totalJobs: 0,
            averageRate: 200 * 1e6,  // $200/hour
            demandScore: 98,
            isActive: true
        });

        categories[SpecialistCategory.DEFI_ANALYST] = CategoryMetadata({
            name: "DeFi Analyst",
            description: "DeFi protocol analysts and researchers",
            activeSpecialists: 0,
            totalJobs: 0,
            averageRate: 120 * 1e6,  // $120/hour
            demandScore: 85,
            isActive: true
        });

        categories[SpecialistCategory.NFT_ARTIST] = CategoryMetadata({
            name: "NFT Artist",
            description: "Digital artists and NFT creators",
            activeSpecialists: 0,
            totalJobs: 0,
            averageRate: 100 * 1e6,  // $100/hour
            demandScore: 75,
            isActive: true
        });

        categories[SpecialistCategory.ONCHAIN_GAME_BUILDER] = CategoryMetadata({
            name: "On-Chain Game Builder",
            description: "Blockchain game developers",
            activeSpecialists: 0,
            totalJobs: 0,
            averageRate: 130 * 1e6,  // $130/hour
            demandScore: 80,
            isActive: true
        });
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
