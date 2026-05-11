// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Job} from "./FreelanceTypes.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface IPrivacyShield {
    function isVerified(address user) external view returns (bool);
}

/**
 * @title FreelanceSovereignLibrary
 * @notice Handles sovereign identity, reputation, and reward interactions.
 */
library FreelanceSovereignLibrary {
    event CallFailed(address indexed target, string reason);

    function actuateSovereignReputation(
        address reputationContract,
        address freelancer,
        uint256 categoryId,
        uint8 rating
    ) external {
        if (reputationContract == address(0)) return;

        // Actuate XP
        (bool success, ) = reputationContract.call(
            abi.encodeWithSignature("actuateSovereignXP(address,uint256,uint256)", freelancer, categoryId, 1)
        );
        if (!success) emit CallFailed(reputationContract, "actuateSovereignXP");

        // Actuate Rating
        (success, ) = reputationContract.call(
            abi.encodeWithSignature("actuateRating(address,uint8)", freelancer, rating)
        );
        if (!success) emit CallFailed(reputationContract, "actuateRating");
    }

    function mintRewards(
        address polyToken,
        address freelancer,
        uint256 baseReward,
        bool isSupremeMember,
        uint256 supremeBoost,
        bool isPolyTokenJob
    ) external {
        if (polyToken == address(0)) return;

        uint256 reward = baseReward;
        if (isSupremeMember) reward *= supremeBoost;
        if (isPolyTokenJob) reward *= 2;

        (bool success, ) = polyToken.call(
            abi.encodeWithSignature("mint(address,uint256)", freelancer, reward)
        );
        if (!success) emit CallFailed(polyToken, "mintReward");
    }

    function mintJobNFT(
        address jobNFT,
        address freelancer,
        uint256 jobId,
        string calldata uri
    ) external {
        if (jobNFT == address(0)) return;
        (bool success, ) = jobNFT.call(
            abi.encodeWithSignature("safeMint(address,uint256,string)", freelancer, jobId, uri)
        );
        if (!success) emit CallFailed(jobNFT, "NFT Mint Failed");
    }

    function checkSupremeStatus(
        address user,
        uint256 categoryId,
        bool isSupremeStored,
        address reputationContract,
        uint256 reputationThreshold,
        address privacyShield
    ) external view returns (bool) {
        if (isSupremeStored) return true;
        
        if (reputationContract != address(0)) {
            try IERC1155(reputationContract).balanceOf(user, categoryId) returns (uint256 bal) {
                if (bal >= reputationThreshold) return true;
            } catch {}
        }
        
        if (privacyShield != address(0)) {
            try IPrivacyShield(privacyShield).isVerified(user) returns (bool verified) {
                return verified;
            } catch {}
        }
        
        return false;
    }
}
