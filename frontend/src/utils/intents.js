/**
 * intents.js
 * EIP-712 typed signing for off-chain freelancer availability intents.
 *
 * A freelancer can sign an "intent" declaring their availability and minimum
 * rate without publishing a transaction. The signature can be verified later
 * on-chain or by another party.
 */

export const INTENT_DOMAIN = {
    name: 'PolyLance',
    version: '1',
    chainId: 137, // Polygon Mainnet
    verifyingContract: '0x0000000000000000000000000000000000000000'
};

export const INTENT_TYPES = {
    FreelancerIntent: [
        { name: 'availability', type: 'bool' },
        { name: 'minRate', type: 'uint256' },
        { name: 'reputationRoot', type: 'bytes32' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
    ]
};

// Keep backward-compat export alias
export const SOVEREIGN_INTENT_TYPES = { SovereignIntent: INTENT_TYPES.FreelancerIntent };

/**
 * Signs a freelancer availability intent using EIP-712.
 *
 * @param {object} walletClient - viem wallet client
 * @param {string} address - signer address
 * @param {object} params - { availability, minRate, reputationRoot, nonce, deadline }
 * @returns {{ intent: object, signature: string }}
 */
export async function signFreelancerIntent(walletClient, address, params) {
    if (!walletClient) throw new Error('Wallet not connected.');

    const intent = {
        availability: params.availability ?? true,
        minRate: BigInt(params.minRate || 0),
        reputationRoot: params.reputationRoot || '0x0000000000000000000000000000000000000000000000000000000000000000',
        nonce: BigInt(params.nonce || Date.now()),
        deadline: BigInt(params.deadline || Math.floor(Date.now() / 1000) + 3600)
    };

    const signature = await walletClient.signTypedData({
        account: address,
        domain: INTENT_DOMAIN,
        types: INTENT_TYPES,
        primaryType: 'FreelancerIntent',
        message: intent
    });

    return { intent, signature };
}

// Backward-compat alias
export const signSovereignIntent = signFreelancerIntent;
