import React, { useEffect, useState } from 'react';
import { ProfileService } from '../services/ProfileService';
import { useEnsName, useEnsAvatar } from 'wagmi';
import { mainnet } from 'wagmi/chains';

export function UserLink({ address, style }) {
    const { data: ensName } = useEnsName({ address: address?.toLowerCase(), chainId: mainnet.id });
    const { data: ensAvatar } = useEnsAvatar({ name: ensName || undefined, chainId: mainnet.id });

    const [name, setName] = useState(null);

    useEffect(() => {
        if (!address) return;
        const fetchProfile = async () => {
            try {
                const profile = await ProfileService.getProfile(address.toLowerCase());
                if (profile && profile.name && profile.name !== 'New User') {
                    setName(profile.name);
                }
            } catch (err) {
                console.warn('[UserLink] Sovereign fetch failed:', err.message);
            }
        };
        fetchProfile();
    }, [address]);

    const display = name || ensName || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Unknown');

    return (
        <span
            title={address}
            className="inline-flex items-center gap-2"
            style={{
                fontWeight: (name || ensName) ? '600' : '400',
                color: (name || ensName) ? 'var(--primary)' : 'inherit',
                cursor: 'pointer',
                ...style
            }}
        >
            {ensAvatar && (
                <img src={ensAvatar} alt="avatar" className="w-5 h-5 rounded-full border border-white/10" />
            )}
            {display}
        </span>
    );
}

export default UserLink;
