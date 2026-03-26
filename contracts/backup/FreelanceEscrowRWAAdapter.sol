// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./FreelanceEscrow.sol";
import "./AssetTokenizer.sol";
import "./InvoiceNFT.sol";

/**
 * @title FreelanceEscrowRWAAdapter
 * @notice Integrates RWA tokenization with the existing FreelanceEscrow system
 * @dev Allows automatic invoice creation and asset tokenization upon job completion
 */
contract FreelanceEscrowRWAAdapter {
    FreelanceEscrow public immutable escrow;
    AssetTokenizer public immutable assetTokenizer;
    InvoiceNFT public immutable invoiceNFT;

    event JobTokenizedAsInvoice(uint256 indexed jobId, uint256 indexed invoiceId, address freelancer);
    event JobTokenizedAsAsset(uint256 indexed jobId, uint256 indexed assetId, address client);

    constructor(
        address _escrow,
        address _assetTokenizer,
        address _invoiceNFT
    ) {
        escrow = FreelanceEscrow(_escrow);
        assetTokenizer = AssetTokenizer(_assetTokenizer);
        invoiceNFT = InvoiceNFT(_invoiceNFT);
    }

    /**
     * @notice Automatically creates an invoice NFT when a job is completed
     * @dev Freelancer can sell this invoice for immediate liquidity
     * @param jobId The completed job ID
     * @param invoiceHash IPFS hash of invoice document
     * @return invoiceId The created invoice NFT ID
     */
    function tokenizeJobAsInvoice(
        uint256 jobId,
        string calldata invoiceHash
    ) external returns (uint256 invoiceId) {
        // Note: This is a simplified version. In production, you would:
        // 1. Fetch job details from FreelanceEscrow
        // 2. Verify job is completed and caller is freelancer
        // 3. Create invoice NFT with job details
        
        // For now, caller must provide job details directly
        revert("RWAAdapter: Use direct InvoiceNFT.createInvoice() instead");
    }

    /**
     * @notice Tokenizes a project's future revenue as fractional RWA tokens
     * @dev Client can raise capital against project deliverables
     * @param jobId The job ID
     * @param totalSupply Number of fractional tokens to create
     * @param metadataURI IPFS hash with project documentation
     * @return assetId The created asset token ID
     */
    function tokenizeProjectAsAsset(
        uint256 jobId,
        uint256 totalSupply,
        string calldata metadataURI
    ) external returns (uint256 assetId) {
        // Note: This is a simplified version. In production, you would:
        // 1. Fetch job details from FreelanceEscrow
        // 2. Verify caller is client
        // 3. Create asset token with job details
        
        // For now, caller must use AssetTokenizer directly
        revert("RWAAdapter: Use direct AssetTokenizer.tokenizeAsset() instead");
    }

    /**
     * @notice Creates milestones in AssetTokenizer
     * @param assetId The asset token ID
     * @param milestoneDescriptions Array of milestone descriptions
     * @param milestoneValues Array of values to release per milestone
     * @param milestoneDeadlines Array of deadline timestamps
     */
    function linkMilestonesToAsset(
        uint256 assetId,
        string[] calldata milestoneDescriptions,
        uint256[] calldata milestoneValues,
        uint256[] calldata milestoneDeadlines
    ) external {
        require(
            milestoneDescriptions.length == milestoneValues.length &&
            milestoneValues.length == milestoneDeadlines.length,
            "RWAAdapter: Length mismatch"
        );

        // Create milestones (caller must be authorized in AssetTokenizer)
        for (uint256 i = 0; i < milestoneDescriptions.length; i++) {
            assetTokenizer.createMilestone(
                assetId,
                milestoneDescriptions[i],
                milestoneValues[i],
                milestoneDeadlines[i]
            );
        }
    }
}
