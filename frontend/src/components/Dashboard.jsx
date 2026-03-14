import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useWalletClient } from 'wagmi';
import { formatEther } from 'viem';
import { 
    Shield, Award, Zap, Brain, Rocket, Clock, Database, 
    Terminal, Layers, TrendingUp, Cpu, Flame, CheckCircle2,
    ArrowRight, MessageSquare, ChevronRight, Gavel, Sparkles,
    Activity, Globe, Lock, Diamond, User, Wallet
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import SubgraphService from '../services/SubgraphService';
import ProfileService from '../services/ProfileService';
import { useSovereignLogic } from '../hooks/useSovereignLogic';
import ReasoningProofModal from './ReasoningProofModal';
import DemoProtocol from '../services/DemoProtocol';
import { TreasuryButlerService } from '../services/TreasuryButlerService';
import { GravityScoreService } from '../services/GravityScoreService';
import { useAnimeAnimations } from '../hooks/useAnimeAnimations';
import hotToast from 'react-hot-toast';

const Dashboard = ({ address: propAddress }) => {
    const { address: wagmiAddress } = useAccount();
    const address = propAddress || wagmiAddress;
    const isConnected = !!address;
    const { data: walletClient } = useWalletClient();
    const { calculateGravity } = useSovereignLogic();
    const { staggerFadeIn, countUp } = useAnimeAnimations();
    
    // Directive: Hydration Orbit Stabilization
    const [isHydrated, setIsHydrated] = useState(false);
    
    // State
    const [selectedProof, setSelectedProof] = useState(null);
    const [isProofModalOpen, setIsProofModalOpen] = useState(false);
    const [surplus, setSurplus] = useState(0);
    const [tbaInfo, setTbaInfo] = useState(null);
    const [activeEscrows, setActiveEscrows] = useState([]);
    const [gravityStats, setGravityStats] = useState({
        frictionLevel: 50,
        orbitCategory: 'Resolving Resonance...',
        equilibriumAdjustment: '0%'
    });

    useEffect(() => {
        setIsHydrated(true);
    }, []);
    
    // Queries
    const { data: pData } = useQuery({
        queryKey: ['profile', address],
        queryFn: () => ProfileService.getProfile(address),
        enabled: isHydrated && !!address
    });

    const { data: aData } = useQuery({
        queryKey: ['ecosystem-stats'],
        queryFn: () => SubgraphService.getEcosystemStats(),
        enabled: isHydrated
    });

    // Real-time Surplus Simulator
    // Surplus dynamic logic disabled per liquidity reset directive
    useEffect(() => {
        // setSurplus(prev => prev + (Math.random() * 0.00001));
    }, []);

    // TBA and Active Escrow Logic
    useEffect(() => {
        if (isHydrated && address) {
            DemoProtocol.getTBAVisualProof(address).then(setTbaInfo);
            
            // Subgraph integration: Fetch real jobs for the connected address
            SubgraphService.getUserPortfolio(address).then(p => {
                if (p) {
                    const freelancerJobs = p.freelancer?.jobs || [];
                    const clientJobs = p.client?.jobs || []; // Note: Schema might need adjustment if client.jobs is not available direct
                    
                    // Filter for active status (0-4)
                    const active = freelancerJobs.filter(j => Number(j.status) < 5);
                    setActiveEscrows(active.map(j => ({
                        id: j.jobId,
                        title: `Contract #${j.jobId}`,
                        status: ['Created', 'Accepted', 'Ongoing', 'Disputed', 'Arbitration', 'Completed', 'Cancelled'][Number(j.status)] || 'Active',
                        progress: Number(j.status) === 0 ? 0 : Number(j.status) === 1 ? 25 : 50,
                        budget: formatEther(BigInt(j.amount || 0))
                    })));
                } else {
                    setActiveEscrows([]);
                }
            }).catch(() => setActiveEscrows([]));
        }
    }, [isHydrated, address]);

    // Derived Stats (Moved to useEffect to authorize Hydrate orbit completion)
    useEffect(() => {
        if (isHydrated) {
            const stats = calculateGravity({
                averageRating: pData?.averageRating || 0,
                totalJobs: aData?.totalJobs || 0,
                karmaBalance: pData?.reputationScore || 0
            });
            setGravityStats(stats);
        }
    }, [isHydrated, pData, aData, calculateGravity]);

    useEffect(() => {
        if (isHydrated) {
            staggerFadeIn('.bento-tile', 60);
        }
    }, [isHydrated, staggerFadeIn]);

    const handleViewProof = (escrow) => {
        setSelectedProof({
            agent: 'LogicStabilizer-Agent',
            timestamp: Date.now(),
            cid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3v6v3y34y3y34y',
            decision: {
                rationale: `Actuating ${escrow.title} milestone release logic via yield-sharing offset. Protocol confirms 0% extractive friction detected.`
            },
            sensoryInputs: {
                milestone_status: 'VERIFIED',
                yield_buffer: '1.42%',
                gravity_index: 'S-ELITE'
            }
        });
        setIsProofModalOpen(true);
    };

    if (!isHydrated || !isConnected) return null; // Shell handles non-connection state

    return (
        <div className="space-y-6 pt-4 pb-12">
            {/* Header Identity Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-subtle border border-accent-border text-accent-light text-[10px] font-black uppercase tracking-widest mb-4">
                        <Activity size={12} className="text-accent" /> Control Center // node_active
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight leading-none mb-2">
                        Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary">{pData?.name || address.slice(0, 6)}</span>
                    </h1>
                    <p className="text-text-secondary text-sm font-medium">Sovereign Node #892-Z is currently operating at <span className="text-success">{gravityStats.orbitCategory}</span> efficiency.</p>
                </div>
                
                <div className="flex gap-4">
                    <div className="p-4 rounded-2xl bg-bg-surface border border-border flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500">
                            <Flame size={20} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Surplus Ledger</div>
                            <div className="text-xl font-black text-white">{surplus.toFixed(6)} <span className="text-xs text-text-tertiary">USDC</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Identity Node: TBA Status & Karma Resonance */}
                <motion.div 
                    className="bento-tile md:col-span-8 p-8 rounded-[2rem] bg-bg-card border border-border relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-colors" />
                    
                    <div className="flex flex-col h-full">
                        <div className="flex justify-between items-start mb-12">
                            <div className="space-y-1">
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Identity Resonance</h3>
                                <p className="text-xs text-text-secondary font-bold uppercase tracking-widest">SBT Portfolio & TBA Registry</p>
                            </div>
                            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-accent-light tracking-widest">
                                ERC-6551_ACTIVE
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-auto">
                            <div className="space-y-3">
                                <div className="text-[10px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2">
                                    <Layers size={12} /> TBA Address
                                </div>
                                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 font-mono text-[10px] text-accent truncate">
                                    {tbaInfo?.tbaAddress || 'Resolving...'}
                                </div>
                            </div>
                            <div className="space-y-3 text-center">
                                <div className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Karma Resonance</div>
                                <div className="text-3xl font-black text-white">{pData?.reputationScore || '0'}<span className="text-xs text-accent"> / 1000</span></div>
                                <div className="flex justify-center gap-1">
                                    {[1, 2, 3, 4, 5].map(i => <div key={i} className={`w-1 h-1 rounded-full ${i <= 4 ? 'bg-accent' : 'bg-white/10'}`} />)}
                                </div>
                            </div>
                            <div className="space-y-3 text-right">
                                <div className="text-[10px] font-black text-text-tertiary uppercase tracking-widest font-bold">Resonance Tier</div>
                                <div className="text-lg font-black text-white italic">S-TIER ELITE</div>
                                <div className="text-[10px] text-success font-bold">+12% Yield Override</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Gravity Meter */}
                <motion.div className="bento-tile md:col-span-4 p-8 rounded-[2rem] bg-bg-surface border border-accent-border relative overflow-hidden group">
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                        <div className="relative">
                           <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full" />
                           <div className="relative w-32 h-32 rounded-full border-4 border-accent-border border-t-accent animate-spin-slow flex items-center justify-center">
                             <div className="text-3xl font-black text-white">{gravityStats.frictionLevel}</div>
                           </div>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-lg font-black text-white uppercase">{gravityStats.orbitCategory}</h4>
                            <p className="text-xs text-text-secondary">Gravity friction suppressed by SBT reputation resonance.</p>
                        </div>
                        <button className="w-full py-3 rounded-xl bg-accent-subtle border border-accent-border text-accent text-xs font-black uppercase tracking-widest hover:bg-accent hover:text-bg-base transition-all">
                            CALIBRATE FRICTION
                        </button>
                    </div>
                </motion.div>

                {/* Milestone Actuator */}
                <motion.div className="bento-tile md:col-span-8 p-8 rounded-[2rem] bg-bg-surface border border-border">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-success-subtle text-success">
                                <Zap size={18} />
                            </div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">Milestone Actuator</h3>
                        </div>
                        <div className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">
                            2 Active Escrows
                        </div>
                    </div>

                    <div className="space-y-4">
                        {activeEscrows.map((escrow, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex flex-col sm:flex-row justify-between gap-6">
                                <div className="space-y-4 flex-1">
                                    <div className="flex items-center gap-3">
                                        <div className="px-2 py-0.5 rounded bg-accent-subtle border border-accent-border text-[10px] font-black text-accent">{escrow.status}</div>
                                        <h4 className="font-bold text-white">{escrow.title}</h4>
                                    </div>
                                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${escrow.progress}%` }}
                                            className="h-full bg-gradient-to-r from-accent to-secondary" 
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-text-tertiary">
                                        <span>Progress: {escrow.progress}%</span>
                                        <span>Budget: {escrow.budget} USDC</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => handleViewProof(escrow)}
                                        className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all flex items-center gap-2 text-xs font-bold"
                                    >
                                        <Brain size={14} className="text-secondary" /> AGA PROOF
                                    </button>
                                    <button className="p-3 rounded-xl bg-accent text-bg-base hover:scale-105 transition-all">
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* System Telemetry */}
                <motion.div className="bento-tile md:col-span-4 p-8 rounded-[2rem] bg-bg-raised border border-border">
                    <h3 className="text-xs font-black text-text-tertiary uppercase tracking-[0.2em] mb-8">System Telemetry</h3>
                    <div className="space-y-6">
                        <div className="flex justify-between items-center group cursor-help">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><Globe size={14} /></div>
                                <span className="text-sm font-bold text-text-secondary">Network Status</span>
                            </div>
                            <span className="text-xs font-black text-success">STABLE</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400"><Database size={14} /></div>
                                <span className="text-sm font-bold text-text-secondary">Zenith Indexer</span>
                            </div>
                            <span className="text-xs font-black text-accent">SYNCING</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-500/10 text-green-400"><Shield size={14} /></div>
                                <span className="text-sm font-bold text-text-secondary">Zero-Knowledge Proofs</span>
                            </div>
                            <span className="text-xs font-black text-success">READY</span>
                        </div>
                        
                        <div className="pt-8 border-t border-white/5">
                            <div className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-4">AGA Cognitive Load</div>
                            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                <div className="h-full bg-accent w-[0%]" />
                            </div>
                            <div className="flex justify-between mt-2 text-[10px] font-bold text-text-tertiary tracking-tighter">
                                <span>Latency: 0ms</span>
                                <span>Uptime: 0.00%</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

            </div>

            {/* Modal */}
            <ReasoningProofModal 
                isOpen={isProofModalOpen} 
                onClose={() => setIsProofModalOpen(false)} 
                proof={selectedProof} 
            />
        </div>
    );
};

export default Dashboard;
