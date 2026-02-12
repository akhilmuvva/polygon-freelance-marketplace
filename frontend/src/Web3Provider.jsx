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
import { HuddleProvider, HuddleClient } from '@huddle01/react';
// import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';

const huddleClient = new HuddleClient({
    projectId: import.meta.env.VITE_HUDDLE_PROJECT_ID || 'yS_cM7SrkNqXv3193R2W1nI_7P3j3P-z',
    options: {
        activeSpeakersLimit: 5,
    },
});

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

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

// const apolloClient = new ApolloClient({
//     uri: import.meta.env.VITE_SUBGRAPH_URL || 'https://api.studio.thegraph.com/query/STUDIO_ID/poly-lance/v0.0.1',
//     cache: new InMemoryCache(),
// });

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
                ]),
                [polygon.id]: fallback([
                    // Prioritize WebSockets for Antigravity-speed updates
                    alchemyId ? http(`https://polygon-mainnet.g.alchemy.com/v2/${alchemyId}`) : http(),
                    http('https://polygon-rpc.com'),
                ]),
                [hardhat.id]: http(),
                [base.id]: alchemyId ? http(`https://base-mainnet.g.alchemy.com/v2/${alchemyId}`) : http(),
                [baseSepolia.id]: alchemyId ? http(`https://base-sepolia.g.alchemy.com/v2/${alchemyId}`) : http(),
            },
            pollingInterval: 1_000, // Faster polling (1s) to match Antigravity speed
            ssr: false,
        });
    }, [projectId]);

    const authAdapter = useMemo(() => createAuthenticationAdapter({
        getNonce: async () => {
            try {
                const address = window.ethereum?.selectedAddress || 'default';
                console.log('[AUTH] Requesting nonce for:', address);
                const response = await fetch(`${API_URL}/auth/nonce/${address}`);
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
            try {
                console.log('[AUTH] createMessage called:', { nonce, address, chainId });
                const message = new SiweMessage({
                    domain: window.location.host,
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
            } catch (error) {
                console.error('[AUTH] createMessage error:', error);
                throw new Error('Failed to prepare authentication message');
            }
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
                {/* <ApolloProvider client={apolloClient}> */}
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
                        <HuddleProvider client={huddleClient}>
                            <ConnectionLogger>
                                {children}
                            </ConnectionLogger>
                        </HuddleProvider>
                    </RainbowKitProvider>
                </RainbowKitAuthenticationProvider>
                {/* </ApolloProvider> */}
            </QueryClientProvider>
        </WagmiProvider>
    );
}
