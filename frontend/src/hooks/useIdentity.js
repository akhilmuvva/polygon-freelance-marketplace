import { useState, useEffect } from 'react';
import { useEnsName, useEnsAvatar } from 'wagmi';
import { normalize } from 'viem/ens';

/**
 * Hook to resolve Ethereum addresses to ENS names, avatars, and Lens profiles.
 * This is a core component of the "Antigravity" identity-centric UI.
 */
export function useIdentity(address) {
    const [identity, setIdentity] = useState({
        address: address,
        displayName: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '',
        avatar: null,
        isEns: false,
        lensProfile: null,
    });

    const { data: ensName } = useEnsName({
        address,
        chainId: 1, // ENS is on Ethereum Mainnet
    });

    const { data: ensAvatar } = useEnsAvatar({
        name: ensName ? normalize(ensName) : undefined,
        chainId: 1,
    });

    useEffect(() => {
        if (address) {
            setIdentity(prev => ({
                ...prev,
                address,
                displayName: ensName || `${address.slice(0, 6)}...${address.slice(-4)}`,
                avatar: ensAvatar || prev.avatar,
                isEns: !!ensName,
            }));
        }
    }, [address, ensName, ensAvatar]);

    /**
     * Resolve Lens Protocol profile and verification status.
     * This connects the economic identity to the social graph.
     */
    useEffect(() => {
        const fetchLens = async () => {
            if (!address) return;
            try {
                // In a production Antigravity app, we'd use the Lens API:
                // https://api-v2.lens.dev/
                console.log('[LENS] Resolving social graph for:', address);

                // Simulating Lens resolution response for the prototype
                const mockLensResult = {
                    handle: 'poly-pioneer.lens',
                    isFollowedByMe: false,
                    isFollowingMe: false,
                    isVerified: true,
                    reputationEpochs: 450
                };

                setIdentity(prev => ({
                    ...prev,
                    lensProfile: mockLensResult,
                    reputationEpochs: mockLensResult.reputationEpochs, // Expose at top level
                    displayName: mockLensResult.handle, // Lens handle takes precedence
                    isLens: true
                }));
            } catch (e) {
                console.warn('[LENS] Profile resolution failed', e);
            }
        };
        fetchLens();
    }, [address]);

    return {
        ...identity,
        reputationEpochs: identity.reputationEpochs ?? 0,
        displayName: identity.lensProfile?.handle || identity.ensName || `${address?.slice(0, 6)}...${address?.slice(-4)}`,
        isVerified: identity.lensProfile?.isVerified || false
    };
}

