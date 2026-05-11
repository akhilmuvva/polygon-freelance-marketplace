// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./FreelanceEscrow.sol";
import "./AssetTokenizer.sol";
import "./InvoiceNFT.sol";
import "./FreelanceLegalLibrary.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title FreelanceEscrowRWAAdapter
 * @notice Integrates legally-binding RWA tokenization with the PolyLance Zenith system.
 */
contract FreelanceEscrowRWAAdapter is AccessControl {
    using FreelanceLegalLibrary for FreelanceLegalLibrary.LegalWrapper;

    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    FreelanceEscrow public immutable escrow;
    AssetTokenizer public immutable assetTokenizer;
    InvoiceNFT public immutable invoiceNFT;

    mapping(address => bool) public isKYCVerified;
    mapping(uint256 => FreelanceLegalLibrary.LegalWrapper) public jobLegalWrappers;

    event JobTokenizedAsInvoice(uint256 indexed jobId, uint256 indexed invoiceId, address freelancer);
    event JobTokenizedAsAsset(uint256 indexed jobId, uint256 indexed assetId, address client);
    event KYCVerified(address indexed user);

    constructor(
        address _escrow,
        address _assetTokenizer,
        address _invoiceNFT,
        address _admin
    ) {
        escrow = FreelanceEscrow(_escrow);
        assetTokenizer = AssetTokenizer(_assetTokenizer);
        invoiceNFT = InvoiceNFT(_invoiceNFT);
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(VERIFIER_ROLE, _admin);
    }

    /**
     * @notice Authorizes a user as KYC verified.
     */
    function verifyKYC(address user) external onlyRole(VERIFIER_ROLE) {
        isKYCVerified[user] = true;
        emit KYCVerified(user);
    }

    /**
     * @notice Actuates a legally-binding invoice NFT for a completed job.
     */
    function tokenizeJobAsInvoice(
        uint256 jobId,
        string calldata invoiceHash,
        FreelanceLegalLibrary.Jurisdiction jurisdiction,
        string calldata legalAgreementCID
    ) external returns (uint256 invoiceId) {
        // 1. Unpack Job Struct (16 values)
        (
            address client,
            , // id
            , // deadline
            uint16 categoryId,
            address freelancer,
            , // milestoneCount
            JobStatus status,
            , // paid
            , // zkRequired
            , // yieldStrategy
            , // rating
            address token,
            uint256 amount,
            , // freelancerStake
            , // totalPaidOut
            // ipfsHash
        ) = escrow.jobs(jobId);

        require(status == JobStatus.Completed, "RWA: Job not completed");
        require(msg.sender == freelancer, "RWA: Not the freelancer");

        FreelanceLegalLibrary.LegalWrapper memory wrapper = FreelanceLegalLibrary.LegalWrapper({
            jurisdiction: jurisdiction,
            legalAgreementCID: legalAgreementCID,
            kycVerified: isKYCVerified[msg.sender],
            timestamp: block.timestamp
        });
        wrapper.validateLegalFoundation();

        // 2. Execution
        invoiceId = invoiceNFT.createInvoice(
            client,
            token,
            amount,
            block.timestamp + 30 days,
            invoiceHash,
            keccak256(abi.encodePacked(legalAgreementCID))
        );

        jobLegalWrappers[jobId] = wrapper;
        emit JobTokenizedAsInvoice(jobId, invoiceId, freelancer);
    }

    /**
     * @notice Tokenizes project deliverables as fractional assets with legal backing.
     */
    function tokenizeProjectAsAsset(
        uint256 jobId,
        uint256 totalSupply,
        string calldata metadataURI,
        FreelanceLegalLibrary.Jurisdiction jurisdiction,
        string calldata legalAgreementCID
    ) external returns (uint256 assetId) {
        (
            address client,
            , // id
            uint48 deadline,
            , // categoryId
            , // freelancer
            , // milestoneCount
            , // status
            , // paid
            , // zkRequired
            , // yieldStrategy
            , // rating
            address token,
            uint256 amount,
            , // freelancerStake
            , // totalPaidOut
            // ipfsHash
        ) = escrow.jobs(jobId);

        require(msg.sender == client, "RWA: Not the client");

        FreelanceLegalLibrary.LegalWrapper memory wrapper = FreelanceLegalLibrary.LegalWrapper({
            jurisdiction: jurisdiction,
            legalAgreementCID: legalAgreementCID,
            kycVerified: isKYCVerified[msg.sender],
            timestamp: block.timestamp
        });
        wrapper.validateLegalFoundation();

        // tokenizeAsset(AssetType, paymentToken, totalValue, totalSupply, maturityDate, metadataURI, legalHash)
        assetId = assetTokenizer.tokenizeAsset(
            AssetTokenizer.AssetType.FUTURE_EARNINGS,
            token,
            amount,
            totalSupply,
            uint256(deadline),
            metadataURI,
            keccak256(abi.encodePacked(legalAgreementCID))
        );

        jobLegalWrappers[jobId] = wrapper;
        emit JobTokenizedAsAsset(jobId, assetId, client);
    }
}
