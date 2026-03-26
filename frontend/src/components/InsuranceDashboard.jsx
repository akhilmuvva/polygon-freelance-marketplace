import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, ShieldCheck, Landmark, DollarSign, Activity, PieChart, Lock, ArrowUpRight, History } from 'lucide-react';
import { useAccount } from 'wagmi';
import SubgraphService from '../services/SubgraphService';

const cardBg = { padding: 32, borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' };
const dimLabel = { fontSize: '0.68rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-tertiary)', marginBottom: 12, display: 'block' };

const InsuranceDashboard = () => {
    const { address } = useAccount();
    const [poolStats, setPoolStats] = useState({ total: 12500, available: 10200, payouts: 2300 });
    const [payouts, setPayouts] = useState([]);

    useEffect(() => {
        // Mock historical payouts for extreme dispute cases
        const mockPayouts = [
            { id: '1', date: '2024-03-24', amount: 450, reason: 'Extreme Settlement Error (Job #12)', recipient: '0x88...f2', status: 'COMPLETED' },
            { id: '2', date: '2024-03-20', amount: 150, reason: 'Magistrate Court Recommendation', recipient: '0x55...a1', status: 'COMPLETED' }
        ];
        setPayouts(mockPayouts);
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40, padding: '40px 0' }}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                        Zenith <span style={{ color: 'var(--accent-light)' }}>Shield</span>
                    </h1>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.92rem', marginTop: 12, maxWidth: 500 }}>
                        The Sovereign Safety Net. Collateralized protection for high-value missions and community liquidity.
                    </p>
                </div>
                <div style={{ ...cardBg, padding: '16px 24px', textAlign: 'right' }}>
                    <span style={dimLabel}>Shield Health</span>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#34d399' }}>99.2% <ShieldCheck size={20} style={{ display: 'inline', marginLeft: 4 }} /></div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                <div style={cardBg}>
                    <Landmark size={24} style={{ color: 'var(--accent-light)', marginBottom: 16 }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{poolStats.total.toLocaleString()} MATIC</div>
                    <span style={dimLabel}>Total Pool Staked</span>
                </div>
                <div style={cardBg}>
                    <ShieldCheck size={24} style={{ color: '#34d399', marginBottom: 16 }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{poolStats.available.toLocaleString()} MATIC</div>
                    <span style={dimLabel}>Available Coverage</span>
                </div>
                <div style={cardBg}>
                    <ShieldAlert size={24} style={{ color: '#f87171', marginBottom: 16 }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{poolStats.payouts.toLocaleString()} MATIC</div>
                    <span style={dimLabel}>Total Dispute Payouts</span>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>Payout Archive</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                    {payouts.map(p => (
                        <motion.div key={p.id} whileHover={{ x: 4 }} style={cardBg}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ShieldAlert size={20} style={{ color: '#f87171' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '1rem', fontWeight: 800 }}>{p.reason}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 2 }}>Paid to <span style={{ color: 'var(--accent-light)', fontWeight: 800 }}>{p.recipient}</span> • {p.date}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#f87171' }}>-{p.amount} MATIC</div>
                                    <span style={{ fontSize: '0.62rem', fontWeight: 900, background: 'rgba(52,211,153,0.1)', color: '#34d399', padding: '2px 8px', borderRadius: 4 }}>{p.status}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default InsuranceDashboard;
