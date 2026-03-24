import React, { useState, useEffect, useRef } from 'react';
import { User, Briefcase, MapPin, Link as LinkIcon, Award, ExternalLink, Globe, Github, Twitter, Zap, Coins, CreditCard, ShieldCheck } from 'lucide-react';
import { useReadContract } from 'wagmi';
import { erc20Abi, formatEther } from 'viem';
import { POLY_TOKEN_ADDRESS, CONTRACT_ADDRESS } from '../constants';
import ProfileService from '../services/ProfileService';
import SubgraphService from '../services/SubgraphService';
import JobService from '../services/JobService';
import Reputation3D from './Reputation3D';
import { useAnimeAnimations } from '../hooks/useAnimeAnimations';
import ProofOfWorkBadge from './ProofOfWorkBadge';

function Portfolio({ address, onBack, onFiatPay }) {
    const [data, setData] = useState({ profile: null, jobs: [] });
    const [loading, setLoading] = useState(true);
    const sidebarRef = useRef(null);
    const mainRef = useRef(null);
    const { staggerFadeIn } = useAnimeAnimations();

    useEffect(() => {
        if (address) {
            const fetchDecentralizedPortfolio = async () => {
                setLoading(true);
                try {
                    // 1. Fetch Sovereign Profile (Subgraph -> IPFS)
                    const profile = await ProfileService.getProfile(address);

                    // 2. Fetch Job History (Subgraph)
                    const subgraphData = await SubgraphService.getUserPortfolio(address);
                    const rawJobs = subgraphData?.freelancer?.jobs || [];

                    // 3. Resolve Metadata for each job (direct IPFS)
                    const jobsWithMeta = await Promise.all(rawJobs.map(async (j) => {
                        const meta = await JobService.resolveMetadata(j.ipfsHash);
                        return { ...j, ...meta };
                    }));

                    setData({
                        profile: profile || { address },
                        jobs: jobsWithMeta
                    });
                } catch (err) {
                    console.error('[Portfolio] Decentralized fetch failed:', err);
                } finally {
                    setLoading(false);
                }
            };
            fetchDecentralizedPortfolio();
        }
    }, [address]);

    const { data: plnBalance } = useReadContract({
        address: POLY_TOKEN_ADDRESS, abi: erc20Abi, functionName: 'balanceOf', args: [address],
    });

    // Task 1: Type-Safe Mapping & Task 3: Philosophy-aligned naming
    const skillSet = React.useMemo(() => {
        const skillsObject = data?.profile?.skills;
        if (!skillsObject) return [];
        if (Array.isArray(skillsObject)) return skillsObject;
        if (typeof skillsObject === 'string') return skillsObject.split(',').map(s => s.trim()).filter(Boolean);
        return [];
    }, [data?.profile?.skills]);

    // Animate on data load
    useEffect(() => {
        if (!loading && data?.profile?.address) {
            // Task: Neutralize sliding function near dashboard per plan
            if (sidebarRef.current) staggerFadeIn(sidebarRef.current, 0);
            if (mainRef.current) staggerFadeIn(mainRef.current, 0);
            setTimeout(() => staggerFadeIn('.competency-resonance-badge', 50), 400);
            setTimeout(() => staggerFadeIn('.artifact-proof-container', 80), 500);
        }
    }, [loading, data]);

    const cardBg = {
        padding: 24, borderRadius: 14,
        background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
    };

    // Task 2: Suspense and Fallbacks - Premium Skeleton / Weightless State
    if (loading) return (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40, opacity: 0.5 }}>
                <div className="loader-spin" style={{ width: 16, height: 16, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Synchronizing Sovereign Identity...</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 320px) 1fr', gap: 40 }}>
                <div style={{ ...cardBg, height: 600, position: 'relative', overflow: 'hidden' }}>
                    <div className="skeleton-shimmer" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)', animation: 'shimmer 2s infinite' }} />
                    <div style={{ width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', margin: '0 auto 30px' }} />
                    <div style={{ height: 24, width: '60%', background: 'rgba(255,255,255,0.03)', margin: '0 auto 10px', borderRadius: 4 }} />
                    <div style={{ height: 14, width: '40%', background: 'rgba(255,255,255,0.03)', margin: '0 auto 40px', borderRadius: 4 }} />
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                        {[1,2,3].map(i => <div key={i} style={{ height: 24, width: 60, borderRadius: 6, background: 'rgba(255,255,255,0.03)' }} />)}
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
                    <div style={{ height: 40, width: '40%', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }} />
                    {[1, 2].map(i => (
                        <div key={i} style={{ ...cardBg, height: 180, position: 'relative', overflow: 'hidden' }}>
                            <div className="skeleton-shimmer" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)', animation: 'shimmer 2s infinite' }} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    if (!data?.profile?.address) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px' }}>
            <User size={60} style={{ color: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Profile not found</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>This address hasn't registered a PolyLance identity yet.</p>
            {onBack && <button onClick={onBack} className="btn btn-ghost" style={{ marginTop: 28, borderRadius: 10 }}>Return to Marketplace</button>}
        </div>
    );

    const { profile, jobs: rawJobs } = data;
    const jobs = rawJobs || [];
    const STATUS_MAP = { 'Created': 0, 'Accepted': 1, 'Ongoing': 2, 'Disputed': 3, 'Arbitration': 4, 'Completed': 5, 'Cancelled': 6 };
    const getCode = (s) => typeof s === 'string' ? (STATUS_MAP[s] ?? 0) : Number(s || 0);

    const completedJobs = jobs.filter(j => {
        const code = getCode(j.status);
        return code === 5 || code === 3 || code === 4 || j.status === 'Completed';
    });
    const activeJobs = jobs.filter(j => {
        const code = getCode(j.status);
        return code === 2 || j.status === 'Ongoing';
    });
    const ratedJobs = completedJobs.filter(j => j.rating > 0);
    const avgRating = ratedJobs.length > 0
        ? (ratedJobs.reduce((acc, j) => acc + j.rating, 0) / ratedJobs.length).toFixed(1)
        : null;

    return (
        <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 80 }}>
            {onBack && (
                <button onClick={onBack} className="btn btn-ghost btn-sm" style={{ marginBottom: 32, borderRadius: 8, gap: 8 }}>
                    ← Return to Marketplace
                </button>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 36 }}>
                {/* Profile Sidebar */}
                <div ref={sidebarRef} style={{ display: 'flex', flexDirection: 'column', gap: 20, opacity: 0 }}>
                    <div style={{ ...cardBg, textAlign: 'center', padding: '36px 20px' }}>
                        <div style={{
                            width: '100%', height: 180, margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'var(--accent-subtle)', borderRadius: 16, border: '1px solid var(--accent-border)',
                        }}>
                            <User size={70} style={{ color: 'var(--accent)', opacity: 0.6 }} />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>{profile.name || 'Anonymous Creator'}</h2>

                        {avgRating && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5, color: '#fbbf24', marginBottom: 14 }}>
                                {'★'.repeat(Math.round(avgRating))}
                                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem', marginLeft: 5 }}>({avgRating})</span>
                            </div>
                        )}

                        <div className="competency-resonance-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 18 }}>
                            {skillSet.length > 0 ? skillSet.map((skill, idx) => (
                                <span key={idx} className="competency-resonance-badge" style={{
                                    fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 6,
                                    border: '1px solid var(--accent-border)', color: 'var(--accent)',
                                    background: 'var(--accent-subtle)', opacity: 0,
                                }}>{skill}</span>
                            )) : <span style={{ fontSize: '0.72rem', padding: '3px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', color: 'var(--text-tertiary)' }}>General Creator</span>}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                            <div style={{ ...cardBg, padding: 14 }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)' }}>{profile.completedJobs}</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>JOBS</div>
                            </div>
                            <div style={{ ...cardBg, padding: 14 }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-light)' }}>{parseFloat(formatEther(BigInt(profile.totalEarned || '0'))).toFixed(1)}</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>MATIC</div>
                            </div>
                        </div>

                        <div style={{ ...cardBg, padding: 14, marginBottom: 18, background: 'rgba(124,92,252,0.03)', borderColor: 'rgba(124,92,252,0.12)' }}>
                            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--accent-light)', letterSpacing: 2 }}>{profile.reputationScore || 0}</div>
                            <div style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', fontWeight: 800 }}>REPUTATION SCORE</div>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24, fontSize: '0.9rem' }}>
                            {profile.bio || "This creator hasn't added a bio yet. Their work on PolyLance speaks for itself."}
                        </p>

                        {onFiatPay && (
                            <button onClick={() => onFiatPay(profile.address)} className="btn btn-primary" style={{ width: '100%', borderRadius: 12, marginBottom: 18, gap: 8 }}>
                                <CreditCard size={16} /> Pay via Fiat
                            </button>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                            {[Globe, Github, Twitter].map((Icon, i) => (
                                <a key={i} href="#" style={{
                                    width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text-tertiary)',
                                    transition: 'all 0.2s ease', textDecoration: 'none',
                                }}>
                                    <Icon size={16} />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div style={cardBg}>
                        <h3 style={{ marginBottom: 16, fontSize: '1rem', fontWeight: 700 }}>Wallet Identity</h3>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 10, wordBreak: 'break-all', fontSize: '0.82rem', border: '1px solid var(--border)' }}>
                            {profile.address}
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--success)', marginTop: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Award size={14} /> Verified on Polygon
                        </p>
                    </div>

                    <div key={profile.address} className="artifact-proof-container" style={{ ...cardBg, background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', padding: 28, transition: 'all 0.2s', opacity: 0, transform: 'translateY(20px)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, fontSize: '1rem', fontWeight: 700 }}>
                            <Zap size={18} style={{ color: '#22d3ee' }} /> Rewards & Stake
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {[
                                { label: 'PLN Balance', value: `${plnBalance ? parseFloat(formatEther(plnBalance)).toFixed(0) : '0'} PLN`, color: '#22d3ee' },
                                { label: 'Reputation', value: `${profile.reputationScore || 0} RP` },
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{item.label}</span>
                                    <span style={{ fontWeight: 700, color: item.color || 'var(--text-primary)' }}>{item.value}</span>
                                </div>
                            ))}
                            <button className="btn btn-primary" style={{ width: '100%', borderRadius: 10, marginTop: 8, background: '#22d3ee', fontSize: '0.82rem' }}>
                                Stake PLN (Coming Soon)
                            </button>
                        </div>
                    </div>
                </div>


                {/* Main: Proof of Work */}
                <div ref={mainRef} style={{ opacity: 0 }}>
                    <h2 style={{ marginBottom: 28, fontSize: '1.8rem', fontWeight: 900 }}>
                        Proof of <span style={{ background: 'linear-gradient(135deg, var(--accent-light), var(--accent))', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Work</span>
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                        {/* 1. Ongoing "Stream of Work" */}
                        {activeJobs.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Zap size={16} color="var(--accent-light)" /> Active Work Stream
                                </h3>
                                {activeJobs.map(job => (
                                    <div key={job.jobId} style={{ ...cardBg, background: 'rgba(255,255,255,0.01)', borderStyle: 'solid' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{job.title}</h4>
                                            <span style={{ fontSize: '0.62rem', fontWeight: 900, color: 'var(--accent-light)', padding: '2px 8px', borderRadius: 4, background: 'rgba(56, 189, 248, 0.1)' }}>IN PROGRESS</span>
                                        </div>
                                        <ProofOfWorkBadge ipfsHash={job.ipfsHash} status={job.status} isClient={false} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 2. Completed Artifacts */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <ShieldCheck size={16} color="var(--success)" /> Validated History
                            </h3>
                            {completedJobs.length === 0 ? (
                                <div style={{ ...cardBg, textAlign: 'center', padding: '80px 40px', borderStyle: 'dashed', opacity: 0.6 }}>
                                    <Briefcase size={40} style={{ opacity: 0.2, marginBottom: 16 }} />
                                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem' }}>No validated artifacts found in the sovereign ledger.</p>
                                </div>
                            ) : (
                                completedJobs.map((job) => (
                                    <div key={job.jobId} className="artifact-proof-container"
                                        style={{ ...cardBg, display: 'flex', gap: 20, alignItems: 'flex-start', opacity: 0, transform: 'translateY(20px)' }}>
                                        <div style={{ width: 110, height: 110, borderRadius: 14, overflow: 'hidden', flexShrink: 0 }}>
                                            <img
                                                src={`https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=300&q=80&sig=${job.jobId}`}
                                                alt="NFT Certificate"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{job.title}</h3>
                                                <span style={{
                                                    fontSize: '0.62rem', fontWeight: 700, padding: '3px 10px', borderRadius: 5,
                                                    background: 'rgba(16,185,129,0.08)', color: 'var(--success)',
                                                }}>COMPLETED</span>
                                            </div>
                                            <p style={{
                                                fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.6,
                                                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                            }}>
                                                {job.description}
                                            </p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: 'var(--accent-light)', fontWeight: 600 }}>
                                                    <Award size={14} /> NFT Proof-of-Work
                                                </div>
                                                <a href={`https://polygonscan.com/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noreferrer"
                                                    style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    Check Ledger <ExternalLink size={12} />
                                                </a>
                                            </div>
                                            {job.review && (
                                                <div style={{
                                                    marginTop: 14, padding: 12, borderRadius: 10,
                                                    background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid #fbbf24',
                                                }}>
                                                    <div style={{ color: '#fbbf24', fontSize: '0.78rem', marginBottom: 4 }}>
                                                        {'★'.repeat(job.rating)} Verified Review
                                                    </div>
                                                    <p style={{ fontSize: '0.82rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                                                        "{job.review}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Portfolio;
