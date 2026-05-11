// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Job, JobStatus} from "./FreelanceTypes.sol";

/**
 * @title FreelanceDisputeLibrary
 * @notice External library to handle complex dispute logic and save contract space.
 */
library FreelanceDisputeLibrary {

    /**
     * @notice Processes a ruling from an arbitrator.
     * @param job Storage pointer to the job being ruled on.
     * @param ruling The arbitrator's ruling.
     * @return clientAmt Amount to be credited to the client.
     * @return freelancerAmt Amount to be credited to the freelancer.
     * @return isCompleted Whether the job should be marked as completed.
     */
    function processRuling(
        Job storage job, 
        uint256 ruling
    ) public returns (uint256 clientAmt, uint256 freelancerAmt, bool isCompleted) {
        uint256 remaining = job.amount - job.totalPaidOut;
        uint256 stake = job.freelancerStake;
        
        if (ruling == 0 || ruling == 1) { // Refuse to Rule or Split
            clientAmt = remaining / 2;
            freelancerAmt = (remaining - clientAmt) + stake;
            isCompleted = false;
        } else if (ruling == 2) { // Client Wins
            clientAmt = remaining + stake;
            freelancerAmt = 0;
            isCompleted = false;
        } else if (ruling == 3) { // Freelancer Wins
            clientAmt = 0;
            freelancerAmt = remaining + stake;
            isCompleted = true;
        } else {
            revert("InvalidRuling");
        }
    }

    /**
     * @notice Processes a manual dispute resolution by an admin.
     * @param job Storage pointer to the job.
     * @param freelancerBps Percentage (in bps) for the freelancer.
     * @return clientAmt Amount to be credited to the client.
     * @return freelancerAmt Amount to be credited to the freelancer.
     */
    function processManualResolution(
        Job storage job,
        uint256 freelancerBps
    ) public view returns (uint256 clientAmt, uint256 freelancerAmt) {
        uint256 remaining = job.amount - job.totalPaidOut;
        freelancerAmt = (remaining * freelancerBps) / 10000;
        clientAmt = remaining - freelancerAmt;
        
        freelancerAmt += job.freelancerStake;
    }
}
