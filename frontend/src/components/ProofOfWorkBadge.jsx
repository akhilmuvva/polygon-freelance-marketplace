import React, { useState, useEffect } from 'react';
import { Rocket, CheckCircle, ExternalLink, ShieldCheck, Clock, FileText, Loader2 } from 'lucide-react';
import JobService from '../services/JobService';

const ProofOfWorkBadge = ({ ipfsHash, status, isClient, onReleaseFunds }) => {
    const [powData, setPowData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (ipfsHash && ipfsHash.length > 20) {
            const fetchPoW = async () => {
                setLoading(true);
                try {
                    const resolved = await JobService.resolveMetadata(ipfsHash);
                    if (resolved && resolved.type === 'ProofOfWork') {
                        setPowData(resolved);
                    }
                } catch (e) {
                    console.error('[PoWBadge] Resolve failed:', e);
                } finally {
                    setLoading(false);
                }
            };
            fetchPoW();
        } else {
            setPowData(null);
        }
    }, [ipfsHash]);

    if (loading) {
        return (
            <div style={s.container}>
                <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />
                <span style={s.label}>Syncing Proof...</span>
            </div>
        );
    }

    if (!powData) {
        return (
            <div style={{ ...s.container, background: 'rgba(255,255,255,0.02)', borderStyle: 'dashed' }}>
                <Clock size={14} style={{ color: 'var(--text-tertiary)' }} />
                <span style={{ ...s.label, color: 'var(--text-tertiary)' }}>No Proof Submitted</span>
            </div>
        );
    }

    return (
        <div style={s.container}>
            <div style={s.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={s.iconBox}>
                        <Rocket size={14} color="var(--accent-light)" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={s.badgeTitle}>{powData.title}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ShieldCheck size={10} color="var(--success)" />
                            <span style={s.statusText}>Work Details Verified</span>
                        </div>
                    </div>
                </div>
                {powData.externalLink && (
                    <a href={powData.externalLink} target="_blank" rel="noreferrer" style={s.externalBtn}>
                        <ExternalLink size={12} />
                    </a>
                )}
            </div>

            <p style={s.desc}>{powData.description}</p>

            {isClient && status !== 'Completed' && status !== 'Closed' && (
                <div style={s.clientAction}>
                    <div style={s.divider} />
                    <button onClick={onReleaseFunds} className="btn btn-primary btn-sm" style={s.releaseBtn}>
                        <CheckCircle size={13} /> Verify & Release Funds
                    </button>
                </div>
            )}
        </div>
    );
};

const s = {
    container: {
        padding: '16px 20px', borderRadius: 16, background: 'rgba(45, 212, 191, 0.04)',
        border: '1px solid var(--accent-border)', display: 'flex', flexDirection: 'column',
        gap: 12, position: 'relative', overflow: 'hidden'
    },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    iconBox: {
        width: 32, height: 32, borderRadius: 10, background: 'rgba(45, 212, 191, 0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--accent-border)'
    },
    badgeTitle: { fontSize: '0.82rem', fontWeight: 800, color: '#fff' },
    statusText: { fontSize: '0.62rem', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.02em' },
    externalBtn: {
        width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)',
        color: 'var(--text-secondary)', transition: 'all 0.2s', textDecoration: 'none'
    },
    desc: {
        fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
    },
    clientAction: { marginTop: 4, display: 'flex', flexDirection: 'column', gap: 12 },
    divider: { height: 1, background: 'var(--accent-border)', opacity: 0.3 },
    releaseBtn: { width: '100%', borderRadius: 10, fontSize: '0.75rem', height: 34, gap: 6 },
    label: { fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)' }
};

export default ProofOfWorkBadge;
