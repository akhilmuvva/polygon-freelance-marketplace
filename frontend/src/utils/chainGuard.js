/**
 * chainGuard.js — Matic Transaction Pre-flight Enforcement
 *
 * Every on-chain write in PolyLance MUST go through Polygon Mainnet (Chain ID 137).
 * Call `assertMatic(chainId)` before executing any writeContract / sendTransaction.
 *
 * Wagmi's useWriteContract already binds to the connected wallet chain,
 * and NetworkGuard in Web3Provider auto-prompts the user to switch.
 * This utility is an additional hard-stop safety net.
 */

export const MATIC_CHAIN_ID = 137;
export const MATIC_CHAIN_NAME = 'Polygon Mainnet';
export const MATIC_EXPLORER = 'https://polygonscan.com';
export const MATIC_RPC = 'https://polygon-rpc.com';
export const MATIC_CURRENCY = { name: 'MATIC', symbol: 'MATIC', decimals: 18 };

/**
 * Throws if the wallet is not on Polygon Mainnet.
 * Use this at the start of any transaction handler.
 *
 * @param {number|undefined} chainId - The connected wallet's chain ID
 * @throws {Error} if chain is not Polygon Mainnet
 */
export function assertMatic(chainId) {
    if (chainId !== MATIC_CHAIN_ID) {
        throw new Error(
            `[CHAIN GUARD] Transaction blocked: wallet is on chain ${chainId ?? 'unknown'}. ` +
            `All transactions require Polygon Mainnet (chain ${MATIC_CHAIN_ID}).`
        );
    }
}

/**
 * Returns true if the wallet is on Polygon Mainnet.
 * Use this for conditional rendering of "wrong network" warnings.
 *
 * @param {number|undefined} chainId
 * @returns {boolean}
 */
export function isOnMatic(chainId) {
    return chainId === MATIC_CHAIN_ID;
}

/**
 * Programmatically request the user's wallet to switch to Polygon Mainnet.
 * Adds the network if not present in the wallet.
 *
 * @returns {Promise<void>}
 */
export async function switchToMatic() {
    if (!window.ethereum) throw new Error('No Web3 wallet detected.');

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${MATIC_CHAIN_ID.toString(16)}` }],
        });
    } catch (switchError) {
        // Error code 4902: chain not added in the wallet
        if (switchError.code === 4902) {
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
            throw switchError;
        }
    }
}

/**
 * Formats a transaction hash as a Polygonscan link.
 *
 * @param {string} txHash
 * @returns {string}
 */
export function maticTxUrl(txHash) {
    return `${MATIC_EXPLORER}/tx/${txHash}`;
}

/**
 * Formats an address as a Polygonscan link.
 *
 * @param {string} address
 * @returns {string}
 */
export function maticAddressUrl(address) {
    return `${MATIC_EXPLORER}/address/${address}`;
}
