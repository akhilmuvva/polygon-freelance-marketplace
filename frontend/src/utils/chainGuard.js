/**
 * chainGuard.js — Ensures all transactions go through Polygon Mainnet (Chain ID 137).
 *
 * Use assertMatic() at the start of any write transaction to block execution
 * on the wrong network. NetworkGuard in Web3Provider auto-switches on connect,
 * but this is a secondary safety check inside the transaction itself.
 */

export const MATIC_CHAIN_ID = 137;
export const MATIC_CHAIN_NAME = 'Polygon Mainnet';
export const MATIC_EXPLORER = 'https://polygonscan.com';
export const MATIC_RPC = 'https://polygon-rpc.com';
export const MATIC_CURRENCY = { name: 'MATIC', symbol: 'MATIC', decimals: 18 };

/**
 * Throws if the wallet is not on Polygon Mainnet.
 * Call this before any contract write.
 *
 * @param {number|undefined} chainId - current wallet chain ID
 * @throws {Error} if not on Polygon Mainnet
 */
export function assertMatic(chainId) {
    if (chainId !== MATIC_CHAIN_ID) {
        throw new Error(
            `Wrong network (chain ${chainId ?? 'unknown'}). ` +
            `Please switch to Polygon Mainnet (chain ${MATIC_CHAIN_ID}).`
        );
    }
}

/**
 * Returns true if the wallet is connected to Polygon Mainnet.
 *
 * @param {number|undefined} chainId
 * @returns {boolean}
 */
export function isOnMatic(chainId) {
    return chainId === MATIC_CHAIN_ID;
}

/**
 * Asks the wallet to switch to Polygon Mainnet.
 * Adds the network if it isn't already configured in the wallet.
 *
 * @returns {Promise<void>}
 */
export async function switchToMatic() {
    if (!window.ethereum) throw new Error('No Web3 wallet found.');

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${MATIC_CHAIN_ID.toString(16)}` }],
        });
    } catch (err) {
        // 4902 = chain not added in the wallet yet
        if (err.code === 4902) {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: `0x${MATIC_CHAIN_ID.toString(16)}`,
                    chainName: MATIC_CHAIN_NAME,
                    nativeCurrency: MATIC_CURRENCY,
                    rpcUrls: [MATIC_RPC, 'https://polygon-bor-rpc.publicnode.com'],
                    blockExplorerUrls: [MATIC_EXPLORER],
                }],
            });
        } else {
            throw err;
        }
    }
}

/** Returns a Polygonscan link for a transaction hash. */
export function maticTxUrl(txHash) {
    return `${MATIC_EXPLORER}/tx/${txHash}`;
}

/** Returns a Polygonscan link for an address. */
export function maticAddressUrl(address) {
    return `${MATIC_EXPLORER}/address/${address}`;
}
