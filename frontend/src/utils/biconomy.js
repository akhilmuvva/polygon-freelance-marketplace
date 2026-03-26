import { createSmartAccountClient } from "@biconomy/account";
import { encodeFunctionData } from "viem";
import env from "../config/env";


// Biconomy Paymaster URL (replace with your own from Biconomy Dashboard)
const PAYMASTER_URL = env.BICONOMY_PAYMASTER_URL;
const BUNDLER_URL = env.BICONOMY_BUNDLER_URL;

/**
 * Initialize Social Login using Biconomy/Particle
 * @returns {Promise<object>} Social Login instance
 */
export async function initSocialLogin() {
    const projectId = env.PARTICLE_PROJECT_ID;
    const clientKey = env.PARTICLE_CLIENT_KEY;
    const appId = env.PARTICLE_APP_ID;

    // Guard: Only attempt to load the Particle SDK if all credentials are present.
    // The SDK crashes during module init (storage.sync error) when credentials are missing.
    if (!projectId || !clientKey || !appId) {
        console.warn('[SECURITY] Particle credentials offline. Actuating Mock Social gateway.');
        return {
            auth: {
                login: async () => {
                    console.log('[SECURITY] Social Login success');
                    return { user: { name: 'Adam Pioneer', email: 'adam@pioneer.com' } };
                },
                logout: async () => console.log('[SECURITY] Logout'),
            },
            isMock: true
        };
    }

    try {
        const { ParticleAuthModule } = await import("@biconomy/particle-auth");

        // Use a timeout for the Particle initialization to prevent hanging the UI
        const initPromise = new Promise((resolve) => {
            // Directive 19: Particle Gateway Resolution
            // The SDK export varies between environments. We proactively resolve the constructor.
            const ParticleConstructor = ParticleAuthModule.ParticleAuth || 
                                       ParticleAuthModule.default?.ParticleAuth || 
                                       ParticleAuthModule.ParticleNetwork || 
                                       ParticleAuthModule.default || 
                                       ParticleAuthModule;
            
            if (typeof ParticleConstructor !== 'function') {
                console.error('[SECURITY] Particle gateway malformed. Resolution found:', typeof ParticleConstructor);
                resolve(null);
                return;
            }
            
            const particle = new ParticleConstructor({
                projectId,
                clientKey,
                appId,
                chainId: 80002, // Amoy
                wallet: { displayWalletEntry: true }
            });
            resolve(particle);
        });

        const timeoutPromise = new Promise(resolve => setTimeout(() => resolve('TIMEOUT'), 8000));
        const result = await Promise.race([initPromise, timeoutPromise]);

        if (result === 'TIMEOUT') {
            console.warn('[SECURITY] Particle identity gateway timeout. Actuating Mock Resonance.');
            return {
                auth: {
                    login: async () => ({ user: { name: 'Sovereign Pioneer', email: 'offline@zenith.com' } }),
                    logout: async () => {},
                },
                isMock: true
            };
        }

        return result;
    } catch (error) {
        console.error('[SECURITY] Social identity gateway collapse:', error.message);
        // Universal fallback for connectivity failure
        return {
            auth: {
                login: async () => ({ user: { name: 'Sovereign Pioneer', email: 'offline@zenith.com' } }),
                logout: async () => {},
            },
            isMock: true
        };
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
        console.warn('[SECURITY] Paymaster/Bundler offline. Actuating MOCK Smart Account resonance.');
        return {
            accountAddress: '0xDE4DbEef88888888888888888888888888888888',
            isMock: true,
            sendTransaction: async () => ({
                waitForTxHash: async () => ({ transactionHash: '0xmock_tx_' + Date.now() })
            })
        };
    }

    try {
        // Directive 08: Identity Pre-flight
        // Ensure the signer has an associated account (required for Biconomy and Viem resonance).
        if (!signer.account && typeof signer.getAddresses === 'function') {
            const [address] = await signer.getAddresses();
            if (address) signer.account = address;
        }

        if (!signer.account) {
            throw new Error('Signer missing account identity node.');
        }

        console.info('[SECURITY] Actuating Smart Account client for chain:', signer.chain?.id || 'unknown');
        const smartAccount = await createSmartAccountClient({
            signer: signer,
            bundlerUrl: BUNDLER_URL,
            biconomyPaymasterApiKey: PAYMASTER_URL,
            rpcUrl: signer.chain?.id === 80002 
                ? 'https://rpc-amoy.polygon.technology' 
                : 'https://polygon-bor-rpc.publicnode.com'
        });

        // Resolve accountAddress — newer SDK versions require getAccountAddress()
        if (!smartAccount.accountAddress && typeof smartAccount.getAccountAddress === 'function') {
            smartAccount.accountAddress = await smartAccount.getAccountAddress();
        }

        console.log('[SECURITY] Smart Account created:', smartAccount.accountAddress);
        return smartAccount;
    } catch (error) {
        console.error('[SECURITY] Failed to create Smart Account. Resonance Error:', error.message);
        console.error('[SECURITY] Full trace:', error);
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

        console.log('[NETWORK] Gasless submission successful:', transactionHash);
        return transactionHash;
    } catch (error) {
        console.error('[NETWORK] Gasless transaction failed:', error);
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

        console.log('[NETWORK] Gasless job creation successful:', transactionHash);
        return transactionHash;
    } catch (error) {
        console.error('[NETWORK] Gasless job creation failed:', error);
        throw error;
    }
}

export function isBiconomyAvailable() {
    return !!(PAYMASTER_URL && BUNDLER_URL);
}
