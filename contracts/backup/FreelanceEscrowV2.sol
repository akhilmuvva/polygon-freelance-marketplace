// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./FreelanceEscrow.sol";

/**
 * @title FreelanceEscrowV2
 * @notice Zenith Upgrade: Adds "Loyalty Points" capability while preserving all historical state.
 */
contract FreelanceEscrowV2 is FreelanceEscrow {
    /// @notice Tracks loyalty points earned by freelancers (V2 Feature)
    mapping(address => uint256) public loyaltyPoints;
    
    event LoyaltyEarned(address indexed freelancer, uint256 points);

    /**
     * @notice Zenith V2: Enhanced fund release that awards loyalty points.
     */
    function releaseMilestoneV2(uint256 jobId, uint256 mId) external whenNotPaused {
        // We reuse the existing release logic but add loyalty logic
        super.releaseMilestone(jobId, mId);
        
        Job storage job = jobs[jobId];
        loyaltyPoints[job.freelancer] += 100;
        emit LoyaltyEarned(job.freelancer, 100);
    }

    function getVersion() public pure returns (string memory) {
        return "2.0.0-ZENITH-UPGRADE";
    }
}
