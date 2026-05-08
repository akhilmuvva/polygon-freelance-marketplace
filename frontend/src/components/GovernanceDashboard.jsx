import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Landmark, Vote, PieChart, Users, ChevronRight, Scale, ShieldAlert, CheckCircle2, Zap, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { GOVERNANCE_ADDRESS, REPUTATION_ADDRESS } from '../constants';
import FreelanceGovernanceABI from '../contracts/FreelanceGovernance.json';
import FreelanceSBTABI from '../contracts/FreelanceSBT.json';
import toast from 'react-hot-toast';

const cardBg = { padding: 32, borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' };
const dimLabel = { fontSize: '0.68rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-tertiary)', marginBottom: 12, display: 'block' };

const GovernanceDashboard = () => {
    const { address } = useAccount();
    const { writeContract, data: hash, isPending: isVoting } = useWriteContract();
    
    // Fetch Proposal Count
    const { data: proposalCount, isLoading: loadingCount } = useReadContract({
        address: GOVERNANCE_ADDRESS,
        abi: FreelanceGovernanceABI.abi,
        functionName: 'proposalCount',
    });

    // Fetch User Reputation (Voting Power)
    const { data: userReputation } = useReadContract({
        address: REPUTATION_ADDRESS,
        abi: FreelanceSBTABI.abi,
        functionName: 'balanceOf',
        args: [address],
        query: { enabled: !!address }
    });

    // Generate contract calls for all proposals
    const proposalCalls = useMemo(() => {
        if (!proposalCount) return [];
        const calls = [];
        for (let i = 1; i <= Number(proposalCount); i++) {
            calls.push({
                address: GOVERNANCE_ADDRESS,
                abi: FreelanceGovernanceABI.abi,
                functionName: 'proposals',
                args: [BigInt(i)],
            });
        }
        return calls;
    }, [proposalCount]);

    // Fetch All Proposals
    const { data: proposalsRaw, isLoading: loadingProposals } = useReadContracts({
        contracts: proposalCalls,
        query: { enabled: proposalCalls.length > 0 }
    });

    const proposals = useMemo(() => {
        if (!proposalsRaw) return [];
        return proposalsRaw
            .map((res, index) => {
                if (res.status === 'success') {
                    const p = res.result;
                    // p is an array from the getter: [id, proposer, description, forVotes, againstVotes, startTime, endTime, executed, quadratic, optimistic, isSecret, isConviction, isZK, isDisputed, disputeId, convictionThreshold, target, data, queued]
                    return {
                        id: p[0].toString(),
                        proposer: `${p[1].slice(0, 6)}...${p[1].slice(-4)}`,
                        fullProposer: p[1],
                        description: p[2],
                        forVotes: Number(p[3]),
                        againstVotes: Number(p[4]),
                        startTime: Number(p[5]),
                        endTime: Number(p[6]),
                        executed: p[7],
                        mechanism: p[8] ? 'Quadratic' : 'Linear',
                        type: p[9] ? 'Optimistic' : 'Standard',
                        status: p[7] ? 'Executed' : (Number(p[6]) < Date.now() / 1000 ? 'Ended' : 'Active'),
                        deadline: Number(p[6]) < Date.now() / 1000 ? 'Closed' : `${Math.floor((Number(p[6]) - Date.now() / 1000) / 86400)} days left`,
                        isDisputed: p[13],
                        isConviction: p[11],
                        isZK: p[12]
                    };
                }
                return null;
            })
            .filter(p => p !== null)
            .reverse(); // Newest first
    }, [proposalsRaw]);

    const { isLoading: isWaitingForTx } = useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        if (hash) {
            toast.success('Vote Submitted to Mempool');
        }
    }, [hash]);

    const handleCastVote = async (id, support) => {
        if (!address) {
            toast.error('Please connect your wallet');
            return;
        }
        
        try {
            writeContract({
                address: GOVERNANCE_ADDRESS,
                abi: FreelanceGovernanceABI.abi,
                functionName: 'vote',
                args: [BigInt(id), support],
            });
        } catch (error) {
            console.error('Voting failed:', error);
            toast.error('Voting failed. Check console for details.');
        }
    };

    const votingPower = Number(userReputation || 0);
    const quadraticImpact = Math.sqrt(votingPower).toFixed(2);

    if (loadingCount || loadingProposals) {
        return (
            <div style={{ height: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                <Loader2 className="animate-spin" size={48} style={{ color: 'var(--accent-light)' }} />
                <p style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Synchronizing Zenith Governance State...</p>
            </div>
        );
    }

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
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-light)' }}>{votingPower.toLocaleString()} <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Reputation</span></div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: 4 }}>Quadratic Impact: <span style={{ color: '#34d399', fontWeight: 800 }}>{quadraticImpact} Votes</span></div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                <div style={cardBg}>
                    <TrendingUp size={24} style={{ color: '#34d399', marginBottom: 16 }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{proposals.length} Total</div>
                    <span style={dimLabel}>Platform Proposals</span>
                </div>
                <div style={cardBg}>
                    <Scale size={24} style={{ color: 'var(--accent-light)', marginBottom: 16 }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{proposals.filter(p => p.status === 'Active').length} Active</div>
                    <span style={dimLabel}>Pending Judgments</span>
                </div>
                <div style={cardBg}>
                    <ShieldAlert size={24} style={{ color: '#818cf8', marginBottom: 16 }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>Sybil Resistant</div>
                    <span style={dimLabel}>Governance Protocol</span>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Live Governance Stream</h2>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                        Connected to <span style={{ color: 'var(--accent-light)' }}>{GOVERNANCE_ADDRESS.slice(0, 10)}...</span>
                    </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                    {proposals.length === 0 ? (
                        <div style={{ ...cardBg, textAlign: 'center', padding: '60px' }}>
                            <Landmark size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 16, opacity: 0.2 }} />
                            <p style={{ color: 'var(--text-tertiary)' }}>No active proposals found on-chain.</p>
                        </div>
                    ) : (
                        proposals.map(p => (
                            <motion.div key={p.id} whileHover={{ x: 4 }} style={cardBg}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Landmark size={20} style={{ color: 'var(--accent-light)' }} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>Proposal #{p.id}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 2 }}>Proposed by <span style={{ color: 'var(--accent-light)', fontWeight: 800 }}>{p.proposer}</span> • {p.deadline}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <span style={{ fontSize: '0.62rem', fontWeight: 900, background: 'rgba(124,92,252,0.1)', color: 'var(--accent-light)', padding: '4px 10px', borderRadius: 20, textTransform: 'uppercase' }}>{p.mechanism}</span>
                                        <span style={{ fontSize: '0.62rem', fontWeight: 900, background: 'rgba(52,211,153,0.1)', color: '#34d399', padding: '4px 10px', borderRadius: 20, textTransform: 'uppercase' }}>{p.type}</span>
                                        {p.isDisputed && <span style={{ fontSize: '0.62rem', fontWeight: 900, background: 'rgba(248,113,113,0.1)', color: '#f87171', padding: '4px 10px', borderRadius: 20, textTransform: 'uppercase' }}>Disputed</span>}
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

                                    {p.status === 'Active' && (
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <button 
                                                disabled={isVoting || isWaitingForTx}
                                                onClick={() => handleCastVote(p.id, false)} 
                                                style={{ padding: '10px 24px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: '#f87171', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer', opacity: (isVoting || isWaitingForTx) ? 0.5 : 1 }}
                                            >
                                                Reject
                                            </button>
                                            <button 
                                                disabled={isVoting || isWaitingForTx}
                                                onClick={() => handleCastVote(p.id, true)} 
                                                style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: 'var(--accent-light)', color: '#fff', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer', opacity: (isVoting || isWaitingForTx) ? 0.5 : 1 }}
                                            >
                                                Support
                                            </button>
                                        </div>
                                    )}
                                    
                                    {p.status === 'Executed' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#34d399', fontSize: '0.8rem', fontWeight: 800 }}>
                                            <CheckCircle2 size={16} />
                                            Executed
                                        </div>
                                    )}
                                    
                                    {p.status === 'Ended' && !p.executed && (
                                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: 800 }}>
                                            Voting Closed
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default GovernanceDashboard;
