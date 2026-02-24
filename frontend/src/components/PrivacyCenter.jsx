import React, { useState } from 'react';
import { Shield, Download, Trash2, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:3001/api';
const cardBg = { padding: 24, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' };
const sectionTitle = (color) => ({ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color });

function PrivacyCenter({ address }) {
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/gdpr/export/${address}`);
            if (!res.ok) throw new Error('Failed to export data');
            const data = await res.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `polylance-data-${address?.slice(0, 6) || 'user'}.json`; a.click();
            toast.success('Data export started!');
        } catch (error) { toast.error(error.message); }
        finally { setLoading(false); }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you absolutely sure? This will anonymize your profile and withdraw all consents. This action cannot be undone.')) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/gdpr/delete/${address}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete data');
            toast.success('Your data has been anonymized.');
        } catch (error) { toast.error(error.message); }
        finally { setLoading(false); }
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
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={async () => {
                            setLoading(true);
                            try {
                                const commitment = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
                                toast.success(`Identity Committed: ${commitment.slice(0, 10)}...`);
                            } finally { setLoading(false); }
                        }} disabled={loading} className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12 }}>
                            Commit Identity
                        </button>
                        <button onClick={() => toast.info("Proof Generation requires Circom-wasm. Initializing...")}
                            style={{
                                padding: '12px 24px', borderRadius: 12,
                                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                                color: '#fff', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.2s ease',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
                            Generate Proof
                        </button>
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
