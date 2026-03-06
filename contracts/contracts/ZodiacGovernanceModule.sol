// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IAvatar
 * @notice Interface for a Gnosis Safe or similar Zodiac-compatible avatar.
 */
interface IAvatar {
    function execTransactionFromModule(
        address to,
        uint256 value,
        bytes calldata data,
        uint8 operation
    ) external returns (bool success);
}

/**
 * @title ZodiacGovernanceModule
 * @notice Transitioning from "Admin" to "Orchestrator" using the Zodiac pattern.
 * This module allows the PolyLance DAO to execute cross-chain transactions through a Gnosis Safe.
 */
contract ZodiacGovernanceModule is Ownable {
    /// @notice The Gnosis Safe address that acts as the platform treasury and protocol owner.
    IAvatar public avatar;

    /// @notice Reality.eth integration (Oracle modules)
    address public realityOracle;

    /// @notice The governance contract that can trigger this orchestrator.
    address public controller;

    event ExecutionTriggered(address indexed target, uint256 value, bytes data);
    event AvatarUpdated(address indexed newAvatar);
    event ControllerUpdated(address indexed newController);

    constructor(address _avatar, address _realityOracle, address _controller) Ownable(msg.sender) {
        avatar = IAvatar(_avatar);
        realityOracle = _realityOracle;
        controller = _controller;
    }

    /**
     * @notice Updates the Avatar (Gnosis Safe).
     */
    function setAvatar(address _avatar) external onlyOwner {
        avatar = IAvatar(_avatar);
        emit AvatarUpdated(_avatar);
    }

    /**
     * @notice Updates the Governance Controller.
     */
    function setController(address _controller) external onlyOwner {
        controller = _controller;
        emit ControllerUpdated(_controller);
    }

    /**
     * @notice Executes a transaction through the Safe.
     * This is the "Orchestration" step. The DAO votes, and this module triggers the Safe.
     */
    function orchestrateExecution(
        address to,
        uint256 value,
        bytes calldata data
    ) external {
        // Antigravity Security: Only the governance contract can trigger execution.
        require(msg.sender == controller, "Zodiac: Unauthorized controller");
        
        // Operation 0 is a standard Call
        bool success = avatar.execTransactionFromModule(to, value, data, 0);
        require(success, "Zodiac: Orchestrated execution failed");

        emit ExecutionTriggered(to, value, data);
    }


    /**
     * @notice Integrates with Reality.eth to allow off-chain outcomes (like manual arbitration)
     * to trigger on-chain Safe transactions.
     */
    function triggerRealityExecution(bytes32 questionId, bytes calldata data) external {
        // Verification of Reality.eth questionId would happen here.
        // Once verified, the module "orchestrates" the safe to release funds.
    }
}
