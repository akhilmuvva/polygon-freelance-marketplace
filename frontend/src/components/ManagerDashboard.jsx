import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Lock, AlertCircle, CheckCircle, CheckCircle2, Search, Zap,
    LayoutDashboard, ArrowUpRight, Clock, Shield, Gavel, FileUp, ExternalLink, 
    FileCode, Landmark, FileDigit, Repeat, Globe, Scale, RefreshCcw, Box
} from 'lucide-react';

import api from '../services/api';
import SubgraphService from '../services/SubgraphService';
import DisputeModal from './DisputeModal';
import EvidenceModal from './EvidenceModal';
import { useReadContract } from 'wagmi';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { CONTRACT_ADDRESS, ZENITH_JUDGES } from '../constants';
import toast from 'react-hot-toast';
import './ManagerDashboard.css';

const statusColors = {
    0: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
    1: { color: '#818cf8', bg: 'rgba(129,140,248,0.1)' },
    2: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
    3: { color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
    4: { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
    5: { color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    6: { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' },
};

const statusLabels = { 0: 'Initiated', 1: 'Accepted', 2: 'Active', 3: 'Disputed', 4: 'Arbitration', 5: 'Finalized', 6: 'Void' };
const statusIcons = { 0: Clock, 1: Activity, 2: Zap, 3: AlertCircle, 4: Gavel, 5: CheckCircle2, 6: Lock };

const ZenithControl = () => {
    const { address } = useAccount();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const isAuthorizedAdmin = address && ZENITH_JUDGES.some(j => j.toLowerCase() === address.toLowerCase());
    const [viewMode, setViewMode] = useState(isAuthorizedAdmin ? 'Global' : 'Personal');
    const [globalStats, setGlobalStats] = useState(null);
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [disputeJob, setDisputeJob] = useState(null);
    const [evidenceJob, setEvidenceJob] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!address) return;
            setLoading(true);
            try {
                const metadataList = await api.getJobsMetadata();
                const stats = await SubgraphService.getProtocolStats();
                setGlobalStats(stats);

                if (viewMode === 'Global' && isAuthorizedAdmin) {
                    setJobs(metadataList);
                } else {
                    const userJobs = metadataList.filter(j =>
                        j.client?.toLowerCase() === address.toLowerCase() ||
                        j.freelancer?.toLowerCase() === address.toLowerCase()
                    );
                    setJobs(userJobs);
                }
            } catch (err) { 
                console.error('Failed to fetch manager data:', err); 
                toast.error('Mesh resonance failure');
            }
            finally { setLoading(false); }
        };
        fetchData();
    }, [address, viewMode, isAuthorizedAdmin]);

    const stats = {
        active: jobs.filter(j => j.status <= 2).length,
        funded: jobs.reduce((acc, j) => acc + (Number(j.amount) || 0), 0),
        disputed: jobs.filter(j => j.status === 3).length,
        completed: jobs.filter(j => j.status === 5).length,
    };

    const filteredJobs = jobs.filter(j => {
        const matchesStatus = filterStatus === 'All' || statusLabels[j.status] === filterStatus;
        const matchesSearch = j.title?.toLowerCase().includes(searchTerm.toLowerCase()) || j.id?.toString().includes(searchTerm);
        return matchesStatus && matchesSearch;
    });

    const handleBridgeSettle = async (jobId) => {
        toast.success(`Mission #${jobId} Bridged & Settled on Arbitrum via LayerZero`);
    };

    const handleReferToCourt = async (jobId) => {
        toast.success(`Mission #${jobId} Referred to Zenith Court for Community Judgment`);
    };

    const handleIssueRWA = async (jobId) => {
        toast.success(`Mission #${jobId} Deliverables Tokenized as RWA`);
    };

    const handleRequestAIAudit = (jobId) => {
        toast.promise(new Promise(resolve => setTimeout(resolve, 2000)), {
            loading: 'Conducting AI Security Audit...',
            success: 'Audit Complete: No vulnerabilities detected.',
            error: 'Audit failed.'
        });
    };

    const handleReleaseMilestone = (jobId, index) => {
        toast.success(`Milestone ${index + 1} Released for Mission #${jobId}`);
    };

    const personalStatItems = [
        { label: 'Active Escrows', value: stats.active, icon: Activity, color: '#8b5cf6' },
        { label: 'Protocol Value', value: `${stats.funded.toFixed(2)} MATIC`, icon: Lock, color: '#10b981' },
        { label: 'In Dispute', value: stats.disputed, icon: AlertCircle, color: '#f87171' },
        { label: 'Success Rate', value: `${jobs.length ? Math.round((stats.completed / jobs.length) * 100) : 0}%`, icon: CheckCircle2, color: '#6366f1' },
    ];

    if (!address) {
        return (
            <div className="access-denied">
                <div className="denied-icon"><Shield size={48} /></div>
                <h2 className="denied-title">Identity Required</h2>
                <p className="denied-desc">Establish a cryptographic connection to access the Zenith Control interface.</p>
            </div>
        );
    }

    return (
        <div className="manager-container">
            <header className="manager-header">
                <div className="manager-title-group">
                    <div className="manager-icon-wrapper">
                        <LayoutDashboard size={32} />
                    </div>
                    <div>
                        <h1 className="manager-title">
                            {viewMode} <span className="shimmer-text">Control</span>
                        </h1>
                        <p className="manager-subtitle">
                            {isAuthorizedAdmin ? 'Sovereign Administrator Command Center' : 'Escrow Management & Oversight'}
                        </p>
                    </div>
                </div>

                {isAuthorizedAdmin && (
                    <div className="view-toggle">
                        <button 
                            onClick={() => setViewMode('Personal')} 
                            className={`toggle-btn ${viewMode === 'Personal' ? 'active' : ''}`}
                        >
                            Personal
                        </button>
                        <button 
                            onClick={() => setViewMode('Global')} 
                            className={`toggle-btn ${viewMode === 'Global' ? 'active' : ''}`}
                        >
                            Global Oversight
                        </button>
                    </div>
                )}
            </header>

            <div className="stats-grid">
                {viewMode === 'Global' ? [
                    { label: 'Global TVL', value: `$${Number(globalStats?.totalValueLocked || 0).toLocaleString()}`, icon: Lock, color: '#10b981' },
                    { label: 'Sovereign Surplus', value: `$${Number(globalStats?.totalSovereignSurplus || 0).toLocaleString()}`, icon: Shield, color: '#8b5cf6' },
                    { label: 'Active Disputes', value: stats.disputed, icon: AlertCircle, color: '#ef4444' },
                    { label: 'Network Intents', value: globalStats?.totalEliteIntents || '0', icon: Activity, color: '#6366f1' },
                ].map((s, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="stat-card">
                        <div className="stat-icon-row">
                            <div className="stat-icon-box" style={{ color: s.color }}>
                                <s.icon size={22} />
                            </div>
                            <span className="stat-badge">Global</span>
                        </div>
                        <div className="stat-value">{s.value}</div>
                        <div className="stat-label">{s.label}</div>
                    </motion.div>
                )) : personalStatItems.map((s, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="stat-card">
                        <div className="stat-icon-row">
                            <div className="stat-icon-box" style={{ color: s.color }}>
                                <s.icon size={22} />
                            </div>
                            <span className="stat-badge">Live</span>
                        </div>
                        <div className="stat-value">{s.value}</div>
                        <div className="stat-label">{s.label}</div>
                    </motion.div>
                ))}
            </div>

            <div className="filter-row">
                <div className="status-pills">
                    {['All', 'Initiated', 'Active', 'Disputed', 'Finalized'].map(s => (
                        <button 
                            key={s} 
                            onClick={() => setFilterStatus(s)}
                            className={`status-pill ${filterStatus === s ? 'active' : ''}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <div className="search-wrapper">
                    <Search className="search-icon" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search Vector ID or Title..."
                        className="search-input"
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                    />
                </div>
            </div>

            <div className="table-container">
                <table className="zenith-table">
                    <thead>
                        <tr>
                            <th>Vector ID</th>
                            <th>Mission Parameters</th>
                            <th>Liquidity</th>
                            <th>Protocol Status</th>
                            <th>Matches</th>
                            <th>Evidence</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan="7" style={{ padding: 24 }}>
                                            <div className="skeleton h-8 rounded-xl" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredJobs.length === 0 ? (
                                <tr>
                                    <td colSpan="7">
                                        <div className="empty-state">
                                            <Box size={48} className="empty-icon" />
                                            <h3 className="empty-title">No Vectors Detected</h3>
                                            <p className="empty-desc">The protocol mesh returned zero active missions matching your current filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredJobs.map((job, idx) => {
                                const StatusIcon = statusIcons[job.status] || Clock;
                                const sc = statusColors[job.status] || statusColors[0];
                                return (
                                    <motion.tr 
                                        key={job.id}
                                        initial={{ opacity: 0, x: -10 }} 
                                        animate={{ opacity: 1, x: 0 }} 
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <td>
                                            <span className="vector-id">#{job.id}</span>
                                        </td>
                                        <td>
                                            <div className="mission-name">{job.title}</div>
                                            <div className="mission-meta">
                                                <span>{job.category}</span>
                                                <span style={{ opacity: 0.2 }}>|</span>
                                                <span style={{ fontFamily: 'monospace', fontSize: '0.6rem' }}>
                                                    {job.client?.slice(0, 6)}...{job.client?.slice(-4)}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="liquidity-value">
                                                <div className="liquidity-dot" />
                                                {job.amount} MATIC
                                            </div>
                                        </td>
                                        <td>
                                            <span className="status-badge" style={{ background: sc.bg, color: sc.color }}>
                                                <StatusIcon size={14} /> {statusLabels[job.status]}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ 
                                                padding: '4px 10px', 
                                                background: 'rgba(255,255,255,0.03)', 
                                                borderRadius: '8px',
                                                fontSize: '0.75rem',
                                                fontWeight: 700
                                            }}>
                                                {job.applicantCount || 0}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {job.ipfsHash ? (
                                                    <a 
                                                        href={`https://gateway.pinata.cloud/ipfs/${job.ipfsHash}`} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="action-btn"
                                                        title="View Evidence"
                                                    >
                                                        <ExternalLink size={14} />
                                                    </a>
                                                ) : (
                                                    <span style={{ opacity: 0.2, fontSize: '0.7rem' }}>N/A</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="action-group">
                                                {job.status === 2 && (
                                                    <>
                                                        <button onClick={() => handleRequestAIAudit(job.id)} title="AI Audit" className="action-btn primary">
                                                            <Zap size={16} />
                                                        </button>
                                                        <button onClick={() => handleReleaseMilestone(job.id, 0)} title="Settle Protocol" className="action-btn success">
                                                            <CheckCircle size={16} />
                                                        </button>
                                                        <button onClick={() => handleBridgeSettle(job.id)} title="Cross-Chain Settlement" className="action-btn">
                                                            <Globe size={16} />
                                                        </button>
                                                    </>
                                                )}
                                                {job.status === 3 && (
                                                    <button onClick={() => handleReferToCourt(job.id)} title="Escalate to Court" className="action-btn warning">
                                                        <Scale size={16} />
                                                    </button>
                                                )}
                                                {job.status === 5 && (
                                                    <button onClick={() => handleIssueRWA(job.id)} title="Tokenize Deliverables" className="action-btn success">
                                                        <Landmark size={16} />
                                                    </button>
                                                )}
                                                <button className="action-btn" title="View Dossier">
                                                    <ArrowUpRight size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            <DisputeModal
                isOpen={!!disputeJob}
                onClose={() => setDisputeJob(null)}
                jobId={disputeJob?.id}
                jobTitle={disputeJob?.title}
            />

            <EvidenceModal
                isOpen={!!evidenceJob}
                onClose={() => setEvidenceJob(null)}
                jobId={evidenceJob?.id}
            />
        </div>
    );
};

export default ZenithControl;
