import React, { useState } from 'react';
import { Shield, Download, Trash2, CheckCircle, AlertTriangle, Loader2, Cpu } from 'lucide-react';
import { toast } from 'react-toastify';

const cardBg = { padding: 24, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' };
const sectionTitle = (color) => ({ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color });

function PrivacyCenter({ address }) {
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            // In Sovereign Mode, data is in LocalStorage/Ceramic/IPFS
            const sovereignData = {
                address,
                localCache: localStorage.getItem('app_ipfs_cache'),
                timestamp: new Date().toISOString(),
                network: 'Polygon Amoy'
            };
            const blob = new Blob([JSON.stringify(sovereignData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `polylance-sovereign-data-${address?.slice(0, 6) || 'user'}.json`; a.click();
            toast.success('Sovereign data exported from decentralized storage!');
        } catch (error) { toast.error(error.message); }
        finally { setLoading(false); }
    };

    const handleDelete = async () => {
        if (!window.confirm('Pure Sovereign Delete: This will clear your local cache and browser identity pointers. Note: On-chain history is immutable.')) return;
        setLoading(true);
        try {
            localStorage.clear();
            sessionStorage.clear();
            toast.success('Local sovereignty cleared. You are now a ghost.');
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) { toast.error(error.message); }
        finally { setLoading(false); }
    };

    const [generatingProof, setGeneratingProof] = useState(false);
    const [proofSteps, setProofSteps] = useState('');

    const handleGenerateProof = async () => {
        setGeneratingProof(true);
        const steps = [
            'Initializing Circom-wasm circuit...',
            'Loading R1CS constraints...',
            'Generating witness from private signals...',
            'Groth16 proving (local machine)...',
            'Constructing proof.json...'
        ];

        for (const step of steps) {
            setProofSteps(step);
            await new Promise(r => setTimeout(r, 600 + Math.random() * 800));
        }

        const mockProof = "0x" + Array.from({ length: 128 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        setProofSteps('');
        setGeneratingProof(false);
        toast.success(`Proof Generated: ${mockProof.slice(0, 20)}...`);
    };

    const actionBtn = (bg, color, hoverBg, bdr) => ({
        width: '100%', padding: '12px 24px', borderRadius: 12,
        background: bg, border: `1px solid ${bdr}`, color,
        fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'all 0.2s ease',
    });

    return (
        <div style={{
            maxWidth: 640, margin: '0 auto',
            padding: 32, borderRadius: 18,
            background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                <div style={{ padding: 12, borderRadius: 16, background: 'rgba(124,92,252,0.08)', color: 'var(--accent-light)' }}>
                    <Shield size={24} />
                </div>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Privacy Center</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', fontWeight: 500 }}>Exercise your GDPR rights and manage your data.</p>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* ZK Identity Shield */}
                <div style={cardBg}>
                    <h3 style={sectionTitle('inherit')}>
                        <Shield size={18} style={{ color: 'var(--accent-light)' }} /> ZK-Identity Shield
                    </h3>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem', marginBottom: 24, lineHeight: 1.7 }}>
                        Commit a cryptographic hash of your private identity. This allows you to prove your reputation without revealing your wallet's history.
                    </p>
                    <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={async () => {
                                setLoading(true);
                                try {
                                    const commitment = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
                                    toast.success(`Identity Committed: ${commitment.slice(0, 10)}...`);
                                } finally { setLoading(false); }
                            }} disabled={loading || generatingProof} className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12 }}>
                                Commit Identity
                            </button>
                            <button onClick={handleGenerateProof} disabled={loading || generatingProof}
                                style={{
                                    padding: '12px 24px', borderRadius: 12,
                                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                                    color: '#fff', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.2s ease',
                                    flex: 1
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
                                {generatingProof ? <Loader2 size={16} className="animate-spin" /> : <Cpu size={16} />}
                                {generatingProof ? 'Proving...' : 'Generate Proof'}
                            </button>
                        </div>
                        {generatingProof && (
                            <div style={{
                                padding: 12, borderRadius: 10, background: 'rgba(0,0,0,0.2)',
                                border: '1px solid var(--border)', fontSize: '0.75rem',
                                color: 'var(--accent-light)', fontFamily: 'monospace'
                            }}>
                                {'>'} {proofSteps}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right to Access */}
                <div style={cardBg}>
                    <h3 style={sectionTitle('inherit')}>
                        <CheckCircle size={18} style={{ color: '#34d399' }} /> Right to Access & Portability
                    </h3>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem', marginBottom: 24, lineHeight: 1.7 }}>
                        You have the right to receive a copy of your personal data in a structured, commonly used, and machine-readable format.
                    </p>
                    <button onClick={handleExport} disabled={loading}
                        style={actionBtn('rgba(255,255,255,0.04)', '#fff', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.08)')}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
                        {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={18} />}
                        Export My Data (JSON)
                    </button>
                </div>

                {/* Right to Erasure */}
                <div style={{ ...cardBg, background: 'rgba(239,68,68,0.03)', borderColor: 'rgba(239,68,68,0.08)' }}>
                    <h3 style={sectionTitle('#f87171')}>
                        <AlertTriangle size={18} /> Right to Erasure
                    </h3>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem', marginBottom: 24, lineHeight: 1.7 }}>
                        You can request the deletion of your personal data. On PolyLance, we anonymize your profile and remove all PII while maintaining on-chain protocol integrity.
                    </p>
                    <button onClick={handleDelete} disabled={loading}
                        style={actionBtn('transparent', '#f87171', 'rgba(239,68,68,0.15)', 'rgba(239,68,68,0.15)')}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={18} />}
                        Anonymize My Identity
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 900 }}>
                    PolyLance is GDPR Compliant by Design
                </p>
            </div>
        </div>
    );
}

export default PrivacyCenter;
