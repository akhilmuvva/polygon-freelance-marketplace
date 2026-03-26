// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./FreelanceGovernance.sol";

/**
 * @title FreelanceGovernanceV2
 * @notice Upgradeable V2 with the Zenith "Global Sentinel" feature.
 */
contract FreelanceGovernanceV2 is FreelanceGovernance {
    constructor(address _sbt) FreelanceGovernance(_sbt) {}

    /// @notice Total reputation weight ever minted across the protocol
    uint256 public totalZenithWeight;
    
    /// @notice Version identifier
    string public constant VERSION = "2.0.0-ZENITH-SENTINEL";

    /**
     * @notice V2-exclusive initializer-style function
     */
    function initializeV2() external {
        // In a real UUPS upgrade, you might use a reinitializer or just a guarded function
        totalZenithWeight = 999; // Initializing with a sentinel value
    }

    /**
     * @notice New V2 function: Checks if a proposal is "Legendary"
     */
    function isLegendary(uint256 proposalId) public view returns (bool) {
        Proposal storage p = proposals[proposalId];
        return (p.forVotes > 100);
    }
}
