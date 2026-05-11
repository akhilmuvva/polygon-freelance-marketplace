// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IFreelanceSBT.sol";

interface IReputation {
    function actuateSovereignReputation(address freelancer, uint256 categoryId, uint8 rating) external;
}

interface IPolyToken {
    function mint(address to, uint256 amount) external;
}

interface IFreelanceJobNFT {
    function safeMint(address to, uint256 tokenId, string memory uri) external;
}

library FreelanceSovereignLibrary {
    function checkSupremeStatus(
        address freelancer,
        uint256 categoryId,
        bool isSupreme,
        address reputationContract,
        uint256 reputationThreshold,
        address privacyShield
    ) external view returns (bool) {
        if (isSupreme) return true;
        
        // Reputation Check
        if (reputationContract != address(0)) {
            // Simplified
        }

        // Privacy Shield Check (Private Verification)
        if (privacyShield != address(0)) {
            (bool success, bytes memory data) = privacyShield.staticcall(
                abi.encodeWithSignature("isVerified(address)", freelancer)
            );
            if (success && abi.decode(data, (bool))) return true;
        }

        return false;
    }

    function actuateSovereignReputation(
        address reputationContract,
        address freelancer,
        uint256 categoryId,
        uint8 rating
    ) external {
        if (reputationContract != address(0)) {
            (bool success, ) = reputationContract.call(
                abi.encodeWithSignature("actuateSovereignReputation(address,uint256,uint8)", freelancer, categoryId, rating)
            );
            (success);
        }
    }

    function mintRewards(
        address polyToken,
        address to,
        uint256 baseAmount,
        bool isSupreme,
        uint256 boost,
        bool isNativeToken
    ) external {
        if (polyToken != address(0)) {
            uint256 amount = baseAmount;
            if (isSupreme) amount *= boost;
            if (isNativeToken) amount *= 2; 

            (bool success, ) = polyToken.call(
                abi.encodeWithSignature("mint(address,uint256)", to, amount)
            );
            (success);
        }
    }

    function handleSBTContribution(
        address sbtContract,
        address to,
        uint256 categoryId,
        uint256 jobId,
        address client,
        string calldata ipfsHash
    ) external {
        if (sbtContract != address(0)) {
            // Explicit cast to uint16
            try IFreelanceSBT(sbtContract).mintContribution(to, uint16(categoryId), 5, jobId, client) {} catch {
                (bool s, ) = sbtContract.call(abi.encodeWithSignature("safeMint(address,string)", to, ipfsHash));
                (s);
            }
        }
    }
    
    function calculateCompletionFees(
        uint256 amount,
        uint256 totalPaidOut,
        uint256 gravityFactor,
        uint256 basisPointsDivisor,
        bool isSupremeMember
    ) external pure returns (uint256 payout, uint256 fee, uint256 freelancerNet) {
        payout = amount - totalPaidOut;
        if (isSupremeMember) {
            fee = 0;
        } else {
            fee = (amount * gravityFactor) / basisPointsDivisor;
            if (fee > payout) fee = payout;
        }
        freelancerNet = payout - fee;
    }

    function mintJobNFT(address nftContract, address to, uint256 jobId, string calldata uri) external {
        if (nftContract != address(0)) {
            IFreelanceJobNFT(nftContract).safeMint(to, jobId, uri);
        }
    }
}
