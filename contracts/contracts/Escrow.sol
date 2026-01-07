// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Escrow
 * @dev Secure, gas-optimized escrow system for freelance jobs with milestone-based payments and arbitration.
 * Optimized for Polygon PoS.
 */
contract Escrow is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ARBITRATOR_ROLE = keccak256("ARBITRATOR_ROLE");

    enum JobStatus { Created, Active, Completed, Disputed, Cancelled }

    struct Milestone {
        uint256 amount;
        bool isReleased;
    }

    struct Job {
        address client;
        address freelancer;
        address token; // address(0) for MATIC
        uint256 totalAmount;
        uint256 remainingAmount;
        JobStatus status;
        uint256 milestoneCount;
    }

    mapping(uint256 => Job) public jobs;
    mapping(uint256 => mapping(uint256 => Milestone)) public jobMilestones;
    uint256 public jobCount;

    event JobCreated(uint256 indexed jobId, address indexed client, address indexed freelancer, address token, uint256 amount);
    event FundsDeposited(uint256 indexed jobId, uint256 amount);
    event PaymentReleased(uint256 indexed jobId, uint256 milestoneId, uint256 amount);
    event JobResolved(uint256 indexed jobId, JobStatus finalStatus);

    error InvalidAmount();
    error Unauthorized();
    error InvalidStatus();
    error MilestoneAlreadyReleased();
    error InvalidMilestone();
    error TransferFailed();

    constructor(address initialAdmin, address initialArbitrator) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(ARBITRATOR_ROLE, initialArbitrator);
    }

    /**
     * @dev Creates a new job and optionally deposits funds.
     * @param freelancer The address of the freelancer.
     * @param token The ERC20 token address (address(0) for MATIC).
     * @param totalAmount Total payment for the job.
     * @param amounts Array of milestone amounts.
     */
    function createJob(
        address freelancer,
        address token,
        uint256 totalAmount,
        uint256[] calldata amounts
    ) external payable nonReentrant returns (uint256 jobId) {
        if (totalAmount == 0) revert InvalidAmount();
        
        uint256 calculatedTotal = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            calculatedTotal += amounts[i];
        }
        if (calculatedTotal != totalAmount) revert InvalidAmount();

        jobId = ++jobCount;
        Job storage job = jobs[jobId];
        job.client = msg.sender;
        job.freelancer = freelancer;
        job.token = token;
        job.totalAmount = totalAmount;
        job.remainingAmount = totalAmount;
        job.status = JobStatus.Created;
        job.milestoneCount = amounts.length;

        for (uint256 i = 0; i < amounts.length; i++) {
            jobMilestones[jobId][i] = Milestone({
                amount: amounts[i],
                isReleased: false
            });
        }

        if (token == address(0)) {
            if (msg.value != totalAmount) revert InvalidAmount();
        } else {
            IERC20(token).safeTransferFrom(msg.sender, address(this), totalAmount);
        }

        job.status = JobStatus.Active;

        emit JobCreated(jobId, msg.sender, freelancer, token, totalAmount);
        emit FundsDeposited(jobId, totalAmount);
    }

    /**
     * @dev Releases a milestone payment to the freelancer.
     * @param jobId The ID of the job.
     * @param milestoneId The index of the milestone.
     */
    function releaseMilestone(uint256 jobId, uint256 milestoneId) external nonReentrant {
        Job storage job = jobs[jobId];
        if (msg.sender != job.client) revert Unauthorized();
        if (job.status != JobStatus.Active) revert InvalidStatus();
        
        Milestone storage milestone = jobMilestones[jobId][milestoneId];
        if (milestoneId >= job.milestoneCount) revert InvalidMilestone();
        if (milestone.isReleased) revert MilestoneAlreadyReleased();

        milestone.isReleased = true;
        job.remainingAmount -= milestone.amount;

        _sendFunds(job.freelancer, job.token, milestone.amount);

        emit PaymentReleased(jobId, milestoneId, milestone.amount);

        if (job.remainingAmount == 0) {
            job.status = JobStatus.Completed;
            emit JobResolved(jobId, JobStatus.Completed);
        }
    }

    /**
     * @dev Resolves a dispute between client and freelancer.
     * @param jobId The ID of the job.
     * @param releaseToFreelancer Whether to release remaining funds to the freelancer or refund the client.
     */
    function resolveDispute(uint256 jobId, bool releaseToFreelancer) external onlyRole(ARBITRATOR_ROLE) nonReentrant {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Active && job.status != JobStatus.Disputed) revert InvalidStatus();

        uint256 amount = job.remainingAmount;
        job.remainingAmount = 0;
        
        address recipient = releaseToFreelancer ? job.freelancer : job.client;
        job.status = releaseToFreelancer ? JobStatus.Completed : JobStatus.Cancelled;

        _sendFunds(recipient, job.token, amount);

        emit JobResolved(jobId, job.status);
    }

    /**
     * @dev Flags a job as disputed.
     * @param jobId The ID of the job.
     */
    function disputeJob(uint256 jobId) external {
        Job storage job = jobs[jobId];
        if (msg.sender != job.client && msg.sender != job.freelancer) revert Unauthorized();
        if (job.status != JobStatus.Active) revert InvalidStatus();

        job.status = JobStatus.Disputed;
    }

    function _sendFunds(address to, address token, uint256 amount) internal {
        if (token == address(0)) {
            (bool success, ) = payable(to).call{value: amount}("");
            if (!success) revert TransferFailed();
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    /**
     * @dev Allows admin to change the arbitrator.
     */
    function setArbitrator(address newArbitrator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(ARBITRATOR_ROLE, newArbitrator);
    }

    receive() external payable {}
}
