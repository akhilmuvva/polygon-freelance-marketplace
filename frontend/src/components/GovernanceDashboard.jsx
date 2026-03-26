import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Landmark, Vote, PieChart, Users, ChevronRight, Scale, ShieldAlert, CheckCircle2, Zap, Clock, TrendingUp } from 'lucide-react';
import { useAccount } from 'wagmi';
import SubgraphService from '../services/SubgraphService';
import toast from 'react-hot-toast';

const cardBg = { padding: 32, borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' };
const dimLabel = { fontSize: '0.68rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-tertiary)', marginBottom: 12, display: 'block' };

const GovernanceDashboard = () => {
    const { address } = useAccount();
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [votingPower, setVotingPower] = useState(1000); // Mock tokens

    useEffect(() => {
        fetchProposals();
    }, []);

    const fetchProposals = async () => {
        // Mock Proposals for High-Stake Escrow Disputes
        const mock = [
            {
                id: 'PQ-128',
                title: 'Referral: Mission #3 Settlement Dispute',
                proposer: '0x88...f2',
                type: 'Dispute Settlement',
                description: 'Magistrate review requested for Milestone #1. AI Auditor suggested 70/30 split. Commmunity vote to confirm or adjust.',
                forVotes: 12500,
                againstVotes: 3200,
                status: 'Active',
                mechanism: 'Quadratic',
                deadline: '2 days left'
            },
            {
                id: 'PQ-129',
                title: 'Protocol Fee Adjustment (Reduce to 2%)',
                proposer: '0x55...a1',
                type: 'FEE_ADJUSTMENT',
                description: 'Proposal to reduce protocol fees for early adopters to increase liquidity and mission throughput.',
                forVotes: 45000,
                againstVotes: 12000,
                status: 'Active',
                mechanism: 'Linear',
                deadline: '5 days left'
            }
        ];
        setProposals(mock);
        setLoading(false);
    };

    const handleCastVote = (id, direction) => {
        const power = Math.sqrt(votingPower).toFixed(2); // Quadratic logic
        toast.success(`Quadratic Vote Cast! Impact: ${power} Votes`);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40, padding: '40px 0' }}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                        Zenith <span style={{ color: 'var(--accent-light)' }}>Court</span>
                    </h1>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.92rem', marginTop: 12, maxWidth: 500 }}>
                        Magistrate Command Center. Exercise your quadratic voice to govern protocol evolution and neutral settlement.
                    </p>
                </div>
                <div style={{ ...cardBg, padding: '16px 24px', textAlign: 'right' }}>
                    <span style={dimLabel}>Governance Power</span>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-light)' }}>{votingPower.toLocaleString()} <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Tokens</span></div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: 4 }}>Quadratic Impact: <span style={{ color: '#34d399', fontWeight: 800 }}>{Math.sqrt(votingPower).toFixed(2)} Votes</span></div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                <div style={cardBg}>
                    <TrendingUp size={24} style={{ color: '#34d399', marginBottom: 16 }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>4% Quorum</div>
                    <span style={dimLabel}>Participation Rate</span>
                </div>
                <div style={cardBg}>
                    <Scale size={24} style={{ color: 'var(--accent-light)', marginBottom: 16 }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>12 Active</div>
                    <span style={dimLabel}>Pending Judgments</span>
                </div>
                <div style={cardBg}>
                    <ShieldAlert size={24} style={{ color: '#818cf8', marginBottom: 16 }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>Sybil Resistant</div>
                    <span style={dimLabel}>Governance Protocol</span>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Active Proposals</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                    {proposals.map(p => (
                        <motion.div key={p.id} whileHover={{ x: 4 }} style={cardBg}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Landmark size={20} style={{ color: 'var(--accent-light)' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{p.title}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 2 }}>Proposed by <span style={{ color: 'var(--accent-light)', fontWeight: 800 }}>{p.proposer}</span> • {p.deadline}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <span style={{ fontSize: '0.62rem', fontWeight: 900, background: 'rgba(124,92,252,0.1)', color: 'var(--accent-light)', padding: '4px 10px', borderRadius: 20, textTransform: 'uppercase' }}>{p.mechanism}</span>
                                    <span style={{ fontSize: '0.62rem', fontWeight: 900, background: 'rgba(52,211,153,0.1)', color: '#34d399', padding: '4px 10px', borderRadius: 20, textTransform: 'uppercase' }}>{p.type}</span>
                                </div>
                            </div>

                            <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', lineHeight: 1.6, maxWidth: 800, marginBottom: 24 }}>
                                {p.description}
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', flex: 1, gap: 40 }}>
                                    <div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#34d399' }}>{p.forVotes.toLocaleString()}</div>
                                        <span style={{ ...dimLabel, marginBottom: 0 }}>Voted For</span>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#f87171' }}>{p.againstVotes.toLocaleString()}</div>
                                        <span style={{ ...dimLabel, marginBottom: 0 }}>Voted Against</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button onClick={() => handleCastVote(p.id, 'Against')} style={{ padding: '10px 24px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: '#f87171', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer' }}>
                                        Reject
                                    </button>
                                    <button onClick={() => handleCastVote(p.id, 'For')} style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: 'var(--accent-light)', color: '#fff', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer' }}>
                                        Support
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

export default GovernanceDashboard;
