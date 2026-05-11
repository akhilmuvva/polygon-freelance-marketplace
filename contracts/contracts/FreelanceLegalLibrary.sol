// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FreelanceLegalLibrary
 * @notice Enforces legal enforceability for Real-World Assets (RWAs)
 * @dev Bridges on-chain tokenization with off-chain legal jurisdictions.
 */
library FreelanceLegalLibrary {
    enum Jurisdiction { NONE, US_DE, EU_FR, UK_EN, SG, AE_DUBAI }

    struct LegalWrapper {
        Jurisdiction jurisdiction;
        string legalAgreementCID; // IPFS CID of the signed legal contract
        bool kycVerified;
        uint256 timestamp;
    }

    /**
     * @notice Validates that an RWA has a legally binding foundation.
     */
    function validateLegalFoundation(LegalWrapper memory wrapper) internal pure {
        require(wrapper.jurisdiction != Jurisdiction.NONE, "Legal: Jurisdiction must be specified");
        require(bytes(wrapper.legalAgreementCID).length > 0, "Legal: Agreement CID missing");
        require(wrapper.kycVerified, "Legal: Originator must be KYC verified");
    }

    /**
     * @notice Checks if a jurisdiction is currently supported by Zenith Legal.
     */
    function isJurisdictionSupported(Jurisdiction jurisdiction) internal pure returns (bool) {
        return jurisdiction != Jurisdiction.NONE;
    }
}
