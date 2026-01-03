// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

interface IFreelanceSBT {
    function balanceOf(address owner) external view returns (uint256);
}

contract FreelanceGovernance is Ownable {
    IFreelanceSBT public sbtContract;
    
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant MIN_REPUTATION_FOR_PROPOSAL = 5; // Must have 5 SBTs to propose

    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId);

    constructor(address _sbtContract) Ownable(msg.sender) {
        sbtContract = IFreelanceSBT(_sbtContract);
    }

    function createProposal(string calldata description) external {
        uint256 rep = sbtContract.balanceOf(msg.sender);
        require(rep >= MIN_REPUTATION_FOR_PROPOSAL, "Insufficient reputation to propose");

        proposalCount++;
        Proposal storage p = proposals[proposalCount];
        p.id = proposalCount;
        p.proposer = msg.sender;
        p.description = description;
        p.startTime = block.timestamp;
        p.endTime = block.timestamp + VOTING_PERIOD;

        emit ProposalCreated(proposalCount, msg.sender, description);
    }

    function vote(uint256 proposalId, bool support) external {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp >= p.startTime && block.timestamp <= p.endTime, "Voting not active");
        require(!p.hasVoted[msg.sender], "Already voted");

        uint256 weight = sbtContract.balanceOf(msg.sender);
        require(weight > 0, "No voting power");

        if (support) {
            p.forVotes += weight;
        } else {
            p.againstVotes += weight;
        }
        p.hasVoted[msg.sender] = true;

        emit Voted(proposalId, msg.sender, support, weight);
    }

    function executeProposal(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp > p.endTime, "Voting still active");
        require(!p.executed, "Already executed");
        require(p.forVotes > p.againstVotes, "Proposal didn't pass");

        p.executed = true;
        emit ProposalExecuted(proposalId);
        
        // In a real DAO, this would trigger on-chain actions via a Timelock or similar.
    }
}
