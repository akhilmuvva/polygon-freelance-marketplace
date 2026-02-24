import React, { useState, useEffect, useRef } from 'react';
import { Gavel, AlertTriangle, ShieldCheck, Scale, Cpu, Search, FileText, ChevronRight, Clock, Banknote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { formatEther } from 'viem';
import CrossChainEscrowManagerABI from '../contracts/CrossChainEscrowManager.json';
import { CONTRACT_ADDRESS, CROSS_CHAIN_ESCROW_MANAGER_ADDRESS } from '../constants';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import { useAnimeAnimations } from '../hooks/useAnimeAnimations';

const ArbitrationDashboard = () => {
    const { address } = useAccount();
    const [disputes, setDisputes] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [loading, setLoading] = useState(true);

    const { staggerFadeIn, slideInLeft, revealOnScroll } = useAnimeAnimations();
    const headerRef = useRef(null);

    const { data: arbitratorRole } = useReadContract({
        address: CONTRACT_ADDRESS, abi: FreelanceEscrowABI.abi,
        functionName: 'hasRole',
        args: ['0x16ceee8289685dd2a02b9c8ae81d2df373176ce53519e6284e2a2950d6546ffa', address],
    });

    const isAdmin = arbitratorRole || false;
    const { writeContract } = useWriteContract();

    useEffect(() => {
        fetchDisputes();
    }, []);

    // Animate after data is loaded
    useEffect(() => {
        if (!loading && disputes.length > 0) {
            if (headerRef.current) slideInLeft(headerRef.current);
            setTimeout(() => staggerFadeIn('.dispute-card', 100), 300);
            const cleanup = revealOnScroll('.glass-card');
            return typeof cleanup === 'function' ? cleanup : undefined;
        }
    }, [loading, disputes.length]);

    const fetchDisputes = async () => {
        try {
            const data = await api.getDisputes();
            // If not admin, filter for disputes the user is involved in
            if (!isAdmin && address) {
                const userDisputes = data.filter(d =>
                    d.client?.toLowerCase() === address.toLowerCase() ||
                    d.freelancer?.toLowerCase() === address.toLowerCase()
                );
                setDisputes(userDisputes);
            } else {
                setDisputes(data);
            }
        }
        catch (err) { console.error('Failed to fetch disputes:', err); }
        finally { setLoading(false); }
    };

    const handleAnalyze = async (jobId) => {
        setIsAnalyzing(true);
        try {
            const analysis = await api.analyzeDispute(jobId);
            setSelectedJob(prev => ({ ...prev, disputeData: analysis }));
            toast.success("AI Arbitration Analysis Complete");
        } catch { toast.error("AI Analysis Failed"); }
        finally { setIsAnalyzing(false); }
    };

    const handleResolution = async (jobId, bps, isCrossChain = false) => {
        try {
            const ruling = bps === 100 ? 3 : (bps === 0 ? 2 : 1);
            const contractAddr = isCrossChain ? CROSS_CHAIN_ESCROW_MANAGER_ADDRESS : CONTRACT_ADDRESS;
            const contractAbi = isCrossChain ? CrossChainEscrowManagerABI.abi : FreelanceEscrowABI.abi;
            const fn = isCrossChain ? 'resolveCrossChainDispute' : 'resolveDisputeManual';
            const args = isCrossChain ? [BigInt(jobId), BigInt(ruling)] : [BigInt(jobId), BigInt(bps * 100)];

            writeContract({ address: contractAddr, abi: contractAbi, functionName: fn, args }, {
                onSuccess: async () => {
                    await api.resolveDispute(jobId, { ruling, reasoning: selectedJob.disputeData?.reasoning || 'Manual Resolution' });
                    toast.success(isCrossChain ? "Cross-Chain Dispute Resolved" : "Dispute Resolved Successfully");
                    fetchDisputes();
                }
            });
        } catch (err) { toast.error("Resolution Failed: " + err.message); }
    };

    const cardBg = { padding: 16, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' };
    const dimLabel = { fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 };

    return (
        <div>
            <header ref={headerRef} style={{ marginBottom: 36 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
                    <div style={{ padding: 12, borderRadius: 14, background: 'rgba(239,68,68,0.08)', color: 'var(--danger)' }}>
                        <Gavel size={28} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
                            Zenith <span style={{ color: 'var(--danger)' }}>Justice</span>
                        </h1>
                        <p style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-tertiary)' }}>
                            {isAdmin ? 'Protocol Court & AI Arbitration' : 'Your Personal Case Records'}
                        </p>
                    </div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 28 }}>
                {/* Dispute List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <h3 style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-tertiary)', marginBottom: 12 }}>
                        Active Cases ({disputes.length})
                    </h3>
                    {loading ? (
                        <div className="skeleton" style={{ height: 240, borderRadius: 16 }} />
                    ) : disputes.length === 0 ? (
                        <div style={{ ...cardBg, padding: 48, textAlign: 'center', borderStyle: 'dashed' }}>
                            <Scale size={40} style={{ opacity: 0.15, marginBottom: 12 }} />
                            <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-tertiary)' }}>Perfect Compliance: No Active Disputes</p>
                        </div>
                    ) : (
                        disputes.map(job => (
                            <motion.div key={job.jobId} whileHover={{ x: 5 }} onClick={() => setSelectedJob(job)}
                                className="dispute-card"
                                style={{
                                    ...cardBg, cursor: 'pointer', transition: 'border-color 0.2s ease',
                                    borderColor: selectedJob?.jobId === job.jobId ? 'rgba(239,68,68,0.4)' : 'var(--border)',
                                    background: selectedJob?.jobId === job.jobId ? 'rgba(239,68,68,0.03)' : 'rgba(255,255,255,0.03)',
                                }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 8px', background: 'rgba(239,68,68,0.12)', color: 'var(--danger)', borderRadius: 4, textTransform: 'uppercase' }}>
                                        Case #{job.jobId}
                                    </span>
                                    <AlertTriangle size={14} style={{ color: 'var(--danger)' }} />
                                </div>
                                <h4 style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 4 }}>{job.title}</h4>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                                    <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)' }}>
                                        Budget: {job.amount ? `${formatEther(job.amount)} POL` : '0'}
                                    </span>
                                    <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Case Details */}
                <div>
                    <AnimatePresence mode="wait">
                        {selectedJob ? (
                            <motion.div key={selectedJob.jobId}
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                                style={{ ...cardBg, padding: 32 }}>
                                {/* Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 4 }}>{selectedJob.title}</h2>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                            Parties: <span style={{ color: 'var(--text-primary)' }}>{selectedJob.client}</span>
                                            {' ↔ '}<span style={{ color: 'var(--text-primary)' }}>{selectedJob.freelancer}</span>
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                                        {isAdmin && (
                                            <button onClick={() => handleAnalyze(selectedJob.jobId)} disabled={isAnalyzing} className="btn btn-secondary btn-sm" style={{ gap: 8, height: 32 }}>
                                                <Cpu size={14} className={isAnalyzing ? 'animate-spin' : ''} />
                                                {isAnalyzing ? 'Analyzing...' : 'AI Audit'}
                                            </button>
                                        )}
                                        <div style={{ ...dimLabel, justifyContent: 'flex-end' }}>
                                            {selectedJob.disputeData?.arbitrator === 'Internal' ? 'Internal Jury' : 'External Court'}
                                        </div>
                                        <span style={{
                                            fontSize: '0.65rem', fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                                            background: selectedJob.disputeData?.arbitrator === 'Internal' ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)',
                                            color: selectedJob.disputeData?.arbitrator === 'Internal' ? 'var(--danger)' : 'var(--info)',
                                        }}>
                                            {selectedJob.disputeData?.arbitrator === 'Internal' ? 'Protocol Arbitrator' : 'Kleros Layer Waiting'}
                                        </span>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
                                    {[
                                        { icon: <Banknote size={10} />, label: 'Budget', value: selectedJob.amount ? `${formatEther(selectedJob.amount)} POL` : '0', color: 'var(--accent-light)' },
                                        { icon: <Clock size={10} />, label: 'Deadline', value: selectedJob.deadline ? new Date(selectedJob.deadline * 1000).toLocaleDateString() : 'N/A' },
                                        { icon: <ShieldCheck size={10} />, label: 'Status', value: 'Disputed', color: 'var(--danger)' },
                                        { icon: <Scale size={10} />, label: 'Dispute ID', value: `#${selectedJob.disputeData?.disputeId || 'N/A'}` },
                                    ].map((s, i) => (
                                        <div key={i} style={cardBg}>
                                            <div style={dimLabel}>{s.icon} {s.label}</div>
                                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: s.color || 'var(--text-primary)' }}>{s.value}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Details + AI */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginBottom: 32 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                        {/* Description */}
                                        <div>
                                            <h4 style={{ ...dimLabel, marginBottom: 10 }}><FileText size={14} /> Claim Description</h4>
                                            <p style={{ fontSize: '0.88rem', lineHeight: 1.7, opacity: 0.8 }}>{selectedJob.description}</p>
                                        </div>
                                        {/* Evidence */}
                                        <div>
                                            <h4 style={{ ...dimLabel, marginBottom: 10 }}>
                                                <Search size={14} /> Evidence Log ({selectedJob.evidence?.length || 0})
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                {selectedJob.evidence?.map((e, i) => (
                                                    <a key={i} href={`https://gateway.pinata.cloud/ipfs/${e.hash}`} target="_blank" rel="noreferrer"
                                                        style={{
                                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                            padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.03)',
                                                            border: '1px solid var(--border)', fontSize: '0.78rem', textDecoration: 'none', color: 'inherit',
                                                            transition: 'border-color 0.2s ease',
                                                        }}>
                                                        <span style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>{e.hash}</span>
                                                        <span style={{ fontSize: '0.58rem', textTransform: 'uppercase', fontWeight: 800, opacity: 0.4 }}>
                                                            {e.party === selectedJob.client ? 'Client' : 'Freelancer'}
                                                        </span>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* AI Analysis */}
                                    <div style={{
                                        padding: 24, borderRadius: 14,
                                        background: 'rgba(124,92,252,0.06)', border: '1px solid rgba(124,92,252,0.15)',
                                        position: 'relative', overflow: 'hidden',
                                    }}>
                                        <div style={{ position: 'absolute', top: 0, right: 0, padding: 16, opacity: 0.06 }}>
                                            <Cpu size={60} />
                                        </div>
                                        <h4 style={{ ...dimLabel, color: 'var(--accent-light)', marginBottom: 16 }}>
                                            <Cpu size={14} /> Gemini 2.0 Verdict
                                        </h4>

                                        {selectedJob.disputeData?.aiVerdict ? (
                                            <div>
                                                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', marginBottom: 14 }}>
                                                    <p style={{ fontSize: '0.78rem', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 14 }}>
                                                        "{selectedJob.disputeData.reasoning}"
                                                    </p>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...dimLabel }}>
                                                        <span>Suggested Split:</span>
                                                        <span style={{ color: 'var(--accent-light)' }}>{selectedJob.disputeData.aiSplit}% Freelancer</span>
                                                    </div>
                                                </div>
                                                {isAdmin && (
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                                        <button onClick={() => handleResolution(selectedJob.jobId, selectedJob.disputeData.aiSplit)}
                                                            className="btn btn-primary btn-sm" style={{ borderRadius: 8 }}>Accept AI Split</button>
                                                        <button onClick={() => handleAnalyze(selectedJob.jobId)}
                                                            className="btn btn-ghost btn-sm" style={{ borderRadius: 8 }}>Re-Analyze</button>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '28px 0' }}>
                                                <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: isAdmin ? 20 : 0 }}>
                                                    {isAdmin ? 'Neural analysis required to determine fair split.' : 'Gemini 2.0 is reviewing active evidence for this case.'}
                                                </p>
                                                {isAdmin && (
                                                    <button onClick={() => handleAnalyze(selectedJob.jobId)} disabled={isAnalyzing}
                                                        className="btn btn-primary" style={{ borderRadius: 10, gap: 8 }}>
                                                        {isAnalyzing ? 'Analyzing...' : <><Cpu size={16} /> Run Neural Audit</>}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Manual Override */}
                                {isAdmin && (
                                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24 }}>
                                        <h4 style={{ ...dimLabel, marginBottom: 18 }}>Manual Overwrite</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                                            <button onClick={() => handleResolution(selectedJob.jobId, 0, selectedJob.isCrossChain)}
                                                className="btn btn-ghost" style={{ borderRadius: 10, background: 'rgba(239,68,68,0.06)', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.15)' }}>
                                                Rule for Client
                                            </button>
                                            <button onClick={() => handleResolution(selectedJob.jobId, 50, selectedJob.isCrossChain)}
                                                className="btn btn-ghost" style={{ borderRadius: 10 }}>
                                                Split 50/50
                                            </button>
                                            <button onClick={() => handleResolution(selectedJob.jobId, 100, selectedJob.isCrossChain)}
                                                className="btn btn-ghost" style={{ borderRadius: 10, background: 'rgba(52,211,153,0.06)', color: 'var(--success)', borderColor: 'rgba(52,211,153,0.15)' }}>
                                                Rule for Freelancer
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {!isAdmin && (
                                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, textAlign: 'center' }}>
                                        <div style={{ padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid var(--border)' }}>
                                            <ShieldCheck size={24} style={{ color: 'var(--success)', marginBottom: 12, opacity: 0.6 }} />
                                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                                                This case is being mediated by Zenith High Council. <br />
                                                Evidence and chat logs are being verified.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <div style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                padding: '100px 40px', border: '2px dashed var(--border)', borderRadius: 20,
                                color: 'var(--text-tertiary)',
                            }}>
                                <Scale size={60} style={{ opacity: 0.08, marginBottom: 20 }} />
                                <p style={{ fontWeight: 700, fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    Select a case to begin arbitration
                                </p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default ArbitrationDashboard;
