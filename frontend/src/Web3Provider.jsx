const originalError = console.error;
console.error = (...args) => {
  if (args[0] && typeof args[0] === 'string' && (args[0].includes('401') || args[0].includes('intrinsics'))) return;
  originalError(...args);
};

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
import { polygon, polygonAmoy } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { SiweMessage } from 'siwe';
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { HuddleClient, HuddleProvider } from '@huddle01/react';
import api from './services/api';

const huddleProjectId = import.meta.env.VITE_HUDDLE_PROJECT_ID;
const huddleClient = huddleProjectId
    ? new HuddleClient({
        projectId: huddleProjectId,
        options: {
            activeSpeakersLimit: 5,
        },
    })
    : null;


function ConnectionLogger({ children }) {
    const { address, isConnected, isConnecting, isReconnecting } = useAccount();

    React.useEffect(() => {
        if (isConnected) {
            console.info(`[SECURITY] Sovereign identity synchronized: ${address}`);
        }
    }, [isConnected, address]);

    return children;
}


const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

const apolloClient = new ApolloClient({
    link: new HttpLink({
        uri: import.meta.env.VITE_SUBGRAPH_URL || 'https://api.studio.thegraph.com/query/poly-lance-studio/poly-lance/v0.0.1',
    }),
    cache: new InMemoryCache(),
});

export function Web3Provider({ children }) {
    const [authStatus, setAuthStatus] = useState('unauthenticated');

    React.useEffect(() => {
        console.info('[NETWORK] Protocol resonance synchronized:', window.location.origin);
    }, []);

    const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '3fcc6b4468bd937409483e8916718e49';

    const config = useMemo(() => {
        // High-Availability Public Transport Mesh (Keyless)
        // ───────────────────────────────────────────────
        // Bypasses the '401 Unauthorized' collapse by using resilient public fallbacks.
        return getDefaultConfig({
            appName: 'PolyLance Zenith', // Directive 01: Refactored appName
            projectId,
            chains: [polygonAmoy, polygon],
            transports: {
                // AMOY TESTNET: No Keys Required
                [polygonAmoy.id]: fallback([
                    http('https://rpc-amoy.polygon.technology'),
                    http('https://polygon-amoy-bor-rpc.publicnode.com')
                ]),
                // MAINNET: No Keys Required
                [polygon.id]: fallback([
                    http('https://polygon-rpc.com'),
                    http('https://1rpc.io/matic')
                ]),
            },
            ssr: false, // Prevents hydration gravity
        });
    }, [projectId]);

    const authAdapter = useMemo(() => createAuthenticationAdapter({
        getNonce: async () => {
            try {
                // Use the connected wallet address from RainbowKit/WAGMI if available
                const connectedAddress = window.ethereum?.selectedAddress
                    || document.querySelector('[data-testid="rk-account-button"]')?.textContent
                    || null;
                if (!connectedAddress || connectedAddress === 'default') {
                    throw new Error('No wallet address available for nonce request');
                }
                console.info('[SECURITY] Requesting SIWE nonce for:', connectedAddress);
                const { nonce } = await api.getNonce(connectedAddress);
                console.info('[SECURITY] Challenge nonce received successfully.');
                return nonce;
            } catch (error) {
                console.error('[SECURITY] Nonce error:', error.message);
                throw error;
            }
        },

        createMessage: ({ nonce, address, chainId }) => {
            try {
                console.info('[SECURITY] createMessage called:', { nonce, address, chainId });
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
                console.info('[SECURITY] SIWE intent prepared.');
                return messageString;
            } catch (error) {
                console.error('[SECURITY] Intent preparation failure:', error.message);
                throw new Error('Failed to prepare authentication message');
            }
        },

        getMessageBody: ({ message }) => {
            console.info('[SECURITY] getMessageBody called. message is:', typeof message);
            return message; // Since createMessage now returns the string directly
        },

        verify: async ({ message, signature }) => {
            console.info('[SECURITY] Actuating SIWE verification intent...');
            try {
                setAuthStatus('loading');
                const data = await api.verifySIWE(message, signature);
                const ok = !!data.address;
                setAuthStatus(ok ? 'authenticated' : 'unauthenticated');
                return ok;
            } catch (error) {
                console.error('[SECURITY] Verification error:', error.message);
                setAuthStatus('unauthenticated');
                return false;
            }
        },

        signOut: async () => {
            setAuthStatus('unauthenticated');
        },
    }), []);

    return (
        <WagmiProvider config={config} reconnectOnMount={false}>
            <QueryClientProvider client={queryClient}>
                <ApolloProvider client={apolloClient}>
                    <RainbowKitAuthenticationProvider
                        adapter={authAdapter}
                        status={authStatus}
                    >
                        <RainbowKitProvider theme={darkTheme({
                            accentColor: '#8a2be2',
                            accentColorForeground: 'white',
                            borderRadius: 'medium',
                            overlayBlur: 'small',
                        })}>
                            {huddleClient ? (
                                <HuddleProvider client={huddleClient}>
                                    <ConnectionLogger>
                                        {children}
                                    </ConnectionLogger>
                                </HuddleProvider>
                            ) : (
                                <ConnectionLogger>
                                    {children}
                                </ConnectionLogger>
                            )}
                        </RainbowKitProvider>
                    </RainbowKitAuthenticationProvider>
                </ApolloProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
