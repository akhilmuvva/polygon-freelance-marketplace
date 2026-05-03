import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Briefcase, Calendar, DollarSign, Target, User, 
    Shield, ArrowRight, MessageSquare, ExternalLink,
    Clock, Cpu, Zap, CreditCard, Rocket, Loader2,
    Activity, ShieldCheck, Terminal, Fingerprint,
    ChevronRight, Info, FileText, Hash
} from 'lucide-react';
import UserLink from './UserLink';
import { formatUnits } from 'viem';
import { useReadContract } from 'wagmi';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { CONTRACT_ADDRESS } from '../constants';
import './MissionDossier.css';

const JobDetailsModal = ({ 
    isOpen, onClose, job, meta, tokenInfo, onSelectChat, onFiatPay, onAccept, onApply, onPickFreelancer,
    isEligibleToAccept, isEligibleToApply, address 
}) => {
    const [activeSection, setActiveSection] = useState('parameters');
    
    const isValidJobId = job?.jobId && !job.isIntent && !isNaN(job.jobId);
    
    const { data: applicants, isLoading: isLoadingApps } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        functionName: 'getJobApplications',
        args: isValidJobId ? [BigInt(job.jobId)] : undefined,
        query: {
            enabled: !!isOpen && isValidJobId,
        }
    });

    // Evidence/Submissions - Simulation for UI
    const evidenceLogs = useMemo(() => [
        { id: 1, type: 'System', message: 'Mission Initialized', timestamp: 'T-00:00:00' },
        { id: 2, type: 'Network', message: 'Escrow Locked on Polygon', timestamp: 'T-00:01:24' },
        ...(job.status >= 2 ? [{ id: 3, type: 'Specialist', message: 'Work Signal Detected', timestamp: 'T-02:14:00' }] : [])
    ], [job.status]);

    if (!isOpen || !job) return null;

    const isClient = address?.toLowerCase() === job.client?.toLowerCase();
    const statusCode = Number(job.status || 0);
    
    const statusConfig = {
        0: { color: '#10b981', label: 'Open' },
        1: { color: '#8b5cf6', label: 'Hiring' },
        2: { color: '#3b82f6', label: 'Active' },
        3: { color: '#f59e0b', label: 'Disputed' },
        4: { color: '#ef4444', label: 'Arbitration' },
        5: { color: '#a1a1aa', label: 'Completed' },
        default: { color: '#71717a', label: 'Inactive' }
    };

    const config = statusConfig[statusCode] || statusConfig.default;

    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    };

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: { 
            opacity: 1, 
            scale: 1, 
            y: 0,
            transition: { type: 'spring', damping: 25, stiffness: 300 }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    className="mission-dossier-overlay" 
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={overlayVariants}
                    onClick={onClose}
                >
                    <motion.div
                        className="mission-dossier-modal"
                        variants={modalVariants}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Dossier Header */}
                        <header className="dossier-header">
                            <div>
                                <div className="dossier-id">Mission Identifier: {job.jobId}</div>
                                <h2 className="dossier-header-title">{meta.title || `Protocol Vector #${job.jobId}`}</h2>
                                <div className="flex items-center gap-4 mt-4">
                                    <div className="status-indicator">
                                        <div className="status-ping" style={{ background: config.color }} />
                                        <span style={{ color: config.color }}>{config.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-zinc-400">
                                        <Hash size={10} />
                                        <span>{job.ipfsHash?.slice(0, 8)}...{job.ipfsHash?.slice(-8)}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={onClose} className="btn-dossier-secondary !p-3 rounded-full border-none">
                                <X size={24} />
                            </button>
                        </header>

                        {/* Dossier Body */}
                        <div className="dossier-body custom-scrollbar">
                            
                            {/* Mission Vital Signs */}
                            <section>
                                <div className="dossier-section-label">
                                    <Activity size={14} /> Mission Vital Signs
                                </div>
                                <div className="dossier-info-grid">
                                    <div className="info-stat-card">
                                        <span className="stat-label">Budget Allocation</span>
                                        <div className="stat-value">
                                            {job.isIntent ? parseFloat(job.amount || 0).toLocaleString() : formatUnits(BigInt(job.amount || '0'), tokenInfo.decimals)} <span className="text-[0.6em] opacity-40">{tokenInfo.symbol}</span>
                                        </div>
                                    </div>
                                    <div className="info-stat-card">
                                        <span className="stat-label">Temporal Deadline</span>
                                        <div className="stat-value">
                                            {isNaN(Number(job.deadline)) ? 'Indefinite' : new Date(Number(job.deadline) * 1000).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="info-stat-card">
                                        <span className="stat-label">Network Consensus</span>
                                        <div className="stat-value text-emerald-400">Verified</div>
                                    </div>
                                </div>
                            </section>

                            {/* Mission Parameters */}
                            <section>
                                <div className="dossier-section-label">
                                    <Terminal size={14} /> Mission Parameters
                                </div>
                                <div className="dossier-manifesto">
                                    {meta.description || "No tactical instructions provided for this mission."}
                                </div>
                            </section>

                            {/* Specialists & Intelligence */}
                            <div className="grid grid-cols-5 gap-12">
                                <div className="col-span-3">
                                    {isClient && statusCode === 0 ? (
                                        <section>
                                            <div className="dossier-section-label">
                                                <Target size={14} /> Candidate Specialists
                                            </div>
                                            <div className="specialist-list">
                                                {isLoadingApps ? (
                                                    <div className="flex items-center justify-center p-12 bg-white/2 rounded-2xl border border-dashed border-white/10">
                                                        <Loader2 size={24} className="animate-spin text-violet-500" />
                                                    </div>
                                                ) : (applicants && applicants.length > 0) ? (
                                                    applicants.map((app, idx) => (
                                                        <div key={idx} className="specialist-card">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                                                                    <User size={20} className="text-violet-400" />
                                                                </div>
                                                                <div>
                                                                    <UserLink address={app.freelancer} className="font-bold text-white text-sm" />
                                                                    <div className="text-[10px] text-zinc-500 font-bold mt-1">
                                                                        Stake Commit: {formatUnits(app.stake, tokenInfo.decimals)} {tokenInfo.symbol}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button onClick={() => onSelectChat(app.freelancer)} className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-zinc-400 transition-colors">
                                                                    <MessageSquare size={16} />
                                                                </button>
                                                                <button onClick={() => onPickFreelancer(app.freelancer)} className="btn-dossier-primary !py-2 !px-4 !text-[10px]">
                                                                    Assign Specialist
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-12 text-center bg-white/2 rounded-2xl border border-dashed border-white/10 text-zinc-500 text-sm italic">
                                                        No specialist signatures detected.
                                                    </div>
                                                )}
                                            </div>
                                        </section>
                                    ) : (
                                        <section>
                                            <div className="dossier-section-label">
                                                <ShieldCheck size={14} /> Sovereign Trace
                                            </div>
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-center justify-between p-6 bg-white/2 rounded-2xl border border-white/5">
                                                    <div>
                                                        <span className="text-[10px] uppercase font-black text-zinc-500 block mb-2 tracking-widest">Initiator</span>
                                                        <UserLink address={job.client} className="text-sm font-bold text-white" />
                                                    </div>
                                                    <div className="h-10 w-[1px] bg-white/5" />
                                                    <div>
                                                        <span className="text-[10px] uppercase font-black text-zinc-500 block mb-2 tracking-widest">Specialist</span>
                                                        {job.freelancer && job.freelancer !== '0x0000000000000000000000000000000000000000' ? (
                                                            <UserLink address={job.freelancer} className="text-sm font-bold text-white" />
                                                        ) : (
                                                            <div className="text-sm font-bold text-zinc-600 italic">Unassigned</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    )}
                                </div>
                                
                                <div className="col-span-2">
                                    <section>
                                        <div className="dossier-section-label">
                                            <FileText size={14} /> Intel Logs
                                        </div>
                                        <div className="bg-white/2 rounded-2xl border border-white/5 overflow-hidden">
                                            <div className="p-4 bg-white/2 border-bottom border-white/5">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-violet-400">
                                                    <Activity size={12} /> REAL-TIME TELEMETRY
                                                </div>
                                            </div>
                                            <div className="p-4 flex flex-col gap-4">
                                                {evidenceLogs.map(log => (
                                                    <div key={log.id} className="flex gap-3 text-[11px]">
                                                        <span className="text-zinc-600 font-mono">{log.timestamp}</span>
                                                        <span className="text-zinc-400 font-bold">[{log.type}]</span>
                                                        <span className="text-zinc-500">{log.message}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>

                        {/* Dossier Footer */}
                        <footer className="dossier-footer">
                            {!isClient && (
                                <button onClick={() => onSelectChat(job.client)} className="btn-dossier btn-dossier-secondary">
                                    <MessageSquare size={16} /> Signal Initiator
                                </button>
                            )}
                            {isEligibleToApply && !isClient && (
                                <button 
                                    onClick={() => { onApply(); onClose(); }} 
                                    className="btn-dossier btn-dossier-primary"
                                >
                                    <Fingerprint size={16} /> Commit Signature
                                </button>
                            )}
                            {isEligibleToAccept && !isClient && (
                                <button 
                                    onClick={() => { onAccept(); onClose(); }} 
                                    className="btn-dossier btn-dossier-primary !bg-emerald-600 !shadow-emerald-900/20"
                                >
                                    <Zap size={16} /> Actuate Escrow
                                </button>
                            )}
                            <button onClick={onClose} className="btn-dossier btn-dossier-secondary">
                                Exit Terminal
                            </button>
                        </footer>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default JobDetailsModal;
