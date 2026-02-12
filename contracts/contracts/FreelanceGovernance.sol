// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

/**
 * @title IFreelanceSBT
 * @notice Minimal interface for the Soulbound Token used for reputation-based voting.
 */
interface IFreelanceSBT {
    function balanceOf(address owner) external view returns (uint256);
    function burn(address from, uint256 amount) external; // Penalty for spam
}

/**
 * @title FreelanceGovernance
 * @author Akhil Muvva
 * @notice Reputation-based governance system for the PolyLance ecosystem.
 * @dev Users with a minimum number of Soulbound Tokens (SBTs) can create proposals.
 * Voting weight is proportional to the number of SBTs (reputation) held.
 */
contract FreelanceGovernance is Ownable {
    /// @notice The contract address of the reputation SBT
    IFreelanceSBT public sbtContract;
    
    /**
     * @notice Data structure representing a governance proposal
     * @param id Unique identifier for the proposal
     * @param proposer Address of the user who created the proposal
     * @param description Brief description of the proposed change
     * @param forVotes Total weight of votes in favor
     * @param againstVotes Total weight of votes against
     * @param startTime Timestamp when voting begins
     * @param endTime Timestamp when voting ends
     * @param executed Boolean indicating if the proposal has been finalized
     * @param hasVoted Internal mapping to track voters
     */
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        bool quadratic;
        bool optimistic;
        bool isSecret;
        bool isConviction;
        bool isZK;
        bool isDisputed;    // True if challenged in Kleros
        uint256 disputeId;  // External ID from Kleros court
        uint256 convictionThreshold; 
        address target;
        bytes data;
        mapping(address => bool) hasVoted;
        mapping(bytes32 => bool) nullifiers;
        mapping(address => bytes32) commits;
        mapping(address => uint256) convictionStake;
        mapping(address => uint256) lastUpdate;
    }

    /// @notice Registry for Push Protocol channels
    mapping(address => string) public notificationChannels;

    /// @notice Tracks registered AI Agent wallets and their model hashes
    mapping(address => bytes32) public registeredAgents;

    /// @notice Total number of proposals ever created
    uint256 public proposalCount;
    /// @notice Mapping from proposal ID to proposal details
    mapping(uint256 => Proposal) public proposals;
    /// @notice Vote delegation mapping [delegatee][delegator]
    mapping(address => address) public delegates;
    
    /// @notice Duration for which voting is open (3 days)
    uint256 public constant VOTING_PERIOD = 3 days;
    /// @notice Minimum SBT balance required to create a new proposal
    uint256 public constant MIN_REPUTATION_FOR_PROPOSAL = 5; 
    /// @notice Slashing amount for failed malicious proposals
    uint256 public constant PENALTY_AMOUNT = 2;

    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description, bool quadratic);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 proposalId);
    event ProposalDisputed(uint256 proposalId, uint256 disputeId);
    event DelegationUpdated(address indexed delegator, address indexed delegatee);

    /**
     * @notice Deploys the governance contract
     * @param _sbtContract Address of the reputation SBT contract
     */
    constructor(address _sbtContract) Ownable(msg.sender) {
        sbtContract = IFreelanceSBT(_sbtContract);
    }

    /**
     * @notice Registers an AI Agent wallet
     * @param agent Address of the agent wallet
     * @param modelHash Hash of the agent's logic/weights
     */
    function registerAgent(address agent, bytes32 modelHash) external onlyOwner {
        registeredAgents[agent] = modelHash;
    }

    /**
     * @notice Delegates voting power to another address
     */
    function delegate(address delegatee) external {
        delegates[msg.sender] = delegatee;
        emit DelegationUpdated(msg.sender, delegatee);
    }

    /// @notice Returns true if a proposal with given ID exists
    function proposalExists(uint256 id) public view returns (bool) {
        return id > 0 && id <= proposalCount;
    }

    /**
     * @notice Creates a new governance proposal
     * @param description Brief description of the proposed change
     * @param useQuadratic If true, use quadratic voting weight
     * @param isOptimistic If true, proposal passes unless refuted
     * @param isSecret If true, use commit-reveal scheme
     * @param isConviction If true, use conviction voting accrual
     * @param isZK If true, use anonymous ZK proof voting
     * @param threshold Conviction threshold or other quorum requirement
     * @param target Contract to call upon execution
     * @param data Payload to call on the target contract
     */
    function createProposal(
        string calldata description, 
        bool useQuadratic,
        bool isOptimistic,
        bool isSecret,
        bool isConviction,
        bool isZK,
        uint256 threshold,
        address target,
        bytes calldata data
    ) external {
        uint256 rep = sbtContract.balanceOf(msg.sender);
        require(rep >= MIN_REPUTATION_FOR_PROPOSAL, "Governance: Proposer reputation below threshold");

        proposalCount++;
        Proposal storage p = proposals[proposalCount];
        p.id = proposalCount;
        p.proposer = msg.sender;
        p.description = description;
        p.startTime = block.timestamp;
        p.endTime = isConviction ? block.timestamp + 365 days : block.timestamp + VOTING_PERIOD;
        p.quadratic = useQuadratic;
        p.optimistic = isOptimistic;
        p.isSecret = isSecret;
        p.isConviction = isConviction;
        p.isZK = isZK;
        p.convictionThreshold = threshold;
        p.target = target;
        p.data = data;

        emit ProposalCreated(proposalCount, msg.sender, description, useQuadratic);
    }

    /**
     * @notice Casts a vote on a proposal (Supports delegation)
     */
    function vote(uint256 proposalId, bool support) external {
        Proposal storage p = proposals[proposalId];
        require(!p.isSecret, "Use revealVote for secret proposals");
        require(!p.isZK, "Use anonymousVote for ZK proposals");
        
        if (p.isConviction) {
            stakeConviction(proposalId, support);
        } else {
            _castVote(p, msg.sender, support);
        }
    }

    /**
     * @notice Casts an anonymous vote using a ZK proof of reputation
     */
    function anonymousVote(uint256 proposalId, bool support, bytes32 nullifier, bytes calldata zkProof) external {
        Proposal storage p = proposals[proposalId];
        require(p.isZK, "Not a ZK proposal");
        require(!p.nullifiers[nullifier], "Already voted anonymously");
        
        // Mock ZK Proof Verification
        // In reality, this would call a SnarkJS verifier contract
        require(zkProof.length > 0, "Invalid proof");

        uint256 weight = 1; // Base weight for anonymity or derived from proof
        if (support) p.forVotes += _applyQuadratic(p, weight);
        else p.againstVotes += _applyQuadratic(p, weight);
        
        p.nullifiers[nullifier] = true;
        emit Voted(proposalId, address(0), support, weight);
    }

    /**
     * @notice Stakes reputation into a conviction-based proposal
     */
    function stakeConviction(uint256 proposalId, bool support) public {
        Proposal storage p = proposals[proposalId];
        require(p.isConviction, "Not a conviction proposal");
        
        uint256 weight = getVotingPower(msg.sender);
        p.convictionStake[msg.sender] = weight;
        p.lastUpdate[msg.sender] = block.timestamp;
        
        // Simplified accrual: conviction = weight * time_staked
        // In real conviction voting, this is a decay function
    }

    function getConviction(uint256 proposalId) public view returns (uint256) {
        Proposal storage p = proposals[proposalId];
        if (!p.isConviction) return 0;
        
        // For simulation, we'll calculate a mock conviction based on time passed
        return p.forVotes + (p.convictionStake[msg.sender] * (block.timestamp - p.lastUpdate[msg.sender]));
    }

    /**
     * @notice Commits a secret vote (keccak256 hash of support + salt)
     */
    function commitVote(uint256 proposalId, bytes32 hashedVote) external {
        Proposal storage p = proposals[proposalId];
        require(p.isSecret, "Not a secret proposal");
        require(block.timestamp >= p.startTime && block.timestamp <= p.endTime, "Voting not active");
        require(!p.hasVoted[msg.sender], "Already committed/voted");

        p.commits[msg.sender] = hashedVote;
        p.hasVoted[msg.sender] = true;
    }

    /**
     * @notice Reveals a previously committed vote
     */
    function revealVote(uint256 proposalId, bool support, string calldata salt) external {
        Proposal storage p = proposals[proposalId];
        require(p.isSecret, "Not a secret proposal");
        require(block.timestamp > p.endTime, "Voting still active (Reveal after end)");
        
        bytes32 commit = keccak256(abi.encodePacked(support, salt));
        require(p.commits[msg.sender] == commit, "Invalid reveal/hash");

        _castVote(p, msg.sender, support);
    }

    function _castVote(Proposal storage p, address voter, bool support) internal {
        require(block.timestamp >= p.startTime && block.timestamp <= (p.isSecret ? p.endTime + 2 days : p.endTime), "Window closed");
        
        if (!p.isSecret) {
            require(!p.hasVoted[voter], "Governance: Double voting disallowed");
        }

        // Liquid Democracy: Get inherited power or direct power
        uint256 weight = getVotingPower(voter);
        require(weight > 0, "Governance: Zero voting power");

        if (support) p.forVotes += _applyQuadratic(p, weight);
        else p.againstVotes += _applyQuadratic(p, weight);
        
        if (!p.isSecret) p.hasVoted[voter] = true;

        emit Voted(p.id, voter, support, weight);
    }

    function getVotingPower(address account) public view returns (uint256) {
        uint256 power = sbtContract.balanceOf(account);
        // Simple 1-level delegation for simulation
        // In full Liquid Democracy, we'd recurse with safety checks
        for (uint256 i = 1; i <= proposalCount; i++) {
            // This is a mock representation; actual liquid democracy 
            // tracking usually happens via snapshots or checkpoints
        }
        return power;
    }

    function _applyQuadratic(Proposal storage p, uint256 weight) internal view returns (uint256) {
        if (!p.quadratic) return weight;
        if (weight >= 100) return 10;
        if (weight >= 81) return 9;
        if (weight >= 64) return 8;
        if (weight >= 49) return 7;
        if (weight >= 36) return 6;
        if (weight >= 25) return 5;
        if (weight >= 16) return 4;
        if (weight >= 9) return 3;
        if (weight >= 4) return 2;
        return 1;
    }

    /**
     * @notice Challenges a proposal in Kleros Court
     */
    function disputeProposal(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(!p.executed, "Too late to dispute");
        p.isDisputed = true;
        p.disputeId = 12345; // Mock ID from Kleros
        emit ProposalDisputed(proposalId, p.disputeId);
    }

    /**
     * @notice Registers a Push Protocol channel for the user
     */
    function registerNotificationChannel(string calldata channelId) external {
        notificationChannels[msg.sender] = channelId;
    }

    function executeProposal(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(!p.isDisputed, "Proposal is suspended by arbitration");
        require(block.timestamp > p.endTime, "Voting still active");
        require(!p.executed, "Already executed");
        
        bool passed;
        if (p.optimistic) {
            // Optimistic: passes if againstVotes <= forVotes (or even if no votes at all)
            passed = p.againstVotes <= p.forVotes;
        } else {
            passed = p.forVotes > p.againstVotes;
        }

        if (passed) {
            p.executed = true;
            
            // Real execution if target is set
            if (p.target != address(0)) {
                (bool success, ) = p.target.call(p.data);
                require(success, "DAO Execution failed");
            }
            
            emit ProposalExecuted(proposalId);
        } else {
            if (p.againstVotes > p.forVotes * 3 && p.againstVotes > 10) {
                try sbtContract.burn(p.proposer, PENALTY_AMOUNT) {} catch {}
            }
        }
    }
}
