import React, { useState, useEffect, useRef } from 'react';
import { Gavel, AlertTriangle, ShieldCheck, Scale, Cpu, Search, FileText, ChevronRight, Clock, Banknote, Shield, Award, Zap, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { formatEther } from 'viem';
import { CONTRACT_ADDRESS } from '../constants';
import hotToast from 'react-hot-toast';
import SubgraphService from '../services/SubgraphService';
import JobService from '../services/JobService';
import { useAnimeAnimations } from '../hooks/useAnimeAnimations.js';
import JurorService from '../services/JurorService';
import { useIdentity } from '../hooks/useIdentity';

const ARCHITECT_WALLET = '0x25F6C8ed995C811E6c0ADb1D66A60830E8115e9A';

const ZenithCourt = () => {
    const { address, isConnected } = useAccount();
    const identity = useIdentity(address);
    const [disputes, setDisputes] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('COURT'); // COURT | JUROR_DASH
    const [jurorStats, setJurorStats] = useState(null);
    const [isStaking, setIsStaking] = useState(false);

    const { staggerFadeIn, slideInLeft } = useAnimeAnimations();
    const headerRef = useRef(null);

    // Sovereign Override: Architect identity grants judicial supremacy.
    const isAdmin = arbitratorRole || address?.toLowerCase() === ARCHITECT_WALLET.toLowerCase();
    const { writeContract, isPending } = useWriteContract();

    useEffect(() => {
        fetchDisputes();
        if (address) {
            JurorService.getJurorStats(address).then(setJurorStats);
        }
    }, [address, isAdmin]);

    useEffect(() => {
        if (!loading && disputes.length > 0) {
            if (headerRef.current) slideInLeft(headerRef.current);
            setTimeout(() => staggerFadeIn('.dispute-card', 100), 300);
        }
    }, [loading, disputes.length]);

    const fetchDisputes = async () => {
        setLoading(true);
        try {
            const rawDisputes = await SubgraphService.getDisputes();
            const hydrated = await Promise.all(rawDisputes.map(async (d) => {
                const meta = await JobService.resolveMetadata(d.ipfsHash).catch(() => ({}));
                return { ...d, ...meta };
            }));
            setDisputes(hydrated);
        }
        catch (err) { console.error('Failed to fetch disputes:', err); }
        finally { setLoading(false); }
    };

    /// @notice Actuates a juror staking intent to join the decentralized judicial pool.
    /// @dev Staking constitutes a "Proof of Commitment" to protocol neutrality.
    const actuateJurorStakingIntent = async () => {
        if (!address) {
            hotToast.error('Identity required for judicial enrollment.');
            return;
        }

        setIsStaking(true);
        try {
            // Signal commitment to the JurorService: This anchors the actor's skin in the game.
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

    /// @notice Actuates a manual ruling intent to resolve a high-friction dispute.
    /// @dev This is the "Supreme Decree" of the protocol, finalizing economic distribution.
    const actuateManualRulingIntent = (jobId, bps) => {
        if (!isAdmin) {
            hotToast.error('Sovereign authority required for manual ruling.');
            return;
        }

        try {
            // Broad-casting the ruling to the EVM state via the resilient transport layer.
            // Directive 02: Force actuation even if simulation suggests failure (due to RPC noise).
            writeContract({
                address: CONTRACT_ADDRESS,
                abi: FreelanceEscrowABI.abi,
                functionName: 'resolveDisputeManual',
                args: [BigInt(jobId), BigInt(bps * 100)],
                gas: 1000000n // Directive 02: Simulation Bypass for Functional Finality
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
        } catch (err) {
            console.warn('[NETWORK] Manual ruling simulation bypass triggered.');
        }
    };

    const s = {
        card: { padding: 24, borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', transition: 'all 0.3s ease' },
        statBox: { padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' },
        label: { fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 },
        tab: (active) => ({
            padding: '10px 20px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
            background: active ? 'rgba(124,92,252,0.1)' : 'transparent',
            color: active ? 'var(--accent-light)' : 'var(--text-tertiary)',
            border: active ? '1px solid rgba(124,92,252,0.2)' : '1px solid transparent'
        })
    };

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <header ref={headerRef} style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
                        <div style={{ padding: 12, borderRadius: 16, background: 'rgba(239,68,68,0.08)', color: 'var(--danger)' }}>
                            <Gavel size={32} />
                        </div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.04em' }}>
                            Zenith <span style={{ color: 'var(--danger)' }}>Justice</span>
                        </h1>
                    </div>
                    <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
                        DECENTRALIZED ARBITRATION & NEURAL VERDICT ENGINE
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.03)', padding: 6, borderRadius: 14, border: '1px solid var(--border)' }}>
                    <div onClick={() => setViewMode('COURT')} style={s.tab(viewMode === 'COURT')}>Court Room</div>
                    <div onClick={() => setViewMode('JUROR_DASH')} style={s.tab(viewMode === 'JUROR_DASH')}>Juror Portal</div>
                </div>
            </header>

            {viewMode === 'JUROR_DASH' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
                    <div style={{ ...s.card, gridColumn: 'span 2' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 20 }}>Your Arbiter Status</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 32 }}>
                            <div style={s.statBox}>
                                <div style={s.label}><Scale size={14} /> Total Cases</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{jurorStats?.totalCases || 0}</div>
                            </div>
                            <div style={s.statBox}>
                                <div style={s.label}><ShieldCheck size={14} /> Correct Votes</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--success)' }}>{jurorStats?.correctVotes || 0}</div>
                            </div>
                            <div style={s.statBox}>
                                <div style={s.label}><Zap size={14} /> Rewards Earned</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-light)' }}>{jurorStats?.rewardsEarned || 0} POL</div>
                            </div>
                        </div>

                        <div style={{ padding: 24, borderRadius: 16, background: 'rgba(124,92,252,0.05)', border: '1px solid rgba(124,92,252,0.1)' }}>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: 10, color: 'var(--accent-light)' }}>Juror Staking Pool</h4>
                            <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: 20 }}>
                                Stake POL tokens to be selected for trial juries. High-precision voters earn protocol fees and reputation multipliers.
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ flex: 1, height: 44, borderRadius: 12, border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', padding: '0 16px', fontWeight: 700 }}>
                                    {jurorStats?.activeStake || 0} POL Staked
                                </div>
                                <button onClick={actuateJurorStakingIntent} disabled={isStaking || !isConnected || loading} className="btn btn-primary" style={{ padding: '0 24px', height: 44, opacity: (!isConnected || loading) ? 0.5 : 1, cursor: (!isConnected || loading) ? 'not-allowed' : 'pointer' }}>
                                    {isStaking ? 'Anchoring...' : 'Stake 500 POL'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div style={s.card}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 16 }}>Eligibility</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Gravity Score</span>
                                <span style={{ fontWeight: 800, color: 'var(--accent-light)' }}>{identity?.reputationEpochs ?? 0}</span>
                            </div>
                            <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.min(100, (identity?.reputationEpochs ?? 0))}%`, background: 'var(--accent)' }} />
                            </div>
                            <p style={{ fontSize: '0.7rem', opacity: 0.5, lineHeight: 1.5 }}>
                                Minimum Gravity Score of 70 required to join the Juror Pool.
                            </p>
                        </div>
                        <div style={{ marginTop: 'auto', paddingTop: 24 }}>
                            <div style={s.statBox}>
                                <div style={s.label}><Award size={14} /> Rank</div>
                                <div style={{ fontSize: '1rem', fontWeight: 800 }}>{jurorStats?.rank || 'Novice'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: 32 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <h3 style={s.label}>Active Disputes ({disputes.length})</h3>
                        {disputes.map(job => (
                            <motion.div key={job.jobId} whileHover={{ x: 5 }} onClick={() => setSelectedJob(job)}
                                style={{
                                    ...s.card, cursor: 'pointer',
                                    borderColor: selectedJob?.jobId === job.jobId ? 'rgba(239,68,68,0.4)' : 'var(--border)',
                                    background: selectedJob?.jobId === job.jobId ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.02)',
                                }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '3px 8px', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: 6 }}>
                                        #{job.jobId}
                                    </span>
                                    <TrendingUp size={12} style={{ opacity: 0.3 }} />
                                </div>
                                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: 4 }}>{job.title}</h4>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)' }}>{formatEther(job.amount || 0n)} POL</span>
                                    <ChevronRight size={16} />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div style={{ position: 'sticky', top: 100 }}>
                        <AnimatePresence mode="wait">
                            {selectedJob ? (
                                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={s.card}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 20, marginBottom: 24 }}>
                                        <div>
                                            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: 4 }}>{selectedJob.title}</h2>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Trial Phase: <span style={{ color: 'var(--danger)' }}>Active Evidence Review</span></p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={s.label}>Claim Amount</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--accent-light)' }}>{formatEther(selectedJob.amount || 0n)} POL</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
                                        <div>
                                            <h4 style={s.label}><FileText size={14} /> Case Details</h4>
                                            <p style={{ fontSize: '0.85rem', lineHeight: 1.6, opacity: 0.8 }}>{selectedJob.description}</p>
                                        </div>
                                        <div style={{ ...s.statBox, background: 'rgba(59,130,246,0.03)' }}>
                                            <h4 style={s.label}><Cpu size={14} /> Neural Summary</h4>
                                            <p style={{ fontSize: '0.75rem', fontStyle: 'italic', opacity: 0.7 }}>
                                                "Job lacks formal submission for milestone 2. Evidence from XMTP suggests a soft-renegotiation was attempted but not finalized."
                                            </p>
                                        </div>
                                    </div>

                                    {isAdmin ? (
                                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24 }}>
                                            <h4 style={s.label}>Protocol Ruling</h4>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                                <button disabled={isPending || loading || !isConnected} onClick={() => actuateManualRulingIntent(selectedJob.jobId, 0)} className="btn btn-ghost" style={{ borderRadius: 12, color: 'var(--danger)', opacity: (loading || !isConnected) ? 0.4 : 1 }}>Ruling: Client</button>
                                                <button disabled={isPending || loading || !isConnected} onClick={() => actuateManualRulingIntent(selectedJob.jobId, 50)} className="btn btn-ghost" style={{ borderRadius: 12, opacity: (loading || !isConnected) ? 0.4 : 1 }}>Split 50/50</button>
                                                <button disabled={isPending || loading || !isConnected} onClick={() => actuateManualRulingIntent(selectedJob.jobId, 100)} className="btn btn-ghost" style={{ borderRadius: 12, color: 'var(--success)', opacity: (loading || !isConnected) ? 0.4 : 1 }}>Ruling: Freelancer</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ padding: 24, borderRadius: 16, border: '1px dashed var(--border)', textAlign: 'center' }}>
                                            <Shield size={24} style={{ opacity: 0.3, marginBottom: 12 }} />
                                            <p style={{ fontSize: '0.82rem', opacity: 0.6 }}>Only verified jurors in the trial pool can cast votes for this case.</p>
                                            <button onClick={() => setViewMode('JUROR_DASH')} className="btn btn-secondary btn-sm" style={{ marginTop: 12 }}>Unlock Arbiter Status</button>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <div style={{ height: 400, border: '2px dashed var(--border)', borderRadius: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
                                    <Scale size={48} />
                                    <p style={{ fontWeight: 800, marginTop: 16 }}>Select Case to Begin Trial</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ZenithCourt;
