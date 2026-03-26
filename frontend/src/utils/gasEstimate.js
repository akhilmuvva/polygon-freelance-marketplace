import { formatEther, parseEther } from 'viem';
import { getPublicClient } from '@wagmi/core';
import { polygonAmoy } from 'viem/chains';

/**
 * [ZENITH] Gas Estimator Utility
 * Provides real-time translucent gas projection for Sovereign Operators.
 */
export async function estimateSovereignTxCost(client, functionName, args = [], value = 0n) {
  try {
    const publicClient = getPublicClient({ chainId: polygonAmoy.id });
    
    // 1. Estimate Gas Units
    const gasEstimate = await publicClient.estimateContractGas({
      address: client.address,
      abi: client.abi,
      functionName: functionName,
      args: args,
      value: value,
      account: client.account
    });

    // 2. Get Current Gas Price
    const gasPrice = await publicClient.getGasPrice();

    // 3. Fetch MATIC/USD Price (Market Mesh)
    let maticPrice = 0.8; // Fallback
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd');
      const data = await res.json();
      maticPrice = data['matic-network']?.usd || 0.8;
    } catch (e) {
      console.warn('[GAS] Coingecko mesh offline. Using fallback valuation.');
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
    console.error('[GAS] Estimation Friction:', err.message);
    return null;
  }
}
