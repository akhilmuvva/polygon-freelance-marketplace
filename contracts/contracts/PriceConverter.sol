// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IChainlinkPriceFeed.sol";

/**
 * @title PriceConverter
 * @notice Library for converting token amounts to USD using Chainlink Price Feeds
 * @dev Supports multiple price feeds for different tokens
 */
library PriceConverter {
    error StalePrice();
    error InvalidPrice();
    error PriceFeedNotSet();
    
    uint256 private constant PRICE_STALENESS_THRESHOLD = 3 hours;
    
    // L2 Sequencer Uptime Feed address (set to 0 for chains without it)
    address private constant SEQUENCER_FEED = address(0);
    uint256 private constant GRACE_PERIOD_TIME = 3600; // 1 hour

    /**
     * @notice Checks if the L2 sequencer is up and has been up for at least the grace period.
     */
    function _checkSequencer() internal view {
        if (SEQUENCER_FEED != address(0)) {
            IChainlinkPriceFeed sequencerUptimeFeed = IChainlinkPriceFeed(SEQUENCER_FEED);
            (
                /* uint80 roundID */,
                int256 answer,
                uint256 startedAt,
                /* uint256 updatedAt */,
                /* uint80 answeredInRound */
            ) = sequencerUptimeFeed.latestRoundData();

            // Answer == 0: Sequencer is UP
            // Answer == 1: Sequencer is DOWN
            if (answer == 1) revert("SequencerDown");
            
            if (block.timestamp - startedAt < GRACE_PERIOD_TIME) revert("GracePeriodNotMet");
        }
    }
    
    /**
     * @notice Convert token amount to USD value
     * @param tokenAmount Amount of tokens in wei
     * @param priceFeed Chainlink price feed address
     * @return USD value with 8 decimals (Chainlink standard)
     */
    function getUSDValue(
        uint256 tokenAmount,
        address priceFeed
    ) internal view returns (uint256) {
        _checkSequencer();
        if (priceFeed == address(0)) revert PriceFeedNotSet();
        
        IChainlinkPriceFeed feed = IChainlinkPriceFeed(priceFeed);
        (
            ,
            int256 price,
            ,
            uint256 updatedAt,
            
        ) = feed.latestRoundData();
        
        // Check price validity
        if (price <= 0) revert InvalidPrice();
        if (block.timestamp - updatedAt > PRICE_STALENESS_THRESHOLD) {
            revert StalePrice();
        }
        
        // Convert: (tokenAmount * price) / 10^decimals
        // Result has 8 decimals (Chainlink standard)
        uint256 decimals = feed.decimals();
        return (tokenAmount * uint256(price)) / (10 ** decimals);
    }
    
    /**
     * @notice Convert USD value to token amount
     * @param usdAmount USD amount with 8 decimals
     * @param priceFeed Chainlink price feed address
     * @return Token amount in wei
     */
    function getTokenAmount(
        uint256 usdAmount,
        address priceFeed
    ) internal view returns (uint256) {
        _checkSequencer();
        if (priceFeed == address(0)) revert PriceFeedNotSet();
        
        IChainlinkPriceFeed feed = IChainlinkPriceFeed(priceFeed);
        (
            ,
            int256 price,
            ,
            uint256 updatedAt,
            
        ) = feed.latestRoundData();
        
        // Check price validity
        if (price <= 0) revert InvalidPrice();
        if (block.timestamp - updatedAt > PRICE_STALENESS_THRESHOLD) {
            revert StalePrice();
        }
        
        // Convert: (usdAmount * 10^decimals) / price
        uint256 decimals = feed.decimals();
        return (usdAmount * (10 ** decimals)) / uint256(price);
    }
    
    /**
     * @notice Get the current price from a feed
     * @param priceFeed Chainlink price feed address
     * @return price Current price with feed's decimals
     * @return decimals Number of decimals in the price
     */
    function getPrice(address priceFeed) 
    internal 
    view 
    returns (uint256 price, uint8 decimals) 
    {
        _checkSequencer();
        if (priceFeed == address(0)) revert PriceFeedNotSet();
        
        IChainlinkPriceFeed feed = IChainlinkPriceFeed(priceFeed);
        (
            ,
            int256 answer,
            ,
            uint256 updatedAt,
            
        ) = feed.latestRoundData();
        
        if (answer <= 0) revert InvalidPrice();
        if (block.timestamp - updatedAt > PRICE_STALENESS_THRESHOLD) {
            revert StalePrice();
        }
        
        return (uint256(answer), feed.decimals());
    }
}
