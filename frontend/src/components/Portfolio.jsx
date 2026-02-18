import React, { useState, useEffect, useRef } from 'react';
import { User, Briefcase, MapPin, Link as LinkIcon, Award, ExternalLink, Globe, Github, Twitter, Zap, Coins } from 'lucide-react';
import { useReadContract } from 'wagmi';
import { erc20Abi, formatEther } from 'viem';
import { POLY_TOKEN_ADDRESS, CONTRACT_ADDRESS } from '../constants';
import { api } from '../services/api';
import Reputation3D from './Reputation3D';
import { useAnimeAnimations } from '../hooks/useAnimeAnimations';

function Portfolio({ address, onBack }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const sidebarRef = useRef(null);
    const mainRef = useRef(null);
    const { slideInLeft, slideInRight, staggerFadeIn } = useAnimeAnimations();

    useEffect(() => {
        if (address) {
            api.getPortfolio(address).then(res => {
                setData(res);
                setLoading(false);
            });
        }
    }, [address]);

    const { data: plnBalance } = useReadContract({
        address: POLY_TOKEN_ADDRESS, abi: erc20Abi, functionName: 'balanceOf', args: [address],
    });

    // Animate on data load
    useEffect(() => {
        if (!loading && data?.profile?.address) {
            if (sidebarRef.current) slideInLeft(sidebarRef.current, 40);
            if (mainRef.current) slideInRight(mainRef.current, 40);
            setTimeout(() => staggerFadeIn('.portfolio-skill-tag', 50), 400);
            setTimeout(() => staggerFadeIn('.portfolio-job-card', 80), 500);
        }
    }, [loading, data]);

    const cardBg = {
        padding: 24, borderRadius: 14,
        background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
    };

    if (loading) return (
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div className="skeleton" style={{ height: 28, width: 120, marginBottom: 28 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 32 }}>
                <div className="skeleton" style={{ height: 500, borderRadius: 14 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="skeleton" style={{ height: 60, width: '50%' }} />
                    <div className="skeleton" style={{ height: 200, borderRadius: 14 }} />
                    <div className="skeleton" style={{ height: 200, borderRadius: 14 }} />
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

    const { profile, jobs } = data;
    const completedJobs = jobs.filter(j => j.status === 'Completed' || j.status === 2 || j.status === 4);
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
                            background: 'rgba(124,92,252,0.06)', borderRadius: 16,
                        }}>
                            <User size={70} style={{ color: 'var(--accent-light)', opacity: 0.4 }} />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>{profile.name || 'Anonymous Creator'}</h2>

                        {avgRating && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5, color: '#fbbf24', marginBottom: 14 }}>
                                {'★'.repeat(Math.round(avgRating))}
                                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem', marginLeft: 5 }}>({avgRating})</span>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 18 }}>
                            {profile.skills?.split(',').map((skill, idx) => (
                                <span key={idx} className="portfolio-skill-tag" style={{
                                    fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 6,
                                    border: '1px solid rgba(124,92,252,0.2)', color: 'var(--accent-light)',
                                    background: 'rgba(124,92,252,0.04)', opacity: 0,
                                }}>{skill.trim()}</span>
                            )) || <span style={{ fontSize: '0.72rem', padding: '3px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', color: 'var(--text-tertiary)' }}>General Creator</span>}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                            <div style={{ ...cardBg, padding: 14 }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-light)' }}>{profile.completedJobs}</div>
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

                    <div key={profile.address} className="portfolio-job-card" style={{ ...cardBg, background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', padding: 28, transition: 'all 0.2s', opacity: 0, transform: 'translateY(20px)' }}>
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

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {completedJobs.length === 0 ? (
                            <div style={{ ...cardBg, textAlign: 'center', padding: '80px 40px', borderStyle: 'dashed' }}>
                                <div>
                                    <Briefcase size={56} style={{ opacity: 0.08, marginBottom: 20, color: 'var(--accent-light)' }} />
                                    <h3 style={{ marginBottom: 10, opacity: 0.5 }}>Future Success in Progress</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                                        This creator hasn't finalized any contracts yet. Stake on their potential today!
                                    </p>
                                </div>
                            </div>
                        ) : (
                            completedJobs.map((job) => (
                                <div key={job.jobId} className="portfolio-job-card"
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
    );
}

export default Portfolio;
