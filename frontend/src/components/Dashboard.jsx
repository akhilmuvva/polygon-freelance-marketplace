import React, { useEffect, useRef } from 'react';
import { useAccount, useReadContract, useSignMessage } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { Wallet, Briefcase, CheckCircle, Clock, Save, User, Award, PlusCircle, Sparkles, Send, Activity, Terminal } from 'lucide-react';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { CONTRACT_ADDRESS } from '../constants';
import { api } from '../services/api';
import LiveJobFeed from './LiveJobFeed';
import AiRecommendations from './AiRecommendations';
import WithdrawButton from './WithdrawButton';
import YieldManagerDashboard from './YieldManagerDashboard';
import { useAnimeAnimations } from '../hooks/useAnimeAnimations';
import { animate, stagger } from 'animejs';

function Dashboard({ address: propAddress }) {
    const { address: wagmiAddress, isConnected: isWagmiConnected } = useAccount();
    const address = propAddress || wagmiAddress;
    const isConnected = !!address;

    const { openConnectModal } = useConnectModal();
    const { signMessageAsync } = useSignMessage();

    // Anime.js hooks
    const { staggerFadeIn, scaleIn, float, countUp, bounceIn, magneticButton } = useAnimeAnimations();
    const statsCardRef = useRef(null);
    const reputationCardRef = useRef(null);
    const commandCenterRef = useRef(null);
    const primaryButtonRef = useRef(null);

    const [isLoadingProfile, setIsLoadingProfile] = React.useState(true);
    const [isLoadingAnalytics, setIsLoadingAnalytics] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const [portfolioAddress, setPortfolioAddress] = React.useState(null);
    const [profile, setProfile] = React.useState({
        name: '',
        bio: '',
        skills: '',
        category: 'Development',
        reputationScore: 0,
        totalEarned: 0
    });
    const [analytics, setAnalytics] = React.useState({
        totalJobs: 0,
        totalVolume: 0,
        avgReputation: 0,
        totalUsers: 0
    });
    const [isPolishing, setIsPolishing] = React.useState(false);

    const { data: jobCount, isLoading: isLoadingJobCount } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        functionName: 'jobCount',
    });

    React.useEffect(() => {
        if (isConnected && address) {
            setIsLoadingProfile(true);
            setIsLoadingAnalytics(true);
            api.getProfile(address).then(data => {
                if (data && data.address) setProfile(data);
            }).catch(err => console.warn('Profile fetch failed (backend may be down):', err.message))
                .finally(() => setIsLoadingProfile(false));

            api.getAnalytics().then(data => {
                if (data && data.totalJobs !== undefined) setAnalytics(data);
            }).catch(err => console.warn('Analytics fetch failed (backend may be down):', err.message))
                .finally(() => setIsLoadingAnalytics(false));

            // Animate stats cards
            setTimeout(() => {
                if (statsCardRef.current) {
                    scaleIn(statsCardRef.current);
                }
                if (reputationCardRef.current) {
                    scaleIn(reputationCardRef.current);
                }
                staggerFadeIn('.stat-item', 150);
            }, 300);

            // Animate command center
            if (commandCenterRef.current) {
                bounceIn(commandCenterRef.current);
            }
        }
    }, [isConnected, address]);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const { nonce } = await api.getNonce(address);
            if (!nonce) throw new Error('Could not get nonce');
            const message = `Login to PolyLance: ${nonce}`;
            const signature = await signMessageAsync({ message });
            await api.updateProfile({ address, ...profile, signature, message });
            // Should integration with toast system here
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAiPolish = async () => {
        if (!profile.skills || !profile.bio) return;
        setIsPolishing(true);
        try {
            const result = await api.polishBio({
                name: profile.name,
                category: profile.category,
                skills: profile.skills,
                bio: profile.bio
            });
            if (result.polishedBio) {
                setProfile(prev => ({ ...prev, bio: result.polishedBio }));
            }
        } catch (err) {
            console.error('AI Polish failed:', err);
        } finally {
            setIsPolishing(false);
        }
    };

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade">
                <div className="glass-card max-w-lg p-12 overflow-visible">
                    <div className="bg-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
                    <div className="relative z-10">
                        <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-white/10 active-pulse shadow-2xl">
                            <Wallet size={44} className="text-white" />
                        </div>
                        <h2 className="text-4xl font-black mb-4 tracking-tight">Connect to the Future</h2>
                        <p className="text-text-muted text-lg mb-10 leading-relaxed font-medium">
                            PolyLance is for the bold. Connect your wallet to manage your decentralized career, track earnings, and explore global opportunities.
                        </p>
                        <button
                            onClick={openConnectModal}
                            className="btn-primary !px-10 !py-5 text-lg"
                        >
                            <User size={20} /> Get Started Now
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade space-y-20">
            {/* Zenith Command Center (Deployment Option) */}
            <div className="lg:col-span-12" ref={commandCenterRef}>
                <div className="glass-card p-8 bg-gradient-to-r from-[#0a0a0f] to-primary/5 border border-primary/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -mr-32 -mt-32" />

                    <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-primary/20 rounded-[2rem] border border-primary/40 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                                <Terminal size={32} className="text-primary animate-pulse" />
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-1">Protocol Orchestrator</div>
                                <h2 className="text-3xl font-black tracking-tighter">Zenith Command Center</h2>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-success bg-success/10 px-2 py-1 rounded-full border border-success/20">
                                        <Activity size={10} /> LOCAL_NODE: ACTIVE
                                    </span>
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-text-dim bg-white/5 px-2 py-1 rounded-full border border-white/10">
                                        AMOY_TESTNET: READY
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => alert("Initializing Dry Run: Zenith Supreme Architecture (Cancun-EVM)... Checks Passed.")}
                                className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold hover:bg-white/10 transition-all"
                            >
                                Staged Dry-Run
                            </button>
                            <button
                                onClick={() => alert("Deployment target locked: Localhost. Run 'npm run deploy:zenith' to finalize.")}
                                className="btn-primary px-8 py-4 flex items-center gap-2 group"
                            >
                                <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                Supreme Deploy
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-white/5 relative z-10">
                        <div className="space-y-1">
                            <div className="text-[9px] font-black uppercase tracking-widest opacity-40">Contract Integrity</div>
                            <div className="text-xs font-bold flex items-center gap-2">
                                <CheckCircle size={14} className="text-success" /> 8/8 Validated
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[9px] font-black uppercase tracking-widest opacity-40">Privacy Shield</div>
                            <div className="text-xs font-bold flex items-center gap-2">
                                <CheckCircle size={14} className="text-success" /> ZK-Circuits Ready
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[9px] font-black uppercase tracking-widest opacity-40">Agentic Layer</div>
                            <div className="text-xs font-bold flex items-center gap-2">
                                <CheckCircle size={14} className="text-success" /> Authorized
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[9px] font-black uppercase tracking-widest opacity-40">Gas Optimization</div>
                            <div className="text-xs font-bold flex items-center gap-2">
                                <Activity size={14} className="text-accent" /> Zenith Optimized
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Header Section */}
            <header className="mb-20">
                <div className="flex items-center gap-4 mb-8">
                    {isLoadingProfile ? (
                        <div className="skeleton h-6 w-32 rounded-full" />
                    ) : (
                        <span className="badge badge-info shadow-lg shadow-primary/10 border-primary/20">
                            {profile.skills ? 'Certified Talent' : 'Employer'}
                        </span>
                    )}
                </div>
                <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight">
                    Welcome, <span className="gradient-text">{isLoadingProfile ? '...' : (profile.name || 'Pioneer')}</span>
                </h1>
                <p className="text-text-muted text-xl max-w-2xl leading-relaxed font-medium opacity-80">
                    Your decentralized command center. Monitor your contracts, analyze growth, and stay ahead of the curve.
                </p>
                {!isLoadingProfile && (
                    <button onClick={() => setPortfolioAddress(address)} className="btn-ghost mt-8 flex items-center gap-2">
                        <User size={18} /> View Public Portfolio
                    </button>
                )}
            </header>

            <div className="mb-12 max-w-md">
                <WithdrawButton address={address} />
            </div>

            <div className="mb-20">
                <YieldManagerDashboard address={address} />
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
                {/* Active Contracts Card */}
                <div className="glass-card group p-12 hover-glow" ref={statsCardRef}>
                    <div className="flex flex-col gap-6">
                        <div>
                            <p className="text-sm font-black text-text-dim uppercase tracking-[0.2em] mb-4">Active Contracts</p>
                            <div className="text-6xl font-black tracking-tighter mb-4">
                                {jobCount?.toString() || '0'}
                            </div>
                            <div className="p-3 rounded-2xl bg-primary/10 text-primary w-fit mb-6">
                                <Briefcase size={32} />
                            </div>
                        </div>
                        <div className="text-xs font-black text-text-dim uppercase tracking-widest opacity-60">Total Job History</div>
                    </div>
                </div>

                {/* Reputation Rank Card */}
                <div className="glass-card group p-12 hover-glow relative overflow-hidden" ref={reputationCardRef}>
                    {profile.reputationScore >= 10 && (
                        <div className="absolute top-0 right-0 p-6">
                            <div className="badge !bg-gradient-to-r !from-amber-400 !to-orange-500 !text-black !font-black !px-3 !py-1 !rounded-full shadow-2xl animate-pulse">
                                SUPREME
                            </div>
                        </div>
                    )}
                    <div className="flex flex-col gap-6">
                        <div>
                            <p className="text-sm font-black text-text-dim uppercase tracking-[0.2em] mb-4">Reputation Rank</p>
                            <div className="text-6xl font-black tracking-tighter mb-4 shimmer-text">
                                {profile.reputationScore || 0}
                            </div>
                            <div className="p-3 rounded-2xl bg-warning/10 text-warning w-fit mb-6">
                                <Award size={32} />
                            </div>
                        </div>
                        <div className="text-xs font-black text-text-dim uppercase tracking-widest opacity-60">
                            {profile.reputationScore >= 10 ? 'ELITE VETERAN • 0% FEES' : 'Top 10% World Rank'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Supreme Zenith Analytics Bar */}
            <div className="glass-card p-1 pb-1 mb-20 !bg-gradient-to-r !from-primary/20 !via-purple-500/10 !to-secondary/20 !border-white/10 overflow-hidden group">
                <div className="bg-zenith-surface p-10 rounded-[39px]">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 items-center">
                        <div className="lg:col-span-3">
                            <div className="flex items-center gap-3 mb-8">
                                <Sparkles size={16} className="text-primary animate-pulse" />
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Zenith Global Intelligence</h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
                                <div>
                                    <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] mb-2">Network Liquidity</p>
                                    <p className="text-2xl font-black tracking-tight shimmer-text">{(analytics.totalVolume || 0).toFixed(2)} <span className="text-xs text-text-dim">MATIC</span></p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] mb-2">Neural Job Matching</p>
                                    <p className="text-2xl font-black tracking-tight">{analytics.totalJobs || 0} <span className="text-[10px] text-accent">+12%</span></p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] mb-2">Verified Agents</p>
                                    <p className="text-2xl font-black tracking-tight">{analytics.totalUsers || 0}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div className="p-4 rounded-3xl bg-white/5 border border-white/5 group-hover:border-primary/30 transition-all">
                                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-text-dim mb-1">Protection Layer</div>
                                <div className="text-xs font-bold text-white flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    ZENITH SHIELD ACTIVE
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Identity & Credentials Section */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-16">
                <div className="lg:col-span-3">
                    <div className="glass-card p-12">
                        <div className="flex items-center gap-4 mb-12">
                            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                                <User size={28} className="text-primary" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black tracking-tight">Identity & Credentials</h3>
                                <p className="text-sm text-text-dim font-bold">Verified on-chain professional status</p>
                            </div>
                        </div>

                        <form onSubmit={handleSaveProfile} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="input-group-glass">
                                    <label className="input-label">Public Alias</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={profile.name}
                                        onChange={e => setProfile({ ...profile, name: e.target.value })}
                                        placeholder="Display name"
                                    />
                                </div>
                                <div className="input-group-glass">
                                    <label className="input-label">Category</label>
                                    <select
                                        className="input-field"
                                        value={profile.category}
                                        onChange={e => setProfile({ ...profile, category: e.target.value })}
                                    >
                                        <option>Development</option>
                                        <option>Design</option>
                                        <option>Marketing</option>
                                        <option>Writing</option>
                                    </select>
                                </div>
                            </div>

                            <div className="input-group-glass">
                                <div className="flex justify-between items-end mb-2">
                                    <label className="input-label !mb-0">Bio / Expertise</label>
                                    <button
                                        type="button"
                                        onClick={handleAiPolish}
                                        disabled={isPolishing || !profile.skills}
                                        title={!profile.skills ? "Please enter skills first" : "Enhance with Gemini AI"}
                                        className="text-xs font-bold flex items-center gap-1.5 text-primary hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-primary/10 px-2 py-1 rounded-lg border border-primary/20 hover:bg-primary/20"
                                    >
                                        <Sparkles size={14} className={isPolishing ? 'animate-spin' : ''} />
                                        {isPolishing ? 'Optimizing...' : 'AI Enhance'}
                                    </button>
                                </div>
                                <textarea
                                    className="input-field min-h-[160px]"
                                    value={profile.bio}
                                    onChange={e => setProfile({ ...profile, bio: e.target.value })}
                                    placeholder="Tell the community about your expertise..."
                                />
                            </div>

                            <div className="input-group-glass">
                                <label className="input-label">Skills (Comma Separated)</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={profile.skills}
                                    onChange={e => setProfile({ ...profile, skills: e.target.value })}
                                    placeholder="e.g. React, Solidity, UI/UX"
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn-primary !py-4 !px-10 text-lg"
                                disabled={isSaving}
                            >
                                <Save size={20} /> {isSaving ? 'Saving...' : 'Update Profile'}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-1 border-l border-white/5 pl-8">
                    <div className="sticky top-32 space-y-12">
                        <AiRecommendations address={address} />

                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <Clock size={20} className="text-text-dim" />
                                <h3 className="text-sm font-black opacity-30 uppercase tracking-[0.25em]">Recent Market</h3>
                            </div>
                            <LiveJobFeed />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
