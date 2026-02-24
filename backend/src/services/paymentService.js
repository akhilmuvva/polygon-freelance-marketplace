import { createWalletClient, http, parseEther, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { polygonAmoy } from 'viem/chains';
import { logger } from '../utils/logger.js';

// PolyToken ABI snippet for minting
const POLY_TOKEN_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "to", "type": "address" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" },
            { "internalType": "string", "name": "reason", "type": "string" }
        ],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

const POLY_TOKEN_ADDRESS = process.env.POLY_TOKEN_ADDRESS || '0xd3b893cd083f07Fe371c1a87393576e7B01C52C6';
const RPC_URL = process.env.RPC_URL || 'https://polygon-amoy.g.alchemy.com/v2/xd727FUEtN2c-SPI_yo3B';

// Initialize Wallet Client
const getFulfillmentClient = () => {
    const pk = process.env.FULFILLMENT_PRIVATE_KEY;
    if (!pk || pk === 'your_private_key_here') {
        logger.warn('FULFILLMENT: No private key configured. Using MOCK fulfillment.', 'PAYMENT');
        return null;
    }

    try {
        const account = privateKeyToAccount(pk.startsWith('0x') ? pk : `0x${pk}`);
        return createWalletClient({
            account,
            chain: polygonAmoy,
            transport: http(RPC_URL)
        }).extend(publicActions);
    } catch (error) {
        logger.error('Failed to initialize fulfillment client', 'PAYMENT', error);
        return null;
    }
};

/**
 * Fulfills a fiat-to-crypto onramp request by minting tokens on-chain.
 * @param {string} userAddress The recipient's wallet address.
 * @param {number} fiatAmount The amount paid in fiat (INR).
 * @param {string} orderId The Razorpay order ID for tracking.
 */
export const fulfillOnramp = async (userAddress, fiatAmount, orderId) => {
    logger.info(`Starting fulfillment for order ${orderId} (${fiatAmount} INR) to ${userAddress}`, 'PAYMENT');

    const client = getFulfillmentClient();

    // Calculate tokens: 1 PolyToken per 10 INR (example rate)
    const tokenAmount = (fiatAmount / 10).toString();
    const amountInWei = parseEther(tokenAmount);

    if (!client) {
        logger.success(`MOCK FULFILLMENT: Would have minted ${tokenAmount} POLY to ${userAddress}`, 'PAYMENT');
        return { success: true, mock: true, txHash: `mock_tx_${Date.now()}` };
    }

    try {
        const { request } = await client.simulateContract({
            account: client.account,
            address: POLY_TOKEN_ADDRESS,
            abi: POLY_TOKEN_ABI,
            functionName: 'mint',
            args: [userAddress, amountInWei, `Razorpay Onramp Order: ${orderId}`]
        });

        const hash = await client.writeContract(request);
        logger.success(`On-chain fulfillment successful! TX: ${hash}`, 'PAYMENT');

        return { success: true, txHash: hash };
    } catch (error) {
        logger.error(`Fulfillment failed for order ${orderId}`, 'PAYMENT', error);
        throw error;
    }
};
