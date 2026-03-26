// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

library FreelanceEscrowLibrary {
    using SafeERC20 for IERC20;

    function sendFunds(address to, address token, uint256 amount) internal {
        if (token == address(0)) {
            (bool success, ) = payable(to).call{value: amount}("");
            require(success, "TransferFailed");
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }
}
