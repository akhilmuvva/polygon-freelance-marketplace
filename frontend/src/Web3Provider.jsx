import React, {
    createContext,
    useState,
    useMemo,
    useEffect,
    useRef
} from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import {
    getDefaultConfig,
    RainbowKitProvider,
    RainbowKitAuthenticationProvider,
    createAuthenticationAdapter,
    darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider, http, fallback, useAccount, useSwitchChain } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { SiweMessage } from 'siwe';
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { HuddleClient, HuddleProvider } from '@huddle01/react';
import messagingService from './services/MessagingService';
import hotToast from 'react-hot-toast';
import env from './config/env';

const huddleProjectId = env.HUDDLE_PROJECT_ID;
const huddleClient = huddleProjectId
    ? new HuddleClient({
        projectId: huddleProjectId,
        options: {
            activeSpeakersLimit: 5,
        },
    })
    : null;

// RPC config — retry on failure with a small backoff, throttle polling
const RPC_CONFIG = {
    batch: { multicall: true },
    retryCount: 2,
    retryDelay: ({ count }) => Math.min(count * 1000, 3000),
    pollingInterval: 12_000,
};

// Logs wallet connect/disconnect events
function ConnectionLogger() {
    const { address, isConnected, status } = useAccount();

    useEffect(() => {
        if (isConnected && address) {
            console.info(`[Auth] Wallet connected: ${address}`);
        } else if (status === 'disconnected') {
            messagingService.disconnect();
        }
    }, [isConnected, address, status]);

    return null;
}

// Forces the wallet to switch to Polygon Mainnet if on a different network
function NetworkGuard({ children }) {
    const { chainId, isConnected } = useAccount();
    const { switchChain } = useSwitchChain();
    const POLYGON_MAINNET_ID = 137;

    useEffect(() => {
        if (isConnected && chainId && chainId !== POLYGON_MAINNET_ID) {
            hotToast.error('Wrong network. Please switch to Polygon Mainnet.', {
                id: 'network-switch-prompt',
                duration: 10000,
                position: 'top-right',
                style: {
                    background: '#1a1a1a',
                    color: '#fff',
                    border: '1px solid #8a2be2',
                },
                icon: '⚠️',
            });
            // Auto-prompt network switch after a short delay
            setTimeout(() => {
                switchChain({ chainId: POLYGON_MAINNET_ID });
            }, 1500);
        }
    }, [chainId, isConnected, switchChain]);

    return children;
}

// Handles Sign-In With Ethereum (SIWE) authentication flow
function AuthProvider({ children, authStatus, setAuthStatus }) {
    const { address, chainId } = useAccount();
    const identityRef = useRef(address);
    const chainRef = useRef(chainId);

    useEffect(() => {
        identityRef.current = address;
        chainRef.current = chainId;
    }, [address, chainId]);

    const authAdapter = useMemo(() => createAuthenticationAdapter({
        getNonce: async () => Math.random().toString(36).substring(2),
        createMessage: (args) => {
            try {
                const { nonce, address: siweAddress, chainId: siweChainId } = args;
                const targetAddress = siweAddress || identityRef.current;
                const targetChainId = siweChainId || chainRef.current || 137;

                return new SiweMessage({
                    domain: 'polylance.codes',
                    address: targetAddress,
                    statement: 'Sign in to PolyLance.',
                    uri: 'https://polylance.codes',
                    version: '1',
                    chainId: Number(targetChainId),
                    nonce,
                }).prepareMessage();
            } catch (err) {
                console.error('[Auth] Failed to create SIWE message:', err.message);
                throw err;
            }
        },
        getMessageBody: ({ message }) => message,
        verify: async ({ message, signature }) => {
            console.log('%c[Auth] Sign-in successful.', 'color: #10b981');

            // Persist session to survive page refresh
            try {
                localStorage.setItem('polylance_session', JSON.stringify({
                    address: identityRef.current,
                    timestamp: Date.now(),
                    authenticated: true
                }));
            } catch (e) {
                console.warn('[Auth] Could not save session:', e.message);
            }

            setAuthStatus('authenticated');
            hotToast.success('Signed in successfully.', { id: 'auth-success' });
            return true;
        },
        signOut: async () => {
            setAuthStatus('unauthenticated');
            localStorage.removeItem('polylance_session');
            console.info('[Auth] User signed out.');
        },
    }), [setAuthStatus]);

    return (
        <RainbowKitAuthenticationProvider adapter={authAdapter} status={authStatus}>
            {children}
        </RainbowKitAuthenticationProvider>
    );
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 60000 },
    },
});

const apolloClient = new ApolloClient({
    link: new HttpLink({
        uri: env.SUBGRAPH_URL,
        fetchOptions: { mode: 'cors' }
    }),
    cache: new InMemoryCache({
        typePolicies: {
            Query: {
                fields: {
                    jobs: { merge: false },
                },
            },
        },
    }),
});

export const AuthContext = createContext({
    authStatus: 'loading',
    setAuthStatus: () => {}
});

export function Web3Provider({ children }) {
    const [authStatus, setAuthStatus] = useState('unauthenticated');
    const projectId = env.WALLET_CONNECT_PROJECT_ID;

    // Use multiple public Polygon RPC nodes as fallback
    const config = useMemo(() => getDefaultConfig({
        appName: 'PolyLance',
        projectId,
        chains: [polygon],
        transports: {
            [polygon.id]: fallback([
                http('https://polygon-bor-rpc.publicnode.com'),
                http('https://rpc.ankr.com/polygon'),
                http('https://1rpc.io/matic'),
                http('https://polygon.llamarpc.com'),
            ]),
        },
        ...RPC_CONFIG,
        ssr: false,
    }), [projectId]);

    return (
        <WagmiProvider config={config} reconnectOnMount={true}>
            <QueryClientProvider client={queryClient}>
                <ApolloProvider client={apolloClient}>
                    <AuthProvider authStatus={authStatus} setAuthStatus={setAuthStatus}>
                        <AuthContext.Provider value={{ authStatus, setAuthStatus }}>
                            <RainbowKitProvider theme={darkTheme({
                                accentColor: '#8a2be2',
                                accentColorForeground: 'white',
                                borderRadius: 'medium',
                                overlayBlur: 'small',
                            })}>
                                {huddleClient ? (
                                    <HuddleProvider client={huddleClient}>
                                        <ConnectionLogger />
                                        <NetworkGuard>
                                            {children}
                                        </NetworkGuard>
                                    </HuddleProvider>
                                ) : (
                                    <>
                                        <ConnectionLogger />
                                        <NetworkGuard>
                                            {children}
                                        </NetworkGuard>
                                    </>
                                )}
                            </RainbowKitProvider>
                        </AuthContext.Provider>
                    </AuthProvider>
                </ApolloProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
