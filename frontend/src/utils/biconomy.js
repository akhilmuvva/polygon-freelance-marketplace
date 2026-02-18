import { createSmartAccountClient } from "@biconomy/account";
import { createWalletClient, custom, encodeFunctionData } from "viem";
import { polygonAmoy } from "viem/chains";

// Biconomy Paymaster URL (replace with your own from Biconomy Dashboard)
const PAYMASTER_URL = import.meta.env.VITE_BICONOMY_PAYMASTER_URL || "";
const BUNDLER_URL = import.meta.env.VITE_BICONOMY_BUNDLER_URL || "";

/**
 * Initialize Social Login using Biconomy/Particle
 * @returns {Promise<object>} Social Login instance
 */
export async function initSocialLogin() {
    const projectId = import.meta.env.VITE_PARTICLE_PROJECT_ID;
    const clientKey = import.meta.env.VITE_PARTICLE_CLIENT_KEY;
    const appId = import.meta.env.VITE_PARTICLE_APP_ID;

    if (!projectId || !clientKey || !appId) {
        console.warn('[BICONOMY] Particle Auth credentials not configured. Social login will fail.');
        return null;
    }

    try {
        const { ParticleAuthModule } = await import("@biconomy/particle-auth");

        const particle = new ParticleAuthModule.ParticleAuth({
            projectId,
            clientKey,
            appId,
            chainId: 80002, // Amoy
            wallet: { displayWalletEntry: true }
        });

        return particle;
    } catch (error) {
        console.error('[BICONOMY] Social Login init failed:', error);
        return null;
    }
}

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
        const smartAccount = await createSmartAccountClient({
            signer: signer,
            bundlerUrl: BUNDLER_URL,
            biconomyPaymasterApiKey: PAYMASTER_URL,
            rpcUrl: 'https://rpc.ankr.com/polygon_amoy'
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
 */
export async function submitWorkGasless(smartAccount, contractAddress, contractABI, jobId, ipfsHash) {
    if (!smartAccount) {
        throw new Error('Smart Account not initialized.');
    }

    try {
        const data = encodeFunctionData({
            abi: contractABI,
            functionName: 'submitWork',
            args: [BigInt(jobId), ipfsHash]
        });

        const tx = {
            to: contractAddress,
            data: data,
        };

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
 */
export async function createJobGasless(smartAccount, contractAddress, contractABI, params) {
    if (!smartAccount) {
        throw new Error('Smart Account not initialized.');
    }

    try {
        const data = encodeFunctionData({
            abi: contractABI,
            functionName: 'createJob',
            args: [params]
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

export function isBiconomyAvailable() {
    return !!(PAYMASTER_URL && BUNDLER_URL);
}
