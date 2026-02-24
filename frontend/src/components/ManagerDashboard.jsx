import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Lock, AlertCircle, CheckCircle2, Search,
    LayoutDashboard, ArrowUpRight, Clock, Shield, Gavel, FileUp
} from 'lucide-react';
import { useArbitration } from '../hooks/useArbitration';
import { api } from '../services/api';
import DisputeModal from './DisputeModal';
import EvidenceModal from './EvidenceModal';

const statusColors = {
    0: { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
    1: { color: '#818cf8', bg: 'rgba(129,140,248,0.08)' },
    2: { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
    3: { color: '#f87171', bg: 'rgba(248,113,113,0.08)' },
    4: { color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
    5: { color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
    6: { color: '#9ca3af', bg: 'rgba(156,163,175,0.08)' },
};
const statusLabels = { 0: 'Created', 1: 'Accepted', 2: 'Ongoing', 3: 'Disputed', 4: 'Arbitration', 5: 'Completed', 6: 'Cancelled' };
const statusIcons = { 0: Clock, 1: Activity, 2: Activity, 3: AlertCircle, 4: Shield, 5: CheckCircle2, 6: Lock };

const cardBg = { padding: 24, borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' };
const dimLabel = { fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-tertiary)' };
const thStyle = { padding: 20, ...dimLabel, textAlign: 'left' };

const ManagerDashboard = () => {
    const { address } = useAccount();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [disputeJob, setDisputeJob] = useState(null);
    const [evidenceJob, setEvidenceJob] = useState(null);
    const { raiseDispute } = useArbitration();



    useEffect(() => {
        const fetchJobs = async () => {
            if (!address) return;
            setLoading(true);
            try {
                const metadataList = await api.getJobsMetadata();
                const userJobs = metadataList.filter(j =>
                    j.client?.toLowerCase() === address.toLowerCase() ||
                    j.freelancer?.toLowerCase() === address.toLowerCase()
                );
                setJobs(userJobs);
            } catch (err) { console.error('Failed to fetch manager data:', err); }
            finally { setLoading(false); }
        };
        fetchJobs();
    }, [address]);

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

    const statItems = [
        { label: 'Active Escrows', value: stats.active, icon: Activity, color: 'var(--accent-light)' },
        { label: 'Total TVL', value: `${stats.funded.toFixed(2)} MATIC`, icon: Lock, color: '#34d399' },
        { label: 'In Dispute', value: stats.disputed, icon: AlertCircle, color: '#f87171' },
        { label: 'Success Rate', value: `${jobs.length ? Math.round((stats.completed / jobs.length) * 100) : 0}%`, icon: CheckCircle2, color: '#818cf8' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {/* Header */}
            <header>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                    <div style={{ padding: 12, borderRadius: 16, background: 'rgba(124,92,252,0.08)', color: 'var(--accent-light)' }}>
                        <LayoutDashboard size={32} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.04em' }}>
                            Escrow <span style={{ color: 'var(--accent-light)' }}>Manager</span>
                        </h1>
                        <p style={dimLabel}>Real-time Smart Contract Monitoring</p>
                    </div>
                </div>
            </header>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                {statItems.map((s, idx) => (
                    <motion.div key={idx} whileHover={{ y: -5 }} style={{ ...cardBg }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <div style={{ padding: 8, borderRadius: 10, background: 'rgba(255,255,255,0.04)', color: s.color }}>
                                <s.icon size={20} />
                            </div>
                            <span style={{ ...dimLabel, opacity: 0.3 }}>Live</span>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 4 }}>{s.value}</div>
                        <div style={dimLabel}>{s.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    {['All', 'Created', 'Ongoing', 'Disputed', 'Completed'].map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)}
                            style={{
                                padding: '8px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                                fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
                                background: filterStatus === s ? 'var(--accent-light)' : 'rgba(255,255,255,0.04)',
                                color: filterStatus === s ? '#fff' : 'var(--text-tertiary)',
                                boxShadow: filterStatus === s ? '0 4px 16px rgba(124,92,252,0.2)' : 'none',
                                transition: 'all 0.2s ease',
                            }}>
                            {s}
                        </button>
                    ))}
                </div>
                <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <input type="text" placeholder="Search Escrow ID or Title..."
                        className="form-input" style={{ paddingLeft: 40, width: 260, fontSize: '0.78rem' }}
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </div>

            {/* Escrow Table */}
            <div style={{ ...cardBg, padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <th style={thStyle}>Escrow ID</th>
                                <th style={thStyle}>Project</th>
                                <th style={thStyle}>Locked Value</th>
                                <th style={thStyle}>Status</th>
                                <th style={thStyle}>Progress</th>
                                <th style={thStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {loading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan="6" style={{ padding: 20 }}>
                                                <div className="skeleton" style={{ height: 16, borderRadius: 8 }} />
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredJobs.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ padding: 80, textAlign: 'center', ...dimLabel }}>
                                            No matching escrows found.
                                        </td>
                                    </tr>
                                ) : filteredJobs.map((job) => {
                                    const StatusIcon = statusIcons[job.status] || Clock;
                                    const sc = statusColors[job.status] || statusColors[0];
                                    return (
                                        <motion.tr key={job.id}
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.3s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: 20 }}>
                                                <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', opacity: 0.5 }}>#{job.id}</span>
                                            </td>
                                            <td style={{ padding: 20 }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{job.title}</span>
                                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{job.category}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: 20 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399' }} />
                                                    <span style={{ fontWeight: 900, fontSize: '0.88rem' }}>{job.amount} MATIC</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: 20 }}>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                                    padding: '4px 12px', borderRadius: 20, background: sc.bg,
                                                    color: sc.color, fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase',
                                                }}>
                                                    <StatusIcon size={12} /> {statusLabels[job.status]}
                                                </span>
                                            </td>
                                            <td style={{ padding: 20 }}>
                                                <div style={{ width: 128, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden' }}>
                                                    <div style={{
                                                        height: '100%', background: 'var(--accent-light)',
                                                        width: `${job.status === 5 ? 100 : job.status >= 2 ? 60 : 20}%`
                                                    }} />
                                                </div>
                                            </td>
                                            <td style={{ padding: 20 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    {job.status >= 1 && job.status <= 2 && (
                                                        <button onClick={() => setDisputeJob(job)} title="Raise Dispute"
                                                            style={{
                                                                padding: 8, borderRadius: 10, background: 'rgba(255,255,255,0.04)',
                                                                border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer',
                                                                transition: 'all 0.2s ease',
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.12)'; e.currentTarget.style.color = '#f87171'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}>
                                                            <Gavel size={16} />
                                                        </button>
                                                    )}
                                                    {job.status === 3 && (
                                                        <button onClick={() => setEvidenceJob(job)} title="Submit Evidence"
                                                            style={{
                                                                padding: 8, borderRadius: 10, background: 'rgba(255,255,255,0.04)',
                                                                border: 'none', color: 'var(--accent-light)', cursor: 'pointer',
                                                                transition: 'all 0.2s ease',
                                                            }}>
                                                            <FileUp size={16} />
                                                        </button>
                                                    )}
                                                    <button style={{
                                                        padding: 8, borderRadius: 10, background: 'rgba(255,255,255,0.04)',
                                                        border: 'none', color: '#fff', cursor: 'pointer', transition: 'all 0.2s ease',
                                                    }}
                                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,92,252,0.12)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
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

export default ManagerDashboard;
