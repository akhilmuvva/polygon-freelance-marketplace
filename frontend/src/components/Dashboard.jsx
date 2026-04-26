import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { 
    Shield, Award, Zap, Rocket, Clock, TrendingUp, Cpu, Flame,
    CheckCircle2, ArrowUpRight, Trophy, Star, Activity, Globe,
    ChevronRight, Layout, PieChart, Wallet, Plus, ZapOff,
    Target, BarChart3, Fingerprint, Layers, ExternalLink,
    Lock, Unlock, Radio, Server
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import SubgraphService from '../services/SubgraphService';
import ProfileService from '../services/ProfileService';
import { useSovereignLogic } from '../hooks/useSovereignLogic';
import ReasoningProofModal from './ReasoningProofModal';
import DemoProtocol from '../services/DemoProtocol';
import { parseProtocolValue } from '../utils/protocolUtils';
import './Dashboard.css';

const Dashboard = ({ address: propAddress }) => {
    const { address: wagmiAddress } = useAccount();
    const address = propAddress || wagmiAddress;
    const isConnected = !!address;
    const { calculateGravity } = useSovereignLogic();
    
    const [selectedProof, setSelectedProof] = useState(null);
    const [isProofModalOpen, setIsProofModalOpen] = useState(false);
    const [tbaInfo, setTbaInfo] = useState(null);

    const { data: qStats } = useQuery({
        queryKey: ['protocolStats'],
        queryFn: () => SubgraphService.getProtocolStats(),
    });

    const { data: pData } = useQuery({
        queryKey: ['profile', address],
        queryFn: () => ProfileService.getProfile(address),
        enabled: !!address
    });

    const { data: aData } = useQuery({
        queryKey: ['ecosystem-stats'],
        queryFn: () => SubgraphService.getEcosystemStats(),
    });

    const { data: portfolioRaw } = useQuery({
        queryKey: ['portfolio', address],
        queryFn: () => SubgraphService.getUserPortfolio(address),
        enabled: !!address
    });

    const activeEscrows = useMemo(() => {
        if (!address || !portfolioRaw) return [];
        const clientJobs = portfolioRaw.client?.jobs || [];
        const freelancerJobs = portfolioRaw.freelancer?.jobs || [];
        const allJobsRaw = [...clientJobs, ...freelancerJobs];
        
        const STATUS_MAP = { 'Created': 0, 'Accepted': 1, 'Ongoing': 2, 'Disputed': 3, 'Arbitration': 4, 'Completed': 5, 'Cancelled': 6 };
        
        const jobIds = new Set();
        return allJobsRaw.filter(j => {
            if (jobIds.has(j.jobId)) return false;
            jobIds.add(j.jobId);
            return (STATUS_MAP[j.status] ?? 0) < 5;
        }).map(j => ({
            id: j.jobId,
            title: `Contract #${j.jobId}`,
            statusLabel: j.status || 'Active',
            amount: formatEther(parseProtocolValue(j.amount))
        }));
    }, [address, portfolioRaw]);

    useEffect(() => {
        if (address) {
            DemoProtocol.getTBAVisualProof(address).then(setTbaInfo);
        }
    }, [address]);

    const gravityStats = useMemo(() => {
        return calculateGravity({
            averageRating: pData?.averageRating || 0,
            totalJobs: aData?.totalJobs || 0,
            karmaBalance: pData?.reputationScore || 0
        });
    }, [pData, aData, calculateGravity]);

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
            className="dashboard-container"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* Background Aesthetic */}
            <div className="bg-pattern-grid" />
            <div className="ambient-glow" style={{ top: '10%', left: '20%', opacity: 0.1 }} />
            <div className="ambient-glow" style={{ bottom: '20%', right: '10%', background: '#d946ef', opacity: 0.05 }} />

            {/* Header Section */}
            <motion.div variants={itemVariants} className="dashboard-header">
                <div>
                    <div className="system-status">
                        <div className="status-dot" />
                        <span className="status-text">Sovereign Node: Online</span>
                    </div>
                    <h1 className="dashboard-title">
                        Command <span className="accent-text">Center</span>
                    </h1>
                    <p className="dashboard-subtitle">
                        Orchestrating trustless coordination for <span style={{ color: '#fff', fontWeight: 700 }}>{pData?.name || (address ? `${address.slice(0,6)}...${address.slice(-4)}` : 'Operator')}</span>. 
                    </p>
                </div>
                <div className="header-actions flex gap-4">
                    <button className="btn btn-ghost" style={{ padding: '12px 24px', gap: '10px' }}>
                        <BarChart3 size={18} />
                        <span>Intelligence</span>
                    </button>
                    <button 
                        className="btn btn-primary" 
                        style={{ padding: '14px 32px', gap: '10px' }}
                        onClick={() => window.dispatchEvent(new CustomEvent('NAV_TO_TAB', { detail: 'jobs' }))}
                    >
                        <Plus size={20} />
                        <span>New Mission</span>
                    </button>
                </div>
            </motion.div>

            {/* Bento Grid */}
            <div className="bento-grid">
                
                {/* 1. Reputation Mastery */}
                <motion.div variants={itemVariants} className="bento-card card-rep">
                    <div className="bg-pattern-grid" />
                    <div className="rep-header">
                        <div>
                            <span className="text-label"><Trophy size={14} style={{ display: 'inline', marginRight: '8px' }} /> Reputation Frequency</span>
                            <div className="rep-score">
                                {pData?.reputationScore || '0'}<span className="rep-unit">RP</span>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div className="status-pill" style={{ color: '#8b5cf6', borderColor: 'rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.1)' }}>
                                {gravityStats.orbitCategory?.split('(')[0].trim() || 'Unranked'}
                            </div>
                        </div>
                    </div>
                    
                    <div className="rep-footer">
                        <div>
                            <span className="text-label">Network Gravity</span>
                            <div className="text-value flex items-center gap-3">
                                {(pData?.averageRating || 0).toFixed(1)}
                                <div className="flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={12} fill={i < Math.floor(pData?.averageRating || 0) ? '#8b5cf6' : 'none'} color={i < Math.floor(pData?.averageRating || 0) ? '#8b5cf6' : 'rgba(255,255,255,0.1)'} />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div>
                            <span className="text-label">Equilibrium</span>
                            <div className="text-value accent-text">
                                {gravityStats.equilibriumAdjustment || '+0.0'}
                            </div>
                        </div>
                        <div>
                            <span className="text-label">Total Missions</span>
                            <div className="text-value">
                                {aData?.totalJobs || '0'} <span style={{ fontSize: '14px', opacity: 0.3, fontWeight: 500 }}>UNITS</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 2. Identity Anchor */}
                <motion.div variants={itemVariants} className="bento-card card-identity">
                    <div>
                        <div className="flex justify-between items-center">
                            <span className="text-label flex items-center gap-2"><Fingerprint size={16} /> Identity Anchor</span>
                            <div className="status-pill">ERC-6551</div>
                        </div>
                        
                        <div className="identity-avatar-container">
                            <div className="avatar-glow" />
                            <div className="avatar-frame">
                                <div className="avatar-inner">
                                    <img 
                                        src={`https://api.dicebear.com/7.x/shapes/svg?seed=${address}&backgroundColor=050505`} 
                                        alt="Sovereign Identity" 
                                        style={{ width: '100%', height: '100%' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <span className="text-label" style={{ marginBottom: '16px' }}>Binding Hash</span>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', fontFamily: 'monospace', fontSize: '12px', color: 'rgba(255,255,255,0.4)', wordBreak: 'break-all' }}>
                            {tbaInfo?.tbaAddress ? `${tbaInfo.tbaAddress.slice(0, 18)}...${tbaInfo.tbaAddress.slice(-16)}` : 'Synchronizing...'}
                        </div>
                        <button className="btn btn-ghost" style={{ width: '100%', marginTop: '24px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 800 }}>
                            View Proof of Identity
                        </button>
                    </div>
                </motion.div>

                {/* 3. Stats Blocks */}
                <motion.div 
                    variants={itemVariants} 
                    className="bento-card card-stats"
                    whileHover={{ scale: 1.02 }}
                >
                    <div className="flex items-center gap-3">
                        <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                            <Activity size={20} />
                        </div>
                        <span className="text-label">Active Missions</span>
                    </div>
                    <div>
                        <div className="text-value" style={{ fontSize: '3rem' }}>{activeEscrows.length}</div>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 800, textTransform: 'uppercase' }}>In Orbit</p>
                    </div>
                </motion.div>

                <motion.div 
                    variants={itemVariants} 
                    className="bento-card card-stats"
                    whileHover={{ scale: 1.02 }}
                >
                    <div className="flex items-center gap-3">
                        <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
                            <Globe size={20} />
                        </div>
                        <span className="text-label">Mesh Sync</span>
                    </div>
                    <div>
                        <div className="text-value" style={{ fontSize: '3rem' }}>99.9%</div>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 800, textTransform: 'uppercase' }}>Protocol Health</p>
                    </div>
                </motion.div>

                {/* 4. Telemetry Grid */}
                <motion.div variants={itemVariants} className="bento-card card-telemetry">
                    <div className="telemetry-header">
                        <div className="flex items-center gap-3">
                            <Radio size={18} className="accent-text" />
                            <span className="text-label" style={{ margin: 0 }}>Mission Telemetry</span>
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: 900, color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(139,92,246,0.1)', padding: '6px 12px', borderRadius: '20px' }}>
                            LIVE SIGNAL <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="status-dot" style={{ width: '6px', height: '6px', background: '#8b5cf6', margin: 0 }} />
                        </div>
                    </div>
                    
                    <div className="telemetry-body">
                        {activeEscrows.length > 0 ? (
                            <table className="telemetry-table">
                                <thead>
                                    <tr>
                                        <th>Vector</th>
                                        <th>Protocol State</th>
                                        <th style={{ textAlign: 'right' }}>Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeEscrows.map((job) => (
                                        <tr key={job.id} className="telemetry-row">
                                            <td>
                                                <div className="flex items-center gap-4">
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6', boxShadow: '0 0 10px rgba(139,92,246,0.5)' }} />
                                                    <span style={{ fontFamily: 'monospace', color: '#fff', fontWeight: 600 }}>MISSION_{job.id}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="status-pill">{job.statusLabel}</span>
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 800, color: '#fff', fontFamily: 'Space Grotesk' }}>
                                                {parseFloat(job.amount).toFixed(2)} <span style={{ fontSize: '10px', opacity: 0.5 }}>POL</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ padding: '100px 40px', textAlign: 'center', opacity: 0.3 }}>
                                <ZapOff size={48} style={{ margin: '0 auto 24px' }} />
                                <p style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>No active missions detected</p>
                                <p style={{ fontSize: '12px', marginTop: '8px' }}>Initiate a mission to begin orchestration</p>
                            </div>
                        )}
                    </div>
                    
                    <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                        <button className="btn btn-ghost" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', gap: '10px', width: '100%', justifyContent: 'center' }}>
                            Access Archived Coordinates <ExternalLink size={14} />
                        </button>
                    </div>
                </motion.div>

            </div>

            <ReasoningProofModal 
                isOpen={isProofModalOpen} 
                onClose={() => setIsProofModalOpen(false)} 
                proof={selectedProof} 
            />
        </motion.div>
    );
};

export default Dashboard;

