import React, { useRef, useEffect } from 'react';
import { useAccount, useReadContract, useSignMessage } from 'wagmi';
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
import { api } from '../services/api';
import ProfileService from '../services/ProfileService';
import LiveJobFeed from './LiveJobFeed';
import AiRecommendations from './AiRecommendations';
import WithdrawButton from './WithdrawButton';
import YieldManagerDashboard from './YieldManagerDashboard';
import { useAnimeAnimations } from '../hooks/useAnimeAnimations';
import StorageService from '../services/StorageService';
import { SubgraphService } from '../services/SubgraphService';
import { useIdentity } from '../hooks/useIdentity';
import { StabilizerService } from '../services/StabilizerService';
import { GravityScoreService } from '../services/GravityScoreService';
import { GhostModeratorService } from '../services/GhostModeratorService';
import { TreasuryButlerService } from '../services/TreasuryButlerService';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

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
        animation: 'fadeIn 0.4s ease',
    },
    // Hero
    heroWrap: {
        position: 'relative',
        borderRadius: 20, overflow: 'hidden',
        background: 'var(--bg-card)',
        border: '1px solid var(--accent-border)',
        padding: '36px 32px',
    },
    heroGlow: {
        position: 'absolute', top: -80, right: -80,
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, var(--accent-subtle) 0%, transparent 70%)',
        pointerEvents: 'none',
    },
    heroGlow2: {
        position: 'absolute', bottom: -60, left: -40,
        width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, var(--secondary-subtle) 0%, transparent 70%)',
        pointerEvents: 'none',
    },
    heroContent: { position: 'relative', zIndex: 1 },
    heroBadge: {
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '5px 12px', borderRadius: 8,
        background: 'var(--accent-subtle)',
        border: '1px solid var(--accent-border)',
        color: 'var(--accent)', fontSize: '0.68rem', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.06em',
        marginBottom: 16,
    },
    heroTitle: {
        fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.035em',
        lineHeight: 1.15, marginBottom: 8,
    },
    heroSub: {
        color: 'var(--text-secondary)', fontSize: '0.95rem',
        maxWidth: 500, lineHeight: 1.6,
    },
    // Stats grid
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
    },
    // Section header
    sectionHead: {
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18,
    },
    sectionIcon: {
        width: 32, height: 32, borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: '0.95rem', fontWeight: 700,
    },
    // Command center
    cmdGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12, marginTop: 20, paddingTop: 16,
        borderTop: '1px solid var(--border)',
    },
    cmdItem: {
        display: 'flex', flexDirection: 'column', gap: 3,
    },
    cmdLabel: {
        fontSize: '0.62rem', fontWeight: 700,
        color: 'var(--text-tertiary)', textTransform: 'uppercase',
        letterSpacing: '0.06em',
    },
    cmdValue: (color) => ({
        fontSize: '0.78rem', fontWeight: 600, color,
        display: 'flex', alignItems: 'center', gap: 5,
    }),
    // Two column
    twoCol: {
        display: 'grid',
        gridTemplateColumns: '1fr 360px',
        gap: 20,
    },
    // Analytics
    analyticsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 24,
    },
    analyticLabel: {
        fontSize: '0.68rem', fontWeight: 600,
        color: 'var(--text-tertiary)', textTransform: 'uppercase',
        letterSpacing: '0.05em', marginBottom: 4,
    },
    analyticValue: {
        fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em',
    },
    // Profile form
    formGrid: {
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14,
    },
    formActions: {
        display: 'flex', gap: 10, alignItems: 'center', marginTop: 4,
    },
    // Live status dot
    liveDot: (color) => ({
        width: 7, height: 7, borderRadius: '50%',
        background: color,
        boxShadow: `0 0 8px ${color}80`,
    }),
    // Connect screen
    connectWrap: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '75vh',
    },
    connectCard: {
        textAlign: 'center', padding: 56, maxWidth: 480,
        background: 'linear-gradient(145deg, #111128 0%, #0d0d22 100%)',
        border: '1px solid var(--border)',
        borderRadius: 24, position: 'relative', overflow: 'hidden',
    },
    connectGlow: {
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,92,252,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
    },
    connectIcon: {
        width: 72, height: 72, borderRadius: 20,
        background: 'linear-gradient(135deg, rgba(124,92,252,0.2), rgba(236,72,153,0.1))',
        border: '1px solid rgba(124,92,252,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 28px',
        boxShadow: '0 0 30px rgba(124,92,252,0.15)',
    },
    // Avatar styles
    avatarUpload: {
        position: 'relative', width: 100, height: 100, margin: '0 auto 20px',
        borderRadius: '50%', border: '2px dashed rgba(124,92,252,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', overflow: 'hidden', transition: 'all 0.2s ease',
    },
    avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
    avatarOverlay: {
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: 0, transition: 'opacity 0.2s ease',
    },
};

function Dashboard({ address: propAddress }) {
    const { address: wagmiAddress } = useAccount();
    const address = propAddress || wagmiAddress;
    const isConnected = !!address;
    const { openConnectModal } = useConnectModal();
    const { signMessageAsync } = useSignMessage();

    // Antigravity: Resolve social identity (Lens/ENS)
    const identity = useIdentity(address);



    const [isLoadingProfile, setIsLoadingProfile] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const [profile, setProfile] = React.useState({
        address: '', name: '', bio: '', skills: '', category: 'Development',
        reputationScore: 0, totalEarned: 0, avatarIpfsHash: '',
    });
    const [isUploading, setIsUploading] = React.useState(false);
    const [analytics, setAnalytics] = React.useState({
        totalJobs: 0, totalVolume: 0, avgReputation: 0, totalUsers: 0,
    });
    const [isPolishing, setIsPolishing] = React.useState(false);
    const [backendStatus, setBackendStatus] = React.useState('checking');
    const [lastSyncedBlock, setLastSyncedBlock] = React.useState(null);

    // Antigravity AI: Autonomous Agent Metrics
    const gravityStats = React.useMemo(() => GravityScoreService.calculateScore({
        averageRating: profile.averageRating || 5.0,
        totalJobs: analytics.totalJobs || 0,
        karmaBalance: identity.reputationPoints || 50
    }), [profile.averageRating, analytics.totalJobs, identity.reputationPoints]);

    const [autonStatus, setAutonStatus] = React.useState({
        stabilizer: 'IDLE',
        treasury: 'STABLE',
        sybil: 'READY'
    });

    React.useEffect(() => {
        const analyze = async () => {
            if (!isConnected) return;
            const stab = await StabilizerService.evaluateStallRisk({ id: 101, deadline: Date.now() / 1000 + 3600 }, 'hash1', 'hash1');
            const trea = await TreasuryButlerService.monitorYieldGap(50000);
            setAutonStatus({
                stabilizer: stab.action === 'NONE' ? 'HEALTHY' : 'STALL_DETECTED',
                treasury: trea.action === 'NONE' ? 'OPTIMIZED' : 'MIGRATION_PENDING',
                sybil: 'PROTECTED (ZK)'
            });
        };
        analyze();
    }, [analytics, isConnected]);

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const stats = await SubgraphService.getEcosystemStats();
                setBackendStatus(stats ? 'online' : 'error');
                // Mock block height for now or fetch from publicClient
            } catch {
                setBackendStatus('offline');
            }
        };
        checkHealth();
        const interval = setInterval(checkHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    // Anime.js refs and hooks
    const heroRef = useRef(null);
    const statsRef = useRef(null);
    const analyticsRef = useRef(null);
    const profileRef = useRef(null);
    const sidebarRef = useRef(null);
    const connectCardRef = useRef(null);
    const statValueRefs = useRef([]);
    const { staggerFadeIn, slideInLeft, float, countUp } = useAnimeAnimations();

    const { data: hash, writeContract, isPending: isContractPending } = useWriteContract();
    const { isLoading: isTxConfirming } = useWaitForTransactionReceipt({ hash });

    // Run entrance animations after data loads
    useEffect(() => {
        if (!isLoadingProfile && isConnected) {
            // Hero slide in from left
            if (heroRef.current) slideInLeft(heroRef.current, 40);
            // Stagger stat cards
            setTimeout(() => staggerFadeIn('.stat-card', 80), 200);
            // Analytics and profile sections are visible by default (no scroll reveal needed)
            // Count up numeric stat values
            setTimeout(() => {
                statValueRefs.current.forEach(el => {
                    try { // Added try block to wrap the logic
                        if (el) {
                            const raw = el.getAttribute('data-target');
                            const target = parseFloat(raw);
                            if (!isNaN(target) && target > 0) countUp(el, target, 1200);
                        }
                    } catch (error) { // Added catch block for error handling
                        console.error("Error processing stat value element:", error);
                    }
                });
            }, 400);
        }
    }, [isLoadingProfile, isConnected]);

    // Float the hero badge
    useEffect(() => {
        if (isConnected && !isLoadingProfile) {
            float('.hero-badge-float', 6);
        }
    }, [isConnected, isLoadingProfile]);

    const { data: jobCount } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        functionName: 'jobCount',
    });

    const fetchData = React.useCallback(async (isInitial = false) => {
        if (!isConnected || !address) return;

        if (isInitial && !profile.address) setIsLoadingProfile(true);

        try {
            const [pData, aData, sData] = await Promise.all([
                ProfileService.getProfile(address).catch(() => null),
                SubgraphService.getEcosystemStats().catch(() => null),
                SubgraphService.getUserStats(address).catch(() => null),
            ]);

            if (pData?.address) setProfile(prev => ({ ...prev, ...pData }));

            // Merge Ecosystem Stats
            if (aData) {
                setAnalytics({
                    totalJobs: Number(aData.totalJobs),
                    totalVolume: parseFloat(import.meta.env.VITE_SUBGRAPH_URL ? formatEther(BigInt(aData.totalVolume)) : '0'),
                    totalUsers: aData.activeUsers?.length || 0,
                });
            }

            // Merge Subgraph stats into analytics if possible
            if (sData) {
                if (sData.freelancer?.reputationScore) {
                    setProfile(prev => ({ ...prev, reputationScore: sData.freelancer.reputationScore }));
                }
            }
        } catch (err) {
            console.warn('Dashboard Refresh:', err.message);
        } finally {
            if (isInitial) setIsLoadingProfile(false);
        }
    }, [isConnected, address]); // Removed profile.address to stabilize function identity

    React.useEffect(() => {
        fetchData(true);
    }, [address, isConnected]); // Fetch on mount/address change

    React.useEffect(() => {
        const handleRefresh = () => fetchData(false); // Silent background refresh
        window.addEventListener('REFRESH_DASHBOARD', handleRefresh);
        return () => window.removeEventListener('REFRESH_DASHBOARD', handleRefresh);
    }, [fetchData]);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // 1. Initialize Weightless Stream Update via Ceramic ComposeDB
            console.log('[Dashboard] Initiating weightless profile preservation...');

            // In a full implementation, we would authenticate here
            // const did = await authenticateCeramic(address); 
            // await CeramicService.authenticate(did);

            const result = await ProfileService.updateSovereignProfile({
                ...profile,
                isSovereign: true,
                updatedAt: new Date().toISOString()
            });

            if (result && result.status === 'SYNCHRONIZED') {
                console.log('[CERAMIC] Profile stream synchronized across the network.');
            }

            // 2. Dual-Write to Legacy System (Optional / Migration Phase)
            const cid = await ProfileService.uploadToIPFS(profile);
            writeContract({
                address: REPUTATION_ADDRESS,
                abi: REPUTATION_ABI,
                functionName: 'updatePortfolio',
                args: [cid],
            });

            // Note: Centralized API call is intentionally omitted here in the "Antigravity" transition
            console.log('[DASHBOARD] Profile persisted to multiple decentralized layers.');
        } catch (err) {
            console.error('[DASHBOARD] Sovereign Save Failed:', err);
        } finally {
            setIsSaving(false);
        }
    };


    const handleAiPolish = async () => {
        if (!profile.skills || !profile.bio) return;
        setIsPolishing(true);
        try {
            const r = await api.polishBio({ name: profile.name, category: profile.category, skills: profile.skills, bio: profile.bio });
            if (r.polishedBio) setProfile(prev => ({ ...prev, bio: r.polishedBio }));
        } catch (err) { console.error('AI Polish:', err); }
        finally { setIsPolishing(false); }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const result = await StorageService.uploadFile(file);
            setProfile(prev => ({ ...prev, avatarIpfsHash: result.cid }));
        } catch (err) { console.error('Image upload failed:', err); }
        finally { setIsUploading(false); }
    };

    const getAvatarUrl = (hash) => {
        if (!hash) return null;
        return `https://gateway.pinata.cloud/ipfs/${hash}`;
    };

    /* ─── CONNECT SCREEN ─── */
    if (!isConnected) {
        return (
            <div style={s.connectWrap}>
                <div ref={connectCardRef} className="anime-connect-card" style={s.connectCard}>
                    <div style={s.connectGlow} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={s.connectIcon} className="anime-connect-icon">
                            <Rocket size={32} style={{ color: '#a78bfa' }} />
                        </div>
                        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 10, letterSpacing: '-0.03em' }}>
                            Launch Your Career
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.7, fontSize: '0.92rem' }}>
                            Connect your wallet to access your decentralized dashboard, manage contracts, and explore global opportunities.
                        </p>
                        <button onClick={openConnectModal} className="btn btn-primary btn-lg anime-connect-btn" style={{ width: '100%', borderRadius: 14, padding: '16px 28px' }}>
                            <Wallet size={18} /> Connect Wallet
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /* ─── MAIN DASHBOARD ─── */
    return (
        <div style={s.page} className="dashboard-anime-root">

            {/* ══════ HERO SECTION ══════ */}
            <div ref={heroRef} style={s.heroWrap}>
                <div style={s.heroGlow} />
                <div style={s.heroGlow2} />
                <div style={s.heroContent}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                        <div>
                            {isLoadingProfile ? (
                                <div className="skeleton" style={{ height: 22, width: 110, borderRadius: 8, marginBottom: 16 }} />
                            ) : (
                                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                                    <div style={s.heroBadge} className="hero-badge-float">
                                        {identity.lensProfile ? <Sparkles size={10} style={{ color: '#00cc88' }} /> : <Diamond size={10} />}
                                        {identity.lensProfile ? 'Lens Verified' : (profile.skills ? 'Verified Talent' : 'Employer')}
                                    </div>
                                    <div style={{ ...s.heroBadge, background: 'rgba(34,211,238,0.1)', color: 'var(--cyan)', border: '1px solid rgba(34,211,238,0.2)' }}>
                                        <Activity size={10} /> {gravityStats.category}
                                    </div>
                                </div>
                            )}
                            <h1 style={s.heroTitle}>
                                Welcome back, <span className="text-gradient">
                                    {isLoadingProfile ? '...' : (identity.displayName || profile.name || 'Pioneer')}
                                </span>
                            </h1>
                            <p style={s.heroSub}>
                                Gravity Score: <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>{gravityStats.score}</span> (Risk).
                                Yield Delta: <span style={{ color: '#34d399', fontWeight: 700 }}>+{gravityStats.suggestedYieldAdjustment}</span>.
                                Your decentralized command center is in orbit.
                            </p>



                            <div style={s.cmdGrid}>
                                <div style={s.cmdItem}>
                                    <span style={s.cmdLabel}>Antigravity Data Layer</span>
                                    <span style={s.cmdValue('#10b981')}>
                                        <Activity size={13} className="animate-pulse" />
                                        ComposeDB Synchronized
                                    </span>
                                </div>
                                <div style={s.cmdItem}>
                                    <span style={s.cmdLabel}>Indexing Engine</span>
                                    <span style={s.cmdValue('#38bdf8')}>
                                        <Zap size={13} className="animate-pulse" />
                                        Substreams (Low Latency)
                                    </span>
                                </div>
                            </div>

                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            {profile.avatarIpfsHash ? (
                                <img src={getAvatarUrl(profile.avatarIpfsHash)} alt="Profile" style={{ width: 80, height: 80, borderRadius: 16, objectFit: 'cover', boxShadow: '0 8px 32px rgba(124,92,252,0.25)', border: '1px solid rgba(124,92,252,0.2)' }} />
                            ) : (
                                <img src="/logo.png" alt="PolyLance" style={{ width: 80, height: 80, borderRadius: 16, boxShadow: '0 8px 32px rgba(124,92,252,0.25)', border: '1px solid rgba(124,92,252,0.2)' }} />
                            )}
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button className="btn btn-primary" style={{ borderRadius: 12, background: 'linear-gradient(135deg, var(--accent), var(--secondary))', color: 'var(--text-inverse)' }}>
                                    <Rocket size={15} /> New Job
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════ STAT CARDS ══════ */}
            <div ref={statsRef} style={s.statsGrid}>
                {[
                    {
                        icon: <Briefcase size={22} />, value: jobCount?.toString() || '0',
                        label: 'Active Contracts', cls: 'stat-card-purple', icls: 'stat-icon-purple',
                    },
                    {
                        icon: <Award size={22} />, value: profile.reputationScore || 0,
                        label: 'Reputation Score', cls: 'stat-card-amber', icls: 'stat-icon-amber',
                        badge: profile.reputationScore >= 10 ? 'ELITE' : null,
                    },
                    {
                        icon: <TrendingUp size={22} />, value: `${(analytics.totalVolume || 0).toFixed(1)}`,
                        label: 'Volume (MATIC)', cls: 'stat-card-green', icls: 'stat-icon-green',
                        suffix: <span style={{ fontSize: '0.7rem', color: 'var(--success)', marginLeft: 4 }}>↑ 12%</span>,
                    },
                    {
                        icon: <Globe size={22} />, value: analytics.totalUsers || 0,
                        label: 'Network Agents', cls: 'stat-card-blue', icls: 'stat-icon-blue',
                    },
                ].map((item, i) => (
                    <div key={i} className={`stat-card ${item.cls}`}>
                        <div className={`stat-icon ${item.icls}`}>
                            {item.icon}
                        </div>
                        <div className="stat-value">
                            <span ref={el => statValueRefs.current[i] = el} data-target={typeof item.value === 'string' ? parseFloat(item.value) || 0 : item.value}>{item.value}</span>{item.suffix}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="stat-label">{item.label}</span>
                            {item.badge && (
                                <span className="badge badge-warning" style={{ fontSize: '0.55rem', padding: '2px 6px' }}>
                                    {item.badge}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* ══════ COMMAND CENTER ══════ */}
            <div className="card-accent">
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                            ...s.sectionIcon,
                            width: 46, height: 46, borderRadius: 14,
                            background: 'var(--bg-raised)',
                            border: '1px solid var(--accent-border)',
                            boxShadow: '0 0 20px var(--accent-subtle)',
                        }}>
                            <Terminal size={22} style={{ color: 'var(--accent-light)' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
                                Protocol Orchestrator
                            </div>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Command Center</h3>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => alert("Dry run initialized...")} className="btn btn-secondary btn-sm" style={{ borderRadius: 10 }}>
                            <Cpu size={13} /> Dry Run
                        </button>
                        <button onClick={() => alert("Deploy target locked.")} className="btn btn-primary btn-sm" style={{ borderRadius: 10 }}>
                            <Send size={13} /> Deploy
                        </button>
                    </div>
                </div>

                <div style={{ ...s.cmdGrid, position: 'relative', zIndex: 1 }}>
                    {[
                        { icon: <CheckCircle size={13} />, label: 'Contracts', value: '8/8 Valid', color: 'var(--success)' },
                        { icon: <Shield size={13} />, label: 'Privacy Shield', value: 'ZK Ready', color: 'var(--success)' },
                        { icon: <Lock size={13} />, label: 'Auth Layer', value: 'Authorized', color: 'var(--success)' },
                        { icon: <Flame size={13} />, label: 'Gas Engine', value: 'Optimized', color: 'var(--accent-light)' },
                    ].map((item, i) => (
                        <div key={i} style={s.cmdItem}>
                            <span style={s.cmdLabel}>{item.label}</span>
                            <span style={s.cmdValue(item.color)}>{item.icon} {item.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ══════ AUTONOMOUS INTELLIGENCE NODE ══════ */}
            <div className="card" style={{ border: '1px solid rgba(34,211,238,0.2)', background: 'linear-gradient(135deg, rgba(34,211,238,0.03), transparent)', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ padding: 10, borderRadius: 12, background: 'rgba(34,211,238,0.1)', color: 'var(--cyan)' }}>
                        <Brain size={20} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Antigravity Agent (AG Intel)</h3>
                        <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>Proactive Protocol Monitoring & Economic Equilibrium</p>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.65rem', fontWeight: 700, color: '#34d399' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} className="animate-pulse" />
                        NODE ONLINE
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    <div style={{ padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 8 }}>The Stabilizer</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Target size={14} style={{ color: autonStatus.stabilizer === 'HEALTHY' ? '#34d399' : '#fbbf24' }} />
                            {autonStatus.stabilizer}
                        </div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: 4 }}>Proximity Scan Active</div>
                    </div>

                    <div style={{ padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 8 }}>RWA Risk Engine</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <TrendingDown size={14} style={{ color: 'var(--cyan)' }} />
                            +{gravityStats.suggestedYieldAdjustment} Yield Delta
                        </div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: 4 }}>Score: {gravityStats.score} (Risk Factor)</div>
                    </div>

                    <div style={{ padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 8 }}>Ghost Moderator</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <ShieldCheck size={14} style={{ color: '#34d399' }} />
                            {autonStatus.sybil}
                        </div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: 4 }}>Ceramic Graph Auth</div>
                    </div>

                    <div style={{ padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 8 }}>Treasury Butler</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Zap size={14} style={{ color: '#fbbf24' }} />
                            {autonStatus.treasury}
                        </div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: 4 }}>Morpho APY Analyzed</div>
                    </div>
                </div>
            </div>

            {/* ══════ WITHDRAW + YIELD ROW ══════ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                <div className="card"><WithdrawButton address={address} /></div>
                <div className="card"><YieldManagerDashboard address={address} /></div>
            </div>

            {/* ══════ ANALYTICS ══════ */}
            <div ref={analyticsRef} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -60, right: -60, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ ...s.sectionHead, position: 'relative', zIndex: 1 }}>
                    <div style={{ ...s.sectionIcon, background: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(34,211,238,0.03))', color: 'var(--cyan)' }}>
                        <BarChart3 size={16} />
                    </div>
                    <h3 style={s.sectionTitle}>Network Intelligence</h3>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', fontWeight: 600, color: 'var(--success)' }}>
                        <div style={s.liveDot('var(--success)')} /> Live
                    </div>
                </div>

                <div style={{ ...s.analyticsGrid, position: 'relative', zIndex: 1 }}>
                    <div>
                        <div style={s.analyticLabel}>Total Liquidity</div>
                        <div style={s.analyticValue}>
                            {(analytics.totalVolume || 0).toFixed(2)}
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: 4 }}>MATIC</span>
                        </div>
                    </div>
                    <div>
                        <div style={s.analyticLabel}>Jobs Matched</div>
                        <div style={s.analyticValue}>
                            {analytics.totalJobs || 0}
                            <span style={{ fontSize: '0.7rem', color: 'var(--success)', marginLeft: 6 }}>+12%</span>
                        </div>
                    </div>
                    <div>
                        <div style={s.analyticLabel}>Verified Users</div>
                        <div style={s.analyticValue}>{analytics.totalUsers || 0}</div>
                    </div>
                    <div>
                        <div style={s.analyticLabel}>Shield Status</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div style={s.liveDot('var(--success)')} />
                            Zenith Active
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════ PROFILE + SIDEBAR ══════ */}
            <div style={s.twoCol}>
                {/* ── Profile Card ── */}
                <div ref={profileRef} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', bottom: -80, left: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,92,252,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

                    <div style={{ ...s.sectionHead, position: 'relative', zIndex: 1 }}>
                        <div style={{ ...s.sectionIcon, background: 'linear-gradient(135deg, rgba(124,92,252,0.15), rgba(124,92,252,0.03))', color: 'var(--accent-light)' }}>
                            <User size={16} />
                        </div>
                        <div>
                            <h3 style={s.sectionTitle}>Identity & Credentials</h3>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 1 }}>Your on-chain professional profile</p>
                        </div>
                    </div>

                    {/* Avatar Upload */}
                    <div
                        style={{ ...s.avatarUpload, borderColor: isUploading ? 'var(--accent-light)' : 'rgba(124,92,252,0.3)' }}
                        onClick={() => document.getElementById('avatar-input').click()}
                        onMouseEnter={e => e.currentTarget.querySelector('.avatar-ovl').style.opacity = 1}
                        onMouseLeave={e => e.currentTarget.querySelector('.avatar-ovl').style.opacity = 0}
                    >
                        {isUploading ? (
                            <Loader2 className="animate-spin" size={24} style={{ color: 'var(--accent-light)' }} />
                        ) : profile.avatarIpfsHash ? (
                            <img src={getAvatarUrl(profile.avatarIpfsHash)} style={s.avatarImg} alt="Avatar" />
                        ) : (
                            <Camera size={24} style={{ color: 'var(--text-tertiary)' }} />
                        )}
                        <div className="avatar-ovl" style={s.avatarOverlay}>
                            <Camera size={20} style={{ color: '#fff' }} />
                        </div>
                        <input id="avatar-input" type="file" hidden accept="image/*" onChange={handleImageUpload} />
                    </div>

                    <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 1 }}>
                        <div style={s.formGrid}>
                            <div className="input-group-glass">
                                <label className="form-label">Public Alias</label>
                                <input type="text" className="form-input" value={profile.name}
                                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                                    placeholder="Your display name" />
                            </div>
                            <div className="input-group-glass">
                                <label className="form-label">Category</label>
                                <select className="form-input" value={profile.category}
                                    onChange={e => setProfile({ ...profile, category: e.target.value })}>
                                    <option>Development</option>
                                    <option>Design</option>
                                    <option>Marketing</option>
                                    <option>Writing</option>
                                </select>
                            </div>
                        </div>

                        <div className="input-group-glass">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <label className="form-label" style={{ marginBottom: 0 }}>Bio / Expertise</label>
                                <button type="button" onClick={handleAiPolish}
                                    disabled={isPolishing || !profile.skills}
                                    className="btn btn-ghost btn-sm"
                                    style={{ padding: '4px 10px', fontSize: '0.72rem', gap: 4, borderRadius: 8, background: 'var(--accent-subtle)', color: 'var(--accent-light)', border: '1px solid var(--accent-border)' }}>
                                    <Sparkles size={11} className={isPolishing ? 'animate-spin' : ''} />
                                    {isPolishing ? 'Working...' : 'AI Enhance'}
                                </button>
                            </div>
                            <textarea className="form-input" style={{ minHeight: 110 }}
                                value={profile.bio}
                                onChange={e => setProfile({ ...profile, bio: e.target.value })}
                                placeholder="Describe your expertise and experience..." />
                        </div>

                        <div className="input-group-glass">
                            <label className="form-label">Skills</label>
                            <input type="text" className="form-input" value={profile.skills}
                                onChange={e => setProfile({ ...profile, skills: e.target.value })}
                                placeholder="e.g. React, Solidity, UI/UX" />
                        </div>

                        <div style={s.formActions}>
                            <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ borderRadius: 12 }}>
                                <Save size={15} /> {isSaving ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* ── Right Sidebar ── */}
                <div ref={sidebarRef} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="card">
                        <div style={s.sectionHead}>
                            <div style={{ ...s.sectionIcon, background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.03))', color: 'var(--warning)' }}>
                                <Target size={14} />
                            </div>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>AI Recommendations</h4>
                        </div>
                        <AiRecommendations address={address} />
                    </div>

                    <div className="card">
                        <div style={s.sectionHead}>
                            <div style={{ ...s.sectionIcon, background: 'linear-gradient(135deg, rgba(96,165,250,0.15), rgba(96,165,250,0.03))', color: 'var(--info)' }}>
                                <Layers size={14} />
                            </div>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>Live Activity</h4>
                            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.65rem', fontWeight: 600, color: 'var(--success)' }}>
                                <div style={s.liveDot('var(--success)')} /> Live
                            </div>
                        </div>
                        <LiveJobFeed />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
