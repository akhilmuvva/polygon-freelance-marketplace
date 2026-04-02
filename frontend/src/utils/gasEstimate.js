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

        // Fetch live MATIC/USD price from CoinGecko
        let maticPrice = 0.8; // fallback if request fails
        try {
            const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd');
            const data = await res.json();
            maticPrice = data['matic-network']?.usd || 0.8;
        } catch {
            console.warn('[Gas] Could not fetch MATIC price, using fallback.');
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
