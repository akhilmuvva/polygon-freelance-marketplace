// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}

/**
 * @title SwapManager
 * @notice Handles token swaps for instant conversion during job creation
 */
contract SwapManager is Ownable {
    using SafeERC20 for IERC20;

    /**
     * @notice The Uniswap V3 Router used for swaps.
     */
    ISwapRouter public immutable swapRouter;
    
    /**
     * @notice Wrapped ETH address for the network.
     */
    address public immutable WETH;
    
    /**
     * @notice The default fee pool used for swaps (3000 = 0.3%).
     */
    uint24 public constant poolFee = 3000; // 0.3%

    event TokensSwapped(address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);

    constructor(address _router, address _weth) Ownable(msg.sender) {
        swapRouter = ISwapRouter(_router);
        WETH = _weth;
    }

    /**
     * @notice Swap tokens for another token
     */
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        address recipient
    ) external payable returns (uint256 amountOut) {
        if (tokenIn == tokenOut) {
             if (tokenIn == address(0)) {
                 (bool s, ) = payable(recipient).call{value: msg.value}("");
                 require(s, "ETH transfer failed");
                 return msg.value;
             }
             IERC20(tokenIn).safeTransferFrom(msg.sender, recipient, amountIn);
             return amountIn;
        }

        if (tokenIn == address(0)) {
            // Swap ETH for tokenOut
            require(msg.value >= amountIn, "Insufficient ETH");
            amountOut = swapRouter.exactInputSingle{value: amountIn}(
                ISwapRouter.ExactInputSingleParams({
                    tokenIn: WETH, 
                    tokenOut: tokenOut,
                    fee: poolFee,
                    recipient: recipient,
                    deadline: block.timestamp,
                    amountIn: amountIn,
                    amountOutMinimum: amountOutMin,
                    sqrtPriceLimitX96: 0
                })
            );
        } else {
            IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
            IERC20(tokenIn).forceApprove(address(swapRouter), amountIn);

            amountOut = swapRouter.exactInputSingle(
                ISwapRouter.ExactInputSingleParams({
                    tokenIn: tokenIn,
                    tokenOut: tokenOut,
                    fee: poolFee,
                    recipient: recipient,
                    deadline: block.timestamp,
                    amountIn: amountIn,
                    amountOutMinimum: amountOutMin,
                    sqrtPriceLimitX96: 0
                })
            );
        }

        emit TokensSwapped(tokenIn, tokenOut, amountIn, amountOut);
    }
}
