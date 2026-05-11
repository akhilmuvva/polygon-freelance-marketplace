// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Job, JobStatus, Application} from "./FreelanceTypes.sol";
import {IYieldManager} from "./interfaces/IYieldManager.sol";

library FreelanceEscrowLibrary {
    using SafeERC20 for IERC20;

    /**
     * @notice Validates that a string is a valid IPFS CID (simple check for Qm... or bafy...).
     * @dev Prevents XSS via malicious metadata strings.
     */
    function validateCID(string calldata cid) internal pure {
        bytes memory b = bytes(cid);
        if (b.length < 46) revert("InvalidCID");
        // Simple check: most CIDs start with Qm (v0) or ba (v1)
        if (!((b[0] == 'Q' && b[1] == 'm') || (b[0] == 'b' && b[1] == 'a'))) revert("InvalidCIDFormat");
    }

    function sendFunds(address to, address token, uint256 amount) internal {
        if (token == address(0)) {
            (bool success, ) = payable(to).call{value: amount}("");
            require(success, "TransferFailed");
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    function withdrawFromYield(
        address yieldManager,
        uint8 strategy,
        address token,
        uint256 amount
    ) internal {
        if (yieldManager != address(0) && strategy != 0 && token != address(0)) {
            (bool success, ) = yieldManager.call(
                abi.encodeWithSignature("withdraw(uint8,address,uint256,address)", strategy, token, amount, address(this))
            );
            require(success, "YieldWithdrawFailed");
        }
    }

    function initializeJob(
        Job storage job,
        uint256 jobId,
        address client,
        address freelancer,
        address token,
        uint256 amount,
        uint256 deadline,
        string calldata ipfsHash,
        uint8 mCount,
        bool zkRequired,
        IYieldManager.Strategy yieldStrategy
    ) internal {
        job.id = uint32(jobId);
        job.client = client;
        job.freelancer = freelancer;
        job.token = token;
        job.amount = amount;
        job.ipfsHash = ipfsHash;
        job.deadline = uint48(deadline == 0 ? block.timestamp + 7 days : deadline);
        job.milestoneCount = mCount;
        job.zkRequired = zkRequired;
        job.yieldStrategy = yieldStrategy;
        job.status = (freelancer != address(0)) ? JobStatus.Accepted : JobStatus.Created;
    }

    function processRefund(
        Job storage job,
        Application[] storage apps,
        address yieldManager,
        mapping(address => mapping(address => uint256)) storage balances
    ) internal {
        job.status = JobStatus.Cancelled;
        job.paid = true;

        uint256 clientRefund = job.amount - job.totalPaidOut;
        uint256 totalToWithdraw = clientRefund;

        for (uint256 i = 0; i < apps.length; i++) {
            totalToWithdraw += apps[i].stake;
        }

        if (totalToWithdraw > 0 && yieldManager != address(0) && job.yieldStrategy != IYieldManager.Strategy.NONE && job.token != address(0)) {
            (bool success, ) = yieldManager.call(
                abi.encodeWithSignature("withdraw(uint8,address,uint256,address)", uint8(job.yieldStrategy), job.token, totalToWithdraw, address(this))
            );
            require(success, "YieldWithdrawFailed");
        }

        if (clientRefund > 0) {
            balances[job.client][job.token] += clientRefund;
        }

        for (uint256 i = 0; i < apps.length; i++) {
            if (apps[i].stake > 0) {
                balances[apps[i].freelancer][job.token] += apps[i].stake;
            }
        }
    }

    function handleFunding(
        address funder,
        address token, 
        uint256 amount, 
        IYieldManager.Strategy yieldStrategy,
        address paymentToken, 
        uint256 paymentAmount, 
        uint256 minAmountOut,
        address swapManager,
        address yieldManager,
        uint256 val
    ) external returns (uint256 actualAmount, IYieldManager.Strategy actualStrategy) {
        actualAmount = amount;

        if (paymentToken != token && swapManager != address(0)) {
            if (paymentToken != address(0)) {
                IERC20(paymentToken).safeTransferFrom(funder, address(this), paymentAmount);
                IERC20(paymentToken).forceApprove(swapManager, paymentAmount);
            } else {
                if (val != paymentAmount) revert("LowValue");
            }
            
            (bool success, bytes memory data) = swapManager.call{value: paymentToken == address(0) ? val : 0}(
                abi.encodeWithSignature("swap(address,address,uint256,uint256,address)", paymentToken, token, paymentAmount, minAmountOut, address(this))
            );
            require(success, "SwapFailed");
            actualAmount = abi.decode(data, (uint256));
        } else {
            if (token != address(0)) {
                IERC20(token).safeTransferFrom(funder, address(this), amount);
            } else {
                if (val != amount) revert("LowValue");
            }
        }

        if (yieldManager != address(0) && token != address(0)) {
            actualStrategy = yieldStrategy;
            if (actualStrategy != IYieldManager.Strategy.NONE) {
                IERC20(token).forceApprove(yieldManager, actualAmount);
                (bool success, ) = yieldManager.call(
                    abi.encodeWithSignature("deposit(uint8,address,uint256)", uint8(actualStrategy), token, actualAmount)
                );
                if (!success) actualStrategy = IYieldManager.Strategy.NONE;
            }
        } else {
            actualStrategy = IYieldManager.Strategy.NONE;
        }
    }

    function handleApplication(
        Job storage job,
        Application[] storage apps,
        mapping(uint256 => mapping(address => bool)) storage hasApplied,
        address freelancer,
        uint256 val,
        address privacyShield,
        address yieldManager
    ) external {
        if (job.client == address(0)) revert("InvalidAddress");
        if (job.status != JobStatus.Created) revert("InvalidStatus");
        if (apps.length >= 50) revert("MaxApplicationsReached"); // Enforce MAX_APPLICATIONS_PER_JOB
        if (hasApplied[job.id][freelancer]) revert("AlreadyApplied");
        
        if (job.zkRequired && privacyShield != address(0)) {
            (bool success, bytes memory data) = privacyShield.call(
                abi.encodeWithSignature("isVerified(address)", freelancer)
            );
            if (!success || !abi.decode(data, (bool))) revert("NotVerified");
        }

        uint256 stake = (job.amount * 5) / 100; // APPLICATION_STAKE_PERCENT
        if (job.token != address(0)) {
            IERC20(job.token).safeTransferFrom(freelancer, address(this), stake);
            if (yieldManager != address(0) && job.yieldStrategy != IYieldManager.Strategy.NONE) {
                 IERC20(job.token).forceApprove(yieldManager, stake);
                 (bool s, ) = yieldManager.call(
                     abi.encodeWithSignature("deposit(uint8,address,uint256)", uint8(job.yieldStrategy), job.token, stake)
                 );
                 (s);
            }
        } else {
            if (val != stake) revert("LowValue");
        }

        apps.push(Application(freelancer, stake));
        hasApplied[job.id][freelancer] = true;
    }

    function handlePicking(
        Job storage job,
        Application[] storage apps,
        address freelancer,
        address yieldManager,
        mapping(address => mapping(address => uint256)) storage balances
    ) external {
        if (job.status != JobStatus.Created) revert("InvalidStatus");
        
        uint256 totalStakeToWithdraw = 0;
        bool found;
        for (uint256 i = 0; i < apps.length; i++) {
            if (apps[i].freelancer == freelancer) {
                job.freelancerStake = apps[i].stake;
                found = true;
            } else {
                totalStakeToWithdraw += apps[i].stake;
                balances[apps[i].freelancer][job.token] += apps[i].stake;
            }
        }
        if (!found) revert("FreelancerNotApplicant");

        if (totalStakeToWithdraw > 0 && yieldManager != address(0) && job.yieldStrategy != IYieldManager.Strategy.NONE && job.token != address(0)) {
            (bool success, ) = yieldManager.call(
                abi.encodeWithSignature("withdraw(uint8,address,uint256,address)", uint8(job.yieldStrategy), job.token, totalStakeToWithdraw, address(this))
            );
            require(success, "YieldWithdrawFailed");
        }

        job.freelancer = freelancer;
        job.status = JobStatus.Accepted;
    }
}
