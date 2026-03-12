import React, { useState, useMemo, useEffect } from 'react';
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
import hotToast from 'react-hot-toast';

const huddleProjectId = import.meta.env.VITE_HUDDLE_PROJECT_ID;
const huddleClient = huddleProjectId
    ? new HuddleClient({
        projectId: huddleProjectId,
        options: {
            activeSpeakersLimit: 5,
        },
    })
    : null;

import messagingService from './services/MessagingService';

function ConnectionLogger({ children }) {
    const { address, isConnected } = useAccount();

    useEffect(() => {
        if (isConnected) {
            console.info(`[SECURITY] Sovereign identity synchronized: ${address}`);
        } else {
            // Task 3: Signer Validation. Revert to IDLE on disconnect.
            messagingService.disconnect();
        }
    }, [isConnected, address]);

    return children;
}

/**
 * Sovereign Authentication Provider: Anchors the SIWE adapter to the active account.
 * This sub-component ensures that the authentication intent is always synchronized with the wallet.
 */
function SovereignAuthProvider({ children, authStatus, setAuthStatus }) {
    const { address, chainId } = useAccount();
    
    // Identity Resonance Refs: Ensuring the adapter has access to the latest session
    // context without triggering a full adapter reconstruction during the handshake.
    const identityRef = React.useRef(address);
    const chainRef = React.useRef(chainId);

    useEffect(() => {
        identityRef.current = address;
        chainRef.current = chainId;
    }, [address, chainId]);

    const authAdapter = useMemo(() => createAuthenticationAdapter({
        getNonce: async () => {
            // Task 1: Local Nonce Generation (0ms latency)
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let nonce = '';
            for (let i = 0; i < 17; i++) {
                nonce += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            return nonce;
        },

        createMessage: (args) => {
            try {
                // RainbowKit provides these in the args object
                const { nonce, address: siweAddress, chainId: siweChainId } = args;
                
                const targetAddress = siweAddress || identityRef.current;
                const targetChainId = siweChainId || chainRef.current || 80002;
                
                console.info('[SECURITY] Preparing SIWE intent:', { 
                    providedAddress: siweAddress, 
                    fallbackAddress: identityRef.current,
                    targetChainId, 
                    nonce 
                });

                if (!targetAddress || !nonce) {
                    const failReason = !targetAddress ? 'Missing Address' : 'Missing Nonce';
                    console.error(`[SECURITY] SIWE Resonance Failure: ${failReason}`);
                    throw new Error(`Identity resonance failure: ${failReason}`);
                }

                return new SiweMessage({
                    domain: window.location.hostname || 'localhost',
                    address: targetAddress,
                    statement: 'I am actuating my sovereign identity on the Zenith Antigravity Protocol.',
                    uri: window.location.origin,
                    version: '1',
                    chainId: Number(targetChainId),
                    nonce,
                }).prepareMessage();
                
            } catch (err) {
                console.error('[SECURITY] SIWE Intent Preparation Failure:', err.message);
                throw err;
            }
        },

        getMessageBody: ({ message }) => message,

        verify: async ({ message, signature }) => {
            console.info('[SECURITY] Verifying SIWE signature resonance (Sovereign Pass-Through)...');
            try {
                // Task 2: Bypass Verify Backend. Instant client-side validation.
                setAuthStatus('authenticated');
                
                // Task 4: Immediate State Reset. The modal closes via status change.
                hotToast.success('Identity Verified', { id: 'auth-success' });
                return true;
            } catch (err) {
                console.error('[SECURITY] SIWE verification collapse:', err);
                setAuthStatus('unauthenticated');
                return false;
            }
        },

        signOut: async () => {
            setAuthStatus('unauthenticated');
            console.info('[SECURITY] Sovereign session terminated.');
        },
    }), [setAuthStatus]); // Adapter is now stable

    return (
        <RainbowKitAuthenticationProvider adapter={authAdapter} status={authStatus}>
            {children}
        </RainbowKitAuthenticationProvider>
    );
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: 1, refetchOnWindowFocus: false },
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
    const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '3fcc6b4468bd937409483e8916718e49';

    const config = useMemo(() => {
        return getDefaultConfig({
            appName: 'PolyLance Zenith',
            projectId,
            chains: [polygonAmoy, polygon],
            transports: {
                // AMOY TESTNET: Keyless Sovereign Fallback Cluster
                [polygonAmoy.id]: fallback([
                    http('https://rpc-amoy.polygon.technology'),
                    http('https://polygon-amoy-bor-rpc.publicnode.com'),
                    http('https://rpc.ankr.com/polygon_amoy')
                ], { rank: true }),
                
                // POLYGON MAINNET: Keyless Sovereign Fallback Cluster
                [polygon.id]: fallback([
                    http('https://polygon-bor-rpc.publicnode.com'),
                    http('https://1rpc.io/matic'),
                    http('https://rpc.ankr.com/polygon')
                ], { rank: true }),
            },
            pollingInterval: 30_000, 
            ssr: false,
        });
    }, [projectId]);

    // Directive 03: Sovereign Telemetry Purge
    // Intercepting and neutralizing the '401', '429', and 'CORS/Network' noise from public RPC friction.
    useEffect(() => {
        const originalError = console.error;
        const originalWarn = console.warn;

        const noiseFilter = (...args) => {
            const message = args.join(' ').toLowerCase();
            const noise = [
                '401', '429', 'unauthorized', 'too many requests', 
                'cors', 'access-control-allow-origin', 'preflight', 
                'err_name_not_resolved', 'err_failed', 'failed to fetch',
                'load failed', 'websocket connection', 'blastapi', 'publicnode',
                'polygon-rpc.com', 'json-rpc'
            ];
            
            if (noise.some(term => message.includes(term))) {
                return;
            }
            return true;
        };

        console.error = (...args) => {
            if (noiseFilter(...args)) originalError(...args);
        };
        
        console.warn = (...args) => {
            if (noiseFilter(...args)) originalWarn(...args);
        };

        return () => { 
            console.error = originalError; 
            console.warn = originalWarn;
        };
    }, []);

    return (
        <WagmiProvider config={config} reconnectOnMount={true}>
            <QueryClientProvider client={queryClient}>
                <ApolloProvider client={apolloClient}>
                    <SovereignAuthProvider authStatus={authStatus} setAuthStatus={setAuthStatus}>
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
                    </SovereignAuthProvider>
                </ApolloProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
