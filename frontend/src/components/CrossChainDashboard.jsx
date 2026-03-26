import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Zap, ArrowUpRight, Share2, Shield, Activity, Share, Repeat, ExternalLink, Box, Layers, Wallet } from 'lucide-react';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';

const cardBg = { padding: 32, borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' };
const dimLabel = { fontSize: '0.68rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-tertiary)', marginBottom: 12, display: 'block' };

const CrossChainDashboard = () => {
    const { address } = useAccount();
    const [syncStatus, setSyncStatus] = useState({});
    const [activeChains, setActiveChains] = useState([
        { name: 'Polygon', eid: '30109', status: 'Healthy', icon: '🟣' },
        { name: 'Arbitrum', eid: '30110', status: 'Healthy', icon: '🔵' },
        { name: 'Base', eid: '30184', status: 'Healthy', icon: '🟡' },
        { name: 'Optimism', eid: '30111', status: 'Healthy', icon: '🔴' }
    ]);

    const handleBridgeReputation = async (eid) => {
        const chain = activeChains.find(c => c.eid === eid);
        toast.loading(`Bridging Sovereign Reputation to ${chain.name}...`);
        setTimeout(() => {
            setSyncStatus(prev => ({ ...prev, [eid]: 'SYNCED' }));
            toast.success(`Reputation Resonance Completed on ${chain.name}`);
        }, 3000);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40, padding: '40px 0' }}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h2 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                        Omnichain <span style={{ color: 'var(--accent-light)' }}>Bridge</span>
                    </h2>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.92rem', marginTop: 12, maxWidth: 500 }}>
                        LayerZero Sovereign Layer. Synchronize your reputation and settle missions across the entire EVM cluster.
                    </p>
                </div>
                <div style={{ ...cardBg, padding: '16px 24px', textAlign: 'right' }}>
                    <span style={dimLabel}>Omni Status</span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#34d399' }}>Resonance Active <Activity size={16} style={{ display: 'inline', marginLeft: 4 }} /></div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                <div style={cardBg}>
                    <Globe size={24} style={{ color: 'var(--accent-light)', marginBottom: 16 }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>4 Networks</div>
                    <span style={dimLabel}>Connected Chains</span>
                </div>
                <div style={cardBg}>
                    <Repeat size={24} style={{ color: '#34d399', marginBottom: 16 }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>117 Syncs</div>
                    <span style={dimLabel}>Omni-Messages Sent</span>
                </div>
                <div style={cardBg}>
                    <Shield size={24} style={{ color: '#818cf8', marginBottom: 16 }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>Unified CID</div>
                    <span style={dimLabel}>Identity Protocol</span>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>Network Topology</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                    {activeChains.map(chain => (
                        <motion.div key={chain.eid} whileHover={{ y: -2 }} style={cardBg}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{ fontSize: '2rem' }}>{chain.icon}</div>
                                    <div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{chain.name}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                                            EID: <span style={{ color: 'var(--accent-light)', fontWeight: 800 }}>{chain.eid}</span> • RPC: {chain.status}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    {syncStatus[chain.eid] === 'SYNCED' ? (
                                        <button disabled style={{ padding: '8px 20px', borderRadius: 12, border: 'none', background: 'rgba(52,211,153,0.1)', color: '#34d399', fontSize: '0.72rem', fontWeight: 900 }}>
                                            Synced
                                        </button>
                                    ) : (
                                        <button onClick={() => handleBridgeReputation(chain.eid)} style={{ padding: '8px 20px', borderRadius: 12, border: 'none', background: 'var(--accent-light)', color: '#fff', fontSize: '0.72rem', fontWeight: 900, cursor: 'pointer' }}>
                                            Bridge Status
                                        </button>
                                    )}
                                    <button style={{ padding: 8, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: 'none', color: '#fff', cursor: 'pointer' }}>
                                        <ExternalLink size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CrossChainDashboard;
