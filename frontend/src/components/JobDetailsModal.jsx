import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Briefcase, Calendar, DollarSign, Target, User, 
    Shield, ArrowRight, MessageSquare, ExternalLink,
    Clock, Cpu, Zap, CreditCard, Rocket, Loader2
} from 'lucide-react';
import UserLink from './UserLink';
import { formatUnits } from 'viem';
import { SUPPORTED_TOKENS } from '../constants';

import { useReadContract } from 'wagmi';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { CONTRACT_ADDRESS } from '../constants';
import toast from 'react-hot-toast';

const JobDetailsModal = ({ 
    isOpen, onClose, job, meta, tokenInfo, onSelectChat, onFiatPay, onAccept, onApply, onPickFreelancer,
    isEligibleToAccept, isEligibleToApply, address 
}) => {
    const [directFreelancer, setDirectFreelancer] = useState('');
    
    const isValidJobId = job?.jobId && !job.isIntent && !isNaN(job.jobId);
    
    // Fetch Applicants from the Sovereign Escrow Mesh
    const { data: applicants, isLoading: isLoadingApps } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        functionName: 'getJobApplications',
        args: isValidJobId ? [BigInt(job.jobId)] : undefined,
        query: {
            enabled: !!isOpen && isValidJobId,
        }
    });

    if (!isOpen || !job) return null;

    const isClient = address?.toLowerCase() === job.client?.toLowerCase();
    const statusCode = Number(job.status || 0);
    const statusLabels = ['Created', 'Accepted', 'Ongoing', 'Disputed', 'Arbitration', 'Completed', 'Cancelled'];
    const statusColor = statusCode === 5 ? '#10b981' : (statusCode === 3 || statusCode === 4) ? '#f87171' : '#7c5cfc';

    const handlePick = (f) => {
        if (!f) return;
        onPickFreelancer(f);
    };

    return (
        <AnimatePresence>
            <div style={styles.overlay} onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    style={styles.modal}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <header style={{ ...styles.header, borderBottomColor: `${statusColor}20` }}>
                        <div style={styles.headerTitleWrap}>
                            <div style={{ ...styles.statusBadge, background: `${statusColor}15`, color: statusColor }}>
                                <Briefcase size={12} />
                                {statusLabels[statusCode] || 'Open Intent'}
                            </div>
                            <h2 style={styles.title}>{meta.title}</h2>
                            <p style={styles.jobId}>Job ID: {job.jobId}</p>
                        </div>
                        <button onClick={onClose} style={styles.closeBtn}>
                            <X size={20} />
                        </button>
                    </header>

                    {/* Content Scrollable */}
                    <div style={styles.content} className="custom-scrollbar">
                        {/* Summary Cards */}
                        <div style={styles.summaryGrid}>
                            <div style={styles.summaryCard}>
                                <div style={styles.summaryIcon}>
                                    <DollarSign size={18} color="var(--success)" />
                                </div>
                                <div>
                                    <label style={styles.summaryLabel}>Total Budget</label>
                                    <div style={styles.summaryValue}>
                                        {job.isIntent ? parseFloat(job.amount || 0).toLocaleString() : formatUnits(BigInt(job.amount || '0'), tokenInfo.decimals)} {tokenInfo.symbol}
                                    </div>
                                </div>
                            </div>
                            <div style={styles.summaryCard}>
                                <div style={styles.summaryIcon}>
                                    <Calendar size={18} color="var(--accent-light)" />
                                </div>
                                <div>
                                    <label style={styles.summaryLabel}>Deadline</label>
                                    <div style={styles.summaryValue}>
                                        {isNaN(Number(job.deadline)) ? 'No Fixed Deadline' : new Date(Number(job.deadline) * 1000).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <section style={styles.section}>
                            <h3 style={styles.sectionTitle}>Project Description</h3>
                            <div style={styles.descriptionBox}>
                                {meta.description}
                            </div>
                        </section>

                        {/* Applicant Management (Sovereign Context) */}
                        {isClient && statusCode === 0 && (
                            <section style={styles.section}>
                                <h3 style={styles.sectionTitle}>Manage Applicants</h3>
                                <div style={styles.applicantsBox}>
                                    {isLoadingApps ? (
                                        <div style={{ padding: 20, textAlign: 'center' }}><Loader2 size={24} className="animate-spin" /></div>
                                    ) : (applicants && applicants.length > 0) ? (
                                        <div style={styles.applicantList}>
                                            {applicants.map((app, idx) => (
                                                <div key={idx} style={styles.applicantRow}>
                                                    <div style={{ flex: 1 }}>
                                                        <UserLink address={app.freelancer} />
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                                                            Stake: {formatUnits(app.stake, tokenInfo.decimals)} {tokenInfo.symbol}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <button onClick={() => onSelectChat(app.freelancer)} style={styles.rowBtnSec} title="Contact">
                                                            <MessageSquare size={14} />
                                                        </button>
                                                        <button onClick={() => handlePick(app.freelancer)} className="btn btn-primary" style={styles.rowBtn}>
                                                            Hire
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                                            No applicants yet. Share this job to find specialists!
                                        </div>
                                    )}

                                    <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16, textAlign: 'center' }}>
                                        <p style={{ ...styles.summaryLabel, marginBottom: 0, textTransform: 'none' }}>
                                            Direct Assign is disabled. Specialists must apply with their <span style={{ color: 'var(--accent-light)' }}>Sovereign ID</span> to join this mission.
                                        </p>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Milestones */}
                        {meta.milestones && meta.milestones.length > 0 && (
                            <section style={styles.section}>
                                <div style={styles.sectionHeader}>
                                    <Target size={16} color="var(--accent-light)" />
                                    <h3 style={styles.sectionTitleMuted}>Contract Milestones</h3>
                                </div>
                                <div style={styles.milestoneList}>
                                    {meta.milestones.map((m, i) => (
                                        <div key={i} style={styles.milestoneItem}>
                                            <div style={styles.milestoneIndex}>{i + 1}</div>
                                            <div style={styles.milestoneInfo}>
                                                <div style={styles.milestoneDesc}>{m.description}</div>
                                                <div style={styles.milestoneAmount}>{m.amount} {tokenInfo.symbol}</div>
                                            </div>
                                            <div style={styles.milestoneStatus}>
                                                <Shield size={12} opacity={0.5} />
                                                Escrow Locked
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Identity Trace */}
                        <section style={styles.section}>
                            <h3 style={styles.sectionTitle}>Sovereign Identity Trace</h3>
                            <div style={styles.identityRow}>
                                <div style={styles.idCard}>
                                    <label style={styles.summaryLabel}>Client</label>
                                    <UserLink address={job.client} style={styles.idLink} />
                                </div>
                                <ArrowRight size={16} color="var(--text-tertiary)" />
                                <div style={styles.idCard}>
                                    <label style={styles.summaryLabel}>Freelancer</label>
                                    {job.freelancer && job.freelancer !== '0x0000000000000000000000000000000000000000' ? (
                                        <UserLink address={job.freelancer} style={styles.idLink} />
                                    ) : (
                                        <div style={styles.waitingText}>Awaiting Selection</div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* IPFS Hash */}
                        <div style={styles.hashBox}>
                            <div style={styles.hashLabel}>IPFS Anchor CID:</div>
                            <div style={styles.hashValue}>{job.ipfsHash}</div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <footer style={styles.footer}>
                        {!isClient && (
                            <button onClick={() => onSelectChat(job.client)} style={styles.btnSecondary}>
                                <MessageSquare size={16} /> Contact Client
                            </button>
                        )}
                        {isClient && job.freelancer && job.freelancer !== '0x00...0' && (
                            <button onClick={() => onSelectChat(job.freelancer)} style={styles.btnSecondary}>
                                <MessageSquare size={16} /> Chat with Freelancer
                            </button>
                        )}
                        {isClient && onFiatPay && (
                            <button onClick={() => onFiatPay(job.freelancer || job.client)} style={styles.btnSecondary}>
                                <CreditCard size={16} /> Fiat Pay
                            </button>
                        )}
                        <button onClick={onClose} className="btn btn-secondary" style={styles.btnMain}>
                            Close
                        </button>
                        {isEligibleToApply && !isClient && (
                            <div style={{ display: 'flex', gap: 10, flex: 1 }}>
                                <input 
                                    type="text" 
                                    placeholder="Verify Wallet ID (0x...)" 
                                    className="form-input"
                                    style={{ flex: 1, height: 40, background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid var(--border)', padding: '0 16px', color: '#fff', fontSize: '0.8rem' }}
                                    value={directFreelancer}
                                    onChange={(e) => setDirectFreelancer(e.target.value)}
                                />
                                <button 
                                    disabled={!directFreelancer || directFreelancer.toLowerCase() !== address?.toLowerCase()}
                                    onClick={() => { onApply(); onClose(); }} 
                                    className="btn btn-primary" 
                                    style={{ ...styles.btnMain, background: 'linear-gradient(135deg, #10b981, #3b82f6)', opacity: (!directFreelancer || directFreelancer.toLowerCase() !== address?.toLowerCase()) ? 0.5 : 1 }}
                                >
                                    <Rocket size={16} /> Apply
                                </button>
                            </div>
                        )}
                        {isEligibleToAccept && !isClient && job.freelancer?.toLowerCase() === address?.toLowerCase() && (
                            <button onClick={() => { onAccept(); onClose(); }} className="btn btn-secondary" style={{ ...styles.btnSecondary, borderColor: 'var(--accent-light)', color: 'var(--accent-light)' }}>
                                <Zap size={16} /> Accept & Start
                            </button>
                        )}
                    </footer>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const styles = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(2, 3, 6, 0.85)', backdropFilter: 'blur(10px)',
        zIndex: 2500, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20
    },
    modal: {
        width: '100%', maxWidth: 640, background: 'var(--bg-surface)',
        border: '1px solid var(--border-strong)', borderRadius: 24,
        boxShadow: '0 40px 80px rgba(0,0,0,0.8)', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
    },
    header: {
        padding: '24px 32px', borderBottom: '1px solid transparent',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
    },
    headerTitleWrap: { flex: 1 },
    statusBadge: {
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 10px', borderRadius: 8, fontSize: '0.62rem',
        fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em',
        marginBottom: 12
    },
    title: { fontSize: '1.4rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: '#fff' },
    jobId: { fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: '4px 0 0', fontFamily: 'monospace' },
    closeBtn: {
        background: 'transparent', border: 'none', color: 'var(--text-tertiary)',
        padding: 8, borderRadius: 10, cursor: 'pointer', display: 'flex'
    },
    content: { padding: '0 32px 32px', overflowY: 'auto' },
    summaryGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 },
    summaryCard: {
        padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 16,
        border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14
    },
    summaryIcon: {
        width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
    },
    summaryLabel: { fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4, display: 'block' },
    summaryValue: { fontSize: '0.95rem', fontWeight: 800, color: '#fff' },
    section: { marginBottom: 32 },
    sectionTitle: { fontSize: '0.85rem', fontWeight: 800, color: '#fff', marginBottom: 14 },
    sectionTitleMuted: { fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', margin: 0 },
    sectionHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 },
    descriptionBox: {
        padding: 20, borderRadius: 16, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)',
        color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6
    },
    milestoneList: { display: 'flex', flexDirection: 'column', gap: 10 },
    milestoneItem: {
        display: 'flex', alignItems: 'center', gap: 16, padding: '12px 18px',
        borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)'
    },
    milestoneIndex: {
        width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-light)',
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.7rem', fontWeight: 900
    },
    milestoneInfo: { flex: 1 },
    milestoneDesc: { fontSize: '0.85rem', fontWeight: 700, color: '#fff' },
    milestoneAmount: { fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 2 },
    milestoneStatus: {
        display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.65rem',
        fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase'
    },
    identityRow: {
        display: 'flex', alignItems: 'center', gap: 20, background: 'rgba(255,255,255,0.02)',
        padding: 20, borderRadius: 18, border: '1px solid var(--border)'
    },
    idCard: { flex: 1 },
    idLink: { fontSize: '0.9rem' },
    waitingText: { fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-tertiary)', fontStyle: 'italic' },
    hashBox: {
        marginTop: 16, padding: 12, borderRadius: 10, background: 'rgba(0,0,0,0.3)',
        border: '1px dotted var(--border)', fontSize: '0.62rem', color: 'var(--text-tertiary)',
        display: 'flex', gap: 8
    },
    hashLabel: { fontWeight: 800, whiteSpace: 'nowrap' },
    hashValue: { wordBreak: 'break-all', fontFamily: 'monospace', opacity: 0.8 },
    footer: {
        padding: '24px 32px', background: 'rgba(1,2,4,0.5)',
        borderTop: '1px solid var(--border)', display: 'flex', gap: 12, justifyContent: 'flex-end'
    },
    btnSecondary: {
        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12,
        background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
        color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer'
    },
    btnMain: { padding: '10px 24px', borderRadius: 12, fontSize: '0.85rem', fontWeight: 800, height: 'auto' },
    applicantsBox: {
        padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)'
    },
    applicantList: { display: 'flex', flexDirection: 'column', gap: 12 },
    applicantRow: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 14px', borderRadius: 12, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)'
    },
    rowBtn: { padding: '6px 14px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 800, height: 'auto' },
    rowBtnSec: {
        padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
        color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center'
    }
};

export default JobDetailsModal;
