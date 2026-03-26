import { formatUnits } from 'viem';

/**
 * @util estimateGasInMATIC
 * @notice Estimates gas cost for a given transaction parameters.
 * @param publicClient Viem Public Client
 * @param txParams { account, to, data, value }
 * @returns {Promise<string>} Estimated cost in MATIC
 */
export async function estimateGasInMATIC(publicClient, txParams) {
    try {
        const gasEstimate = await publicClient.estimateContractGas(txParams);
        const gasPrice = await publicClient.getGasPrice();
        const totalCost = gasEstimate * gasPrice;
        
        // Return rounded to 6 decimal places
        return parseFloat(formatUnits(totalCost, 18)).toFixed(6);
    } catch (err) {
        console.warn('[GAS_ESTIMATOR] Failed to calculate resonance friction:', err.message);
        return 'N/A';
    }
}
