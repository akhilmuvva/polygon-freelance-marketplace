// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title  GrantMilestones
 * @notice On-chain transparency ledger for Grant Deliverables.
 *         Ensures the Polygon Foundation can track progress directly via the subgraph.
 */
contract GrantMilestones is Ownable {
    
    struct Milestone {
        string title;
        string deliverableHash; // IPFS CID or GitHub Commit
        uint256 timestamp;
        bool completed;
        string verificationEvidence; // Proof of Work / Test Results
    }

    Milestone[] public milestones;

    event MilestoneAdded(uint256 indexed id, string title);
    event MilestoneCompleted(uint256 indexed id, string deliverableHash, string evidence);

    constructor(address _owner) Ownable(_owner) {
        // Initial Granular Roadmap for Phase 6
        _addMilestone("POL Gravitational Boost Enhancement", "");
        _addMilestone("AggLayer Intent Bridging Demo", "");
        _addMilestone("On-chain Transparency Dashboard", "");
        _addMilestone("ZK-Email Proof of Income Proof-of-Concept", "");
    }

    function _addMilestone(string memory _title, string memory _hash) internal {
        milestones.push(Milestone({
            title: _title,
            deliverableHash: _hash,
            timestamp: block.timestamp,
            completed: false,
            verificationEvidence: ""
        }));
        emit MilestoneAdded(milestones.length - 1, _title);
    }

    /**
     * @notice Adds a new deliverable milestone to the on-chain roadmap.
     */
    function addMilestone(string memory _title) external onlyOwner {
        _addMilestone(_title, "");
    }

    /**
     * @notice Completes a milestone with verifiable proof (e.g. GitHub commit or test report CID).
     */
    function completeMilestone(uint256 _id, string memory _hash, string memory _evidence) external onlyOwner {
        require(_id < milestones.length, "Invalid milestone ID");
        Milestone storage m = milestones[_id];
        require(!m.completed, "Milestone already completed");

        m.completed = true;
        m.deliverableHash = _hash;
        m.verificationEvidence = _evidence;
        m.timestamp = block.timestamp;

        emit MilestoneCompleted(_id, _hash, _evidence);
    }

    function getMilestoneCount() external view returns (uint256) {
        return milestones.length;
    }
}
