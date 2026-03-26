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
        <div className="specialist-marketplace space-y-16">
            {/* CINEMATIC HEADER: THE INTELLIGENCE NEXUS */}
            <header className="relative px-12 py-20 rounded-[4rem] bg-[#020617] border border-white/5 overflow-hidden shadow-2xl">
                {/* Kinetic Atmosphere */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent/20 rounded-full blur-[160px] animate-pulse pointer-events-none" />
                <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[140px] pointer-events-none" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay pointer-events-none" />
                
                {/* Protocol Grid Lattice */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" 
                     style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
                    <div className="text-center lg:text-left space-y-6">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent-light text-[11px] font-black uppercase tracking-[0.3em] backdrop-blur-md"
                        >
                            <Target size={14} className="text-accent animate-pulse" /> Global Intelligence Mesh
                        </motion.div>
                        
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="text-7xl xl:text-8xl font-black text-white tracking-tighter leading-tight uppercase italic"
                        >
                            Sovereign <br />
                            <span className="bg-gradient-to-r from-accent via-white to-secondary bg-clip-text text-transparent italic">Specialists</span>
                        </motion.h1>
                        
                        <motion.p 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                            className="text-text-secondary text-xl font-medium max-w-2xl leading-relaxed"
                        >
                            Access the planet's highest-gravity Web3 talent. Direct protocol engagement with <span className="text-white font-bold">zero extraction fees</span> and absolute execution certainty.
                        </motion.p>
                    </div>

                    {/* Holographic Protocol Stats */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col sm:flex-row gap-6"
                    >
                        <div className="group relative p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-2xl hover:bg-white/[0.05] transition-all duration-500">
                            <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative">
                                <Activity size={20} className="text-accent mb-4" />
                                <div className="text-[11px] font-black text-text-tertiary uppercase tracking-widest mb-1">Active Nodes</div>
                                <div className="text-4xl font-black text-white tabular-nums">{categoryStats.activeSpecialists || '0'}</div>
                            </div>
                        </div>
                        <div className="group relative p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-2xl hover:bg-white/[0.05] transition-all duration-500">
                            <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-secondary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative">
                                <Zap size={20} className="text-secondary mb-4" />
                                <div className="text-[11px] font-black text-text-tertiary uppercase tracking-widest mb-1">Volume Reserve</div>
                                <div className="text-4xl font-black text-white tabular-nums">
                                    {categoryStats.totalVolume?.toFixed(1) || '0.0'} <span className="text-sm font-medium text-text-tertiary italic">MATIC</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </header>

            <AnimatePresence mode="wait">
                {selectedCategory === null ? (
                    <motion.div 
                        key="categories"
                        initial={{ opacity: 0, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, filter: 'blur(10px)' }}
                        className="space-y-20"
                    >
                        {/* High-Gravity Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {categories.map((category, idx) => (
                                <motion.div
                                    key={category.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group relative p-10 rounded-[2.5rem] bg-[#0a0a0b] border border-white/5 hover:border-white/20 transition-all duration-500 cursor-pointer overflow-hidden"
                                    onClick={() => setSelectedCategory(category.id)}
                                >
                                    {/* Bioluminescent Aura */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                                         style={{ 
                                             background: `radial-gradient(circle at 50% 100%, ${category.color}40 0%, transparent 60%)`,
                                         }} />
                                    
                                    {/* Particle Burst Icon */}
                                    <div className="relative z-10 p-5 rounded-2xl border border-white/5 bg-white/[0.02] inline-flex mb-10 group-hover:scale-110 transition-transform duration-500"
                                         style={{ boxShadow: `0 0 30px ${category.color}30` }}>
                                        <category.icon size={32} style={{ color: category.color }} />
                                    </div>
                                    
                                    <h3 className="relative z-10 text-2xl font-black text-white leading-none mb-4 uppercase tracking-tighter group-hover:text-white transition-colors">
                                        {category.name.split(' ').map((word, i) => (
                                            <span key={i} className={i === 0 ? "block" : "text-text-tertiary group-hover:text-white/70 block text-lg font-bold"}>
                                                {word}
                                            </span>
                                        ))}
                                    </h3>
                                    
                                    <p className="relative z-10 text-sm text-text-tertiary font-medium mb-12 line-clamp-2 leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity">
                                        {category.description}
                                    </p>

                                    <div className="relative z-10 flex justify-between items-end pt-6 border-t border-white/5">
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-black text-text-tertiary uppercase tracking-widest opacity-50">Entry Rate</div>
                                            <div className="text-xl font-black text-white">${category.avgRate}/hr</div>
                                        </div>
                                        <ChevronRight size={24} className="text-white opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                    </div>
                                </motion.div>
                            ))}

                            {/* AGENT REGISTRATION NODE */}
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="group relative p-10 rounded-[2.5rem] bg-gradient-to-br from-accent/20 to-secondary/10 border-2 border-accent/30 flex flex-col justify-center items-center text-center overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-[#00f5d4]/5 backdrop-blur-3xl" />
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
                                
                                <div className="relative z-10 space-y-8">
                                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 inline-flex shadow-2xl">
                                        <Rocket size={40} className="text-white animate-bounce" />
                                    </div>
                                    <h4 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
                                        Become a <br /><span className="text-accent italic">Specialist</span>
                                    </h4>
                                    <p className="text-sm font-medium text-white/60 leading-relaxed">
                                        Monetize your elite Web3 intelligence at absolute scale.
                                    </p>
                                    <button 
                                        onClick={onRegister}
                                        className="w-full py-5 rounded-2xl bg-white text-accent text-xs font-black uppercase tracking-[0.3em] hover:bg-black hover:text-white transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-accent/40"
                                    >
                                        Register Alias
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="specialists"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-10"
                    >
                        <button 
                            className="group flex items-center gap-3 text-xs font-black text-text-tertiary uppercase tracking-[0.2em] hover:text-white transition-all underline decoration-accent/30 underline-offset-8 decoration-2"
                            onClick={() => setSelectedCategory(null)}
                        >
                            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-accent/20 transition-colors"><ArrowLeft size={14} /></div>
                            Back to Sovereign Nexus
                        </button>

                        <div className="flex flex-col lg:flex-row gap-12 items-start">
                            <div className="w-full lg:w-3/4 space-y-8">
                                {/* TACTICAL FILTER NEXUS */}
                                <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-6 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-3xl shadow-2xl">
                                    <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
                                        <div className="relative w-full md:w-80">
                                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
                                            <input 
                                                type="text"
                                                placeholder="Scan Node Signatures..."
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 pl-12 pr-6 text-xs font-medium text-white placeholder:text-text-tertiary focus:border-accent/40 focus:ring-4 focus:ring-accent/10 transition-all"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Filter size={16} className="text-accent" />
                                            <select 
                                                className="bg-transparent border-none text-xs font-black text-white uppercase tracking-widest focus:ring-0 cursor-pointer hover:bg-white/5 rounded-xl px-4 py-2 transition-colors"
                                                value={filterLevel}
                                                onChange={(e) => setFilterLevel(e.target.value)}
                                            >
                                                <option value="all" className="bg-[#0f172a]">All Tiers</option>
                                                {proficiencyLevels.map(l => <option key={l.id} value={l.id} className="bg-[#0f172a]">{l.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                                        <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Sort:</span>
                                        <select 
                                            className="bg-transparent border-none text-xs font-black text-accent uppercase tracking-widest focus:ring-0 cursor-pointer"
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                        >
                                            <option value="rating">Gravity Rank</option>
                                            <option value="projects">Execution History</option>
                                            <option value="earnings">Accumulated Yield</option>
                                            <option value="rate">Friction Min</option>
                                        </select>
                                    </div>
                                </div>

                                {/* AGENT DOSSIER GRID */}
                                <div className="grid grid-cols-1 gap-6">
                                    {filteredAndSortedSpecialists.length > 0 ? filteredAndSortedSpecialists.map((specialist, idx) => (
                                        <motion.div 
                                            key={idx} 
                                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                                            className="group relative p-8 rounded-[2.5rem] bg-[#0a0a0b] border border-white/5 hover:border-accent/30 transition-all duration-500 flex flex-col xl:flex-row justify-between gap-10 overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            
                                            <div className="relative z-10 flex gap-8 items-start">
                                                <div className="relative">
                                                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center text-4xl shadow-2xl group-hover:scale-105 transition-transform">
                                                        {specialist.avatar}
                                                    </div>
                                                    <div className="absolute -bottom-3 -right-3 p-2 bg-[#020617] border border-white/10 rounded-2xl shadow-neon">
                                                        {React.createElement(proficiencyLevels[specialist.proficiency].icon, { size: 16, className: "text-white" })}
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="text-2xl font-black text-white group-hover:text-accent transition-colors tracking-tight">{specialist.name}</h3>
                                                            {specialist.proficiency >= 3 && (
                                                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 border border-success/20 text-[9px] font-black text-success uppercase tracking-wider">
                                                                    <ShieldCheck size={12} /> Verified Agent
                                                                </div>
                                                            )}
                                                        </div>
                                                        <code className="text-[11px] text-text-tertiary font-mono bg-white/5 px-2 py-1 rounded-md">{specialist.address}</code>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {specialist.specialties.map((s, i) => (
                                                            <span key={i} className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/5 text-[10px] font-bold text-text-secondary uppercase tracking-tight">{s}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-10 xl:text-right">
                                                <div className="grid grid-cols-2 xl:grid-cols-1 gap-x-12 gap-y-4 w-full sm:w-auto">
                                                    <div>
                                                        <div className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] mb-1">Execution Rate</div>
                                                        <div className="text-2xl font-black text-white">${specialist.hourlyRate}<span className="text-xs text-text-tertiary">/HR</span></div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] mb-1">Resonance</div>
                                                        <div className="text-2xl font-black text-success">{specialist.averageRating}%</div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-4 w-full sm:w-auto">
                                                    <button 
                                                        onClick={() => handleHireSpecialist(specialist)}
                                                        className="flex-1 sm:flex-none px-8 py-4 rounded-2xl bg-white text-black text-xs font-black uppercase tracking-[0.3em] hover:bg-accent hover:text-white transition-all shadow-xl hover:shadow-accent/40"
                                                    >
                                                        Initialize Mission
                                                    </button>
                                                    <button className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                                                        <MessageSquare size={18} className="text-text-secondary" />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )) : (
                                        <div className="py-32 flex flex-col items-center justify-center text-center space-y-6 rounded-[3rem] bg-white/[0.01] border border-dashed border-white/5 backdrop-blur-sm">
                                            <div className="p-6 rounded-3xl bg-white/5 text-text-tertiary">
                                                <Search size={48} className="opacity-20" />
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-2xl font-black text-white uppercase tracking-tighter">No Active Signatures</h4>
                                                <p className="text-sm text-text-tertiary max-w-xs mx-auto">The network is silent in this frequency. Adjust your telemetry to scan again.</p>
                                            </div>
                                            <button 
                                                onClick={() => { setSearchTerm(''); setFilterLevel('all'); }}
                                                className="text-xs font-black text-accent uppercase tracking-[0.3em] hover:text-white transition-all underline underline-offset-8"
                                            >
                                                Reset Telemetry
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* TACTICAL TELEMETRY SIDEBAR */}
                            <div className="w-full lg:w-1/4 space-y-8">
                                <div className="p-10 rounded-[3rem] bg-[#020617] border border-white/5 relative overflow-hidden shadow-2xl">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
                                    
                                    <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[9px] font-black uppercase tracking-widest mb-8">
                                        <Activity size={12} className="animate-pulse" /> Live Telemetry
                                    </div>
                                    
                                    <div className="space-y-8">
                                        {[
                                            { label: 'Active Talent', value: categoryStats.activeSpecialists, icon: User },
                                            { label: 'Missions Closed', value: categoryStats.totalJobs, icon: Briefcase },
                                            { label: 'Execution Speed', value: categoryStats.avgCompletionTime, icon: Clock },
                                            { label: 'Resonance Acc', value: `${categoryStats.successRate}%`, icon: ShieldCheck },
                                        ].map((stat, i) => {
                                            const StatIcon = stat.icon;
                                            return (
                                                <div key={i} className="flex justify-between items-center group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 rounded-xl bg-white/5 text-text-tertiary group-hover:text-accent transition-colors"><StatIcon size={14} /></div>
                                                        <span className="text-xs font-bold text-text-secondary">{stat.label}</span>
                                                    </div>
                                                    <span className="text-sm font-black text-white tabular-nums">{stat.value}</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-10 pt-10 border-t border-white/5">
                                        <div className="p-5 rounded-3xl bg-accent-subtle/50 border border-accent/20 backdrop-blur-3xl">
                                            <div className="text-[10px] font-black text-accent-light uppercase tracking-widest leading-relaxed">
                                                Mission execution certainty anchored on Polygon PoS. No extractive friction in this vertical.
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SIDEBAR CTA */}
                                <motion.div 
                                    whileHover={{ scale: 1.02 }}
                                    className="p-10 rounded-[3rem] bg-gradient-to-br from-accent to-secondary text-black relative overflow-hidden group shadow-2xl shadow-accent/20"
                                >
                                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
                                    <Sparkles size={40} className="mb-6 group-hover:rotate-12 transition-transform" />
                                    <h4 className="text-3xl font-black leading-none uppercase tracking-tighter mb-4">Elite <br />Registration</h4>
                                    <p className="text-sm font-medium opacity-80 mb-10 leading-relaxed">Monetize your sovereign intelligence with zero protocol extraction.</p>
                                    <button 
                                        onClick={onRegister}
                                        className="w-full py-5 rounded-2xl bg-black text-white text-xs font-black uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all"
                                    >
                                        Register Node
                                    </button>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SpecialistMarketplace;
