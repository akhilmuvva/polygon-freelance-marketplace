import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useReadContract } from 'wagmi';
import { Vote, Shield, Globe, Users, TrendingUp, Info, ChevronRight, Plus, Send, Zap, UserPlus, Scale, AlertTriangle, RefreshCw, Bell, Gavel, Cpu, Target, Activity } from 'lucide-react';
import { GOVERNANCE_ABI, REPUTATION_ABI, CROSS_CHAIN_GOVERNOR_ABI } from '../utils/daoABIs';
import { GOVERNANCE_ADDRESS, REPUTATION_ADDRESS, CROSS_CHAIN_GOVERNOR_ADDRESS } from '../constants';
import SubgraphService from '../services/SubgraphService';
import { TreasuryButlerService } from '../services/TreasuryButlerService';
import toast from 'react-hot-toast';
// import { toast } from 'react-toastify';

const cardBg = { padding: 24, borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' };
const dimLabel = { fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-tertiary)', marginBottom: 8, display: 'block' };
const badge = (bg, color, bdr) => ({
    fontSize: '0.6rem', fontWeight: 900, padding: '3px 10px', borderRadius: 8,
    background: bg, color, border: `1px solid ${bdr}`, textTransform: 'uppercase', letterSpacing: '0.1em',
    display: 'inline-flex', alignItems: 'center', gap: 4,
});

export default function ZenithGovernance() {
    const { address } = useAccount();
    const [stats, setStats] = useState(null);
    const [velocity, setVelocity] = useState(0);
    const [proposals, setProposals] = useState([]);

    const { data: karmaBalance } = useReadContract({
        address: REPUTATION_ADDRESS, abi: REPUTATION_ABI, functionName: 'balanceOf', args: [address, 0n],
    });
    const { data: proposalCount } = useReadContract({
        address: GOVERNANCE_ADDRESS, abi: GOVERNANCE_ABI, functionName: 'proposalCount',
    });

    useEffect(() => {
        const fetchStats = async () => {
            const data = await SubgraphService.getProtocolStats();
            const ecosystem = await SubgraphService.getEcosystemStats();
            setStats(data);
            if (ecosystem) setVelocity(Number(ecosystem.totalVolume || 0));
        };
        fetchStats();

        if (proposalCount) {
            const count = Number(proposalCount);
            const fetched = [];
            for (let i = count; i > Math.max(0, count - 10); i--) fetched.push(i);
            setProposals(fetched);
        }
    }, [proposalCount]);

    const handleAction = (msg) => toast.success(msg);

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <header style={{ marginBottom: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                <h1 style={{ fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 8 }}>
                    Zenith <span style={{ color: 'var(--accent-light)' }}>Governance</span>
                </h1>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', fontWeight: 600 }}>OMNICHAIN PROPOSAL ENGINE & REPUTATION SYSTEM</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-secondary" style={{ borderRadius: 16 }} onClick={() => handleAction("Synchronizing Delegate Matrix...")}>
                        <Users size={18} /> Active Delegates
                    </button>
                    <button className="btn btn-primary" style={{ borderRadius: 16, gap: 8 }} onClick={() => handleAction("Initiating Sovereign Proposal Sequence...")}>
                        <Plus size={18} /> New Proposal
                    </button>
                </div>
            </header>

            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 40 }}>
                {[
                    { label: 'My Voting Power', value: karmaBalance ? Number(karmaBalance) : '0', icon: <Cpu size={16} />, color: 'var(--accent-light)' },
                    { label: 'Network Intents', value: stats?.totalEliteIntents || '0', icon: <RefreshCw size={16} />, color: 'var(--info)' },
                    { label: 'Quorum Readiness', value: proposalCount ? 'Valid' : 'Initializing', icon: <Target size={16} />, color: 'var(--success)' },
                    { label: 'TVL Locked', value: `$${Number(stats?.totalValueLocked || 0).toLocaleString()}`, icon: <Activity size={16} />, color: 'var(--secondary)' }
                ].map((stat, i) => (
                    <div key={i} style={cardBg}>
                        <div style={dimLabel}>{stat.icon} {stat.label}</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 900 }}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Proposals Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
                <div>
                    <h3 style={{ ...dimLabel, marginBottom: 20 }}>Live Initiatives</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {proposals.map(id => (
                            <motion.div key={id} whileHover={{ y: -4 }} style={cardBg}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                    <div>
                                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                            <span style={badge('rgba(255,255,255,0.03)', 'var(--text-tertiary)', 'var(--border)')}>#{id}</span>
                                            <span style={badge('rgba(52,211,153,0.1)', 'var(--success)', 'rgba(52,211,153,0.2)')}>Live</span>
                                        </div>
                                        <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Expand Cross-chain Escrow to Arbitrum One</h4>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={dimLabel}>VOTES</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 900 }}>0</div>
                                    </div>
                                </div>
                                <div style={{ height: 6, width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
                                    <div style={{ width: '0%', height: '100%', background: 'var(--accent-light)' }} />
                                </div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button className="btn btn-primary" style={{ flex: 1, height: 44, borderRadius: 12 }} onClick={() => handleAction("Casting Support Vote...")}>Vote Support</button>
                                    <button className="btn btn-secondary" style={{ flex: 1, height: 44, borderRadius: 12 }} onClick={() => handleAction("Casting Opposition Vote...")}>Vote Oppose</button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div style={{ ...cardBg, background: 'linear-gradient(135deg, rgba(34,197,94,0.05), transparent)' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <TrendingUp size={18} color="var(--success)" /> Sovereign Surplus
                        </h4>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 4 }}>${Number(stats?.totalSovereignSurplus || 0).toLocaleString()}</div>
                        <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>Accumulated protocol surplus for the Sovereign Safety Module.</p>
                    </div>

                    <div style={cardBg}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: 16 }}>Governance Insights</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {[
                                { label: 'Voter Turnout', val: '0%', desc: '0 unique wallets' },
                                { label: 'Sybil Shield', val: 'Active', desc: 'WorldID Gatekeeping' },
                                { label: 'Council Veto', val: 'Passive', desc: 'No active vetoes' }
                            ].map((item, i) => (
                                <div key={i}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{item.label}</span>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-light)' }}>{item.val}</span>
                                    </div>
                                    <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>{item.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
