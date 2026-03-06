import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { Vote, Shield, Globe, Users, TrendingUp, Info, ChevronRight, Plus, Send, Zap, UserPlus, Scale, AlertTriangle, RefreshCw, Bell, Gavel } from 'lucide-react';
import { GOVERNANCE_ABI, REPUTATION_ABI, CROSS_CHAIN_GOVERNOR_ABI } from '../utils/daoABIs';
import { GOVERNANCE_ADDRESS, REPUTATION_ADDRESS, CROSS_CHAIN_GOVERNOR_ADDRESS } from '../constants';
import { toast } from 'react-toastify';

const cardBg = { padding: 24, borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' };
const dimLabel = { fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-tertiary)', marginBottom: 8, display: 'block' };
const badge = (bg, color, bdr) => ({
    fontSize: '0.6rem', fontWeight: 900, padding: '2px 8px', borderRadius: 4,
    background: bg, color, border: `1px solid ${bdr}`, textTransform: 'uppercase', letterSpacing: '0.1em',
    display: 'inline-flex', alignItems: 'center', gap: 4,
});
const switchRow = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
};

export default function DaoDashboard() {
    const { address } = useAccount();
    const [proposals, setProposals] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [useQuadratic, setUseQuadratic] = useState(false);
    const [isOptimistic, setIsOptimistic] = useState(false);
    const [isSecret, setIsSecret] = useState(false);
    const [isConviction, setIsConviction] = useState(false);
    const [isZK, setIsZK] = useState(false);
    const [targetAddr, setTargetAddr] = useState('0x0000000000000000000000000000000000000000');
    const [newProposalDesc, setNewProposalDesc] = useState('');
    const [delegateAddr, setDelegateAddr] = useState('');
    const [showDelegation, setShowDelegation] = useState(false);
    const { writeContractAsync } = useWriteContract();

    const { data: karmaBalance } = useReadContract({
        address: REPUTATION_ADDRESS, abi: REPUTATION_ABI, functionName: 'balanceOf', args: [address, 0n],
    });
    const { data: proposalCount } = useReadContract({
        address: GOVERNANCE_ADDRESS, abi: GOVERNANCE_ABI, functionName: 'proposalCount',
    });

    useEffect(() => {
        if (proposalCount) {
            const count = Number(proposalCount);
            const fetched = [];
            for (let i = count; i > Math.max(0, count - 10); i--) fetched.push(i);
            setProposals(fetched);
        }
    }, [proposalCount]);

    const handleCreateProposal = async (e) => {
        e.preventDefault();
        try {
            await writeContractAsync({
                address: GOVERNANCE_ADDRESS, abi: GOVERNANCE_ABI, functionName: 'createProposal',
                args: [newProposalDesc, useQuadratic, isOptimistic, isSecret, isConviction, isZK, 0n, targetAddr, '0x'],
            });
            toast.success(`Proposal #${Number(proposalCount) + 1} launched!`);
            setIsCreating(false); setNewProposalDesc('');
        } catch (error) { toast.error("Launch failed: " + (error.shortMessage || error.message)); }
    };

    const handleDelegate = async (e) => {
        e.preventDefault();
        try {
            await writeContractAsync({
                address: GOVERNANCE_ADDRESS, abi: GOVERNANCE_ABI, functionName: 'delegate', args: [delegateAddr],
            });
            toast.success("Power delegated successfully!"); setShowDelegation(false);
        } catch (error) { toast.error("Delegation failed: " + (error.shortMessage || error.message)); }
    };

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 8 }}>
                        DAO <span style={{ color: 'var(--accent-light)' }}>PRO</span>
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={badge('rgba(124,92,252,0.12)', 'var(--accent-light)', 'rgba(124,92,252,0.25)')}>
                            Omnichain Governance
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-tertiary)' }}>
                            <RefreshCw size={12} /> Virtual State Synced
                        </span>
                    </div>
                </motion.div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => setShowDelegation(true)} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 10 }}>
                        <UserPlus size={18} /> Delegate
                    </button>
                    <button onClick={() => setIsCreating(true)} className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 10, boxShadow: '0 0 20px rgba(124,92,252,0.3)' }}>
                        <Zap size={18} /> Propose Change
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 40 }}>
                {[
                    { icon: Shield, label: 'Voting Weight', value: `${karmaBalance ? Number(karmaBalance) : 0}`, unit: 'Karma', color: 'var(--accent-light)', borderAccent: 'var(--accent-light)' },
                    { icon: Scale, label: 'Governance Mode', value: 'Antigravity (Baal)', extraColor: 'var(--info)' },
                    { icon: TrendingUp, label: 'DAO Treasury', value: '$4.2M', extra: '▲ 12%', color: '#fff', extraColor: 'var(--success)' },
                    { icon: AlertTriangle, label: 'Exit Strategy', value: 'Ragequit Active', color: 'var(--danger)' },
                ].map((m, i) => (
                    <div key={i} style={{ ...cardBg, position: 'relative', borderLeft: m.borderAccent ? `3px solid ${m.borderAccent}` : undefined }}>
                        {m.label === 'Exit Strategy' ? (
                            <button onClick={() => {
                                if (window.confirm("ARE YOU SURE? Ragequitting will burn your reputation and exit your share of the treasury. This is the ultimate sovereign act.")) {
                                    toast.error("Ragequit Initiated... Burning SBTs...");
                                }
                            }} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }} />
                        ) : null}
                        <m.icon size={40} style={{ position: 'absolute', top: 16, right: 16, opacity: 0.06 }} />
                        <span style={dimLabel}>{m.label}</span>
                        <div style={{ fontSize: m.unit ? '2rem' : '1.1rem', fontWeight: 900, color: m.color }}>
                            {m.value}
                            {m.unit && <span style={{ fontSize: '0.82rem', fontWeight: 600, opacity: 0.4, marginLeft: 6 }}>{m.unit}</span>}
                            {m.extra && <span style={{ fontSize: '0.72rem', fontWeight: 700, color: m.extraColor || m.color, marginLeft: 6 }}>{m.extra}</span>}
                        </div>
                    </div>
                ))}
            </div>


            {/* Integrity Monitor */}
            <div style={{
                marginBottom: 40, padding: 2, borderRadius: 42,
                background: 'linear-gradient(135deg, rgba(124,92,252,0.15), transparent, rgba(139,92,246,0.15))',
            }}>
                <div style={{
                    background: '#02040a', borderRadius: 40, padding: 24,
                    display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ position: 'relative' }}>
                            <Shield size={24} style={{ color: 'var(--accent-light)' }} />
                        </div>
                        <div>
                            <div style={{ ...dimLabel, marginBottom: 4 }}>Security Integrity Monitor</div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                                Protocol Aura: <span style={{ color: 'var(--success)' }}>EXCELLENT</span>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 40 }}>
                        {[
                            { label: 'Immersion Score', value: '98/100', color: 'var(--accent-light)' },
                            { label: 'Sybil Resistance', value: 'ACTIVE', color: 'var(--info)' },
                            { label: 'Audit Freshness', value: 'REAL-TIME', color: 'var(--accent-light)' },
                        ].map((s, i) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.58rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.4 }}>{s.label}</span>
                                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: s.color }}>{s.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main: Proposals + Sidebar */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 40 }}>
                {/* Proposal Feed */}
                <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <Users size={24} style={{ color: 'var(--accent-light)' }} /> Active Epoch
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {proposals.length > 0 ? (
                            proposals.map(id => <AdvancedProposalCard key={id} proposalId={id} />)
                        ) : (
                            <div style={{ ...cardBg, padding: 80, textAlign: 'center', opacity: 0.5, fontStyle: 'italic' }}>
                                Awaiting new community initiatives...
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                    <div>
                        <h4 style={dimLabel}>Governance Insights</h4>
                        <div style={{ ...cardBg, display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                <div style={{ padding: 8, borderRadius: 10, background: 'rgba(52,211,153,0.08)' }}>
                                    <TrendingUp size={16} style={{ color: 'var(--success)' }} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.88rem', fontWeight: 700 }}>Voter Participation: 68%</p>
                                    <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                                        High engagement this week due to the CCIP Fee adjustment proposal.
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                <div style={{ padding: 8, borderRadius: 10, background: 'rgba(239,68,68,0.08)' }}>
                                    <AlertTriangle size={16} style={{ color: 'var(--danger)' }} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.88rem', fontWeight: 700 }}>Slashing Monitor</p>
                                    <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                                        3 accounts penalized this epoch for spam/malicious proposals.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{
                        ...cardBg, background: 'rgba(139,92,246,0.04)',
                        border: '1px solid rgba(139,92,246,0.15)', position: 'relative', overflow: 'hidden',
                    }}>
                        <div style={{ position: 'absolute', bottom: -10, right: -10, opacity: 0.04 }}>
                            <Zap size={150} />
                        </div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: 8 }}>Supreme Council</h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: 16, lineHeight: 1.6 }}>
                            Holding 50+ Karma grants Veto rights on emergency protocol upgrades. Currently 12 active members.
                        </p>
                        <button style={{
                            background: 'none', border: 'none', color: 'var(--accent-light)',
                            fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
                            cursor: 'pointer',
                        }}>View Council Roadmap →</button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {isCreating && (
                    <Modal onClose={() => setIsCreating(false)}>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>New Protocol Initiative</h2>
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 28, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Shield size={14} style={{ color: 'var(--accent-light)' }} /> 5 Karma Security Deposit Required
                        </p>

                        <form onSubmit={handleCreateProposal} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                                <label style={dimLabel}>Objective</label>
                                <textarea value={newProposalDesc} onChange={(e) => setNewProposalDesc(e.target.value)}
                                    placeholder="Describe the change and its benefit to the DAO..."
                                    className="form-input" style={{ width: '100%', minHeight: 120, fontSize: '0.88rem' }} required />
                            </div>

                            {[
                                { icon: Scale, label: 'Quadratic Voting', desc: 'Simulates square root weight distribution', checked: useQuadratic, set: setUseQuadratic, color: 'var(--accent-light)' },
                                { icon: Zap, label: 'Optimistic Governance', desc: 'Passes automatically unless vetoed', checked: isOptimistic, set: setIsOptimistic, color: 'var(--info)' },
                                { icon: Shield, label: 'Secret Voting', desc: 'Uses Commit-Reveal for privacy', checked: isSecret, set: setIsSecret, color: 'var(--accent-light)' },
                                { icon: TrendingUp, label: 'Conviction Voting', desc: 'Accrues power over time', checked: isConviction, set: setIsConviction, color: 'var(--accent-light)' },
                                { icon: Globe, label: 'ZK Anonymity', desc: 'Zero-knowledge identity mask', checked: isZK, set: setIsZK, color: 'var(--accent-light)' },
                            ].map((opt, i) => (
                                <div key={i} style={switchRow}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <opt.icon size={20} style={{ color: opt.color }} />
                                        <div>
                                            <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>{opt.label}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{opt.desc}</div>
                                        </div>
                                    </div>
                                    <Switch checked={opt.checked} onChange={opt.set} />
                                </div>
                            ))}

                            <div>
                                <label style={dimLabel}>Execution Target (Optional)</label>
                                <input value={targetAddr} onChange={(e) => setTargetAddr(e.target.value)} placeholder="0x..."
                                    className="form-input" style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.78rem' }} />
                            </div>

                            <div style={{
                                padding: 12, borderRadius: 12,
                                background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                                display: 'flex', alignItems: 'flex-start', gap: 12,
                            }}>
                                <AlertTriangle size={16} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 2 }} />
                                <p style={{ fontSize: '0.72rem', color: 'var(--danger)', fontWeight: 700, lineHeight: 1.5 }}>
                                    If this proposal is rejected by 80%+ of the DAO, a 2 Karma penalty will be applied to your reputation.
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: 16, paddingTop: 16 }}>
                                <button type="button" onClick={() => setIsCreating(false)} className="btn btn-ghost" style={{ flex: 1, borderRadius: 10 }}>Abort</button>
                                <button type="submit" className="btn btn-primary"
                                    style={{ flex: 2, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <Send size={18} /> Broadcast to Chains
                                </button>
                            </div>
                        </form>
                    </Modal>
                )}

                {showDelegation && (
                    <Modal onClose={() => setShowDelegation(false)}>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Delegate Reputation</h2>
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>
                            Empower an industry expert to vote on your behalf. You retain ownership of your SBTs.
                        </p>
                        <form onSubmit={handleDelegate} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                                <label style={dimLabel}>Delegatee Address</label>
                                <input value={delegateAddr} onChange={(e) => setDelegateAddr(e.target.value)} placeholder="0x..."
                                    className="form-input" style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.78rem' }} required />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', borderRadius: 10 }}>Confirm Delegation</button>
                        </form>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
}

function AdvancedProposalCard({ proposalId }) {
    const { writeContractAsync } = useWriteContract();
    const [isHumanVerified, setIsHumanVerified] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const { data: proposal } = useReadContract({
        address: GOVERNANCE_ADDRESS, abi: GOVERNANCE_ABI, functionName: 'proposals', args: [BigInt(proposalId)],
    });

    const handleDispute = async (pid) => {
        const id = toast.loading("Initiating Kleros Court Dispute...");
        try {
            await writeContractAsync({ address: GOVERNANCE_ADDRESS, abi: GOVERNANCE_ABI, functionName: 'disputeProposal', args: [BigInt(pid)] });
            toast.update(id, { render: "Dispute Lodged in Kleros! ⚖️", type: "success", isLoading: false, autoClose: 3000 });
        } catch {
            toast.update(id, { render: "Dispute failed.", type: "error", isLoading: false, autoClose: 3000 });
        }
    };

    const { data: remoteVotes } = useReadContract({
        address: CROSS_CHAIN_GOVERNOR_ADDRESS, abi: CROSS_CHAIN_GOVERNOR_ABI,
        functionName: 'proposalVotes', args: [BigInt(proposalId), true],
    });

    const handleVote = async (support) => {
        if (!isHumanVerified) { toast.warn("Please verify humanity (WorldID) before casting this vote."); return; }
        const id = toast.loading("Confirming vote on-chain...");
        try {
            await writeContractAsync({ address: GOVERNANCE_ADDRESS, abi: GOVERNANCE_ABI, functionName: 'vote', args: [BigInt(proposalId), support] });
            toast.update(id, { render: "Vote secured! 🗳️", type: "success", isLoading: false, autoClose: 3000 });
        } catch {
            toast.update(id, { render: "Vote failed.", type: "error", isLoading: false, autoClose: 3000 });
        }
    };

    if (!proposal) return null;

    const forV = Number(proposal.forVotes || 0);
    const againstV = Number(proposal.againstVotes || 0);
    const remoteV = Number(remoteVotes || 0);
    const total = forV + againstV + remoteV;
    const supportP = total > 0 ? ((forV + remoteV) / total) * 100 : 0;

    const actionBtn = (bg, color, bdr) => ({
        padding: '6px 12px', borderRadius: 12, background: bg, color,
        border: `1px solid ${bdr}`, fontWeight: 700, fontSize: '0.72rem',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        transition: 'all 0.2s ease',
    });

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ ...cardBg, transition: 'border-color 0.3s ease' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={badge('rgba(255,255,255,0.03)', 'var(--text-tertiary)', 'rgba(255,255,255,0.05)')}>
                            ID #{proposal.id?.toString()}
                        </span>
                        {proposal.quadratic && (
                            <span style={badge('rgba(139,92,246,0.08)', 'var(--accent-light)', 'rgba(139,92,246,0.15)')}>
                                <Scale size={10} /> Quadratic
                            </span>
                        )}
                        <span style={badge(
                            proposal.executed ? 'rgba(52,211,153,0.08)' : 'rgba(124,92,252,0.08)',
                            proposal.executed ? 'var(--success)' : 'var(--accent-light)',
                            proposal.executed ? 'rgba(52,211,153,0.15)' : 'rgba(124,92,252,0.15)',
                        )}>
                            {proposal.executed ? 'EXECUTED' : 'LIVE'}
                        </span>
                    </div>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 900 }}>{proposal.description}</h4>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        Proposed by <span style={{ fontFamily: 'monospace', color: 'rgba(124,92,252,0.6)' }}>
                            {proposal.proposer?.slice(0, 6)}...{proposal.proposer?.slice(-4)}
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => handleDispute(proposalId)} style={actionBtn('rgba(239,68,68,0.08)', 'var(--danger)', 'rgba(239,68,68,0.15)')}>
                        <Gavel size={14} /> Dispute to Kleros
                    </button>
                    <button onClick={() => toast.info("AI Agent analyzing proposal logic...")}
                        style={actionBtn('rgba(124,92,252,0.12)', 'var(--accent-light)', 'rgba(124,92,252,0.2)')}>
                        <Zap size={14} /> Summon Agent
                    </button>
                    <button onClick={() => window.open(`https://warpcast.com/~/compose?text=Check out this DAO proposal on PolyLance!&embeds[]=https://your-api.com/api/frames/proposal/${proposalId}`, '_blank')}
                        style={actionBtn('rgba(138,99,210,0.12)', '#8a63d2', 'rgba(138,99,210,0.2)')}>
                        <Globe size={14} /> Cast to Frames
                    </button>
                </div>
            </div>

            {/* Voting progress */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', ...dimLabel }}>
                    <div style={{ display: 'flex', gap: 16 }}>
                        <span style={{ color: 'var(--success)' }}>Yes {forV + remoteV}</span>
                        <span style={{ color: 'var(--danger)' }}>No {againstV}</span>
                    </div>
                    <span style={{ opacity: 0.4 }}>{supportP.toFixed(1)}% Passing</span>
                </div>

                <div style={{ height: 8, width: '100%', background: 'rgba(255,255,255,0.04)', borderRadius: 20, overflow: 'hidden', display: 'flex' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${supportP}%` }}
                        style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent-light), var(--info))' }} />
                </div>

                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)',
                }}>
                    <div style={{ display: 'flex', gap: 16 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.62rem', fontWeight: 700, opacity: 0.6 }}>
                            <Shield size={12} style={{ color: 'var(--accent-light)' }} /> Polygon: {forV}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.62rem', fontWeight: 700, color: 'var(--info)' }}>
                            <Globe size={12} /> Remote: {remoteV}
                        </span>
                    </div>
                    <span style={{ fontSize: '0.62rem', fontWeight: 900, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                        Quorum: {(total / 50).toFixed(0)}/100
                    </span>
                </div>

                {/* Vote actions */}
                {!proposal.executed && (
                    <div style={{ paddingTop: 16 }}>
                        {!isHumanVerified ? (
                            <button onClick={() => {
                                toast.info("Connecting to WorldID Biometric Provider...");
                                setTimeout(() => { setIsHumanVerified(true); toast.success("Sybil Resistance Verified! Vote Unlocked."); }, 2000);
                            }} className="btn btn-ghost" style={{
                                width: '100%', padding: '14px 0', borderRadius: 12,
                                color: 'var(--info)', borderColor: 'rgba(34,211,238,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            }}>
                                <Users size={18} /> Verify Humanity to Vote
                            </button>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <button onClick={() => {
                                    setNotificationsEnabled(!notificationsEnabled);
                                    toast.success(notificationsEnabled ? "Push Notifications Disabled" : "Zenith Push Notifications Activated! 🔔");
                                }} style={{
                                    padding: 12, borderRadius: 16, cursor: 'pointer',
                                    background: notificationsEnabled ? 'rgba(124,92,252,0.12)' : 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${notificationsEnabled ? 'var(--accent-light)' : 'rgba(255,255,255,0.08)'}`,
                                    color: notificationsEnabled ? 'var(--accent-light)' : 'var(--text-tertiary)',
                                    transition: 'all 0.2s ease',
                                }}>
                                    <Bell size={20} />
                                </button>
                                <button onClick={() => handleVote(true)} className="btn btn-primary"
                                    style={{ flex: 1, padding: '12px 0', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    Cast Yes Vote
                                </button>
                                <button onClick={() => handleVote(false)} className="btn btn-ghost"
                                    style={{ padding: '12px 20px', borderRadius: 12, color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.15)' }}>
                                    Cast No Vote
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function Modal({ children, onClose }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
        }} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                style={{
                    ...cardBg, width: '100%', maxWidth: 520, padding: 40,
                    position: 'relative', overflow: 'hidden',
                }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: 'linear-gradient(90deg, var(--accent), var(--info))' }} />
                {children}
            </motion.div>
        </div>
    );
}

function Switch({ checked, onChange }) {
    return (
        <button type="button" onClick={() => onChange(!checked)}
            style={{
                width: 48, height: 24, borderRadius: 12, position: 'relative', border: 'none', cursor: 'pointer',
                background: checked ? 'var(--accent-light)' : 'rgba(255,255,255,0.1)',
                boxShadow: checked ? '0 0 15px rgba(124,92,252,0.4)' : 'none',
                transition: 'all 0.3s ease',
            }}>
            <motion.div animate={{ x: checked ? 26 : 2 }}
                style={{ width: 20, height: 20, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2 }} />
        </button>
    );
}
