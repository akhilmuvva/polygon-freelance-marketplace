import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, Shield, Brain, Rocket, Trophy, Target, 
    Search, Filter, ChevronRight, User, ArrowLeft,
    CheckCircle2, DollarSign, Clock, MessageSquare, 
    LayoutGrid, List, Sparkles, Cpu, Code2, Palette,
    Gamepad2, ShieldCheck, Coins, Landmark, Microscope,
    Layers, Briefcase, Activity, Hexagon, Globe, Box,
    Terminal, Command, Star
} from 'lucide-react';
import SubgraphService from '../services/SubgraphService';
import { formatEther } from 'viem';
import './SpecialistMarketplace.css';

/**
 * Specialist Marketplace — Zenith Sovereign Edition
 * High-fidelity sovereign talent nexus for PolyLance.
 */
const SpecialistMarketplace = ({ onRegister }) => {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [specialists, setSpecialists] = useState([]);
    const [categoryStats, setCategoryStats] = useState({});
    const [filterLevel, setFilterLevel] = useState('all');
    const [sortBy, setSortBy] = useState('rating');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);

    const categories = [
        {
            id: 0,
            name: 'Smart Contract Developer',
            icon: Code2,
            description: 'Engineering immutable logic in Solidity, Rust, and Move for robust protocols.',
            avgRate: 150,
            demand: 95,
            color: '#8b5cf6', // Zenith Violet
            status: 'Trending'
        },
        {
            id: 1,
            name: 'ZK Proof Engineer',
            icon: ShieldCheck,
            description: 'Privacy-preserving architecture and zero-knowledge circuit implementation.',
            avgRate: 200,
            demand: 98,
            color: '#c4b5fd', // Accent Bright
            status: 'Elite'
        },
        {
            id: 2,
            name: 'DeFi Analyst',
            icon: Landmark,
            description: 'Liquidity optimization, yield strategy, and protocol risk modeling.',
            avgRate: 120,
            demand: 85,
            color: '#d946ef' // Secondary Fuchsia
        },
        {
            id: 3,
            name: 'Protocol Auditor',
            icon: Shield,
            description: 'In-depth security analysis and vulnerability assessment for mainnet readiness.',
            avgRate: 180,
            demand: 92,
            color: '#ef4444',
            status: 'Critical'
        },
        {
            id: 4,
            name: 'Tokenomics Designer',
            icon: Coins,
            description: 'Designing sustainable economic flywheels and incentive structures.',
            avgRate: 140,
            demand: 78,
            color: '#a78bfa'
        },
        {
            id: 5,
            name: 'MEV Researcher',
            icon: Microscope,
            description: 'Maximizing protocol efficiency through arbitrage and front-running protection.',
            avgRate: 190,
            demand: 88,
            color: '#6366f1'
        },
        {
            id: 6,
            name: 'NFT/Creative Director',
            icon: Palette,
            description: 'Digital identity systems and high-fidelity generative art protocols.',
            avgRate: 100,
            demand: 75,
            color: '#ec4899'
        },
        {
            id: 7,
            name: 'DAO Architect',
            icon: Layers,
            description: 'Governance framework design and decentralization roadmap execution.',
            avgRate: 160,
            demand: 82,
            color: '#0ea5e9'
        }
    ];

    const proficiencyLevels = [
        { id: 0, name: 'Core', icon: Rocket, color: '#10b981' },
        { id: 1, name: 'Senior', icon: Target, color: '#3b82f6' },
        { id: 2, name: 'Principal', icon: Trophy, color: '#8b5cf6' },
        { id: 3, name: 'Elite', icon: Sparkles, color: '#f59e0b' },
        { id: 4, name: 'Sovereign', icon: Brain, color: '#ef4444' }
    ];

    useEffect(() => {
        setIsLoaded(true);
        if (selectedCategory !== null) {
            fetchSpecialists();
            fetchCategoryStats();
        }
    }, [selectedCategory]);

    const fetchSpecialists = async () => {
        try {
            const leaders = await SubgraphService.getLeaderboard();
            const realSpecialists = leaders.map(l => {
                const earned = parseFloat(formatEther(BigInt(l.totalEarned || '0')));
                const completed = Number(l.jobsCompleted || 0);
                
                return {
                    address: l.id,
                    name: l.name || `AGENT-${l.id.slice(2, 6)}`.toUpperCase(),
                    proficiency: Math.min(Math.floor((Number(l.reputationScore) || 0) / 200), 4),
                    verifiedProjects: completed,
                    totalEarnings: earned,
                    averageRating: Number(l.rating || 5) * 20, 
                    hourlyRate: earned > 0 && completed > 0 
                        ? Math.max(50, Math.min(250, Math.round(earned / completed / 10) * 10)) 
                        : 120, 
                    avatar: '⚡',
                    specialties: ['Solidity', 'Protocol Architecture', 'ZK'],
                    endorsements: Math.floor((Number(l.reputationScore) || 0) / 5),
                    aiResonance: 85 + Math.floor(Math.random() * 15),
                    isAIMatch: Math.random() > 0.8
                };
            });
            setSpecialists(realSpecialists);
        } catch (err) {
            console.error('[MARKETPLACE] Nexus connection failed:', err);
        }
    };

    const fetchCategoryStats = async () => {
        try {
            const stats = await SubgraphService.getEcosystemStats();
            setCategoryStats({
                activeSpecialists: stats?.activeUsers?.length || 0,
                totalJobs: Number(stats?.totalJobs || 0),
                totalVolume: parseFloat(formatEther(BigInt(stats?.totalVolume || '0'))),
                avgCompletionTime: '36h',
                successRate: 99.8
            });
        } catch (err) {
            console.error('[MARKETPLACE] Stats telemetry failed:', err);
        }
    };

    const handleHireSpecialist = (specialist) => {
        const detail = { 
            freelancer: specialist.address,
            title: `Strategic Engagement: ${categories[selectedCategory]?.name || 'Mission'}`,
            amount: specialist.hourlyRate.toString()
        };
        window.dispatchEvent(new CustomEvent('NAV_TO_CREATE', { detail }));
    };

    const filteredAndSortedSpecialists = useMemo(() => {
        return specialists
            .filter(s => {
                const matchesLevel = filterLevel === 'all' || s.proficiency === parseInt(filterLevel);
                const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                     s.address.toLowerCase().includes(searchTerm.toLowerCase());
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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
        }
    };

    return (
        <motion.div 
            className="specialist-marketplace"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <div className="bg-pattern-grid" />
            <div className="ambient-glow" style={{ top: '0%', left: '0%', opacity: 0.05 }} />
            <div className="ambient-glow" style={{ bottom: '10%', right: '5%', background: '#d946ef', opacity: 0.03 }} />

            <AnimatePresence mode="wait">
                {selectedCategory === null ? (
                    <motion.div 
                        key="nexus-home"
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={containerVariants}
                        className="space-y-24"
                    >
                        {/* ZENITH HERO SECTION */}
                        <motion.section variants={itemVariants} className="marketplace-hero">
                            <div className="bg-pattern-grid" />
                            
                            <div className="hero-content">
                                <div className="space-y-10 max-w-5xl">
                                    <div className="system-tag">
                                        <Globe size={14} className="animate-spin-slow" /> Sovereign Talent Nexus Online
                                    </div>
                                    
                                    <h1 className="hero-title">
                                        Elite <br />
                                        <span className="accent-text">Specialists</span>
                                    </h1>
                                    
                                    <p className="hero-subtitle">
                                        Direct protocol access to the world's highest-gravity Web3 intelligence. Execute missions with zero intermediary friction, anchored on Polygon.
                                    </p>
                                </div>

                                <div className="hero-stats">
                                    <div className="hero-stat-card">
                                        <div className="stat-label">Active Nodes</div>
                                        <div className="stat-value">24.8K</div>
                                    </div>
                                    <div className="hero-stat-card">
                                        <div className="stat-label">Trust Score</div>
                                        <div className="stat-value" style={{ color: '#8b5cf6' }}>9.98</div>
                                    </div>
                                </div>
                            </div>
                        </motion.section>

                        {/* BENTO CATEGORY GRID */}
                        <div className="category-bento-grid">
                            {categories.map((cat, idx) => (
                                <motion.div
                                    key={cat.id}
                                    variants={itemVariants}
                                    whileHover={{ y: -8, scale: 1.02 }}
                                    className="category-card group"
                                    onClick={() => setSelectedCategory(cat.id)}
                                >
                                    <div className="category-glow" style={{ background: `radial-gradient(circle at 50% 0%, ${cat.color}30 0%, transparent 70%)` }} />
                                    
                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="icon-wrap" style={{ borderColor: `${cat.color}20` }}>
                                            <cat.icon size={24} style={{ color: cat.color }} />
                                        </div>
                                        
                                        <div className="mt-8 flex-1">
                                            <h3 className="category-name">
                                                {cat.name.split(' ').map((word, i) => (
                                                    <span key={i} className={i === 0 ? "block" : "text-white/40 group-hover:text-white/80 transition-colors block text-lg font-medium"}>
                                                        {word}
                                                    </span>
                                                ))}
                                            </h3>
                                            <p className="category-desc">
                                                {cat.description}
                                            </p>
                                        </div>

                                        <div className="category-footer">
                                            <div className="rate-tag">
                                                From ${cat.avgRate}/hr
                                            </div>
                                            <ChevronRight size={18} className="text-white/20 group-hover:text-white group-hover:translate-x-2 transition-all" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* REGISTRATION CTA CARD */}
                            <motion.div 
                                variants={itemVariants}
                                whileHover={{ y: -8, scale: 1.02 }}
                                className="category-card cta-card"
                            >
                                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(139,92,246,0.2),rgba(217,70,239,0.2))]" />
                                <div className="relative z-10 flex flex-col items-center text-center justify-center h-full space-y-8">
                                    <div className="cta-icon">
                                        <Sparkles size={32} className="text-white animate-pulse" />
                                    </div>
                                    <h4 className="cta-title">
                                        Join the <br /><span style={{ color: '#8b5cf6' }}>Nexus</span>
                                    </h4>
                                    <button 
                                        onClick={onRegister}
                                        className="btn-zenith"
                                    >
                                        Register Alias
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="specialist-dossiers"
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={containerVariants}
                        className="space-y-16"
                    >
                        <motion.button 
                            variants={itemVariants}
                            className="back-btn group"
                            onClick={() => setSelectedCategory(null)}
                        >
                            <ArrowLeft size={18} />
                            <span>Nexus Core</span>
                        </motion.button>

                        <div className="dossier-layout">
                            <div className="dossier-main">
                                {/* SEARCH & FILTER PANEL */}
                                <motion.div variants={itemVariants} className="filter-panel">
                                    <div className="search-wrap">
                                        <Search size={18} className="search-icon" />
                                        <input 
                                            type="text"
                                            placeholder="SCAN NEURAL SIGNATURES..."
                                            className="zenith-input"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="filter-group">
                                        <div className="filter-item">
                                            <Filter size={14} className="text-accent" />
                                            <select 
                                                className="zenith-select"
                                                value={filterLevel}
                                                onChange={(e) => setFilterLevel(e.target.value)}
                                            >
                                                <option value="all">All Tiers</option>
                                                {proficiencyLevels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                            </select>
                                        </div>
                                        
                                        <div className="filter-divider" />
                                        
                                        <div className="filter-item">
                                            <select 
                                                className="zenith-select accent-select"
                                                value={sortBy}
                                                onChange={(e) => setSortBy(e.target.value)}
                                            >
                                                <option value="rating">Gravity</option>
                                                <option value="projects">History</option>
                                                <option value="earnings">Yield</option>
                                                <option value="rate">Efficiency</option>
                                            </select>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* SPECIALIST LIST */}
                                <div className="specialist-list">
                                    {filteredAndSortedSpecialists.length > 0 ? filteredAndSortedSpecialists.map((specialist, idx) => (
                                        <motion.div 
                                            key={specialist.address} 
                                            variants={itemVariants}
                                            className="specialist-dossier group"
                                        >
                                            <div className="scan-line" />
                                            
                                            <div className="dossier-info">
                                                <div className="avatar-section">
                                                    <div className="dossier-avatar">
                                                        {specialist.avatar}
                                                    </div>
                                                    <div className="rank-icon" style={{ background: proficiencyLevels[specialist.proficiency].color }}>
                                                        {React.createElement(proficiencyLevels[specialist.proficiency].icon, { size: 14, color: '#fff' })}
                                                    </div>
                                                </div>
                                                
                                                <div className="text-section">
                                                    <div className="name-wrap">
                                                        <h3 className="specialist-name">{specialist.name}</h3>
                                                        <div className="rank-tag">
                                                            {proficiencyLevels[specialist.proficiency].name} Rank
                                                        </div>
                                                        {specialist.isAIMatch && (
                                                            <div className="match-tag">
                                                                Zenith Match
                                                            </div>
                                                        )}
                                                    </div>
                                                    <code className="address-tag">
                                                        {specialist.address}
                                                    </code>
                                                    <div className="skills-row">
                                                        {specialist.specialties.map(s => (
                                                            <span key={s} className="skill-tag">
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="dossier-actions">
                                                <div className="rate-section">
                                                    <div className="stat-label">Rate / Resonance</div>
                                                    <div className="rate-value">${specialist.hourlyRate}<span>/hr</span></div>
                                                    <div className="resonance-value">{specialist.aiResonance}% Resonance</div>
                                                </div>
                                                <button 
                                                    onClick={() => handleHireSpecialist(specialist)}
                                                    className="btn-engage"
                                                >
                                                    Engage
                                                </button>
                                            </div>
                                        </motion.div>
                                    )) : (
                                        <motion.div variants={itemVariants} className="empty-state">
                                            <div className="empty-icon">
                                                <Search size={48} />
                                            </div>
                                            <div className="space-y-4">
                                                <h4 className="empty-title">Nexus Silent</h4>
                                                <p className="empty-desc">No signatures matching your criteria detected in the global mesh.</p>
                                                <button 
                                                    onClick={() => { setSearchTerm(''); setFilterLevel('all'); }}
                                                    className="reset-btn"
                                                >
                                                    Reset Scan
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {/* SIDEBAR TELEMETRY */}
                            <div className="dossier-sidebar">
                                <motion.div variants={itemVariants} className="telemetry-card">
                                    <div className="bg-pattern-grid" />
                                    <div className="telemetry-header">
                                        <Activity size={16} className="animate-pulse" /> Telemetry
                                    </div>
                                    
                                    <div className="telemetry-stats">
                                        {[
                                            { label: 'Network Load', value: 'Low', color: '#10b981' },
                                            { label: 'Talent Density', value: categoryStats.activeSpecialists, color: '#fff' },
                                            { label: 'Volume Flow', value: `${categoryStats.totalVolume?.toFixed(1)}M`, color: '#fff' },
                                            { label: 'Avg Latency', value: '36.4ms', color: '#8b5cf6' }
                                        ].map((stat, i) => (
                                            <div key={i} className="telemetry-row">
                                                <span className="row-label">{stat.label}</span>
                                                <span className="row-value" style={{ color: stat.color }}>{stat.value}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="telemetry-footer">
                                        Sovereign intelligence execution confirmed on Polygon.
                                    </div>
                                </motion.div>

                                <motion.div 
                                    variants={itemVariants}
                                    whileHover={{ y: -5 }}
                                    className="scale-card"
                                >
                                    <Box size={32} className="text-black" />
                                    <h4 className="scale-title">Scale <br />Impact</h4>
                                    <p className="scale-desc">Global distribution of your elite intelligence.</p>
                                    <button 
                                        onClick={onRegister}
                                        className="btn-deploy"
                                    >
                                        Deploy Node
                                    </button>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default SpecialistMarketplace;
