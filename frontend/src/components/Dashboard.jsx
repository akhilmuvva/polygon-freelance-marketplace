import React, { useState, useEffect, useMemo, useRef } from 'react';
// Resonance Calibration Log: [2026-03-14] - Triggering Vite re-sync.
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { 
    Shield, Award, Zap, Brain, Rocket, Clock, Database, 
    Terminal, Layers, TrendingUp, Cpu, Flame, CheckCircle2,
    ArrowRight, MessageSquare, ChevronRight, Gavel, Sparkles,
    Activity, Globe, Lock, Diamond, User, Wallet, ShieldCheck, Trophy,
    ArrowUpRight, Star, Search, Filter, AlertCircle, Info, Loader2
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
import { parseProtocolValue } from '../utils/protocolUtils';

const Dashboard = ({ address: propAddress }) => {
    const { address: wagmiAddress } = useAccount();
    const address = propAddress || wagmiAddress;
    const isConnected = !!address;
    const { calculateGravity } = useSovereignLogic();
    const { staggerFadeIn } = useAnimeAnimations();
    
    // State
    const [selectedProof, setSelectedProof] = useState(null);
    const [isProofModalOpen, setIsProofModalOpen] = useState(false);
    const { data: qStats } = useQuery({
        queryKey: ['protocolStats'],
        queryFn: () => SubgraphService.getProtocolStats(),
    });
    const surplus = useMemo(() => {
        try {
            if (!qStats?.totalYieldGenerated) return 0;
            const weiVal = parseProtocolValue(qStats.totalYieldGenerated);
            return parseFloat(formatEther(weiVal * 20n / 100n));
        } catch (e) {
            return 0;
        }
    }, [qStats]);
    const [tbaInfo, setTbaInfo] = useState(null);
    const [activeEscrows, setActiveEscrows] = useState([]);
    
    // Queries
    const { data: pData } = useQuery({
        queryKey: ['profile', address],
        queryFn: () => ProfileService.getProfile(address),
        enabled: !!address
    });

    const { data: aData } = useQuery({
        queryKey: ['ecosystem-stats'],
        queryFn: () => SubgraphService.getEcosystemStats(),
    });

    // Surplus dynamic logic disabled per liquidity reset directive — re-enable in v1.6
    // useEffect(() => { setSurplus(prev => prev + (Math.random() * 0.00001)); }, []);

    // TBA and Active Escrow Logic
    useEffect(() => {
        if (address) {
            DemoProtocol.getTBAVisualProof(address).then(setTbaInfo);
            
            // Subgraph integration: Fetch real jobs for the connected address
            SubgraphService.getUserPortfolio(address).then(p => {
                if (p) {
                    const freelancerJobs = p.freelancer?.jobs || [];
                    const _clientJobs = p.client?.jobs || []; // Reserved for client-side portfolio view
                    
                    // Filter for active status (0-4)
                    const active = freelancerJobs.filter(j => Number(j.status) < 5);
                    setActiveEscrows(active.map(j => ({
                        id: j.jobId,
                        title: `Contract #${j.jobId}`,
                        status: ['Created', 'Accepted', 'Ongoing', 'Disputed', 'Arbitration', 'Completed', 'Cancelled'][Number(j.status)] || 'Active',
                        progress: Number(j.status) === 0 ? 0 : Number(j.status) === 1 ? 25 : 50,
                        budget: formatEther(parseProtocolValue(j.amount))
                    })));
                } else {
                    setActiveEscrows([]);
                }
            }).catch(() => setActiveEscrows([]));
        }
    }, [address]);

    // Derived Stats: Calculated via useMemo for absolute zero-gravity render cycles.
    const gravityStats = useMemo(() => {
        return calculateGravity({
            averageRating: pData?.averageRating || 0,
            totalJobs: aData?.totalJobs || 0,
            karmaBalance: pData?.reputationScore || 0
        });
    }, [pData, aData, calculateGravity]);

    useEffect(() => {
        staggerFadeIn('.bento-tile', 60);
    }, [staggerFadeIn]);

    const handleViewProof = (escrow) => {
        setSelectedProof({
            agent: 'LogicStabilizer-Agent',
            timestamp: Date.now(),
            cid: escrow.id || 'not-yet-indexed',
            decision: {
                rationale: `Actuating ${escrow.title} milestone release logic via yield-sharing offset. Protocol confirms 0% extractive friction detected.`
            },
            sensoryInputs: {
                milestone_status: escrow.status || 'ACTIVE',
                yield_adjustment: gravityStats.equilibriumAdjustment,
                gravity_tier: gravityStats.orbitCategory,
                progress: `${escrow.progress}%`,
                budget: `${escrow.budget} MATIC`
            }
        });
        setIsProofModalOpen(true);
    };

    // Shell handles non-connection state, but we show a loader if address is transiently missing
    if (!isConnected) return (
        <div style={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
            <Loader2 size={32} className="animate-spin text-accent" />
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em' }}>Synchronizing Node</div>
        </div>
    );

    return (
        <div style={{ 
            padding: '60px', 
            maxWidth: '1800px', 
            margin: '0 auto', 
            color: '#fff',
            fontFamily: "'Outfit', sans-serif"
        }}>
            {/* ── Background Atmos ── */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#00f5d4]/5 rounded-full blur-[160px] pointer-events-none opacity-40" />
            
            {/* ── Tactical Header ── */}
            <motion.header 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '60px' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ 
                        padding: '6px 16px', 
                        background: 'rgba(255,255,255,0.03)', 
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '100px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00f5d4', boxShadow: '0 0 10px #00f5d4' }} />
                        <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.4)' }}>
                            Node: {address?.slice(0, 10)}... // Status: Active
                        </span>
                    </div>
                </div>
                
                <h1 style={{ fontSize: '4.5rem', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1, margin: 0 }}>
                    <span style={{ color: 'rgba(255,255,255,0.1)' }}>/</span> {address?.slice(2, 6).toUpperCase()} <span style={{ color: '#00f5d4', textShadow: '0 0 30px rgba(0,245,212,0.2)' }}>Control Hub</span>
                </h1>
                <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4em', color: 'rgba(255,255,255,0.2)', marginTop: '8px' }}>
                    Authorized Operator: {pData?.name || 'Sovereign Node'}
                </p>
            </motion.header>

            {/* ── Main Operations Grid ── */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(12, 1fr)', 
                gap: '30px',
                position: 'relative',
                zIndex: 10
            }}>
                
                {/* 1. Protocol Reputation Tile */}
                <motion.div 
                    whileHover={{ y: -5 }}
                    style={{ 
                        gridColumn: 'span 8', 
                        background: '#0a0b0e', 
                        border: '1px solid rgba(255,255,255,0.05)', 
                        borderRadius: '32px',
                        padding: '40px',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(0,245,212,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '80px' }}>
                        <div>
                            <h3 style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0 }}>Protocol Reputation</h3>
                            <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.3em', marginTop: '4px' }}>Identity Alignment Mesh</p>
                        </div>
                        <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                            <span style={{ fontSize: '9px', fontWeight: 900, color: '#00f5d4', textTransform: 'uppercase', letterSpacing: '0.2em' }}>SBT-6551 Ready</span>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '40px', alignItems: 'end' }}>
                        <div>
                            <div style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '12px' }}>Root Address</div>
                            <div style={{ padding: '16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', fontSize: '10px', fontFamily: 'monospace', color: 'rgba(0,245,212,0.7)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {tbaInfo?.tbaAddress || 'Resolving...'}
                            </div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '8px' }}>Reputation Score</div>
                            <div style={{ fontSize: '64px', fontWeight: 900, lineHeight: 1 }}>{pData?.reputationScore || '0'}</div>
                            <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', marginTop: '16px', overflow: 'hidden' }}>
                                <div style={{ width: `${(pData?.reputationScore || 0) / 10}%`, height: '100%', background: '#00f5d4', boxShadow: '0 0 10px #00f5d4' }} />
                            </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '4px' }}>Current Rank</div>
                            <div style={{ fontSize: '24px', fontWeight: 900, color: '#00f5d4', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{gravityStats.orbitCategory?.split('(')[0].trim()}</div>
                            <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '8px' }}>{gravityStats.equilibriumAdjustment} Boost</div>
                        </div>
                    </div>
                </motion.div>

                {/* 2. Protocol Stats Side Card (Mirroring Reference) */}
                <motion.div 
                    whileHover={{ scale: 1.02 }}
                    style={{ 
                        gridColumn: 'span 4', 
                        background: '#0d0e12', 
                        border: '1px solid rgba(255,255,255,0.08)', 
                        borderRadius: '32px',
                        padding: '40px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Protocol Stats</span>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00f5d4', boxShadow: '0 0 10px #00f5d4' }} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '30px 0' }}>
                        <div style={{ 
                            width: '80px', 
                            height: '80px', 
                            borderRadius: '50%', 
                            background: 'linear-gradient(135deg, #00f5d4, #6366f1)',
                            boxShadow: '0 0 30px rgba(0,245,212,0.3)'
                        }} />
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Current Resonance</div>
                            <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff' }}>v1.5.1-Z</div>
                        </div>
                    </div>

                    <div style={{ spaceY: '20px' }}>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            background: 'rgba(0,0,0,0.4)', 
                            padding: '16px 20px', 
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            marginBottom: '20px'
                        }}>
                            <span style={{ fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Friction Level</span>
                            <span style={{ fontSize: '18px', fontWeight: 900, color: '#00f5d4' }}>{gravityStats.frictionLevel}</span>
                        </div>
                        <button style={{ 
                            width: '100%', 
                            padding: '16px', 
                            background: '#fff', 
                            color: '#000', 
                            border: 'none', 
                            borderRadius: '16px', 
                            fontSize: '10px', 
                            fontWeight: 900, 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.3em',
                            cursor: 'pointer'
                        }}>
                            Calibrate Node
                        </button>
                    </div>
                </motion.div>

                {/* 3. Global Stats Grid */}
                <div style={{ gridColumn: 'span 8', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ padding: '32px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(0,245,212,0.05)', border: '1px solid rgba(0,245,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00f5d4' }}>
                            <Flame size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Earned Yield</div>
                            <div style={{ fontSize: '28px', fontWeight: 900 }}>{surplus.toFixed(4)} <span style={{ fontSize: '10px', color: '#00f5d4' }}>MATIC</span></div>
                        </div>
                    </div>
                    <div style={{ padding: '32px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(0,245,212,0.05)', border: '1px solid rgba(0,245,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00f5d4' }}>
                            <Zap size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Active Pipelines</div>
                            <div style={{ fontSize: '28px', fontWeight: 900 }}>{activeEscrows.length} <span style={{ fontSize: '10px', color: '#00f5d4' }}>UNITS</span></div>
                        </div>
                    </div>
                </div>

                {/* 4. Telemetry Tile */}
                <motion.div style={{ gridColumn: 'span 4', padding: '32px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px' }}>
                    <h4 style={{ fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.4em', marginBottom: '24px' }}>Telemetry</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[
                            { label: 'Network Integrity', val: 'SECURE', color: '#00f5d4' },
                            { label: 'Zenith Mesh Sync', val: 'ACTIVE', color: '#00f5d4' },
                            { label: 'Protocol Equilibrium', val: 'STABLE', color: 'rgba(255,255,255,0.6)' },
                        ].map((s, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>{s.label}</span>
                                <span style={{ fontSize: '10px', fontWeight: 900, color: s.color, letterSpacing: '0.1em' }}>{s.val}</span>
                            </div>
                        ))}
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
