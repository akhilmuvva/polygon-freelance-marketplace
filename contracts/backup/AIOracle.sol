// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AIOracle
 * @notice Integrates AI-powered verification for milestone completion and asset validation
 * @dev Uses Chainlink Functions or custom oracle network for off-chain AI computation
 */
contract AIOracle is AccessControl, ReentrancyGuard {
    bytes32 public constant ORACLE_OPERATOR_ROLE = keccak256("ORACLE_OPERATOR_ROLE");
    bytes32 public constant CONSUMER_ROLE = keccak256("CONSUMER_ROLE");

    enum VerificationStatus { PENDING, APPROVED, REJECTED, DISPUTED }

    /**
     * @notice Structure for verification requests
     */
    struct VerificationRequest {
        uint256 requestId;
        address requester;
        address targetContract;
        uint256 targetId;              // Asset ID, Milestone ID, or Invoice ID
        string verificationType;       // "milestone", "invoice", "asset", "ip_rights"
        string proofDataURI;           // IPFS hash with proof documents
        VerificationStatus status;
        uint256 confidence;            // AI confidence score (0-100)
        string aiResponse;             // AI analysis summary
        uint256 timestamp;
        address verifier;
    }

    // State variables
    uint256 public nextRequestId;
    uint256 public minConfidenceThreshold;  // Minimum AI confidence to auto-approve
    
    mapping(uint256 => VerificationRequest) public requests;
    mapping(address => uint256[]) public contractRequests;
    mapping(bytes32 => uint256) public requestHash; // Hash of (contract, targetId, type) => requestId

    // Events
    event VerificationRequested(
        uint256 indexed requestId,
        address indexed requester,
        address indexed targetContract,
        uint256 targetId,
        string verificationType
    );
    event VerificationCompleted(
        uint256 indexed requestId,
        VerificationStatus status,
        uint256 confidence,
        string aiResponse
    );
    event ConfidenceThresholdUpdated(uint256 newThreshold);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_OPERATOR_ROLE, msg.sender);
        nextRequestId = 1;
        minConfidenceThreshold = 80; // 80% confidence required for auto-approval
    }

    /**
     * @notice Requests AI verification for a milestone, invoice, or asset
     * @param targetContract The contract containing the item to verify
     * @param targetId The ID of the item (milestone, invoice, asset)
     * @param verificationType Type of verification needed
     * @param proofDataURI IPFS hash with proof documents
     * @return requestId The verification request ID
     */
    function requestVerification(
        address targetContract,
        uint256 targetId,
        string calldata verificationType,
        string calldata proofDataURI
    ) external returns (uint256 requestId) {
        require(targetContract != address(0), "AIOracle: Invalid contract");
        require(bytes(proofDataURI).length > 0, "AIOracle: Empty proof");

        // Check for duplicate requests
        bytes32 hash = keccak256(abi.encodePacked(targetContract, targetId, verificationType));
        require(requestHash[hash] == 0, "AIOracle: Duplicate request");

        requestId = nextRequestId++;

        requests[requestId] = VerificationRequest({
            requestId: requestId,
            requester: msg.sender,
            targetContract: targetContract,
            targetId: targetId,
            verificationType: verificationType,
            proofDataURI: proofDataURI,
            status: VerificationStatus.PENDING,
            confidence: 0,
            aiResponse: "",
            timestamp: block.timestamp,
            verifier: address(0)
        });

        contractRequests[targetContract].push(requestId);
        requestHash[hash] = requestId;

        emit VerificationRequested(requestId, msg.sender, targetContract, targetId, verificationType);
    }

    /**
     * @notice Submits AI verification result (called by oracle operator)
     * @param requestId The verification request ID
     * @param approved Whether the verification passed
     * @param confidence AI confidence score (0-100)
     * @param aiResponse AI analysis summary
     */
    function submitVerification(
        uint256 requestId,
        bool approved,
        uint256 confidence,
        string calldata aiResponse
    ) external onlyRole(ORACLE_OPERATOR_ROLE) nonReentrant {
        VerificationRequest storage request = requests[requestId];
        require(request.status == VerificationStatus.PENDING, "AIOracle: Not pending");
        require(confidence <= 100, "AIOracle: Invalid confidence");

        request.confidence = confidence;
        request.aiResponse = aiResponse;
        request.verifier = msg.sender;

        // Auto-approve if confidence meets threshold
        if (approved && confidence >= minConfidenceThreshold) {
            request.status = VerificationStatus.APPROVED;
            
            // Callback to target contract
            _notifyTargetContract(request);
        } else if (!approved) {
            request.status = VerificationStatus.REJECTED;
        } else {
            // Low confidence - requires manual review
            request.status = VerificationStatus.DISPUTED;
        }

        emit VerificationCompleted(requestId, request.status, confidence, aiResponse);
    }

    /**
     * @notice Manually approves a disputed verification (admin override)
     * @param requestId The verification request ID
     */
    function manualApprove(uint256 requestId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        VerificationRequest storage request = requests[requestId];
        require(request.status == VerificationStatus.DISPUTED, "AIOracle: Not disputed");

        request.status = VerificationStatus.APPROVED;
        _notifyTargetContract(request);

        emit VerificationCompleted(requestId, VerificationStatus.APPROVED, request.confidence, "Manual approval");
    }

    /**
     * @notice Notifies the target contract of verification result
     * @param request The verification request
     */
    function _notifyTargetContract(VerificationRequest storage request) internal {
        // Call the appropriate verification function on the target contract
        if (keccak256(bytes(request.verificationType)) == keccak256("milestone")) {
            // Call AssetTokenizer.verifyMilestone
            (bool success, ) = request.targetContract.call(
                abi.encodeWithSignature(
                    "verifyMilestone(uint256,uint256,bytes32)",
                    request.targetId,
                    0, // milestoneId - would need to be passed in request
                    keccak256(bytes(request.proofDataURI))
                )
            );
            require(success, "AIOracle: Callback failed");
        } else if (keccak256(bytes(request.verificationType)) == keccak256("invoice")) {
            // Call InvoiceNFT.verifyInvoice
            (bool success, ) = request.targetContract.call(
                abi.encodeWithSignature("verifyInvoice(uint256)", request.targetId)
            );
            require(success, "AIOracle: Callback failed");
        } else if (keccak256(bytes(request.verificationType)) == keccak256("asset")) {
            // Call AssetTokenizer.verifyAsset
            (bool success, ) = request.targetContract.call(
                abi.encodeWithSignature("verifyAsset(uint256)", request.targetId)
            );
            require(success, "AIOracle: Callback failed");
        }
    }

    /**
     * @notice Updates the minimum confidence threshold
     * @param newThreshold New threshold (0-100)
     */
    function setConfidenceThreshold(uint256 newThreshold) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newThreshold <= 100, "AIOracle: Invalid threshold");
        minConfidenceThreshold = newThreshold;
        emit ConfidenceThresholdUpdated(newThreshold);
    }

    /**
     * @notice Returns verification request details
     * @param requestId The request ID
     */
    function getRequest(uint256 requestId) external view returns (VerificationRequest memory) {
        return requests[requestId];
    }

    /**
     * @notice Returns all requests for a specific contract
     * @param targetContract The contract address
     */
    function getContractRequests(address targetContract) external view returns (uint256[] memory) {
        return contractRequests[targetContract];
    }

    /**
     * @notice Checks if a verification exists and is approved
     * @param targetContract The contract address
     * @param targetId The target ID
     * @param verificationType Type of verification
     */
    function isVerified(
        address targetContract,
        uint256 targetId,
        string calldata verificationType
    ) external view returns (bool) {
        bytes32 hash = keccak256(abi.encodePacked(targetContract, targetId, verificationType));
        uint256 requestId = requestHash[hash];
        
        if (requestId == 0) return false;
        return requests[requestId].status == VerificationStatus.APPROVED;
    }
}
