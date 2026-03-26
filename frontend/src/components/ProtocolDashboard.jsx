import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Landmark, Coins, TrendingUp, ShieldCheck, Activity, Users, Lock, ArrowUpRight, PieChart, BarChart3, Zap, Scale } from 'lucide-react';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';

const cardBg = { padding: 32, borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' };
const dimLabel = { fontSize: '0.68rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-tertiary)', marginBottom: 12, display: 'block' };

const ProtocolDashboard = () => {
    const { address } = useAccount();
    const [protocolMetrics, setProtocolMetrics] = useState({
        tvl: '1.2M MATIC',
        treasury: '450k USDC',
        staked: '820k POL',
        burnRate: '0.5%',
        apr: '12.4%'
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40, padding: '40px 0' }}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                        Zenith <span style={{ color: 'var(--accent-light)' }}>Protocol</span>
                    </h1>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.92rem', marginTop: 12, maxWidth: 500 }}>
                        Sovereign Economic Layer. Monitoring protocol health, treasury management, and decentralized governance alignment.
                    </p>
                </div>
                <div style={{ ...cardBg, padding: '16px 24px', textAlign: 'right' }}>
                    <span style={dimLabel}>Protocol Stability</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#34d399' }}>S-Tier Resilient <ShieldCheck size={18} style={{ display: 'inline', marginLeft: 4 }} /></div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                <div style={cardBg}>
                    <Lock size={20} style={{ color: 'var(--accent-light)', marginBottom: 12 }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{protocolMetrics.tvl}</div>
                    <span style={dimLabel}>Total Value Locked</span>
                </div>
                <div style={cardBg}>
                    <Landmark size={20} style={{ color: '#818cf8', marginBottom: 12 }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{protocolMetrics.treasury}</div>
                    <span style={dimLabel}>Sovereign Treasury</span>
                </div>
                <div style={cardBg}>
                    <Coins size={20} style={{ color: '#fbbf24', marginBottom: 12 }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{protocolMetrics.staked}</div>
                    <span style={dimLabel}>Staked Capital</span>
                </div>
                <div style={cardBg}>
                    <TrendingUp size={20} style={{ color: '#34d399', marginBottom: 12 }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{protocolMetrics.apr}</div>
                    <span style={dimLabel}>Yield Resonance</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
                <div style={cardBg}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Treasury Allocation</h2>
                        <PieChart size={24} style={{ opacity: 0.3 }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {[ 
                            { label: 'Insurance Pool Reserve', weight: 40, color: 'var(--accent-light)' },
                            { label: 'Platform Liquidity', weight: 35, color: '#818cf8' },
                            { label: 'DAO Initiatives', weight: 15, color: '#fbbf24' },
                            { label: 'Burn Counter-Mechanism', weight: 10, color: '#f87171' }
                        ].map(item => (
                            <div key={item.label} style={{ spaceY: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{item.label}</span>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 900 }}>{item.weight}%</span>
                                </div>
                                <div style={{ height: 6, width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: 10 }}>
                                    <div style={{ height: '100%', width: `${item.weight}%`, background: item.color, borderRadius: 10 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ ...cardBg, background: 'var(--gradient-primary)', color: '#000' }}>
                    <Scale size={32} style={{ marginBottom: 20 }} />
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 12 }}>Magistrate Board</h3>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.8, lineHeight: 1.6, marginBottom: 24 }}>
                        The protocol parameters are governed by the Zenith Court. Every parameter from burn rate to yield distribution is community-voted.
                    </p>
                    <button style={{ width: '100%', padding: '14px', borderRadius: 14, background: '#000', color: '#fff', border: 'none', fontSize: '0.72rem', fontWeight: 900, cursor: 'pointer' }}>
                        Enter Governance
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>Network Pulse</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    {[ 
                        { label: 'Active Users', value: '14.2k', change: '+12%', icon: Users },
                        { label: 'Hourly Tx', value: '882', change: '+5%', icon: Activity },
                        { label: 'Elite Intents', value: '157', change: '+22%', icon: Zap }
                    ].map(node => (
                        <motion.div key={node.label} whileHover={{ scale: 1.02 }} style={cardBg}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <div style={{ padding: 8, borderRadius: 10, background: 'rgba(255,255,255,0.03)', color: 'var(--accent-light)' }}>
                                    <node.icon size={20} />
                                </div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#34d399' }}>{node.change}</div>
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{node.value}</div>
                            <span style={dimLabel}>{node.label}</span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProtocolDashboard;
