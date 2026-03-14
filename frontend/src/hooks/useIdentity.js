import { useState, useEffect } from 'react';
import { useEnsName, useEnsAvatar } from 'wagmi';
import { normalize } from 'viem/ens';
import ProfileService from '../services/ProfileService';

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
     * Resolve Lens Protocol profile and sovereign reputation.
     * This connects the economic identity to the social and weightless data meshes.
     */
    const fetchSovereignIdentity = async () => {
        if (!address) return;
        try {
            // Task 1: Resolve Sovereign Profile (Ceramic/Mesh)
            const profile = await ProfileService.getProfile(address);
            if (profile && profile.name) {
                setIdentity(prev => ({
                    ...prev,
                    displayName: profile.name,
                    isSovereign: true
                }));
            }

            // Task 2: Resolve social graph (Lens Simulation)
            const mockLensResult = {
                handle: 'poly-pioneer.lens',
                isVerified: true,
                reputationEpochs: 450
            };

            setIdentity(prev => ({
                ...prev,
                lensProfile: mockLensResult,
                reputationEpochs: mockLensResult.reputationEpochs,
            }));
        } catch (e) {
            console.warn('[IDENTITY] Resonance failure', e);
        }
    };

    useEffect(() => {
        fetchSovereignIdentity();
        
        // Listen for real-time identity resonance
        const handleUpdate = (e) => {
            if (e.detail?.toLowerCase() === address?.toLowerCase()) {
                fetchSovereignIdentity();
            }
        };
        window.addEventListener('IDENTITY_UPDATED', handleUpdate);
        return () => window.removeEventListener('IDENTITY_UPDATED', handleUpdate);
    }, [address]);

    return {
        ...identity,
        reputationEpochs: identity.reputationEpochs ?? 0,
        displayName: identity.displayName || identity.lensProfile?.handle || identity.ensName || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''),
        isVerified: identity.lensProfile?.isVerified || false
    };
}

