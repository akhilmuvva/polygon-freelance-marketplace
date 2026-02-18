// Environment configuration with fallbacks
export const config = {
    // WalletConnect
    walletConnectProjectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || '',

    // RPC URLs
    polygonRpc: import.meta.env.VITE_POLYGON_RPC || 'https://polygon-rpc.com',
    polygonAmoyRpc: import.meta.env.VITE_POLYGON_AMOY_RPC || 'https://rpc.ankr.com/polygon_amoy',

    // Optional services
    biconomyApiKey: import.meta.env.VITE_BICONOMY_API_KEY || '',
    huddleProjectId: import.meta.env.VITE_HUDDLE_PROJECT_ID || '',
    sentryDsn: import.meta.env.VITE_SENTRY_DSN || '',
    graphApiUrl: import.meta.env.VITE_GRAPH_API_URL || '',

    // App settings
    appEnv: import.meta.env.VITE_APP_ENV || 'production',
    appName: import.meta.env.VITE_APP_NAME || 'PolyLance',
    appUrl: import.meta.env.VITE_APP_URL || '',

    // Feature flags (disable features if env vars missing)
    features: {
        walletConnect: !!import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
        gaslessTransactions: !!import.meta.env.VITE_BICONOMY_API_KEY,
        videoCalls: !!import.meta.env.VITE_HUDDLE_PROJECT_ID,
        errorTracking: !!import.meta.env.VITE_SENTRY_DSN,
        subgraph: !!import.meta.env.VITE_GRAPH_API_URL,
    }
};

// Validation warnings (only in development)
if (import.meta.env.DEV) {
    if (!config.walletConnectProjectId) {
        console.warn('⚠️ VITE_WALLET_CONNECT_PROJECT_ID is not set. Wallet connection will not work.');
        console.warn('Get your Project ID from: https://cloud.walletconnect.com');
    }
}

export default config;
