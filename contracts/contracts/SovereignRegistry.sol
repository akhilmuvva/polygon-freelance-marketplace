// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Create2.sol";
import "./interfaces/IERC6551Registry.sol";

/**
 * @title SovereignRegistry
 * @notice ERC-6551 Registry for PolyLance Zenith.
 * Deploys Token Bound Accounts (TBAs) for Soulbound Reputation Tokens.
 */
contract SovereignRegistry is IERC6551Registry {
    error AccountCreationFailed();

    /**
     * @notice Deploys a new Token Bound Account for a specific NFT.
     */
    function createAccount(
        address implementation,
        bytes32 salt,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId
    ) external returns (address) {
        bytes memory code = _creationCode(implementation, salt, chainId, tokenContract, tokenId);

        address _account = Create2.computeAddress(salt, keccak256(code));

        if (_account.code.length != 0) return _account;

        _account = Create2.deploy(0, salt, code);

        if (_account == address(0)) revert AccountCreationFailed();

        emit ERC6551AccountCreated(_account, implementation, salt, chainId, tokenContract, tokenId);

        return _account;
    }

    /**
     * @notice Computes the address of a Token Bound Account without deploying it.
     */
    function account(
        address implementation,
        bytes32 salt,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId
    ) external view returns (address) {
        bytes32 bytecodeHash = keccak256(_creationCode(implementation, salt, chainId, tokenContract, tokenId));
        return Create2.computeAddress(salt, bytecodeHash);
    }

    function _creationCode(
        address implementation,
        bytes32 salt,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId
    ) internal pure returns (bytes memory) {
        return
            abi.encodePacked(
                hex"3d60ad80600a3d3981f3363d3d373d3d3d363d73",
                implementation,
                hex"5af43d82803e903d91602b57fd5bf3",
                abi.encode(salt, chainId, tokenContract, tokenId)
            );
    }
}
