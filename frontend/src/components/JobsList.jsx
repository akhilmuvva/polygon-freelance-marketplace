import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { motion } from 'framer-motion';
import { Briefcase, RefreshCcw, MessageSquare, Search, Filter, ArrowUpDown } from 'lucide-react';
import axios from 'axios';
import { formatUnits } from 'viem';
import { SUPPORTED_TOKENS } from '../constants';
import UserLink from './UserLink';
import AiMatchRating from './AiMatchRating';
import { createBiconomySmartAccount } from '../utils/biconomy';
import { useAnimeAnimations } from '../hooks/useAnimeAnimations';



const st = {
    container: { display: 'flex', flexDirection: 'column', gap: 32 },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24 },
    title: { fontSize: '2.4rem', fontWeight: 900, marginBottom: 8, letterSpacing: '-0.04em' },
    subtitle: { color: 'var(--text-secondary)', fontWeight: 500, maxWidth: 480 },
    filterBar: {
        display: 'grid', gridTemplateColumns: 'minmax(300px, 2fr) 1fr 1fr 1.2fr', gap: 16,
        padding: 18, borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
    },
    inputIcon: { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' },
    input: { width: '100%', padding: '10px 14px 10px 42px', borderRadius: 10, border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '0.9rem' },
    select: { width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10, border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '0.9rem', appearance: 'none' },
    card: {
        padding: 24, borderRadius: 16, background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border)', transition: 'all 0.3s ease',
        cursor: 'pointer', position: 'relative', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column'
    }
};

const JobsList = ({ onSelectChat, gasless, smartAccount: propSmartAccount, address: propAddress }) => {
    const { address: wagmiAddress } = useAccount();
    const address = propAddress || wagmiAddress;
    const { data: walletClient } = useWalletClient();
    const [smartAccount, setSmartAccount] = useState(null);
    const { staggerFadeIn, slideInLeft } = useAnimeAnimations();
    const headerRef = useRef(null);

    const [jobs, setJobs] = useState([]);
    const [isLoadingJobs, setIsLoadingJobs] = useState(true);
    const [filter, setFilter] = useState('All Categories');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('Newest');
    const [statusFilter] = useState('All');
    const [showMyJobs, setShowMyJobs] = useState(false);
    const [aiResults, setAiResults] = useState(null);
    const [isAiLoading, setIsAiLoading] = useState(false);

    useEffect(() => {
        if (headerRef.current) slideInLeft(headerRef.current);
    }, []);

    useEffect(() => {
        const initSA = async () => {
            if (propSmartAccount) setSmartAccount(propSmartAccount);
            else if (gasless && walletClient && !smartAccount) {
                try {
                    const sa = await createBiconomySmartAccount(walletClient);
                    setSmartAccount(sa);
                } catch (e) { console.error(e); }
            }
        };
        initSA();
    }, [gasless, walletClient, smartAccount, propSmartAccount]);

    const fetchJobs = async () => {
        setIsLoadingJobs(true);
        try {
            const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://localhost:3001/api';
            const response = await axios.get(`${apiBase}/jobs`);
            setJobs(response.data);
        } catch (err) {
            console.error('Failed to fetch jobs:', err);
        } finally {
            setIsLoadingJobs(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length > 5) {
                setIsAiLoading(true);
                try {
                    const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://localhost:3001/api';
                    const response = await axios.get(`${apiBase}/search?q=${searchQuery}`);
                    if (response.data.jobs) setAiResults(response.data.jobs.map(j => j.jobId));
                } catch (err) { console.error('AI Search failed:', err); }
                finally { setIsAiLoading(false); }
            } else { setAiResults(null); }
        }, 800);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const filteredJobs = React.useMemo(() => {
        let res = [...jobs];
        if (aiResults) res = res.filter(j => aiResults.includes(Number(j.jobId)));

        if (filter !== 'All Categories') {
            res = res.filter(j => j.category === filter);
        }

        if (statusFilter !== 'All') {
            res = res.filter(j => j.status.toString() === statusFilter);
        }

        if (searchQuery && !aiResults) {
            res = res.filter(j =>
                j.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                j.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (showMyJobs && address) {
            res = res.filter(j =>
                j.client?.toLowerCase() === address.toLowerCase() ||
                j.freelancer?.toLowerCase() === address.toLowerCase()
            );
        }

        if (sortBy === 'Newest') {
            res = res.sort((a, b) => b.jobId - a.jobId);
        } else if (sortBy === 'Budget: High to Low') {
            res = res.sort((a, b) => Number(b.amount) - Number(a.amount));
        } else if (sortBy === 'Deadline') {
            res = res.sort((a, b) => Number(a.deadline) - Number(b.deadline));
        }

        return res;
    }, [jobs, aiResults, filter, statusFilter, searchQuery, showMyJobs, address, sortBy]);

    useEffect(() => {
        if (filteredJobs.length > 0) setTimeout(() => staggerFadeIn('.job-card-wrapper', 60), 100);
    }, [filteredJobs.length]);

    const isLoading = isLoadingJobs || isAiLoading;

    return (
        <div style={st.container}>
            <header ref={headerRef} style={st.header}>
                <div>
                    <h1 style={st.title}>
                        Browse <span style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>Gigs</span>
                    </h1>
                    <p style={st.subtitle}>
                        Find high-value blockchain opportunities and secure your next contract.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={fetchJobs} style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, padding: '10px 16px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                        <RefreshCcw size={16} style={{ animation: isLoadingJobs ? 'spin 2s linear infinite' : 'none' }} />
                        Refresh
                    </button>
                    <button className="btn btn-primary" style={{ borderRadius: 12, padding: '10px 18px' }}>Post a Job</button>
                </div>
            </header>

            <div style={st.filterBar}>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={st.inputIcon} />
                    <input type="text" placeholder="Search projects or AI match..." style={st.input}
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    {isAiLoading && <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}><RefreshCcw size={14} style={{ animation: 'spin 1.5s linear infinite' }} /></div>}
                </div>

                <div style={{ position: 'relative' }}>
                    <Filter size={16} style={st.inputIcon} />
                    <select style={st.select} value={filter} onChange={(e) => setFilter(e.target.value)}>
                        <option>All Categories</option><option>Development</option><option>Design</option><option>Marketing</option>
                    </select>
                </div>

                <div style={{ position: 'relative' }}>
                    <ArrowUpDown size={16} style={st.inputIcon} />
                    <select style={st.select} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option>Newest</option><option>Budget: High to Low</option><option>Deadline</option>
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>My Jobs Only</span>
                    <div onClick={() => setShowMyJobs(!showMyJobs)} style={{
                        width: 42, height: 20, borderRadius: 10, background: showMyJobs ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                        position: 'relative', cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                        <div style={{
                            width: 12, height: 12, borderRadius: '50%', background: '#fff',
                            position: 'absolute', top: 4, left: showMyJobs ? 26 : 4, transition: 'all 0.2s'
                        }} />
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 24 }}>
                    {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 260, borderRadius: 16 }} />)}
                </div>
            ) : filteredJobs.length === 0 ? (
                <div style={{ ...st.card, textAlign: 'center', padding: '80px 40px', background: 'transparent', borderStyle: 'dashed' }}>
                    <Briefcase size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 16, opacity: 0.3, margin: '0 auto' }} />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>Found No Matches</h3>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>Try adjusting your filters or search query.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 24 }}>
                    {filteredJobs.map((job) => (
                        <JobCard key={job.jobId} job={job} address={address} onSelectChat={onSelectChat} />
                    ))}
                </div>
            )}
        </div>
    );
};

const JobCard = ({ job, address, onSelectChat }) => {
    const tokenInfo = SUPPORTED_TOKENS.find(t => t.address?.toLowerCase() === job.token?.toLowerCase()) || SUPPORTED_TOKENS[0];
    const statusColor = job.status === 0 ? 'var(--success)' : job.status === 3 ? 'var(--danger)' : 'var(--accent-light)';

    return (
        <motion.div className="job-card-wrapper"
            whileHover={{ y: -4 }}
            style={st.card}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,92,252,0.3)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{
                    padding: '4px 10px', borderRadius: 8, background: `${statusColor}15`,
                    color: statusColor, fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                    {job.category || 'Development'}
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>
                    {formatUnits(BigInt(job.amount || '0'), tokenInfo.decimals)} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-tertiary)' }}>{tokenInfo.symbol}</span>
                </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 12, lineHeight: 1.4, color: '#fff' }}>{job.title}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.6 }}>
                {job.description}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Client</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600 }}><UserLink address={job.client} /></span>
                </div>
                <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Deadline</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{new Date(Number(job.deadline) * 1000).toLocaleDateString()}</span>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
                <button className="btn btn-primary" style={{ flex: 1, height: 40, borderRadius: 10, fontSize: '0.8rem', fontWeight: 700 }}>View Gig</button>
                <button onClick={() => onSelectChat(job.client)} className="btn btn-ghost" style={{ width: 40, height: 40, padding: 0, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageSquare size={16} />
                </button>
            </div>

            {address && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <AiMatchRating jobId={job.jobId} freelancerAddress={address} />
                </div>
            )}
        </motion.div>
    );
};

export default JobsList;
