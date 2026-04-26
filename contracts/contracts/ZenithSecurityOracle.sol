// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./ReentrancyGuardUpgradeable.sol";

/**
 * @title ZenithSecurityOracle (ZSO)
 * @author PolyForge / PolyLance Zenith
 * @notice The core security engine of the PolyLance protocol. 
 * @dev Validates automated audit reports (Slither, Mythril, Aderyn) on-chain.
 *      Integrates with FreelanceEscrow to gate milestone releases.
 */
contract ZenithSecurityOracle is Initializable, AccessControlUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable {
    bytes32 public constant SECURITY_AGENT_ROLE = keccak256("SECURITY_AGENT_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    enum ReportType { SLITHER, MYTHRIL, ADERYN, MANUAL }
    enum Severity { LOW, MEDIUM, HIGH, CRITICAL }

    struct SecurityReport {
        bytes32 reportHash;      // IPFS hash of the full JSON report
        ReportType rType;
        uint8 highIssues;        // Number of high severity issues
        uint8 mediumIssues;      // Number of medium severity issues
        bool passed;             // Whether the report meets the threshold
        uint256 timestamp;
        address verifiedBy;      // Agent or Oracle that submitted the result
    }

    // Mapping of JobID => MilestoneID => Reports
    mapping(uint256 => mapping(uint256 => SecurityReport[])) public milestoneReports;
    
    // Thresholds for auto-passing
    uint8 public maxHighIssuesAllowed;
    uint8 public maxMediumIssuesAllowed;

    event ReportSubmitted(uint256 indexed jobId, uint256 indexed milestoneId, ReportType rType, bool passed);
    event ThresholdsUpdated(uint8 maxHigh, uint8 maxMedium);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address admin) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(SECURITY_AGENT_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);

        maxHighIssuesAllowed = 0;
        maxMediumIssuesAllowed = 3;
    }

    /**
     * @notice Submits a security report for a specific milestone.
     * @dev Only callable by authorized Security Agents (e.g., your CI/CD runner).
     */
    function submitReport(
        uint256 jobId,
        uint256 milestoneId,
        bytes32 reportHash,
        ReportType rType,
        uint8 highIssues,
        uint8 mediumIssues
    ) external onlyRole(SECURITY_AGENT_ROLE) {
        bool passed = (highIssues <= maxHighIssuesAllowed && mediumIssues <= maxMediumIssuesAllowed);
        
        SecurityReport memory report = SecurityReport({
            reportHash: reportHash,
            rType: rType,
            highIssues: highIssues,
            mediumIssues: mediumIssues,
            passed: passed,
            timestamp: block.timestamp,
            verifiedBy: msg.sender
        });

        milestoneReports[jobId][milestoneId].push(report);
        emit ReportSubmitted(jobId, milestoneId, rType, passed);
    }

    /**
     * @notice Checks if a milestone has passed all required security checks.
     * @dev This is the function called by FreelanceEscrow.
     */
    function isMilestoneSecure(uint256 jobId, uint256 milestoneId) public view returns (bool) {
        SecurityReport[] storage reports = milestoneReports[jobId][milestoneId];
        if (reports.length == 0) return false;

        // Requirement: At least one Slither report must exist and pass
        bool slitherPassed = false;
        for (uint256 i = 0; i < reports.length; i++) {
            if (reports[i].rType == ReportType.SLITHER && reports[i].passed) {
                slitherPassed = true;
                break;
            }
        }
        
        return slitherPassed;
    }

    function setThresholds(uint8 _maxHigh, uint8 _maxMedium) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maxHighIssuesAllowed = _maxHigh;
        maxMediumIssuesAllowed = _maxMedium;
        emit ThresholdsUpdated(_maxHigh, _maxMedium);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
