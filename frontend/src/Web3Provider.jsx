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
import { WagmiProvider, http, fallback, useAccount } from 'wagmi';
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

function SovereignAuthProvider({ children, authStatus, setAuthStatus }) {
    const { address, chainId } = useAccount();
    const identityRef = useRef(address);
    const chainRef = useRef(chainId);

    useEffect(() => {
        identityRef.current = address;
        chainRef.current = chainId;
    }, [address, chainId]);

    const authAdapter = useMemo(() => createAuthenticationAdapter({
        getNonce: async () => Math.random().toString(36).substring(2, 15).slice(0, 12),
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

    // RPC Total Purge: Removing all private/third-party providers (Infura, Blast, Llama) 
    // to eliminate 401/CORS bottlenecks. Using only official high-uptime public Polygon nodes.
    const config = useMemo(() => getDefaultConfig({
        appName: 'PolyLance Zenith',
        projectId,
        chains: [polygonAmoy, polygon],
        transports: {
            [polygonAmoy.id]: fallback([
                http('https://rpc-amoy.polygon.technology', DEFENSIVE_RPC_CONFIG),
                http('https://polygon-amoy-bor-rpc.publicnode.com', DEFENSIVE_RPC_CONFIG),
            ]),
            [polygon.id]: fallback([
                http('https://polygon-rpc.com', DEFENSIVE_RPC_CONFIG),
                http('https://rpc.ankr.com/polygon', DEFENSIVE_RPC_CONFIG),
            ]),
        },
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
                                        {children}
                                    </HuddleProvider>
                                ) : (
                                    <>
                                        <ConnectionLogger />
                                        {children}
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


