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

import CreateProposalModal from './CreateProposalModal';

const cardBg = { padding: 32, borderRadius: 32, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' };
const dimLabel = { fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 };
const badge = (bg, color, bdr) => ({
    fontSize: '0.6rem', fontWeight: 900, padding: '4px 12px', borderRadius: 10,
    background: bg, color, border: `1px solid ${bdr}`, textTransform: 'uppercase', letterSpacing: '0.15em',
    display: 'inline-flex', alignItems: 'center', gap: 6,
});

const ProposalCard = ({ id, onAction }) => {
    const { data: proposal } = useReadContract({
        address: GOVERNANCE_ADDRESS,
        abi: GOVERNANCE_ABI,
        functionName: 'proposals',
        args: [BigInt(id)],
    });

    if (!proposal) return null;

    const [propId, proposer, description, forVotes, againstVotes, startTime, endTime, executed] = proposal;
    const totalVotes = Number(forVotes) + Number(againstVotes);
    const progress = totalVotes > 0 ? (Number(forVotes) / totalVotes) * 100 : 0;

    return (
        <motion.div whileHover={{ y: -4 }} style={{ ...cardBg, background: 'rgba(255,255,255,0.015)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                        <span style={badge('rgba(255,255,255,0.03)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)')}>REF: 0x{id.toString(16).padStart(4, '0')}</span>
                        <span style={badge(executed ? 'rgba(74,222,128,0.05)' : 'rgba(0,245,212,0.05)', executed ? '#4ade80' : '#00f5d4', executed ? 'rgba(74,222,128,0.15)' : 'rgba(0,245,212,0.15)')}>
                            {executed ? 'Executed' : 'Active'}
                        </span>
                    </div>
                    <h4 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, lineHeight: 1.2 }}>{description || 'Legacy Directive'}</h4>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', marginTop: 8, fontWeight: 700 }}>
                        PROPOSER: {proposer.slice(0, 6)}...{proposer.slice(-4)}
                    </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 100 }}>
                    <div style={dimLabel}>VOTES</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{totalVotes}</div>
                </div>
            </div>
            <div style={{ height: 4, width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: 10, overflow: 'hidden', marginBottom: 32 }}>
                <div style={{ width: `${progress}%`, height: '100%', background: '#00f5d4', boxShadow: '0 0 10px #00f5d4' }} />
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
                <button 
                    disabled={executed}
                    style={{ 
                        flex: 2, height: 50, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', cursor: executed ? 'not-allowed' : 'pointer',
                        opacity: executed ? 0.3 : 1
                    }} 
                    onClick={() => onAction("Synchronizing Support Vote...")}
                >Support</button>
                <button 
                    disabled={executed}
                    style={{ 
                        flex: 1, height: 50, borderRadius: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.05)',
                        color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', cursor: executed ? 'not-allowed' : 'pointer',
                        opacity: executed ? 0.3 : 1
                    }} 
                    onClick={() => onAction("Synchronizing Opposition Vote...")}
                >Oppose</button>
            </div>
        </motion.div>
    );
};

export default function ZenithGovernance() {
    const { address } = useAccount();
    const [stats, setStats] = useState(null);
    const [velocity, setVelocity] = useState(0);
    const [proposals, setProposals] = useState([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

        if (proposalCount !== undefined) {
            const count = Number(proposalCount);
            const fetched = [];
            for (let i = count; i > Math.max(0, count - 10); i--) fetched.push(i);
            setProposals(fetched);
        }
    }, [proposalCount]);

    const handleAction = (msg) => toast.success(msg);

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: '100px', color: '#fff', fontFamily: "'Outfit', sans-serif" }}>
            
            {/* Header */}
            <header style={{ marginBottom: 80, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00f5d4', boxShadow: '0 0 10px #00f5d4' }} />
                        <span style={{ fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.3em' }}>
                            Omnichain Governance Protocol // v2.1.0
                        </span>
                    </div>
                    <h1 style={{ fontSize: '4.5rem', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1, margin: 0 }}>
                        Zenith <span style={{ color: '#00f5d4', textShadow: '0 0 40px rgba(0,245,212,0.2)' }}>Governance</span>
                    </h1>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                    <button 
                        style={{ 
                            height: 60, padding: '0 32px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', 
                            border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '11px', fontWeight: 900, 
                            textTransform: 'uppercase', letterSpacing: '0.2em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 
                        }} 
                        onClick={() => handleAction("Syncing Delegate Mesh...")}
                    >
                        <Users size={18} /> Delegates
                    </button>
                    <button 
                        style={{ 
                            height: 60, padding: '0 32px', borderRadius: 16, background: 'linear-gradient(135deg, #00f5d4, #06b6d4)', 
                            border: 'none', color: '#000', fontSize: '11px', fontWeight: 900, 
                            textTransform: 'uppercase', letterSpacing: '0.2em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                            boxShadow: '0 10px 30px rgba(0,245,212,0.2)'
                        }} 
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        <Plus size={18} /> New Proposal
                    </button>
                </div>
            </header>

            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 30, marginBottom: 60 }}>
                {[
                    { label: 'Voting Power', value: karmaBalance ? Number(karmaBalance) : '0', icon: <Cpu size={16} />, color: '#00f5d4' },
                    { label: 'Active Intents', value: stats?.totalEliteIntents || '0', icon: <RefreshCw size={16} />, color: '#6366f1' },
                    { label: 'Registry Sync', value: proposalCount !== undefined ? 'Valid' : 'Initializing', icon: <Target size={16} />, color: '#00f5d4' },
                    { label: 'Network TVL', value: `$${Number(stats?.totalValueLocked || 0).toLocaleString()}`, icon: <Activity size={16} />, color: '#ffffff' }
                ].map((stat, i) => (
                    <div key={i} style={cardBg}>
                        <div style={dimLabel}>{React.cloneElement(stat.icon, { style: { color: stat.color } })} {stat.label}</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Proposals Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 40 }}>
                <div>
                    <h3 style={{ ...dimLabel, marginBottom: 32 }}>Live System Initiatives</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {proposals.length === 0 ? (
                            <div style={{ ...cardBg, textAlign: 'center', padding: '60px 0', opacity: 0.5 }}>
                                <Globe size={48} style={{ marginBottom: 20, opacity: 0.3 }} />
                                <p style={{ fontWeight: 800 }}>No Active Governance Proposals Found</p>
                            </div>
                        ) : (
                            proposals.map(id => (
                                <ProposalCard key={id} id={id} onAction={handleAction} />
                            ))
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
                    <div style={{ ...cardBg, background: 'linear-gradient(135deg, rgba(0,245,212,0.03), transparent)' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <TrendingUp size={18} style={{ color: '#00f5d4' }} /> Sovereign Surplus
                        </h4>
                        <div style={{ fontSize: '2.8rem', fontWeight: 900, marginBottom: 8, letterSpacing: '-0.02em' }}>${Number(stats?.totalSovereignSurplus || 0).toLocaleString()}</div>
                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, lineHeight: 1.5, margin: 0 }}>Accumulated protocol surplus allocated for the Sovereign Safety Mesh and network insurance.</p>
                    </div>

                    <div style={cardBg}>
                        <h4 style={{ ...dimLabel, marginBottom: 24 }}>Governance Telemetry</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {[
                                { label: 'Voter Turnout', val: '0%', desc: 'Root Wallets Synced' },
                                { label: 'Sybil Shield', val: 'Active', desc: 'WorldID Gatekeeping' },
                                { label: 'Council Veto', val: 'Passive', desc: '0 Active Overrides' }
                            ].map((item, i) => (
                                <div key={i} style={{ paddingBottom: 20, borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>{item.label}</span>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#00f5d4' }}>{item.val}</span>
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <CreateProposalModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
        </div>
    );
}
