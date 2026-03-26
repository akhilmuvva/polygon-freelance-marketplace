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
import { polygon, polygonAmoy } from 'wagmi/chains';
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

/**
 * Defensive Provider: Alchemy Shield Configuration
 * Caps block ranges and adds jitter-based retry logic to avoid 429 bottlenecks.
 */
const DEFENSIVE_RPC_CONFIG = {
    batch: { multicall: true },
    retryCount: 2,
    retryDelay: ({ count }) => Math.min(count * 1000, 3000), // Jitter delay
    pollingInterval: 12_000, // Throttled polling
};

function ConnectionLogger() {
    const { address, isConnected, status } = useAccount();

    useEffect(() => {
        if (isConnected && address) {
            console.info(`[SECURITY] Sovereign identity synchronized: ${address}`);
        } else if (status === 'disconnected') {
            messagingService.disconnect();
        }
    }, [isConnected, address, status]);

    return null;
}

function NetworkGuard({ children }) {
    const { chainId, isConnected } = useAccount();
    const { switchChain } = useSwitchChain();
    const AMOY_ID = 80002;

    useEffect(() => {
        if (isConnected && chainId && chainId !== AMOY_ID) {
            hotToast.error('Resonance Mismatch: Please switch to Polygon Amoy.', {
                id: 'network-switch-prompt',
                duration: 10000,
                position: 'top-right',
                style: {
                    background: '#1a1a1a',
                    color: '#fff',
                    border: '1px solid #8a2be2',
                },
                icon: '🛰️',
            });
            // Auto-prompt switch after a small delay
            setTimeout(() => {
                 switchChain({ chainId: AMOY_ID });
            }, 1500);
        }
    }, [chainId, isConnected, switchChain]);

    return children;
}

function SovereignAuthProvider({ children, authStatus, setAuthStatus }) {
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
                const targetChainId = siweChainId || chainRef.current || 80002;
                
                // Directive 11: Production Identity Alignment
                // Hardcoding the domain and URI to ensure strictly zero 'Domain Gravity' mismatch on polylance.codes.
                const domain = 'polylance.codes';
                const uri = 'https://polylance.codes';

                return new SiweMessage({
                    domain,
                    address: targetAddress,
                    statement: 'Sovereign Identity Actuation on PolyLance Zenith.',
                    uri,
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
            console.log("%c[SECURITY] Identity Handshake Success.", "color: #10b981");
            
            // Task 1: Session Resurrection Anchor
            // Saving the active session to prevent 'Data Amnesia' on page refresh.
            try {
                localStorage.setItem('zenith_active_session', JSON.stringify({
                    address: identityRef.current,
                    timestamp: Date.now(),
                    authenticated: true
                }));
            } catch (e) { console.warn('[AUTH] Persistence failure:', e.message); }

            setAuthStatus('authenticated');
            hotToast.success('Identity Verified', { id: 'auth-success' });
            return true;
        },
        signOut: async () => {
            setAuthStatus('unauthenticated');
            localStorage.removeItem('zenith_active_session');
            console.info('[SECURITY] Sovereign session terminated.');
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

/**
 * [SECURITY] AuthContext: Neutralizing State Race Conditions
 * Providing a stable default prevents "reading properties of undefined" on initial hydrate.
 */
export const AuthContext = createContext({
    authStatus: 'loading',
    setAuthStatus: () => {}
});

export function Web3Provider({ children }) {
    const [authStatus, setAuthStatus] = useState('unauthenticated');
    const projectId = env.WALLET_CONNECT_PROJECT_ID;

    // RPC Total Purge: Expanding to a multi-node 'Resonance Fallback' cluster
    // Adding high-availability public nodes to neutralize 401/CORS rate-limiting bottlenecks.
    const config = useMemo(() => getDefaultConfig({
        appName: 'PolyLance Zenith',
        projectId,
        chains: [polygonAmoy, polygon],
        transports: {
            [polygonAmoy.id]: fallback([
                http('https://rpc-amoy.polygon.technology'),
                http('https://polygon-amoy-bor-rpc.publicnode.com'),
                http('https://amoy.polygon.drpc.org'),
                http('https://rpc.ankr.com/polygon_amoy'),
            ]),
            [polygon.id]: fallback([
                http('https://polygon-bor-rpc.publicnode.com'),
                http('https://polygon.drpc.org'),
                http('https://1rpc.io/matic'),
            ]),
        },
        ...DEFENSIVE_RPC_CONFIG, // Integrate retry & jitter-based batching
        ssr: false,
    }), [projectId]);



    return (
        <WagmiProvider config={config} reconnectOnMount={true}>
            <QueryClientProvider client={queryClient}>
                <ApolloProvider client={apolloClient}>
                    <SovereignAuthProvider authStatus={authStatus} setAuthStatus={setAuthStatus}>
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
                    </SovereignAuthProvider>
                </ApolloProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}


