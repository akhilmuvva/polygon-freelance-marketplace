import React from 'react';
import { useIdentity } from '../hooks/useIdentity';

/**
 * UserLink: The "Antigravity" identity component.
 * Resolves ENS names, avatars, and Lens profiles automatically.
 */
export function UserLink({ address, style, shielded = false }) {
    const { displayName, avatar, isEns, lensProfile } = useIdentity(address);

    if (shielded) {
        return (
            <span
                className="flex items-center gap-2"
                style={{
                    color: 'var(--cyan)',
                    fontWeight: '800',
                    fontSize: '0.78rem',
                    letterSpacing: '0.02em',
                    ...style
                }}
            >
                <div style={{ padding: 4, borderRadius: 6, background: 'rgba(34,211,238,0.1)', display: 'flex' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
                </div>
                ZK-Verified Expert
            </span>
        );
    }

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

