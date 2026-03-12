/**
 * GaslessService.js
 * Configuration for Antigravity-supported Paymasters and UserOps.
 */

// Example configuration for an EIP-4337 based relay
export const ANTIGRAVITY_RELAY_CONFIG = {
    bundlerUrl: import.meta.env.VITE_ANTIGRAVITY_BUNDLER_URL || 'https://bundler.antigravity.network/rpc',
    paymasterUrl: import.meta.env.VITE_ANTIGRAVITY_PAYMASTER_URL || 'https://paymaster.antigravity.network/rpc',
    entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789', // Standard EntryPoint
};

/**
 * Strategy for Real-time Updates on Antigravity:
 * 1. WebSockets (Primary): Use Wagmi's useWatchContractEvent. 
 *    Antigravity's sub-second block times make standard polling (e.g., every 4s) feel sluggish.
 * 2. Subgraph (Secondary): Use for historical data retrieval. 
 *    Ensure the subgraph is configured with 'pruning: none' and a fast indexing node.
 */

export const getWebsocketTransport = (alchemyId) => {
    // Standardizing on public RPC infrastructure as requested
    return 'wss://polygon-rpc.com/ws'; 
};

/**
 * Example of how to use Gasless Relay with a Smart Account
 */
export async function sendGaslessTransaction(smartAccount, tx) {
    if (!smartAccount) {
        throw new Error('Smart Account not initialized');
    }
    try {
        // Construct the User Operation
        const userOp = await smartAccount.buildUserOp([tx]);

        // Let the Paymaster sign the operation (Sponsoring gas)
        if (!smartAccount.paymaster) {
            throw new Error('Paymaster not configured on Smart Account. Check your Biconomy dashboard settings.');
        }
        const paymasterServiceData = {
            mode: "SPONSORED",
        };
        const paymasterAndDataResponse = await smartAccount.paymaster.getPaymasterAndData(
            userOp,
            paymasterServiceData
        );
        userOp.paymasterAndData = paymasterAndDataResponse.paymasterAndData;

        // Sign and send via Bundler
        const userOpResponse = await smartAccount.sendUserOp(userOp);
        const { receipt } = await userOpResponse.wait();

        return receipt;
    } catch (error) {
        console.error("Gasless transaction failed:", error);
        throw error;
    }
}
