// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IFreelanceSBT
 * @notice Reputation source for the Antigravity DAO.
 */
interface IFreelanceSBT {
    function balanceOf(address owner) external view returns (uint256);
    function burn(address from, uint256 amount) external;
}

/**
 * @title IAvatar
 * @notice Interface for the Gnosis Safe (Treasury).
 */
interface IAvatar {
    function execTransactionFromModule(address to, uint256 value, bytes calldata data, uint8 operation) external returns (bool);
}

/**
 * @title AntigravityGovernance
 * @notice Implements Baal-style Ragequit and Conviction Voting.
 * This is the "Autonomous Equilibrium" phase where the protocol becomes a public good.
 */
contract AntigravityGovernance is Ownable, ReentrancyGuard {
    IFreelanceSBT public sbtContract;
    address public zodiacModule;
    address public treasury; // The Gnosis Safe address
    address public antigravityAgent; // The AGA address allowed to trigger failsafe
    address public activeEscrow;
    bool public protocolFrozen;

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        address target;
        bytes data;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        bool isConviction;
        uint256 convictionThreshold;
        uint256 totalConviction;
        mapping(address => uint256) userConviction;
        mapping(address => uint256) lastUpdate;
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    
    // Conviction constants
    uint256 public constant D = 10000; // Multiplier for decimals
    uint256 public constant ALPHA = 9000; // 0.9 decay
    
    // Ragequit status
    uint256 public constant GRACE_PERIOD = 2 days;
    mapping(uint256 => uint256) public proposalPassedTimestamp;

    event ProposalCreated(uint256 indexed id, address indexed proposer, string description);
    event ConvictionStaked(uint256 indexed proposalId, address indexed user, uint256 amount);
    event ProposalExecuted(uint256 indexed id);
    event Ragequit(address indexed user, uint256 sbtAmount, address[] tokens);
    event EmergencyFreezeTriggered(address indexed agent, string reason);

    constructor(address _sbt, address _zodiac, address _treasury, address _agent, address _escrow) Ownable(msg.sender) {
        sbtContract = IFreelanceSBT(_sbt);
        zodiacModule = _zodiac;
        treasury = _treasury;
        antigravityAgent = _agent;
        activeEscrow = _escrow;
    }

    /**
     * @notice Trigger Emergency Failsafe: Freezes the protocol if a centralization attack is detected.
     */
    function triggerEmergencyFreeze(string calldata reason) external {
        require(msg.sender == antigravityAgent || msg.sender == owner(), "Unauthorized");
        protocolFrozen = true;
        
        // Trigger global freeze on Escrow
        if (activeEscrow != address(0)) {
            (bool success, ) = activeEscrow.call(abi.encodeWithSignature("sovereignFreeze()"));
            require(success, "Global Escrow Freeze failed");
        }
        
        emit EmergencyFreezeTriggered(msg.sender, reason);
    }



    /**
     * @notice Create a proposal that conviction-accrues weight over time.
     */
    function createConvictionProposal(
        string calldata description,
        address target,
        bytes calldata data,
        uint256 threshold
    ) external {
        require(sbtContract.balanceOf(msg.sender) >= 5, "Reputation too low");
        
        proposalCount++;
        Proposal storage p = proposals[proposalCount];
        p.id = proposalCount;
        p.proposer = msg.sender;
        p.description = description;
        p.target = target;
        p.data = data;
        p.isConviction = true;
        p.convictionThreshold = threshold;
        p.startTime = block.timestamp;
        
        emit ProposalCreated(proposalCount, msg.sender, description);
    }

    /**
     * @notice Stake reputation into a proposal to grow its conviction.
     * Conviction = last_conviction * alpha + weight * (1 - alpha)
     */
    function stakeConviction(uint256 proposalId) external nonReentrant {
        Proposal storage p = proposals[proposalId];
        require(p.isConviction, "Not conviction proposal");
        require(!p.executed, "Already executed");

        _updateConviction(proposalId, msg.sender);
        
        uint256 weight = sbtContract.balanceOf(msg.sender);
        p.userConviction[msg.sender] = weight * D; // Normalized start
        p.lastUpdate[msg.sender] = block.timestamp;

        emit ConvictionStaked(proposalId, msg.sender, weight);
    }

    /**
     * @notice Updates the total conviction of a proposal.
     */
    function _updateConviction(uint256 proposalId, address user) internal {
        Proposal storage p = proposals[proposalId];
        uint256 weight = sbtContract.balanceOf(user);
        uint256 timePassed = block.timestamp - p.lastUpdate[user];
        
        if (timePassed > 0 && p.lastUpdate[user] > 0) {
            // Simplified alpha growth over time steps
            // conviction[t] = conviction[t-1] * a^n + weight * (1-a)/(1-a) * (1-a^n)
            // For the prototype, we use a simpler accumulation with a cap
            uint256 maxConviction = (weight * D) / (D - ALPHA);
            p.totalConviction += (maxConviction * timePassed) / 100; // Scaled growth
        }
        
        p.lastUpdate[user] = block.timestamp;
    }

    /**
     * @notice Ragequit: If a user disagrees with the DAO's direction,
     * they can burn their reputation and take their proportional share of the treasury.
     * This is the ultimate "Antigravity" mechanic—it prevents majority tyranny.
     */
    function ragequit(uint256 amount, address[] calldata tokens) external nonReentrant {
        uint256 userSBT = sbtContract.balanceOf(msg.sender);
        require(userSBT >= amount, "Insufficient reputation to ragequit");
        require(amount > 0, "Amount must be > 0");

        // 1. Calculate the share percentage (User SBT / Total SBT in existence)
        // For simplicity, we assume we can query total supply or use a fixed scaling
        // In this implementation, we burn the SBT and trigger a treasury transfer
        
        sbtContract.burn(msg.sender, amount);

        // 2. Trigger the Zodiac module to transfer funds from the Safe to the user
        // This requires the DAO to have pre-authorized this module for ragequit logic
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 balance = IERC20(tokens[i]).balanceOf(treasury);
            uint256 userShare = (balance * amount) / 1000; // Assume 1000 is total SBT supply for proto
            
            if (userShare > 0) {
                bytes memory transferData = abi.encodeWithSignature("transfer(address,uint256)", msg.sender, userShare);
                (bool success, ) = zodiacModule.call(
                    abi.encodeWithSignature("orchestrateExecution(address,uint256,bytes)", tokens[i], 0, transferData)
                );
                require(success, "Ragequit: Treasury transfer failed");
            }
        }

        emit Ragequit(msg.sender, amount, tokens);
    }

    /**
     * @notice Execute a proposal if it has reached its conviction threshold.
     */
    function executeConviction(uint256 proposalId) external nonReentrant {
        Proposal storage p = proposals[proposalId];
        require(p.isConviction, "Not conviction proposal");
        require(!p.executed, "Already executed");
        require(p.totalConviction >= p.convictionThreshold, "Conviction threshold not met");

        p.executed = true;
        
        // Execute through Zodiac Module
        (bool success, ) = zodiacModule.call(
            abi.encodeWithSignature("orchestrateExecution(address,uint256,bytes)", p.target, 0, p.data)
        );
        require(success, "Governance: Zodiac execution failed");

        emit ProposalExecuted(proposalId);
    }
}
