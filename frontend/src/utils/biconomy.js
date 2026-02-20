import { createSmartAccountClient } from "@biconomy/account";
import { encodeFunctionData } from "viem";


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

    // Developer Mock Mode
    if (!projectId || !clientKey || !appId) {
        console.warn('[BICONOMY] Particle credentials missing. Enabling Mock Social Login.');
        return {
            auth: {
                login: async () => {
                    console.log('[MOCK] Social Login success');
                    return { user: { name: 'Adam Pioneer', email: 'adam@pioneer.com' } };
                },
                logout: async () => console.log('[MOCK] Logout'),
            },
            isMock: true
        };
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
    // Mock Account for Developers
    if (signer?.isMock || !PAYMASTER_URL || !BUNDLER_URL) {
        console.warn('[BICONOMY] Using MOCK Smart Account.');
        return {
            accountAddress: '0xDE4DbEef88888888888888888888888888888888',
            isMock: true,
            sendTransaction: async () => ({
                waitForTxHash: async () => ({ transactionHash: '0xmock_tx_' + Date.now() })
            })
        };
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
