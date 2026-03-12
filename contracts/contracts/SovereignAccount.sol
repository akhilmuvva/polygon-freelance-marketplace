// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC1271.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "./interfaces/IERC6551Account.sol";

/**
 * @title SovereignAccount
 * @notice The Smart Contract Account implementation for PolyLance Zenith.
 * Supports ERC-6551 (Token Bound Accounts) and ERC-4337 Session Keys via Biconomy logic.
 */
contract SovereignAccount is IERC165, IERC1271, IERC6551Account {
    uint256 public state;

    struct SessionKey {
        uint48 validUntil;
        uint48 validAfter;
        address sessionKey;
        bytes permissions; // Encoded permissions for specific AGA tasks
    }

    mapping(address => SessionKey) public sessions;

    receive() external payable {}

    /**
     * @notice Execute a transaction. Only callable by the owner (SBT holder) or an active Session Key.
     */
    function execute(
        address dest,
        uint256 value,
        bytes calldata func
    ) external returns (bytes memory) {
        require(_isValidSigner(msg.sender), "Invalid signer");
        require(dest != address(0), "Invalid destination");

        state++;

        (bool success, bytes memory result) = dest.call{value: value}(func);
        require(success, "Execution failed");

        return result;
    }

    /**
     * @notice Authorize an AGA Session Intent.
     */
    function authorizeSession(
        address sessionKey,
        uint48 validUntil,
        bytes calldata permissions
    ) external {
        require(msg.sender == owner(), "Only owner can authorize sessions");
        sessions[sessionKey] = SessionKey({
            validUntil: validUntil,
            validAfter: uint48(block.timestamp),
            sessionKey: sessionKey,
            permissions: permissions
        });
    }

    function owner() public view returns (address) {
        (uint256 chainId, address tokenContract, uint256 tokenId) = token();
        if (chainId != block.chainid) return address(0);

        return IERC721(tokenContract).ownerOf(tokenId);
    }

    function token()
        public
        view
        returns (
            uint256,
            address,
            uint256
        )
    {
        bytes memory footer = new bytes(0x60);

        assembly {
            extcodecopy(address(), add(footer, 0x20), 0x4d, 0x60)
        }

        return abi.decode(footer, (uint256, address, uint256));
    }

    function isValidSigner(address signer, bytes calldata)
        external
        view
        returns (bytes4)
    {
        if (_isValidSigner(signer)) {
            return IERC6551Account.isValidSigner.selector;
        }

        return bytes4(0);
    }

    function isValidSignature(bytes32 hash, bytes calldata signature)
        external
        view
        returns (bytes4)
    {
        if (SignatureChecker.isValidSignatureNow(owner(), hash, signature)) {
            return IERC1271.isValidSignature.selector;
        }

        return bytes4(0);
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return
            interfaceId == type(IERC165).interfaceId ||
            interfaceId == type(IERC6551Account).interfaceId;
    }

    function _isValidSigner(address signer) internal view returns (bool) {
        if (signer == owner()) return true;

        SessionKey memory session = sessions[signer];
        if (
            session.sessionKey != address(0) &&
            block.timestamp <= session.validUntil &&
            block.timestamp >= session.validAfter
        ) {
            return true;
        }

        return false;
    }
}
