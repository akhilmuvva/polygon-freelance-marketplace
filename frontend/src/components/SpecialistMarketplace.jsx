import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, Shield, Brain, Rocket, Trophy, Target, 
    Search, Filter, ChevronRight, User, ArrowLeft,
    CheckCircle2, DollarSign, Clock, MessageSquare, 
    LayoutGrid, List, Sparkles, Cpu, Code2, Palette,
    Gamepad2, ShieldCheck, Coins, Landmark, Microscope,
    Layers, Briefcase, Activity
} from 'lucide-react';
import { useAnimeAnimations } from '../hooks/useAnimeAnimations';
import SubgraphService from '../services/SubgraphService';
import { formatEther } from 'viem';
import './SpecialistMarketplace.css';

/**
 * Specialist Marketplace Component
 * Browse and hire Web3 specialists by category with premium "Antigravity" aesthetic.
 */
const SpecialistMarketplace = ({ onRegister }) => {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [specialists, setSpecialists] = useState([]);
    const [categoryStats, setCategoryStats] = useState({});
    const [filterLevel, setFilterLevel] = useState('all');
    const [sortBy, setSortBy] = useState('rating');
    const [searchTerm, setSearchTerm] = useState('');
    const { staggerFadeIn } = useAnimeAnimations();

    const categories = [
        {
            id: 0,
            name: 'Smart Contract Developer',
            icon: Code2,
            description: 'Solidity, Rust, Move blockchain developers',
            avgRate: 150,
            demand: 95,
            color: '#7c5cfc',
            status: 'Trending'
        },
        {
            id: 1,
            name: 'ZK Proof Engineer',
            icon: ShieldCheck,
            description: 'Zero-knowledge proof specialists',
            avgRate: 200,
            demand: 98,
            color: '#2dd4bf',
            status: 'Elite'
        },
        {
            id: 2,
            name: 'DeFi Analyst',
            icon: Landmark,
            description: 'DeFi protocol analysts and researchers',
            avgRate: 120,
            demand: 85,
            color: '#fbbf24'
        },
        {
            id: 3,
            name: 'NFT Artist',
            icon: Palette,
            description: 'Digital artists and NFT creators',
            avgRate: 100,
            demand: 75,
            color: '#ec4899'
        },
        {
            id: 4,
            name: 'On-Chain Game Builder',
            icon: Gamepad2,
            description: 'Blockchain game developers',
            avgRate: 130,
            demand: 80,
            color: '#10b981'
        },
        {
            id: 5,
            name: 'Protocol Auditor',
            icon: Shield,
            description: 'Security auditors',
            avgRate: 180,
            demand: 92,
            color: '#ef4444',
            status: 'Critical'
        },
        {
            id: 6,
            name: 'Tokenomics Designer',
            icon: Coins,
            description: 'Token economics experts',
            avgRate: 140,
            demand: 78,
            color: '#8b5cf6'
        },
        {
            id: 7,
            name: 'DAO Architect',
            icon: Layers,
            description: 'Governance system designers',
            avgRate: 160,
            demand: 82,
            color: '#0ea5e9'
        },
        {
            id: 8,
            name: 'MEV Researcher',
            icon: Microscope,
            description: 'MEV and arbitrage specialists',
            avgRate: 190,
            demand: 88,
            color: '#6366f1'
        },
        {
            id: 9,
            name: 'Layer 2 Engineer',
            icon: Cpu,
            description: 'L2 scaling solutions',
            avgRate: 170,
            demand: 90,
            color: '#f472b6',
            status: 'New'
        }
    ];

    const proficiencyLevels = [
        { id: 0, name: 'Beginner', icon: Rocket, color: '#10b981' },
        { id: 1, name: 'Intermediate', icon: Target, color: '#3b82f6' },
        { id: 2, name: 'Advanced', icon: Trophy, color: '#8b5cf6' },
        { id: 3, name: 'Expert', icon: Sparkles, color: '#f59e0b' },
        { id: 4, name: 'Master', icon: Brain, color: '#ef4444' }
    ];

    useEffect(() => {
        if (selectedCategory !== null) {
            fetchSpecialists();
            fetchCategoryStats();
        } else {
            staggerFadeIn('.category-card', 60);
        }
    }, [selectedCategory, staggerFadeIn]);

    const fetchSpecialists = async () => {
        try {
            const leaders = await SubgraphService.getLeaderboard();
            const realSpecialists = leaders.map(l => {
                const earned = parseFloat(formatEther(BigInt(l.totalEarned || '0')));
                const completed = Number(l.jobsCompleted || 0);
                
                return {
                    address: l.id,
                    name: l.name || `Specialist-${l.id.slice(2, 6)}`.toUpperCase(),
                    proficiency: Math.min(Math.floor((Number(l.reputationScore) || 0) / 200), 4),
                    verifiedProjects: completed,
                    totalEarnings: earned,
                    averageRating: Number(l.rating || 5) * 20, 
                    // Derive rate from historical earnings or category default
                    hourlyRate: earned > 0 && completed > 0 
                        ? Math.max(50, Math.min(250, Math.round(earned / completed / 10) * 10)) 
                        : 120, 
                    avatar: '👤',
                    specialties: ['Web3', 'Blockchain', 'Smart Contracts'],
                    endorsements: Math.floor((Number(l.reputationScore) || 0) / 5),
                    responseTime: '< 2 hours',
                    availability: 'Responsive',
                    portfolio: l.portfolioCID ? `ipfs://${l.portfolioCID}` : null
                };
            });
            setSpecialists(realSpecialists);
        } catch (err) {
            console.error('[MARKETPLACE] Failed to fetch specialists:', err);
        }
    };

    const fetchCategoryStats = async () => {
        try {
            const stats = await SubgraphService.getEcosystemStats();
            setCategoryStats({
                activeSpecialists: stats?.activeUsers?.length || 0,
                totalJobs: Number(stats?.totalJobs || 0),
                totalVolume: parseFloat(formatEther(BigInt(stats?.totalVolume || '0'))),
                avgCompletionTime: '24-48h',
                successRate: 100
            });
            setTimeout(() => staggerFadeIn('.specialist-card', 60), 100);
        } catch (err) {
            console.error('[MARKETPLACE] Failed to fetch stats:', err);
        }
    };

    const handleHireSpecialist = (specialist) => {
        // Directive 09: Cross-Module Intent Actuation
        // Pack the specialist's identity metadata and signal the App shell to transition 
        // to the job creation logic with pre-filled context.
        const detail = { 
            freelancer: specialist.address,
            title: `Specialist Mission: ${categories[selectedCategory].name}`,
            amount: specialist.hourlyRate.toString()
        };
        
        window.dispatchEvent(new CustomEvent('NAV_TO_CREATE', { detail }));
    };

    const filteredAndSortedSpecialists = useMemo(() => {
        return specialists
            .filter(s => {
                const matchesLevel = filterLevel === 'all' || s.proficiency === parseInt(filterLevel);
                const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                    s.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    s.specialties.some(sp => sp.toLowerCase().includes(searchTerm.toLowerCase()));
                return matchesLevel && matchesSearch;
            })
            .sort((a, b) => {
                switch (sortBy) {
                    case 'rating': return b.averageRating - a.averageRating;
                    case 'projects': return b.verifiedProjects - a.verifiedProjects;
                    case 'earnings': return b.totalEarnings - a.totalEarnings;
                    case 'rate': return a.hourlyRate - b.hourlyRate;
                    default: return 0;
                }
            });
    }, [specialists, filterLevel, sortBy, searchTerm]);

    return (
        <div className="specialist-marketplace space-y-12">
            <header className="marketplace-header relative px-12 py-16 rounded-[3rem] bg-bg-surface border border-accent-border overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-subtle border border-accent-border text-accent-light text-[10px] font-black uppercase tracking-widest mb-4">
                            <Target size={12} className="text-accent" /> Expert Intelligence Node
                        </div>
                        <h1 className="text-6xl font-black text-white tracking-tighter leading-none mb-4 uppercase italic">
                            Sovereign <span className="shimmer-text">Specialists</span>
                        </h1>
                        <p className="text-text-secondary text-lg font-medium max-w-xl">
                            Deploy high-gravity Web3 talent into your mission protocols. Zero extractive friction.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
                            <div className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Active Talent</div>
                            <div className="text-2xl font-black text-white">{categoryStats.activeSpecialists || '0'}</div>
                        </div>
                        <div className="px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
                            <div className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Protocol Volume</div>
                            <div className="text-2xl font-black text-accent">{categoryStats.totalVolume?.toFixed(1) || '0.0'} <span className="text-xs">MATIC</span></div>
                        </div>
                    </div>
                </div>
            </header>

            <AnimatePresence mode="wait">
                {selectedCategory === null ? (
                    <motion.div 
                        key="categories"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 60, alignItems: 'start' }}>
                            <div className="category-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {categories.map((category) => (
                                    <div
                                        key={category.id}
                                        className="category-card p-8 rounded-[2rem] bg-bg-card border border-border hover:border-accent-border transition-all group relative overflow-hidden cursor-pointer shadow-lg hover:shadow-accent/10"
                                        onClick={() => setSelectedCategory(category.id)}
                                    >
                                        {category.status && (
                                            <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-[8px] font-black text-accent uppercase tracking-tighter z-20">
                                                {category.status}
                                            </div>
                                        )}
                                        <div className="category-glow absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(circle at center, ${category.color}20 0%, transparent 70%)` }} />
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-colors" />
                                        <div className="p-5 rounded-2xl bg-bg-surface border border-border inline-flex text-white mb-8 group-hover:scale-110 transition-transform shadow-neon" style={{ color: category.color, boxShadow: `0 0 20px ${category.color}40` }}>
                                            <category.icon size={28} />
                                        </div>
                                        <h3 className="text-xl font-black text-white leading-tight mb-3 group-hover:text-accent transition-colors tracking-tight">{category.name}</h3>
                                        <p className="text-[11px] text-text-tertiary font-medium mb-10 line-clamp-2 leading-relaxed">{category.description}</p>
                                        
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-1">
                                                <div className="text-[10px] font-black text-text-tertiary uppercase tracking-widest opacity-50">Gravity Rate</div>
                                                <div className="text-base font-black text-white flex items-center gap-1">
                                                    <span className="text-success text-xs">$</span>{category.avgRate}<span className="text-[10px] text-text-tertiary">/hr</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 opacity-50">Resonance</div>
                                                <div className="h-1.5 w-20 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                    <div className="h-full bg-accent" style={{ width: `${category.demand}%`, background: `linear-gradient(90deg, ${category.color}, #fff)`, boxShadow: `0 0 10px ${category.color}80` }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* CTA Sidebar for Nexus View */}
                            <div className="main-cta-card p-12 rounded-[3.5rem] bg-[#00f5d4]/5 border border-[#00f5d4]/20 text-white relative overflow-hidden group h-full flex flex-col justify-center backdrop-blur-3xl shadow-2xl">
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
                                <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent/20 rounded-full blur-[80px] pointer-events-none" />
                                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 inline-flex self-start mb-8 group-hover:scale-110 transition-transform">
                                    <Sparkles size={32} className="text-accent" />
                                </div>
                                <h4 className="text-2xl font-black leading-none mb-4 uppercase tracking-tighter">Join the Sovereign <br/><span className="text-accent">Network</span></h4>
                                <p className="text-sm font-medium opacity-60 mb-10 leading-relaxed max-w-[240px]">Monetize your elite intelligence with zero extraction and direct-to-chain yield.</p>
                                <button 
                                    onClick={onRegister}
                                    className="w-full py-4 rounded-2xl bg-white text-accent text-xs font-black uppercase tracking-widest hover:bg-bg-base hover:text-white transition-all shadow-xl"
                                >
                                    Register Alias
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="specialists"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        <button 
                            className="flex items-center gap-2 text-xs font-black text-text-tertiary uppercase tracking-widest hover:text-accent transition-colors"
                            onClick={() => setSelectedCategory(null)}
                        >
                            <ArrowLeft size={14} /> Back to Nexus
                        </button>

                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            <div className="w-full lg:w-3/4 space-y-6">
                                {/* Filter Bar */}
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 rounded-2xl bg-bg-surface border border-border">
                                    <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto">
                                        <div className="relative w-full sm:w-64">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                                            <input 
                                                type="text"
                                                placeholder="Search Specialists..."
                                                className="w-full bg-white/[0.03] border border-border rounded-xl py-2 pl-9 pr-4 text-xs font-medium text-white placeholder:text-text-tertiary focus:border-accent/30 focus:ring-1 focus:ring-accent/20 transition-all"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Filter size={14} className="text-accent" />
                                            <select 
                                                className="bg-transparent border-none text-xs font-black text-white uppercase tracking-widest focus:ring-0 cursor-pointer"
                                                value={filterLevel}
                                                onChange={(e) => setFilterLevel(e.target.value)}
                                            >
                                                <option value="all" className="bg-bg-surface">All Proficiency</option>
                                                {proficiencyLevels.map(l => <option key={l.id} value={l.id} className="bg-bg-surface">{l.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-text-tertiary uppercase">Sort:</span>
                                        <select 
                                            className="bg-transparent border-none text-xs font-black text-accent uppercase tracking-widest focus:ring-0 cursor-pointer"
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                        >
                                            <option value="rating">Gravity Rank</option>
                                            <option value="projects">Execution History</option>
                                            <option value="earnings">Accumulated Yield</option>
                                            <option value="rate">Friction Minimum</option>
                                        </select>
                                    </div>
                                                                {/* Specialists Grid */}
                                <div className="grid grid-cols-1 gap-4">
                                    {filteredAndSortedSpecialists.length > 0 ? filteredAndSortedSpecialists.map((specialist, idx) => (
                                        <div key={idx} className="specialist-card p-6 rounded-3xl bg-bg-raised border border-border hover:border-accent-border transition-all flex flex-col md:flex-row justify-between gap-8 group">
                                            <div className="flex gap-6 items-start">
                                                <div className="relative">
                                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center text-3xl">
                                                        {specialist.avatar}
                                                    </div>
                                                    <div className="absolute -bottom-2 -right-2 p-1 bg-bg-base border border-border rounded-lg">
                                                        {React.createElement(proficiencyLevels[specialist.proficiency].icon, { size: 12, className: "text-white" })}
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="text-xl font-black text-white group-hover:text-accent transition-colors">{specialist.name}</h3>
                                                            {specialist.proficiency >= 3 && (
                                                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 border border-success/20 text-[8px] font-black text-success uppercase">
                                                                    <ShieldCheck size={10} /> Verified
                                                                </div>
                                                            )}
                                                        </div>
                                                        <code className="text-[10px] text-text-tertiary font-mono">{specialist.address}</code>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {specialist.specialties.map((s, i) => (
                                                            <span key={i} className="px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/5 text-[9px] font-bold text-text-secondary uppercase">{s}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-center gap-8 md:text-right">
                                                <div className="grid grid-cols-2 md:grid-cols-1 gap-x-8 gap-y-2">
                                                    <div>
                                                        <div className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Execution Rate</div>
                                                        <div className="text-lg font-black text-white">${specialist.hourlyRate}/hr</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Resonance</div>
                                                        <div className="text-lg font-black text-success">{specialist.averageRating}%</div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleHireSpecialist(specialist)}
                                                        className="px-6 py-3 rounded-xl bg-accent text-bg-base text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-accent/20"
                                                    >
                                                        Initialize Mission
                                                    </button>
                                                    <button className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                                        <MessageSquare size={16} className="text-text-secondary" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 rounded-3xl bg-white/[0.01] border border-dashed border-white/5">
                                            <div className="p-4 rounded-2xl bg-white/5 text-text-tertiary">
                                                <Search size={32} />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black text-white">No Intelligence Detected</h4>
                                                <p className="text-sm text-text-tertiary">Adjust your filters to scan the network again.</p>
                                            </div>
                                            <button 
                                                onClick={() => { setSearchTerm(''); setFilterLevel('all'); }}
                                                className="text-xs font-black text-accent uppercase tracking-widest hover:underline"
                                            >
                                                Reset Telemetry
                                            </button>
                                        </div>
                                    )}
                                </div>     </div>
                            </div>

                            {/* Sidebar Stats */}
                            <div className="w-full lg:w-1/4 space-y-6">
                                <div className="p-8 rounded-3xl bg-bg-surface border border-accent-border relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
                                    <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <Activity size={12} className="text-accent" /> Telemetry
                                    </h4>
                                    <div className="space-y-6">
                                        {[
                                            { label: 'Active Talent', value: categoryStats.activeSpecialists, icon: User },
                                            { label: 'Escrows Closed', value: categoryStats.totalJobs, icon: Briefcase },
                                            { label: 'Execution Speed', value: categoryStats.avgCompletionTime, icon: Clock },
                                            { label: 'Resonance Accuracy', value: `${categoryStats.successRate}%`, icon: ShieldCheck },
                                        ].map((stat, i) => {
                                            const StatIcon = stat.icon;
                                            return (
                                                <div key={i} className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-white/5 text-text-tertiary"><StatIcon size={12} /></div>
                                                        <span className="text-xs font-bold text-text-secondary">{stat.label}</span>
                                                    </div>
                                                    <span className="text-xs font-black text-white">{stat.value}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-8 pt-8 border-t border-white/5">
                                        <div className="p-4 rounded-2xl bg-accent-subtle border border-accent-border">
                                            <div className="text-[10px] font-black text-accent uppercase tracking-widest leading-normal">
                                                Absolute Zero Gravity Enforced for this vertical.
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 rounded-3xl bg-gradient-to-br from-accent to-secondary text-white relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
                                    <Sparkles size={32} className="mb-4 opacity-50 group-hover:scale-110 transition-transform" />
                                    <h4 className="text-xl font-black leading-tight mb-2">Join the Sovereign Network</h4>
                                    <p className="text-xs font-medium opacity-80 mb-6">Monetize your elite intelligence with zero extraction.</p>
                                    <button 
                                        onClick={onRegister}
                                        className="w-full py-4 rounded-2xl bg-white text-accent text-xs font-black uppercase tracking-widest hover:bg-bg-base hover:text-white transition-all"
                                    >
                                        Register Alias
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SpecialistMarketplace;
