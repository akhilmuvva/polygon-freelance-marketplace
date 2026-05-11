import { formatEther } from 'viem';
import { getPublicClient } from '@wagmi/core';
import { polygon } from 'viem/chains';

/**
 * Estimates the gas cost of a contract function call and returns
 * the projected cost in MATIC and USD.
 *
 * @param {object} client - contract instance with address, abi, account
 * @param {string} functionName - function to estimate gas for
 * @param {Array} args - function arguments
 * @param {bigint} value - native value to send (default 0)
 * @returns {object|null} { units, priceGwei, matic, usd } or null on error
 */
export async function estimateSovereignTxCost(client, functionName, args = [], value = 0n) {
    try {
        const publicClient = getPublicClient({ chainId: polygon.id }); // Polygon Mainnet (137)

        // Estimate gas units needed
        const gasEstimate = await publicClient.estimateContractGas({
            address: client.address,
            abi: client.abi,
            functionName: functionName,
            args: args,
            value: value,
            account: client.account
        });

        // Get current gas price
        const gasPrice = await publicClient.getGasPrice();

        // Fetch live MATIC/USD price from Chainlink on-chain
        let maticPrice = 0.8; // fallback if request fails
        try {
            // Chainlink MATIC/USD Price Feed on Polygon
            const CHALINK_MATIC_USD = '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0';
            const priceData = await publicClient.readContract({
                address: CHALINK_MATIC_USD,
                abi: [{
                    inputs: [],
                    name: "latestRoundData",
                    outputs: [
                        { name: "roundId", type: "uint80" },
                        { name: "answer", type: "int256" },
                        { name: "startedAt", type: "uint256" },
                        { name: "updatedAt", type: "uint256" },
                        { name: "answeredInRound", type: "uint80" }
                    ],
                    stateMutability: "view",
                    type: "function"
                }],
                functionName: 'latestRoundData',
            });
            
            // Chainlink prices have 8 decimals
            maticPrice = Number(priceData[1]) / 1e8;
        } catch (error) {
            console.warn('[Gas] Could not fetch on-chain MATIC price, using fallback:', error.message);
        }

        const totalCostWei = gasEstimate * gasPrice;
        const totalCostMatic = formatEther(totalCostWei);
        const totalCostUsd = (parseFloat(totalCostMatic) * maticPrice).toFixed(4);

        return {
            units: gasEstimate.toString(),
            priceGwei: (Number(gasPrice) / 1e9).toFixed(2),
            matic: totalCostMatic,
            usd: totalCostUsd
        };
    } catch (err) {
        console.error('[Gas] Estimation failed:', err.message);
        return null;
    }
}
