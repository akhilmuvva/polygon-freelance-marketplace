// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title ComplianceRegistry
 * @notice Manages KYC/AML verification status and compliance levels for users
 * @dev Integrates with off-chain KYC providers (Persona, Sumsub) and on-chain identity (Worldcoin, Civic)
 */
contract ComplianceRegistry is AccessControlUpgradeable, UUPSUpgradeable {
    bytes32 public constant KYC_OPERATOR_ROLE = keccak256("KYC_OPERATOR_ROLE");
    bytes32 public constant COMPLIANCE_ADMIN_ROLE = keccak256("COMPLIANCE_ADMIN_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    /// @notice KYC verification levels
    enum KYCLevel {
        NONE,           // No verification
        BASIC,          // Email + phone verified
        INTERMEDIATE,   // Government ID verified
        ADVANCED,       // Full KYC with proof of address
        INSTITUTIONAL   // Business verification
    }

    /// @notice Compliance status
    enum ComplianceStatus {
        PENDING,        // Verification in progress
        APPROVED,       // Fully compliant
        REJECTED,       // Failed verification
        SUSPENDED,      // Temporarily suspended
        REVOKED         // Permanently revoked
    }

    /// @notice User compliance data
    struct ComplianceData {
        KYCLevel kycLevel;
        ComplianceStatus status;
        uint256 verifiedAt;
        uint256 expiresAt;
        string kycProvider;         // "persona", "sumsub", "worldcoin", "civic"
        bytes32 kycHash;            // Hash of KYC data (privacy-preserving)
        string jurisdiction;        // ISO 3166-1 alpha-2 country code
        bool isAccreditedInvestor;  // For securities compliance
        bool isSanctioned;          // OFAC/sanctions check
        uint256 riskScore;          // 0-100 (0 = lowest risk)
    }

    /// @notice Transaction limits based on KYC level
    struct TransactionLimits {
        uint256 dailyLimit;
        uint256 monthlyLimit;
        uint256 transactionLimit;
    }

    // State variables
    mapping(address => ComplianceData) public userCompliance;
    mapping(KYCLevel => TransactionLimits) public kycLimits;
    mapping(address => mapping(uint256 => uint256)) public dailyVolume;  // user => day => volume
    mapping(address => mapping(uint256 => uint256)) public monthlyVolume; // user => month => volume
    
    // Sanctioned addresses
    mapping(address => bool) public sanctionedAddresses;
    
    // Restricted jurisdictions
    mapping(string => bool) public restrictedJurisdictions;

    // Events
    event KYCVerified(address indexed user, KYCLevel level, string provider);
    event ComplianceStatusUpdated(address indexed user, ComplianceStatus status);
    event KYCExpired(address indexed user);
    event SanctionedAddressAdded(address indexed user);
    event JurisdictionRestricted(string jurisdiction);
    event TransactionLimitUpdated(KYCLevel level, uint256 dailyLimit, uint256 monthlyLimit);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __AccessControl_init();


        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KYC_OPERATOR_ROLE, msg.sender);
        _grantRole(COMPLIANCE_ADMIN_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        // Set default transaction limits
        _setDefaultLimits();
        
        // Add default restricted jurisdictions (example)
        restrictedJurisdictions["KP"] = true; // North Korea
        restrictedJurisdictions["IR"] = true; // Iran
        restrictedJurisdictions["SY"] = true; // Syria
    }

    /**
     * @notice Verify user KYC status
     * @param user User address
     * @param level KYC verification level
     * @param provider KYC provider name
     * @param jurisdiction User's jurisdiction (ISO country code)
     * @param kycHash Privacy-preserving hash of KYC data
     * @param expiryMonths Months until KYC expires
     */
    function verifyKYC(
        address user,
        KYCLevel level,
        string calldata provider,
        string calldata jurisdiction,
        bytes32 kycHash,
        uint256 expiryMonths
    ) external onlyRole(KYC_OPERATOR_ROLE) {
        require(user != address(0), "Invalid user");
        require(!restrictedJurisdictions[jurisdiction], "Restricted jurisdiction");
        require(!sanctionedAddresses[user], "Sanctioned address");

        userCompliance[user] = ComplianceData({
            kycLevel: level,
            status: ComplianceStatus.APPROVED,
            verifiedAt: block.timestamp,
            expiresAt: block.timestamp + (expiryMonths * 30 days),
            kycProvider: provider,
            kycHash: kycHash,
            jurisdiction: jurisdiction,
            isAccreditedInvestor: false,
            isSanctioned: false,
            riskScore: 0
        });

        emit KYCVerified(user, level, provider);
        emit ComplianceStatusUpdated(user, ComplianceStatus.APPROVED);
    }

    /**
     * @notice Update compliance status
     * @param user User address
     * @param status New compliance status
     */
    function updateComplianceStatus(
        address user,
        ComplianceStatus status
    ) external onlyRole(COMPLIANCE_ADMIN_ROLE) {
        userCompliance[user].status = status;
        emit ComplianceStatusUpdated(user, status);
    }

    /**
     * @notice Mark user as accredited investor
     * @param user User address
     * @param isAccredited Accreditation status
     */
    function setAccreditedInvestor(
        address user,
        bool isAccredited
    ) external onlyRole(COMPLIANCE_ADMIN_ROLE) {
        require(userCompliance[user].kycLevel >= KYCLevel.ADVANCED, "Requires advanced KYC");
        userCompliance[user].isAccreditedInvestor = isAccredited;
    }

    /**
     * @notice Add address to sanctions list
     * @param user Address to sanction
     */
    function addSanctionedAddress(address user) external onlyRole(COMPLIANCE_ADMIN_ROLE) {
        sanctionedAddresses[user] = true;
        userCompliance[user].isSanctioned = true;
        userCompliance[user].status = ComplianceStatus.REVOKED;
        
        emit SanctionedAddressAdded(user);
        emit ComplianceStatusUpdated(user, ComplianceStatus.REVOKED);
    }

    /**
     * @notice Add restricted jurisdiction
     * @param jurisdiction ISO country code
     */
    function addRestrictedJurisdiction(
        string calldata jurisdiction
    ) external onlyRole(COMPLIANCE_ADMIN_ROLE) {
        restrictedJurisdictions[jurisdiction] = true;
        emit JurisdictionRestricted(jurisdiction);
    }

    /**
     * @notice Update transaction limits for KYC level
     * @param level KYC level
     * @param dailyLimit Daily transaction limit
     * @param monthlyLimit Monthly transaction limit
     * @param transactionLimit Single transaction limit
     */
    function updateTransactionLimits(
        KYCLevel level,
        uint256 dailyLimit,
        uint256 monthlyLimit,
        uint256 transactionLimit
    ) external onlyRole(COMPLIANCE_ADMIN_ROLE) {
        kycLimits[level] = TransactionLimits({
            dailyLimit: dailyLimit,
            monthlyLimit: monthlyLimit,
            transactionLimit: transactionLimit
        });

        emit TransactionLimitUpdated(level, dailyLimit, monthlyLimit);
    }

    /**
     * @notice Check if user is compliant
     * @param user User address
     * @return isCompliant Whether user is compliant
     */
    function isUserCompliant(address user) external view returns (bool) {
        ComplianceData memory data = userCompliance[user];
        
        // Check basic compliance
        if (data.status != ComplianceStatus.APPROVED) return false;
        if (data.isSanctioned) return false;
        if (block.timestamp > data.expiresAt) return false;
        
        return true;
    }

    /**
     * @notice Check if transaction is within limits
     * @param user User address
     * @param amount Transaction amount
     * @return isAllowed Whether transaction is allowed
     */
    function checkTransactionLimit(
        address user,
        uint256 amount
    ) external view returns (bool isAllowed) {
        ComplianceData memory data = userCompliance[user];
        TransactionLimits memory limits = kycLimits[data.kycLevel];

        // Check single transaction limit
        if (amount > limits.transactionLimit) return false;

        // Check daily limit
        uint256 today = block.timestamp / 1 days;
        if (dailyVolume[user][today] + amount > limits.dailyLimit) return false;

        // Check monthly limit
        uint256 thisMonth = block.timestamp / 30 days;
        if (monthlyVolume[user][thisMonth] + amount > limits.monthlyLimit) return false;

        return true;
    }

    /**
     * @notice Record transaction volume
     * @param user User address
     * @param amount Transaction amount
     */
    function recordTransaction(
        address user,
        uint256 amount
    ) external onlyRole(KYC_OPERATOR_ROLE) {
        uint256 today = block.timestamp / 1 days;
        uint256 thisMonth = block.timestamp / 30 days;

        dailyVolume[user][today] += amount;
        monthlyVolume[user][thisMonth] += amount;
    }

    /**
     * @notice Get user compliance data
     * @param user User address
     */
    function getUserCompliance(address user) external view returns (ComplianceData memory) {
        return userCompliance[user];
    }

    /**
     * @notice Check if KYC is expired
     * @param user User address
     */
    function isKYCExpired(address user) public view returns (bool) {
        return block.timestamp > userCompliance[user].expiresAt;
    }

    /**
     * @notice Get minimum required KYC level for amount
     * @param amount Transaction amount
     */
    function getRequiredKYCLevel(uint256 amount) public view returns (KYCLevel) {
        if (amount <= kycLimits[KYCLevel.BASIC].transactionLimit) {
            return KYCLevel.BASIC;
        } else if (amount <= kycLimits[KYCLevel.INTERMEDIATE].transactionLimit) {
            return KYCLevel.INTERMEDIATE;
        } else if (amount <= kycLimits[KYCLevel.ADVANCED].transactionLimit) {
            return KYCLevel.ADVANCED;
        } else {
            return KYCLevel.INSTITUTIONAL;
        }
    }

    /**
     * @notice Set default transaction limits
     */
    function _setDefaultLimits() internal {
        // BASIC: Email + phone verified
        kycLimits[KYCLevel.BASIC] = TransactionLimits({
            dailyLimit: 1000 * 1e6,      // $1,000 daily
            monthlyLimit: 5000 * 1e6,    // $5,000 monthly
            transactionLimit: 500 * 1e6  // $500 per transaction
        });

        // INTERMEDIATE: Government ID verified
        kycLimits[KYCLevel.INTERMEDIATE] = TransactionLimits({
            dailyLimit: 10000 * 1e6,      // $10,000 daily
            monthlyLimit: 50000 * 1e6,    // $50,000 monthly
            transactionLimit: 5000 * 1e6  // $5,000 per transaction
        });

        // ADVANCED: Full KYC with proof of address
        kycLimits[KYCLevel.ADVANCED] = TransactionLimits({
            dailyLimit: 100000 * 1e6,      // $100,000 daily
            monthlyLimit: 500000 * 1e6,    // $500,000 monthly
            transactionLimit: 50000 * 1e6  // $50,000 per transaction
        });

        // INSTITUTIONAL: Business verification
        kycLimits[KYCLevel.INSTITUTIONAL] = TransactionLimits({
            dailyLimit: 1000000 * 1e6,      // $1,000,000 daily
            monthlyLimit: 10000000 * 1e6,   // $10,000,000 monthly
            transactionLimit: 500000 * 1e6  // $500,000 per transaction
        });
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
