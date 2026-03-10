import React from 'react';
import { motion } from 'framer-motion';
import { useAccount, useSignMessage } from 'wagmi';
import { formatEther } from 'viem';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import {
    Wallet, Briefcase, CheckCircle, Clock, Save, User, Award,
    Sparkles, Send, Activity, Terminal, Shield, Zap, TrendingUp,
    Globe, BarChart3, Lock, Star, Layers,
    Cpu, Rocket, Target, Flame, Diamond,
    Camera, Loader2, Brain, ShieldCheck, TrendingDown
} from 'lucide-react';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { CONTRACT_ADDRESS, REPUTATION_ADDRESS } from '../constants';
import api from '../services/api';
import ProfileService from '../services/ProfileService';
import { useQuery } from '@tanstack/react-query';
import LiveJobFeed from './LiveJobFeed';
import AiRecommendations from './AiRecommendations';
import WithdrawButton from './WithdrawButton';
import YieldManagerDashboard from './YieldManagerDashboard';
import { useAnimeAnimations } from '../hooks/useAnimeAnimations';
import StorageService from '../services/StorageService';
import SubgraphService from '../services/SubgraphService';
import { useIdentity } from '../hooks/useIdentity';
import { StabilizerService } from '../services/StabilizerService';
import { GravityScoreService } from '../services/GravityScoreService';
import { GhostModeratorService } from '../services/GhostModeratorService';
import { TreasuryButlerService } from '../services/TreasuryButlerService';
import GovernanceWatcherService from '../services/GovernanceWatcherService';
import SovereignResumeService from '../services/SovereignResume';
// import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

const REPUTATION_ABI = [
    {
        "inputs": [{ "internalType": "string", "name": "cid", "type": "string" }],
        "name": "updatePortfolio",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

/* ─── Inline Styles ─── */
const s = {
    page: {
        display: 'flex', flexDirection: 'column', gap: 24,
        animation: 'fadeIn 0.5s ease-out',
        perspective: '1000px',
    },
    bentoGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gridAutoRows: 'minmax(100px, auto)',
        gap: 20,
    },
    tile: (spanX = 4, spanY = 1, bg = 'var(--bg-card)') => ({
        gridColumn: `span ${spanX}`,
        gridRow: `span ${spanY}`,
        background: bg,
        borderRadius: 24,
        padding: 24,
        border: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
    }),
    glassTile: (spanX = 4, spanY = 1) => ({
        gridColumn: `span ${spanX}`,
        gridRow: `span ${spanY}`,
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 28,
        padding: 32,
        border: '1px solid rgba(255, 255, 255, 0.05)',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
    }),
    heroBadge: {
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 14px', borderRadius: 12,
        background: 'rgba(124, 92, 252, 0.1)',
        border: '1px solid rgba(124, 92, 252, 0.2)',
        color: 'var(--accent-light)', fontSize: '0.65rem', fontWeight: 800,
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginBottom: 20,
    },
    heroTitle: {
        fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-0.04em',
        lineHeight: 1, marginBottom: 12, color: '#fff',
    },
    statsLabel: {
        fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-tertiary)',
        textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
    },
    statsValue: {
        fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#fff',
    },
    agentStatus: (online) => ({
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: '0.62rem', fontWeight: 800,
        color: online ? '#10b981' : 'var(--text-tertiary)',
        textTransform: 'uppercase',
    }),
    glow: (color) => ({
        position: 'absolute', top: '-20%', right: '-10%',
        width: 150, height: 150, borderRadius: '50%',
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        opacity: 0.15, pointerEvents: 'none',
    }),
};

function Dashboard({ address: propAddress }) {
    const { address: wagmiAddress } = useAccount();
    const address = propAddress || wagmiAddress;
    const isConnected = !!address;
    const { openConnectModal } = useConnectModal();
    const { signMessageAsync: _signMessageAsync } = useSignMessage();
    const identity = useIdentity(address);

    const { data: aData } = useQuery({
        queryKey: ['ecosystem-stats'],
        queryFn: () => SubgraphService.getEcosystemStats(),
        staleTime: 60000 // 1 minute cache
    });

    const { data: pData, isLoading: isLoadingProfile } = useQuery({
        queryKey: ['profile', address],
        queryFn: () => ProfileService.getProfile(address),
        enabled: isConnected && !!address
    });

    const [analytics, setAnalytics] = React.useState({ totalJobs: 0, totalVolume: 0, totalUsers: 0 });
    const [profile, setProfile] = React.useState({ name: '', bio: '', averageRating: 5.0, reputationScore: 780 });

    React.useEffect(() => {
        if (aData) {
            setAnalytics({
                totalJobs: Number(aData.totalJobs || 0),
                totalVolume: parseFloat(formatEther(BigInt(aData.totalVolume || 0))),
                totalUsers: aData.activeUsers?.length || 0
            });
        }
    }, [aData]);

    React.useEffect(() => {
        if (pData) setProfile(prev => ({ ...prev, ...pData }));
    }, [pData]);

    const globalRank = React.useMemo(() => Math.floor(Math.random() * 100) + 1, [address]);

    const [autonStatus] = React.useState({
        stabilizer: 'HEALTHY', treasury: 'OPTIMIZED', sybil: 'PROTECTED', governance: 'SECURE'
    });
    const [yieldStrategy, setYieldStrategy] = React.useState({ strategy: 'Analyzing...', projectedApy: '0%' });
    const [badges, setBadges] = React.useState([]);

    const gravityStats = React.useMemo(() => GravityScoreService.calculateScore({
        averageRating: profile.averageRating || 5.0,
        totalJobs: analytics.totalJobs || 0,
        karmaBalance: identity.reputationPoints || 50
    }), [profile.averageRating, analytics.totalJobs, identity.reputationPoints]);

    const { countUp, staggerFadeIn } = useAnimeAnimations();
    const statRefs = React.useRef([]);

    const fetchData = React.useCallback(async () => {
        if (!isConnected || !address) return;
        try {
            const [yData, bData] = await Promise.all([
                api.getYieldStrategy(address).catch(() => ({ strategy: 'Morpho Blue', projectedApy: '4.2%' })),
                SovereignResumeService.getBadges(address).catch(() => [])
            ]);
            if (yData) setYieldStrategy(yData);
            if (bData) setBadges(bData);
        } catch (err) { console.warn(err); }
    }, [isConnected, address]);

    React.useEffect(() => { fetchData(); }, [fetchData]);

    React.useEffect(() => {
        if (!isLoadingProfile && isConnected) {
            setTimeout(() => {
                staggerFadeIn('.bento-tile', 60);
                statRefs.current.forEach(el => {
                    if (el) {
                        const target = parseFloat(el.getAttribute('data-target'));
                        if (target) countUp(el, target, 1500);
                    }
                });
            }, 100);
        }
    }, [isLoadingProfile, isConnected]);

    if (!isConnected) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', maxWidth: 450 }}>
                    <div style={{ width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg, var(--accent), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', boxShadow: '0 0 40px var(--accent-glow)' }}>
                        <Rocket size={32} color="#fff" />
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', marginBottom: 12 }}>Enter the Zenith</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>Connect your sovereign identity to access the decentralized dashboard and manage your global work empire.</p>
                    <button onClick={openConnectModal} className="btn btn-primary btn-lg" style={{ width: '100%', borderRadius: 16 }}>Connect Wallet</button>
                </motion.div>
            </div>
        );
    }

    return (
        <div style={s.page}>
            <div style={s.bentoGrid}>
                
                {/* ── Tile 1: Hero Identity ── */}
                <div className="bento-tile" style={s.glassTile(8, 2)}>
                    <div style={s.glow('var(--accent)')} />
                    <div style={{ position: 'relative', zIdentity: 1 }}>
                        <div style={s.heroBadge}>
                            <Sparkles size={12} /> Sovereign Command Center
                        </div>
                        <h1 style={s.heroTitle}>
                            Welcome, <span className="text-gradient">{identity.displayName || profile.name || 'Pioneer'}</span>
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', maxWidth: 500, lineHeight: 1.6, fontSize: '1rem' }}>
                            Your PolyLance Node is synchronized. You are currently operating at a <span style={{ color: 'var(--accent-light)', fontWeight: 800 }}>{gravityStats.category}</span> efficiency with a reputation score of {profile.reputationScore}.
                        </p>
                        
                        <div style={{ display: 'flex', gap: 24, marginTop: 40, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <div>
                                <div style={s.statsLabel}>Gravity Score</div>
                                <div style={s.statsValue} ref={el => statRefs.current[0] = el} data-target={gravityStats.score}>{gravityStats.score}</div>
                            </div>
                            <div>
                                <div style={s.statsLabel}>Total Earned</div>
                                <div style={s.statsValue}>₹<span ref={el => statRefs.current[1] = el} data-target={profile.totalEarned || 0}>{profile.totalEarned || 0}</span></div>
                            </div>
                            <div>
                                <div style={s.statsLabel}>Global Rank</div>
                                <div style={s.statsValue}>#{globalRank}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Tile 2: Autonomous Intelligence ── */}
                <div className="bento-tile" style={s.tile(4, 2, 'var(--bg-raised)')}>
                    <div style={s.glow('var(--cyan)')} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                        <div style={{ padding: 10, borderRadius: 12, background: 'rgba(34,211,238,0.1)', color: 'var(--cyan)' }}><Brain size={20} /></div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>AG Intel Engine</h3>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {[
                            { label: 'Treasury Butler', status: autonStatus.treasury, icon: <Zap size={14} />, online: true },
                            { label: 'Ghost Moderator', status: autonStatus.sybil, icon: <ShieldCheck size={14} />, online: true },
                            { label: 'Risk Stabilizer', status: autonStatus.stabilizer, icon: <Activity size={14} />, online: true },
                            { label: 'Governance Watch', status: autonStatus.governance, icon: <Globe size={14} />, online: true }
                        ].map((agent, i) => (
                            <div key={i} style={{ padding: '12px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-tertiary)' }}>{agent.label}</span>
                                    <div style={s.agentStatus(agent.online)}><div style={{ width: 5, height: 5, borderRadius: '50%', background: agent.online ? '#10b981' : '#ccc' }} /> ONLINE</div>
                                </div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>{agent.icon} {agent.status}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Tile 3: Yield Monitor ── */}
                <div className="bento-tile" style={s.tile(4, 1)}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div style={s.statsLabel}>Yield Strategy</div>
                        <TrendingUp size={16} color="var(--success)" />
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399' }}>{yieldStrategy.projectedApy} APY</div>
                    <p style={{ fontSize: '0.68rem', opacity: 0.6, marginTop: 4 }}>{yieldStrategy.strategy} strategy synthesized.</p>
                </div>

                {/* ── Tile 4: System Health ── */}
                <div className="bento-tile" style={s.tile(4, 1)}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div style={s.statsLabel}>Network Health</div>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} className="animate-pulse" />
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>Polygon Amoy</div>
                    <p style={{ fontSize: '0.68rem', opacity: 0.6, marginTop: 4 }}>Indexing: Healthy · Subgraph: Syncing</p>
                </div>

                {/* ── Tile 5: Matching Insights ── */}
                <div className="bento-tile" style={s.tile(4, 1)}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div style={s.statsLabel}>Job Matching</div>
                        <Target size={16} color="var(--accent-light)" />
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>85% Match Rate</div>
                    <p style={{ fontSize: '0.68rem', opacity: 0.6, marginTop: 4 }}>AI-driven algorithmic alignment active.</p>
                </div>

                {/* ── Tile 6: Active Contracts ── */}
                <div className="bento-tile" style={s.tile(8, 3)}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Active Escrow Gigs</h3>
                        <button className="btn btn-ghost btn-sm">View All</button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                        <WithdrawButton address={address} />
                        <div style={{ marginTop: 24 }}>
                            <LiveJobFeed />
                        </div>
                    </div>
                </div>

                {/* ── Tile 7: Sovereign Skills (SBTs) ── */}
                <div className="bento-tile" style={s.tile(4, 3, 'linear-gradient(135deg, rgba(124,92,252,0.05), transparent)')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                        <Award size={20} color="var(--accent-light)" />
                        <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Soulbound Badges</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {(badges && badges.length > 0 ? badges : [
                            { title: 'Elite Dev', color: 'var(--accent)' },
                            { title: 'Top 1%', color: 'var(--secondary)' },
                            { title: 'Fast Responder', color: 'var(--success)' },
                            { title: 'JS Expert', color: 'var(--info)' }
                        ]).slice(0, 4).map((sbt, i) => (
                            <div key={i} style={{ padding: 12, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
                                <div style={{ width: 40, height: 40, borderRadius: '50%', background: sbt.color || 'var(--accent)', opacity: 0.2, margin: '0 auto 8px' }} />
                                <div style={{ fontSize: '0.65rem', fontWeight: 800 }}>{sbt.title}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: 'auto', paddingTop: 20 }}>
                        <button className="btn btn-secondary btn-sm" style={{ width: '100%', borderRadius: 12 }}>Verify New Skill</button>
                    </div>
                </div>

                {/* ── Tile 8: Ecosystem Stats ── */}
                <div className="bento-tile" style={s.tile(12, 1, 'var(--bg-card)')}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '100%' }}>
                        <div>
                            <span style={s.statsLabel}>TVL (MATIC)</span>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800 }} ref={el => statRefs.current[2] = el} data-target={analytics.totalVolume}>{analytics.totalVolume}</div>
                        </div>
                        <div style={{ width: 1, height: 40, background: 'var(--border)' }} />
                        <div>
                            <span style={s.statsLabel}>Total Jobs</span>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800 }} ref={el => statRefs.current[3] = el} data-target={analytics.totalJobs}>{analytics.totalJobs}</div>
                        </div>
                        <div style={{ width: 1, height: 40, background: 'var(--border)' }} />
                        <div>
                            <span style={s.statsLabel}>Agents Online</span>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800 }} ref={el => statRefs.current[4] = el} data-target={analytics.totalUsers}>{analytics.totalUsers}</div>
                        </div>
                    </div>
                </div>

            </div>
            
            {/* Extended Services (Lazy sections) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, marginTop: 12 }}>
                <YieldManagerDashboard address={address} />
                <AiRecommendations address={address} />
            </div>
        </div>
    );
}

export default Dashboard;
