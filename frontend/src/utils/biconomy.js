/**
 * Biconomy Account Abstraction Integration
 * Enables gasless work submission for freelancers
 */

import { createSmartAccountClient } from "@biconomy/account";
import { createWalletClient, custom, encodeFunctionData } from "viem";
import { polygonAmoy } from "viem/chains";

// Biconomy Paymaster URL (replace with your own from Biconomy Dashboard)
const PAYMASTER_URL = import.meta.env.VITE_BICONOMY_PAYMASTER_URL || "";
const BUNDLER_URL = import.meta.env.VITE_BICONOMY_BUNDLER_URL || "";

/**
 * Create a Biconomy Smart Account for gasless transactions
 * @param {object} signer - Ethers or Viem signer
 * @returns {Promise<object>} Smart Account client
 */
export async function createBiconomySmartAccount(signer) {
    if (!PAYMASTER_URL || !BUNDLER_URL) {
        console.warn('[BICONOMY] Paymaster or Bundler URL not configured. Falling back to standard transactions.');
        return null;
    }

    try {
        const walletClient = createWalletClient({
            chain: polygonAmoy,
            transport: custom(window.ethereum)
        });

        const smartAccount = await createSmartAccountClient({
            signer: walletClient,
            bundlerUrl: BUNDLER_URL,
            biconomyPaymasterApiKey: PAYMASTER_URL,
        });

        console.log('[BICONOMY] Smart Account created:', smartAccount.accountAddress);
        return smartAccount;
    } catch (error) {
        console.error('[BICONOMY] Failed to create Smart Account:', error);
        return null;
    }
}

/**
 * Submit work gaslessly using Biconomy
 * @param {object} smartAccount - Biconomy Smart Account
 * @param {string} contractAddress - FreelanceEscrow contract address
 * @param {object} contractABI - Contract ABI
 * @param {number} jobId - Job ID
 * @param {string} ipfsHash - IPFS hash of submitted work
 * @returns {Promise<string>} Transaction hash
 */
export async function submitWorkGasless(smartAccount, contractAddress, contractABI, jobId, ipfsHash) {
    if (!smartAccount) {
        throw new Error('Smart Account not initialized. Use standard transaction instead.');
    }

    try {
        // Encode the function call
        const data = encodeFunctionData({
            abi: contractABI,
            functionName: 'submitWork',
            args: [jobId, ipfsHash]
        });

        // Build the transaction
        const tx = {
            to: contractAddress,
            data: data,
        };

        // Send as a gasless transaction through Biconomy
        const userOpResponse = await smartAccount.sendTransaction(tx);
        const { transactionHash } = await userOpResponse.waitForTxHash();

        console.log('[BICONOMY] Gasless submission successful:', transactionHash);
        return transactionHash;
    } catch (error) {
        console.error('[BICONOMY] Gasless transaction failed:', error);
        throw error;
    }
}

/**
 * Create a job gaslessly using Biconomy
 * @param {object} smartAccount - Biconomy Smart Account
 * @param {string} contractAddress - FreelanceEscrow contract address
 * @param {object} contractABI - Contract ABI
 * @param {object} params - Job parameters
 * @returns {Promise<string>} Transaction hash
 */
export async function createJobGasless(smartAccount, contractAddress, contractABI, params) {
    if (!smartAccount) {
        throw new Error('Smart Account not initialized.');
    }

    const { freelancer, token, amount, ipfsHash, durationDays, categoryId } = params;

    try {
        const data = encodeFunctionData({
            abi: contractABI,
            functionName: 'createJob',
            args: [freelancer, token, amount, ipfsHash, durationDays, categoryId]
        });

        const tx = {
            to: contractAddress,
            data: data,
        };

        const userOpResponse = await smartAccount.sendTransaction(tx);
        const { transactionHash } = await userOpResponse.waitForTxHash();

        console.log('[BICONOMY] Gasless job creation successful:', transactionHash);
        return transactionHash;
    } catch (error) {
        console.error('[BICONOMY] Gasless job creation failed:', error);
        throw error;
    }
}

/**
 * Check if Biconomy is available and configured
 * @returns {boolean}
 */
export function isBiconomyAvailable() {
    return !!(PAYMASTER_URL && BUNDLER_URL);
}

/**
 * Estimate gas savings with Biconomy
 * @param {object} provider - Ethereum provider
 * @param {string} contractAddress - Contract address
 * @param {object} contractABI - Contract ABI
 * @param {number} jobId - Job ID
 * @param {string} ipfsHash - IPFS hash
 * @returns {Promise<object>} Gas estimation
 */
export async function estimateGasSavings(provider, contractAddress, contractABI, jobId, ipfsHash) {
    try {
        const contract = new provider.eth.Contract(contractABI, contractAddress);
        const gasEstimate = await contract.methods.submitWork(jobId, ipfsHash).estimateGas();
        const gasPrice = await provider.eth.getGasPrice();
        const estimatedCost = (gasEstimate * gasPrice) / 1e18; // Convert to MATIC

        return {
            gasEstimate,
            gasCostInMATIC: estimatedCost.toFixed(6),
            savedWithBiconomy: true
        };
    } catch (error) {
        console.error('[BICONOMY] Gas estimation failed:', error);
        return null;
    }
}
