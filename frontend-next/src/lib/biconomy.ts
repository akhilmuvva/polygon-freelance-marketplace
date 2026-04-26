import { createSmartAccountClient } from "@biconomy/account";
import { createWalletClient, custom, Address } from "viem";
import { polygon, polygonAmoy } from "viem/chains";

const IS_AMOY = process.env.NEXT_PUBLIC_NETWORK === 'amoy';
const CHAIN = IS_AMOY ? polygonAmoy : polygon;

export async function initSocialLogin() {
    const projectId = process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID;
    const clientKey = process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY;
    const appId = process.env.NEXT_PUBLIC_PARTICLE_APP_ID;

    if (!projectId || !clientKey || !appId) {
        console.warn('[Zenith] Particle credentials missing. Using mock.');
        return {
            auth: {
                login: async () => ({ user: { name: 'Demo User', email: 'demo@polylance.codes' } }),
                logout: async () => {},
            },
            isMock: true
        };
    }

    try {
        const { ParticleNetwork } = await import("@particle-network/auth");
        // Note: The @biconomy/particle-auth package is a wrapper. 
        // In Next.js, we might need to handle the import carefully.
        
        const particle = new ParticleNetwork({
            projectId,
            clientKey,
            appId,
            chainName: IS_AMOY ? 'Polygon' : 'Polygon', // Particle chain names
            chainId: IS_AMOY ? 80002 : 137,
            wallet: { displayWalletEntry: true }
        });

        return particle;
    } catch (error) {
        console.error('[Zenith] Particle init failed:', error);
        return {
            auth: {
                login: async () => ({ user: { name: 'Demo User', email: 'offline@polylance.codes' } }),
                logout: async () => {},
            },
            isMock: true
        };
    }
}

export async function createBiconomySmartAccount(signer: any) {
    const paymasterUrl = process.env.NEXT_PUBLIC_BICONOMY_PAYMASTER_URL;
    const bundlerUrl = process.env.NEXT_PUBLIC_BICONOMY_BUNDLER_URL;

    if (!paymasterUrl || !bundlerUrl || signer?.isMock) {
        return {
            accountAddress: '0xDE4DbEef88888888888888888888888888888888' as Address,
            isMock: true,
            sendTransaction: async () => ({
                waitForTxHash: async () => ({ transactionHash: '0xmock_' + Date.now() })
            })
        };
    }

    try {
        const smartAccount = await createSmartAccountClient({
            signer: signer,
            bundlerUrl,
            biconomyPaymasterApiKey: paymasterUrl,
            rpcUrl: IS_AMOY ? 'https://rpc-amoy.polygon.technology' : 'https://polygon-rpc.com'
        });
        return smartAccount;
    } catch (error) {
        console.error('[Zenith] Smart account creation failed:', error);
        return null;
    }
}
