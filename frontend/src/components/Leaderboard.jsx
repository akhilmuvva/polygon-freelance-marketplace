import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SubgraphService from '../services/SubgraphService';
import { 
    Trophy, Medal, Award, ExternalLink, User, Star, 
    TrendingUp, Loader2, Globe, Zap, ArrowUpRight,
    Fingerprint, Activity, Layers
} from 'lucide-react';
import { formatEther } from 'viem';
import './Leaderboard.css';

const Leaderboard = () => {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaders = async () => {
            setLoading(true);
            try {
                const data = await SubgraphService.getLeaderboard();
                setLeaders(data || []);
            } catch (err) {
                console.error('[Leaderboard] Subgraph query failed:', err);
                setLeaders([]);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaders();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0, 
            transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } 
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <Loader2 className="w-12 h-12 text-[#8b5cf6] animate-spin" />
            <p className="text-zinc-500 font-mono text-sm tracking-widest uppercase">Calculating Network Gravity...</p>
        </div>
    );

    const topThree = leaders.slice(0, 3);
    const rest = leaders.slice(3);

    return (
        <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="gravity-rank-container space-y-16"
        >
            {/* Header: Global Gravity Rank */}
            <motion.header variants={itemVariants} className="text-center space-y-4">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <Globe size={18} className="text-[#8b5cf6]" />
                    <span className="text-[10px] font-bold tracking-[0.3em] text-zinc-500 uppercase">Global Reputation Mesh</span>
                </div>
                <h1 className="text-6xl md:text-7xl font-bold tracking-tighter text-white">
                    Global <span className="text-gradient">Gravity Rank</span>
                </h1>
                <p className="text-zinc-400 font-medium text-lg max-w-2xl mx-auto">
                    The highest concentration of trust in the sovereign freelance protocol. 
                    Real-time ranking of top contributors synchronized by Zenith mesh.
                </p>
            </motion.header>

            {/* Podium Section */}
            <div className="podium-container">
                {/* Rank 2 */}
                {topThree[1] && (
                    <motion.div variants={itemVariants} className="podium-card rank-2 mt-12">
                        <div className="rank-badge"><Medal size={24} /></div>
                        <div className="leader-avatar-wrapper">
                            <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${topThree[1].address}`} alt="" className="w-full h-full rounded-xl object-cover" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">{topThree[1].name || 'Sovereign_Node'}</h3>
                        <p className="text-xs font-mono text-zinc-500 mb-6">{topThree[1].address.slice(0, 6)}...{topThree[1].address.slice(-4)}</p>
                        
                        <div className="flex flex-col items-center gap-1">
                            <div className="text-2xl font-bold text-zinc-300">{topThree[1].reputationScore}</div>
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Gravity Units</span>
                        </div>
                    </motion.div>
                )}

                {/* Rank 1 */}
                {topThree[0] && (
                    <motion.div variants={itemVariants} className="podium-card rank-1 podium-rank-1">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#8b5cf6]/20 blur-[60px] pointer-events-none" />
                        <div className="rank-badge"><Trophy size={28} /></div>
                        <div className="leader-avatar-wrapper">
                            <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${topThree[0].address}`} alt="" className="w-full h-full rounded-xl object-cover" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-1">{topThree[0].name || 'Origin_Creator'}</h3>
                        <p className="text-xs font-mono text-[#8b5cf6] mb-6">{topThree[0].address.slice(0, 6)}...{topThree[0].address.slice(-4)}</p>
                        
                        <div className="flex flex-col items-center gap-1">
                            <div className="text-4xl font-bold text-white">{topThree[0].reputationScore}</div>
                            <span className="text-[10px] font-bold text-[#8b5cf6] uppercase tracking-widest">Gravity Equilibrium</span>
                        </div>
                    </motion.div>
                )}

                {/* Rank 3 */}
                {topThree[2] && (
                    <motion.div variants={itemVariants} className="podium-card rank-3 mt-16">
                        <div className="rank-badge"><Award size={24} /></div>
                        <div className="leader-avatar-wrapper">
                            <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${topThree[2].address}`} alt="" className="w-full h-full rounded-xl object-cover" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">{topThree[2].name || 'High_Contributor'}</h3>
                        <p className="text-xs font-mono text-zinc-500 mb-6">{topThree[2].address.slice(0, 6)}...{topThree[2].address.slice(-4)}</p>
                        
                        <div className="flex flex-col items-center gap-1">
                            <div className="text-2xl font-bold text-zinc-400">{topThree[2].reputationScore}</div>
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Gravity Score</span>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* List Section */}
            <div className="space-y-6">
                <motion.div variants={itemVariants} className="flex justify-between items-end px-6">
                    <h2 className="text-2xl font-bold text-white">Full Mesh Analytics</h2>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">{leaders.length} NODES IDENTIFIED</span>
                </motion.div>

                <div className="leaderboard-list">
                    {rest.length > 0 ? (
                        rest.map((leader, idx) => (
                            <motion.div 
                                key={leader.address} 
                                variants={itemVariants}
                                className="leader-row-item group"
                            >
                                <div className="leader-rank-small">#{idx + 4}</div>
                                
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 p-0.5 group-hover:border-[#8b5cf6]/50 transition-colors">
                                        <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${leader.address}`} alt="" className="w-full h-full rounded-[10px] object-cover" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-white group-hover:text-[#8b5cf6] transition-colors">{leader.name || 'Anonymous_Node'}</span>
                                        <span className="text-[10px] font-mono text-zinc-600">{leader.address.slice(0, 8)}...{leader.address.slice(-6)}</span>
                                    </div>
                                </div>

                                <div className="expertise-col flex flex-wrap gap-2">
                                    {leader.skills?.split(',').slice(0, 2).map((s, i) => (
                                        <span key={i} className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#8b5cf6]/5 text-[#8b5cf6] border border-[#8b5cf6]/10 uppercase">
                                            {s.trim()}
                                        </span>
                                    )) || <span className="text-[9px] text-zinc-600 uppercase">Generalist</span>}
                                </div>

                                <div className="rating-col flex items-center gap-2">
                                    <Star size={12} className="text-[#8b5cf6] fill-[#8b5cf6]" />
                                    <span className="text-sm font-bold text-white">{(leader.avgRating || 0).toFixed(1)}</span>
                                </div>

                                <div className="volume-col text-right pr-4">
                                    <div className="text-sm font-bold text-white">
                                        {parseFloat(formatEther(BigInt(leader.totalEarned || '0'))).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                        <span className="text-[10px] text-zinc-500 ml-1">POL</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">Total Throughput</span>
                                </div>

                                <div className="flex justify-end">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-500 group-hover:text-white group-hover:bg-[#8b5cf6]/20 transition-all">
                                        <ArrowUpRight size={16} />
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <motion.div variants={itemVariants} className="p-12 text-center text-zinc-600 border border-white/5 rounded-2xl bg-white/[0.01] italic">
                            No additional nodes synchronized.
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default Leaderboard;
