import React, { useState, useMemo } from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import {
    getDefaultConfig,
    RainbowKitProvider,
    RainbowKitAuthenticationProvider,
    createAuthenticationAdapter,
    darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider, http, fallback, useAccount } from 'wagmi';
import { polygon, polygonAmoy, hardhat, base, baseSepolia } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { SiweMessage } from 'siwe';

function ConnectionLogger({ children }) {
    const { address, isConnected, isConnecting, isReconnecting } = useAccount();

    React.useEffect(() => {
        if (isConnected) {
            console.log(`[WAGMI] Connected with address: ${address}`);
        }
        if (isConnecting) console.log('[WAGMI] Connecting...');
        if (isReconnecting) console.log('[WAGMI] Reconnecting...');
    }, [isConnected, address, isConnecting, isReconnecting]);

    return children;
}

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://20.30.75.78:3001/api';
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

export function Web3Provider({ children }) {
    const [authStatus, setAuthStatus] = useState('unauthenticated');

    React.useEffect(() => {
        console.log('[NETWORK] Current App Origin:', window.location.origin);
    }, []);

    const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '65a5f1dd3b7df21cef34448cac019cd5';

    const config = useMemo(() => {
        const alchemyId = import.meta.env.VITE_ALCHEMY_ID;
        const infuraId = import.meta.env.VITE_INFURA_ID;

        return getDefaultConfig({
            appName: 'PolyLance',
            appDescription: 'Enterprise Decentralized Freelance Marketplace',
            appUrl: window.location.origin,
            appIcon: 'https://raw.githubusercontent.com/lucide-react/lucide/main/icons/briefcase.svg',
            projectId,
            chains: [polygonAmoy, polygon, hardhat, base, baseSepolia],
            transports: {
                [polygonAmoy.id]: fallback([
                    http('https://rpc-amoy.polygon.technology'),
                    http('https://polygon-amoy-bor-rpc.publicnode.com'),
                    http('https://rpc.ankr.com/polygon_amoy')
                ]),
                [polygon.id]: fallback([
                    alchemyId ? http(`https://polygon-mainnet.g.alchemy.com/v2/${alchemyId}`) : http(),
                    http('https://polygon-rpc.com'),
                    http('https://rpc-mainnet.maticvigil.com'),
                    http('https://polygon.llamarpc.com')
                ]),
                [hardhat.id]: http(),
                [base.id]: alchemyId ? http(`https://base-mainnet.g.alchemy.com/v2/${alchemyId}`) : http(),
                [baseSepolia.id]: alchemyId ? http(`https://base-sepolia.g.alchemy.com/v2/${alchemyId}`) : http(),
            },
            ssr: false,
        });
    }, [projectId]);

    const authAdapter = useMemo(() => createAuthenticationAdapter({
        getNonce: async () => {
            try {
                console.log('[AUTH] Requesting nonce...');
                const response = await fetch(`${API_URL}/auth/nonce/default`);
                if (!response.ok) throw new Error('Failed to fetch nonce');
                const { nonce } = await response.json();
                console.log('[AUTH] Nonce received:', nonce);
                return nonce;
            } catch (error) {
                console.error('[AUTH] Nonce error:', error);
                throw error;
            }
        },

        createMessage: ({ nonce, address, chainId }) => {
            console.log('[AUTH] createMessage called:', { nonce, address, chainId });
            const message = new SiweMessage({
                domain: window.location.hostname,
                address,
                statement: 'Sign in to PolyLance',
                uri: window.location.origin,
                version: '1',
                chainId: Number(chainId),
                nonce,
            });
            const messageString = message.prepareMessage();
            console.log('[AUTH] Prepared message string:', messageString);
            return messageString;
        },

        getMessageBody: ({ message }) => {
            console.log('[AUTH] getMessageBody called. message is:', typeof message);
            return message; // Since createMessage now returns the string directly
        },

        verify: async ({ message, signature }) => {
            console.log('[AUTH] verify called. message type:', typeof message);
            try {
                setAuthStatus('loading');
                const verifyRes = await fetch(`${API_URL}/auth/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message, // This is now a string from createMessage
                        signature,
                    }),
                });

                if (!verifyRes.ok) {
                    const errorData = await verifyRes.json();
                    throw new Error(errorData.error || 'Verification failed');
                }

                const data = await verifyRes.json();
                const ok = !!data.address;
                setAuthStatus(ok ? 'authenticated' : 'unauthenticated');
                return ok;
            } catch (error) {
                console.error('[AUTH] Verification error:', error);
                setAuthStatus('unauthenticated');
                return false;
            }
        },

        signOut: async () => {
            setAuthStatus('unauthenticated');
        },
    }), []);

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitAuthenticationProvider
                    adapter={authAdapter}
                    status={authStatus}
                >
                    <RainbowKitProvider theme={darkTheme({
                        accentColor: '#8a2be2',
                        accentColorForeground: 'white',
                        borderRadius: 'medium',
                        overlayBlur: 'small',
                    })} modalSize="compact">
                        <ConnectionLogger>
                            {children}
                        </ConnectionLogger>
                    </RainbowKitProvider>
                </RainbowKitAuthenticationProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
