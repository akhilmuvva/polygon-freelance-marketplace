import React, { useState, useEffect } from 'react';
import { Gavel, AlertTriangle, ShieldCheck, Scale, Cpu, Search, FileText, ChevronRight, Clock, Banknote, Shield, Award, Zap, TrendingUp, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useWriteContract } from 'wagmi';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { formatEther } from 'viem';
import { CONTRACT_ADDRESS, ZENITH_JUDGES } from '../constants';
import hotToast from 'react-hot-toast';
import SubgraphService from '../services/SubgraphService';
import JobService from '../services/JobService';
import JurorService from '../services/JurorService';
import { useIdentity } from '../hooks/useIdentity';
import './ArbitrationDashboard.css';

const ZenithCourt = ({ address: propAddress, isAdmin: propIsAdmin }) => {
    const { address: wagmiAddress, isConnected } = useAccount();
    const address = propAddress || wagmiAddress;
    const identity = useIdentity(address);
    const [disputes, setDisputes] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('COURT'); // COURT | JUROR_DASH
    const [jurorStats, setJurorStats] = useState(null);
    const [isStaking, setIsStaking] = useState(false);
    const isAdmin = propIsAdmin ?? (address && ZENITH_JUDGES.some(j => j.toLowerCase() === address.toLowerCase()));
    const { writeContract, isPending } = useWriteContract();

    useEffect(() => {
        fetchDisputes();
        if (address) {
            JurorService.getJurorStats(address).then(setJurorStats);
        }
    }, [address, isAdmin]);

    const fetchDisputes = async () => {
        setLoading(true);
        try {
            const rawDisputes = await SubgraphService.getDisputes();
            if (!rawDisputes) {
                setDisputes([]);
                return;
            }
            const hydrated = await Promise.all(rawDisputes.map(async (d) => {
                const meta = await JobService.resolveMetadata(d.ipfsHash).catch(() => ({}));
                return { ...d, ...meta };
            }));
            setDisputes(hydrated);
        }
        catch (err) { 
            console.error('Failed to fetch disputes:', err);
            setDisputes([]);
        }
        finally { setLoading(false); }
    };

    const actuateJurorStakingIntent = async () => {
        if (!address) {
            hotToast.error('Identity required for judicial enrollment.');
            return;
        }

        setIsStaking(true);
        try {
            await JurorService.stake(address, 500);
            hotToast.success("Sovereign Stake Anchored: You are now an Active Juror.");
            setJurorStats(prev => ({ ...prev, activeStake: 500 }));
        } catch (err) { 
            console.error('[GRAVITY] Staking friction:', err);
            hotToast.error("Staking intent neutralized. Check liquidity resonance."); 
        } finally { 
            setIsStaking(false); 
        }
    };

    const actuateManualRulingIntent = (jobId, bps) => {
        if (!isAdmin) {
            hotToast.error('Sovereign authority required for manual ruling.');
            return;
        }

        writeContract({
            address: CONTRACT_ADDRESS,
            abi: FreelanceEscrowABI.abi,
            functionName: 'resolveDisputeManual',
            args: [BigInt(jobId), BigInt(bps * 100)],
            gas: 1000000n 
        }, {
            onSuccess: () => {
                hotToast.success("Decree Cast: Dispute Resolution Actuated.");
                fetchDisputes();
            },
            onError: (err) => {
                console.warn('[NETWORK] Ruling failed:', err.message);
                hotToast.error("Ruling friction detected. Check network resonance.");
            }
        });
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <motion.div 
            className="court-container"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <header className="court-header">
                <div>
                    <div className="justice-title">
                        <div className="justice-icon">
                            <Gavel size={32} />
                        </div>
                        <h1>Zenith <span className="text-danger">Justice</span></h1>
                    </div>
                    <p className="justice-subtitle">
                        DECENTRALIZED ARBITRATION & NEURAL VERDICT ENGINE
                    </p>
                </div>

                <div className="view-switcher">
                    <div 
                        onClick={() => setViewMode('COURT')} 
                        className={`view-tab ${viewMode === 'COURT' ? 'active' : ''}`}
                    >
                        Court Room
                    </div>
                    <div 
                        onClick={() => setViewMode('JUROR_DASH')} 
                        className={`view-tab ${viewMode === 'JUROR_DASH' ? 'active' : ''}`}
                    >
                        Juror Portal
                    </div>
                </div>
            </header>

            <AnimatePresence mode="wait">
                {viewMode === 'JUROR_DASH' ? (
                    <motion.div 
                        key="juror"
                        className="juror-portal-grid"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <div className="juror-card" style={{ gridColumn: 'span 2' }}>
                            <h3 className="section-title" style={{ fontSize: '1.25rem', marginBottom: '24px' }}>Your Arbiter Status</h3>
                            <div className="stat-grid">
                                <div className="stat-item">
                                    <div className="amount-label"><Scale size={14} /> Total Cases</div>
                                    <div className="amount-value" style={{ color: '#fff' }}>{jurorStats?.totalCases || 0}</div>
                                </div>
                                <div className="stat-item">
                                    <div className="amount-label"><ShieldCheck size={14} /> Correct Votes</div>
                                    <div className="amount-value" style={{ color: '#10b981' }}>{jurorStats?.correctVotes || 0}</div>
                                </div>
                                <div className="stat-item">
                                    <div className="amount-label"><Zap size={14} /> Rewards</div>
                                    <div className="amount-value">{jurorStats?.rewardsEarned || 0} POL</div>
                                </div>
                            </div>

                            <div className="staking-panel">
                                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px' }}>Juror Staking Pool</h4>
                                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '24px' }}>
                                    Stake POL tokens to be selected for trial juries. High-precision voters earn protocol fees and reputation multipliers.
                                </p>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ flex: 1, padding: '12px 20px', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 700 }}>
                                        {isAdmin ? "IMMUTABLE" : `${jurorStats?.activeStake || 0} POL`} Staked
                                    </div>
                                    {isAdmin ? (
                                        <div style={{ padding: '0 24px', height: '48px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', display: 'flex', alignItems: 'center', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.1em' }}>
                                            JUDICIAL SUPREMACY
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={actuateJurorStakingIntent} 
                                            disabled={isStaking || !isConnected || loading} 
                                            className="zenith-button"
                                            style={{ height: '48px', padding: '0 32px' }}
                                        >
                                            {isStaking ? 'Anchoring...' : 'Stake 500 POL'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="juror-card">
                            <h3 className="section-title" style={{ fontSize: '1.25rem', marginBottom: '24px' }}>Eligibility</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>Gravity Score</span>
                                    <span style={{ fontWeight: 800, color: 'var(--accent-primary)' }}>{identity?.reputationEpochs ?? 0}</span>
                                </div>
                                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, (identity?.reputationEpochs ?? 0))}%` }}
                                        style={{ height: '100%', background: 'var(--accent-primary)' }} 
                                    />
                                </div>
                                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                                    Minimum Gravity Score of 70 required to join the Juror Pool.
                                </p>
                                <div style={{ marginTop: '24px', padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div className="amount-label"><Award size={14} /> Judicial Rank</div>
                                    <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>{jurorStats?.rank || 'Novice'}</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="court"
                        className="court-layout"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <div className="dispute-list">
                            <h3 className="justice-subtitle">Active Disputes ({disputes.length})</h3>
                            {disputes.map(job => (
                                <motion.div 
                                    key={job.jobId} 
                                    variants={itemVariants}
                                    whileHover={{ scale: 1.02, x: 8 }} 
                                    onClick={() => setSelectedJob(job)}
                                    className={`dispute-card ${selectedJob?.jobId === job.jobId ? 'selected' : ''}`}
                                >
                                    <div className="dispute-id">CASE #{job.jobId}</div>
                                    <h4>{job.title}</h4>
                                    <div className="dispute-meta">
                                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{formatEther(job.amount || 0n)} POL</span>
                                        <ChevronRight size={18} opacity={0.5} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="court-detail">
                            <AnimatePresence mode="wait">
                                {selectedJob ? (
                                    <motion.div 
                                        key={selectedJob.jobId}
                                        className="court-detail-panel"
                                        initial={{ opacity: 0, scale: 0.98 }} 
                                        animate={{ opacity: 1, scale: 1 }} 
                                        exit={{ opacity: 0, scale: 0.98 }}
                                    >
                                        <div className="case-header">
                                            <div className="case-title-area">
                                                <h2>{selectedJob.title}</h2>
                                                <p style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 700 }}>
                                                    <AlertTriangle size={14} style={{ display: 'inline', marginRight: '6px' }} />
                                                    TRIAL PHASE: ACTIVE EVIDENCE REVIEW
                                                </p>
                                            </div>
                                            <div className="case-amount-area">
                                                <div className="amount-label">Escrow Amount</div>
                                                <div className="amount-value">{formatEther(selectedJob.amount || 0n)} POL</div>
                                            </div>
                                        </div>

                                        <div className="case-grid">
                                            <div className="case-info-box">
                                                <h4><FileText size={16} /> Case Brief</h4>
                                                <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.7)' }}>{selectedJob.description}</p>
                                            </div>
                                            <div className="case-info-box neural-box">
                                                <h4><Cpu size={16} /> Neural Verdict Engine</h4>
                                                <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--accent-primary)', opacity: 0.9 }}>
                                                    {selectedJob.aiSummary || "Neural analysis pending... Waiting for on-chain evidence synchronization."}
                                                </p>
                                            </div>
                                        </div>

                                        {isAdmin ? (
                                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '32px' }}>
                                                <h4 className="justice-subtitle" style={{ marginBottom: '20px' }}>Judicial Decree</h4>
                                                <div className="ruling-actions">
                                                    <button 
                                                        disabled={isPending || loading || !isConnected} 
                                                        onClick={() => actuateManualRulingIntent(selectedJob.jobId, 0)} 
                                                        className="ruling-btn client"
                                                    >
                                                        {isPending ? <Loader2 size={16} className="animate-spin" /> : 'Ruling: Client'}
                                                    </button>
                                                    <button 
                                                        disabled={isPending || loading || !isConnected} 
                                                        onClick={() => actuateManualRulingIntent(selectedJob.jobId, 50)} 
                                                        className="ruling-btn"
                                                    >
                                                        {isPending ? <Loader2 size={16} className="animate-spin" /> : 'Split 50/50'}
                                                    </button>
                                                    <button 
                                                        disabled={isPending || loading || !isConnected} 
                                                        onClick={() => actuateManualRulingIntent(selectedJob.jobId, 100)} 
                                                        className="ruling-btn freelancer"
                                                    >
                                                        {isPending ? <Loader2 size={16} className="animate-spin" /> : 'Ruling: Freelancer'}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ padding: '32px', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
                                                <Shield size={32} style={{ opacity: 0.2, marginBottom: '16px', color: 'var(--accent-primary)' }} />
                                                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginBottom: '20px' }}>
                                                    Only verified jurors in the trial pool can cast votes for this case.
                                                </p>
                                                <button onClick={() => setViewMode('JUROR_DASH')} className="zenith-button secondary" style={{ padding: '8px 24px' }}>Unlock Arbiter Status</button>
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <div className="empty-court">
                                        <Scale size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '24px' }} />
                                        <p style={{ fontStyle: 'Space Grotesk', fontSize: '1.25rem', fontWeight: 600 }}>Select Case to Begin Trial</p>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>Global Judicial Consensus Active</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ZenithCourt;
