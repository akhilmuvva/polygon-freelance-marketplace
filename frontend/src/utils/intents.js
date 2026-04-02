/**
 * intents.js
 * Implementation of EIP-712 Typed Signatures for Intent-Based Workflows.
 */

export const INTENT_DOMAIN = {
    name: 'PolyLance Zenith',
    version: '1',
    chainId: 137, // Polygon Mainnet
    verifyingContract: '0x0000000000000000000000000000000000000000' // Domain-wide
};

export const SOVEREIGN_INTENT_TYPES = {
    SovereignIntent: [
        { name: 'availability', type: 'bool' },
        { name: 'minRate', type: 'uint256' },
        { name: 'reputationRoot', type: 'bytes32' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
    ]
};

/**
 * Sign a Freelancer Intent using EIP-712
 */
export async function signSovereignIntent(walletClient, address, params) {
    if (!walletClient) throw new Error("Wallet not connected");

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
        types: SOVEREIGN_INTENT_TYPES,
        primaryType: 'SovereignIntent',
        message: intent
    });

    return { intent, signature };
}
