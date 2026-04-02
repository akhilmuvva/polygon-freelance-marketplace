import { createSmartAccountClient } from "@biconomy/account";
import { encodeFunctionData } from "viem";
import env from "../config/env";

const PAYMASTER_URL = env.BICONOMY_PAYMASTER_URL;
const BUNDLER_URL = env.BICONOMY_BUNDLER_URL;

/**
 * Initializes Particle Auth for social login (Google, Twitter, etc).
 * Falls back to a mock login object if credentials are missing or init times out.
 *
 * @returns {Promise<object>} Particle Auth instance or mock
 */
export async function initSocialLogin() {
    const projectId = env.PARTICLE_PROJECT_ID;
    const clientKey = env.PARTICLE_CLIENT_KEY;
    const appId = env.PARTICLE_APP_ID;

    // Skip real init if credentials aren't configured
    if (!projectId || !clientKey || !appId) {
        console.warn('[Biconomy] Particle credentials not set. Using mock social login.');
        return {
            auth: {
                login: async () => {
                    console.log('[Biconomy] Mock social login');
                    return { user: { name: 'Demo User', email: 'demo@polylance.codes' } };
                },
                logout: async () => console.log('[Biconomy] Mock logout'),
            },
            isMock: true
        };
    }

    try {
        const { ParticleAuthModule } = await import("@biconomy/particle-auth");

        // The exported constructor name varies between Particle SDK versions
        const ParticleConstructor = ParticleAuthModule.ParticleAuth ||
                                   ParticleAuthModule.default?.ParticleAuth ||
                                   ParticleAuthModule.ParticleNetwork ||
                                   ParticleAuthModule.default ||
                                   ParticleAuthModule;

        if (typeof ParticleConstructor !== 'function') {
            console.error('[Biconomy] Could not resolve Particle constructor:', typeof ParticleConstructor);
            return { auth: { login: async () => ({ user: { name: 'Demo User', email: 'demo@polylance.codes' } }), logout: async () => {} }, isMock: true };
        }

        // Race against a timeout to prevent blocking the UI
        const initPromise = new Promise((resolve) => {
            const particle = new ParticleConstructor({
                projectId,
                clientKey,
                appId,
                chainId: 137, // Polygon Mainnet
                wallet: { displayWalletEntry: true }
            });
            resolve(particle);
        });

        const timeoutPromise = new Promise(resolve => setTimeout(() => resolve('TIMEOUT'), 8000));
        const result = await Promise.race([initPromise, timeoutPromise]);

        if (result === 'TIMEOUT') {
            console.warn('[Biconomy] Particle init timed out. Using mock.');
            return {
                auth: {
                    login: async () => ({ user: { name: 'Demo User', email: 'offline@polylance.codes' } }),
                    logout: async () => {},
                },
                isMock: true
            };
        }

        return result;
    } catch (error) {
        console.error('[Biconomy] Social login init failed:', error.message);
        return {
            auth: {
                login: async () => ({ user: { name: 'Demo User', email: 'offline@polylance.codes' } }),
                logout: async () => {},
            },
            isMock: true
        };
    }
}

/**
 * Creates a Biconomy Smart Account for gasless transactions.
 * Returns null if setup fails, allowing callers to fall back to regular transactions.
 *
 * @param {object} signer - ethers/viem wallet signer
 * @returns {Promise<object|null>} Smart account client or null
 */
export async function createBiconomySmartAccount(signer) {
    // Return mock account if Biconomy isn't configured
    if (signer?.isMock || !PAYMASTER_URL || !BUNDLER_URL) {
        console.warn('[Biconomy] Paymaster/Bundler not configured. Using mock smart account.');
        return {
            accountAddress: '0xDE4DbEef88888888888888888888888888888888',
            isMock: true,
            sendTransaction: async () => ({
                waitForTxHash: async () => ({ transactionHash: '0xmock_tx_' + Date.now() })
            })
        };
    }

    try {
        // Biconomy requires an account address on the signer
        if (!signer.account && typeof signer.getAddresses === 'function') {
            const [address] = await signer.getAddresses();
            if (address) signer.account = address;
        }

        if (!signer.account) {
            throw new Error('Could not resolve account address from signer.');
        }

        console.info('[Biconomy] Creating smart account for chain:', signer.chain?.id || 'unknown');
        const smartAccount = await createSmartAccountClient({
            signer: signer,
            bundlerUrl: BUNDLER_URL,
            biconomyPaymasterApiKey: PAYMASTER_URL,
            rpcUrl: 'https://polygon-rpc.com' // Polygon Mainnet
        });

        // Newer SDK versions expose getAccountAddress() instead of accountAddress
        if (!smartAccount.accountAddress && typeof smartAccount.getAccountAddress === 'function') {
            smartAccount.accountAddress = await smartAccount.getAccountAddress();
        }

        console.log('[Biconomy] Smart account ready:', smartAccount.accountAddress);
        return smartAccount;
    } catch (error) {
        console.error('[Biconomy] Failed to create smart account:', error.message);
        return null;
    }
}

/**
 * Submits work proof for a job gaslessly (no MATIC required from the user).
 *
 * @param {object} smartAccount - Biconomy smart account
 * @param {string} contractAddress - FreelanceEscrow contract address
 * @param {Array} contractABI - contract ABI
 * @param {number} jobId
 * @param {string} ipfsHash - IPFS CID of the work deliverable
 * @returns {Promise<string>} transaction hash
 */
export async function submitWorkGasless(smartAccount, contractAddress, contractABI, jobId, ipfsHash) {
    if (!smartAccount) {
        throw new Error('Smart account not initialized.');
    }

    try {
        const data = encodeFunctionData({
            abi: contractABI,
            functionName: 'submitWork',
            args: [BigInt(jobId), ipfsHash]
        });

        const userOpResponse = await smartAccount.sendTransaction({ to: contractAddress, data });
        const { transactionHash } = await userOpResponse.waitForTxHash();

        console.log('[Biconomy] Gasless work submission sent:', transactionHash);
        return transactionHash;
    } catch (error) {
        console.error('[Biconomy] Gasless submitWork failed:', error);
        throw error;
    }
}

/**
 * Creates a job gaslessly using a Biconomy smart account.
 *
 * @param {object} smartAccount - Biconomy smart account
 * @param {string} contractAddress
 * @param {Array} contractABI
 * @param {object} params - job params
 * @returns {Promise<string>} transaction hash
 */
export async function createJobGasless(smartAccount, contractAddress, contractABI, params) {
    if (!smartAccount) {
        throw new Error('Smart account not initialized.');
    }

    try {
        const data = encodeFunctionData({
            abi: contractABI,
            functionName: 'createJob',
            args: [params]
        });

        const userOpResponse = await smartAccount.sendTransaction({ to: contractAddress, data });
        const { transactionHash } = await userOpResponse.waitForTxHash();

        console.log('[Biconomy] Gasless job created:', transactionHash);
        return transactionHash;
    } catch (error) {
        console.error('[Biconomy] Gasless createJob failed:', error);
        throw error;
    }
}

/** Returns true if Biconomy is configured and ready. */
export function isBiconomyAvailable() {
    return !!(PAYMASTER_URL && BUNDLER_URL);
}
