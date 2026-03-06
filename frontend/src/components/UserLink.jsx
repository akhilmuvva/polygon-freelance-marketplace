import React from 'react';
import { useIdentity } from '../hooks/useIdentity';

/**
 * UserLink: The "Antigravity" identity component.
 * Resolves ENS names, avatars, and Lens profiles automatically.
 */
export function UserLink({ address, style }) {
    const { displayName, avatar, isEns, lensProfile } = useIdentity(address);

    return (
        <span
            title={address}
            className="flex items-center gap-2"
            style={{
                fontWeight: (isEns || lensProfile) ? '700' : '500',
                color: (isEns || lensProfile) ? 'var(--accent-light)' : 'inherit',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                ...style
            }}
        >
            {avatar && (
                <img src={avatar} alt="avatar" style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid var(--border)' }} />
            )}
            {!avatar && lensProfile?.picture?.original?.url && (
                <img src={lensProfile.picture.original.url} alt="Lens avatar" style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid var(--accent-light)' }} />
            )}
            {displayName}
            {lensProfile && (
                <span title="Lens Verified" style={{ fontSize: '0.6rem', color: '#00cc66' }}>🌿</span>
            )}
        </span>
    );
}

export default UserLink;

