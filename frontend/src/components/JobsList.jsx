import React from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useWalletClient } from 'wagmi';
import { motion } from 'framer-motion';
import { Briefcase, CheckCircle, ExternalLink, RefreshCcw, AlertCircle, MessageSquare, Search, Filter, ArrowUpDown, Sparkles } from 'lucide-react';
import axios from 'axios';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { formatEther, formatUnits, parseUnits, erc20Abi } from 'viem';
import { CONTRACT_ADDRESS, SUPPORTED_TOKENS } from '../constants';
import { api } from '../services/api';
import UserLink from './UserLink';
import AiMatchRating from './AiMatchRating';
import { checkRiskLevel } from '../utils/riskMitigation';
import { useTransactionToast } from '../hooks/useTransactionToast';
import { uploadJSONToIPFS } from '../utils/ipfs';
import { createBiconomySmartAccount, submitWorkGasless } from '../utils/biconomy';
import { useTokenPrice } from '../hooks/useTokenPrice';

const statusLabels = ['Created', 'Accepted', 'Ongoing', 'Disputed', 'Completed', 'Cancelled'];

function JobsList({ onUserClick, onSelectChat, gasless }) {
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();
    const [filter, setFilter] = React.useState('All');
    const [searchQuery, setSearchQuery] = React.useState('');
    const [minBudget, setMinBudget] = React.useState('');
    const [sortBy, setSortBy] = React.useState('Newest');
    const [statusFilter, setStatusFilter] = React.useState('All');
    const [aiResults, setAiResults] = React.useState(null);
    const [isAiLoading, setIsAiLoading] = React.useState(false);

    // AI Intent Search Logic
    React.useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length > 3) {
                setIsAiLoading(true);
                try {
                    const response = await axios.get(`${import.meta.env.VITE_API_URL || 'https://localhost:3001/api'}/search?q=${searchQuery}`);
                    setAiResults(response.data.jobs.map(j => j.jobId));

                    // Auto-set category if AI detected it
                    if (response.data.intent.category && response.data.intent.category !== 'All') {
                        setFilter(response.data.intent.category);
                    }
                    if (response.data.intent.minBudget > 0) {
                        setMinBudget(response.data.intent.minBudget.toString());
                    }
                } catch (err) {
                    console.error('AI Search failed:', err);
                } finally {
                    setIsAiLoading(false);
                }
            } else {
                setAiResults(null);
            }
        }, 600);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const { data: jobCount } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        functionName: 'jobCount',
    });

    const count = jobCount ? Number(jobCount) : 0;
    let jobIds = Array.from({ length: count }, (_, i) => i + 1);

    // Filter by AI Results if they exist
    if (aiResults) {
        jobIds = jobIds.filter(id => aiResults.includes(id));
    }

    if (sortBy === 'Newest') jobIds.reverse();

    const isLoading = jobCount === undefined || isAiLoading;

    return (
        <div className="container" style={{ padding: 0 }}>
            {/* Advanced Filter Bar */}
            <header className="mb-12">
                <h1 className="text-5xl font-black mb-4 tracking-tighter">Global <span className="gradient-text">Opportunities</span></h1>
                <p className="text-text-muted font-medium opacity-80 max-w-xl">
                    Discover and secure high-value contracts on the most efficient freelance protocol.
                </p>
            </header>

            <div className="glass-card mb-12 !border-white/5 relative overflow-hidden">
                {isAiLoading && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-primary animate-shimmer" />
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
                    <div className="relative lg:col-span-2">
                        <Search size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${searchQuery ? 'text-purple-400' : 'text-text-dim'}`} />
                        <input
                            type="text"
                            placeholder="Try 'I want a solidity developer budget 1000'..."
                            className="input-field !pl-12 w-full border-white/10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && !isAiLoading && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <Sparkles size={12} className="text-purple-400" />
                                <span className="text-[10px] font-black text-purple-400 uppercase tracking-tighter">AI Active</span>
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
                        <select
                            className="input-field !pl-10 !appearance-none"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        >
                            <option>All Categories</option>
                            <option>Development</option>
                            <option>Design</option>
                            <option>Marketing</option>
                            <option>Writing</option>
                        </select>
                    </div>

                    <select
                        className="input-field"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Statuses</option>
                        <option value="0">Open 🟢</option>
                        <option value="2">Ongoing ⏳</option>
                        <option value="4">Completed ✨</option>
                        <option value="3">Disputed ⚖️</option>
                    </select>

                    <div className="relative">
                        <ArrowUpDown size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
                        <select
                            className="input-field !pl-10 !appearance-none"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option>Newest</option>
                            <option>Oldest</option>
                            <option>Budget: High to Low</option>
                        </select>
                    </div>

                    <input
                        type="number"
                        placeholder="Min Budget"
                        className="input-field"
                        value={minBudget}
                        onChange={(e) => setMinBudget(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid-marketplace">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="glass-card skeleton skeleton-card !bg-white/5 opacity-50" />
                    ))
                ) : count === 0 ? (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '80px', gridColumn: '1 / -1' }}>
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div style={{
                                width: '80px',
                                height: '80px',
                                background: 'rgba(99, 102, 241, 0.1)',
                                borderRadius: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 24px auto'
                            }}>
                                <Briefcase size={40} style={{ color: 'var(--primary)' }} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>No opportunities found</h2>
                            <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
                                Be the pioneer. Post the first high-quality job and start building the future of decentralized work.
                            </p>
                        </motion.div>
                    </div>
                ) : (
                    jobIds.map((id, i) => (
                        <motion.div
                            key={id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05, duration: 0.4 }}
                        >
                            <JobCard
                                jobId={id}
                                categoryFilter={filter}
                                searchQuery={searchQuery}
                                minBudget={minBudget}
                                statusFilter={statusFilter}
                                onUserClick={onUserClick}
                                onSelectChat={onSelectChat}
                                gasless={gasless}
                            />
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}

const JobCard = React.memo(({ jobId, categoryFilter, searchQuery, minBudget, statusFilter, onUserClick, onSelectChat, gasless }) => {
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();
    const [metadata, setMetadata] = React.useState(null);
    const [matchScore, setMatchScore] = React.useState(null);
    const [isApproving, setIsApproving] = React.useState(false);
    const [smartAccount, setSmartAccount] = useState(null);
    const { convertToUsd } = useTokenPrice('MATIC');

    const { data: job, refetch } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        functionName: 'jobs',
        args: [BigInt(jobId)],
    });

    const { data: arbitrator } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        functionName: 'arbitrator',
    });

    const { data: hash, writeContract, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    useTransactionToast(hash, isPending, isConfirming, isSuccess, error);

    React.useEffect(() => {
        if (isSuccess) refetch();
    }, [isSuccess]);

    React.useEffect(() => {
        if (gasless && walletClient && !smartAccount) {
            createBiconomySmartAccount(walletClient).then(setSmartAccount).catch(console.error);
        }
    }, [gasless, walletClient, smartAccount]);

    const [inView, setInView] = React.useState(false);
    const cardRef = React.useRef();

    React.useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) setInView(true);
        }, { threshold: 0.1 });
        if (cardRef.current) observer.observe(cardRef.current);
        return () => observer.disconnect();
    }, []);

    React.useEffect(() => {
        if (!inView) return;
        const fetchMetadata = async () => {
            try {
                const data = await api.getJobMetadata(jobId);
                setMetadata(data);

                if (address) {
                    const matches = await api.getJobMatches(jobId);
                    const myMatch = matches.find(m => m.address.toLowerCase() === address.toLowerCase());
                    if (myMatch) setMatchScore(myMatch.matchScore);
                }
            } catch (err) {
                console.error('Failed to fetch job metadata/matches:', err);
            }
        };
        fetchMetadata();
    }, [jobId, address, inView]);

    if (!job) return null;

    const [client, id, deadline, status, rating, freelancer, categoryId, milestoneCount, paid, token, amount, freelancerStake, totalPaidOut, ipfsHash] = job;
    const tokenInfo = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === token.toLowerCase()) || SUPPORTED_TOKENS[0];
    const currency = tokenInfo.symbol;
    const decimals = tokenInfo.decimals;

    // Filter logic
    const categoryMatches = categoryFilter === 'All Categories' || categoryFilter === 'All' || metadata?.category === categoryFilter;
    const searchMatches = !searchQuery ||
        metadata?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        metadata?.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const budgetMatches = !minBudget || Number(formatUnits(amount, decimals)) >= Number(minBudget);
    const statusMatches = statusFilter === 'All' || status.toString() === statusFilter;

    if (!categoryMatches || !searchMatches || !budgetMatches || !statusMatches) return null;

    const isClient = address?.toLowerCase() === client.toLowerCase();
    const isFreelancer = address?.toLowerCase() === freelancer.toLowerCase();
    const isArbitrator = address?.toLowerCase() === arbitrator?.toLowerCase();

    const handleAccept = () => {
        const requiredStake = (amount * 10n) / 100n;
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: FreelanceEscrowABI.abi,
            functionName: 'acceptJob',
            args: [BigInt(jobId)],
            value: token === '0x0000000000000000000000000000000000000000' ? requiredStake : 0n,
        });
    };

    const handleRelease = () => {
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: FreelanceEscrowABI.abi,
            functionName: 'releaseFunds',
            args: [BigInt(jobId)],
        });
    };

    const handleSubmit = async () => {
        const text = prompt('Enter your work summary:');
        if (!text) return;

        let ipfsHash = text;
        try {
            ipfsHash = await uploadJSONToIPFS({
                type: 'work_submission',
                jobId,
                freelancer: address,
                content: text,
                timestamp: Date.now()
            });
        } catch (err) { console.error(err); }

        if (gasless && walletClient && smartAccount) {
            try {
                await submitWorkGasless(smartAccount, CONTRACT_ADDRESS, FreelanceEscrowABI.abi, Number(jobId), ipfsHash);
                refetch();
                return;
            } catch (err) {
                console.error('[BICONOMY] Gasless submission failed:', err);
            }
        }

        writeContract({
            address: CONTRACT_ADDRESS,
            abi: FreelanceEscrowABI.abi,
            functionName: 'submitWork',
            args: [BigInt(jobId), ipfsHash],
        });
    };

    return (
        <div ref={cardRef} className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div className={`badge ${status === 3 ? 'badge-warning' : 'badge-info'}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {status === 0 && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />}
                    {statusLabels[status]}
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginBottom: '4px' }}>
                        <div className="text-[9px] font-black tracking-widest text-primary uppercase opacity-60">Zenith Secured</div>
                        <Sparkles size={10} className="text-primary" />
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', fontFamily: 'Outfit' }}>
                        {formatUnits(amount, decimals)} {currency}
                    </div>
                    {currency === 'MATIC' && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 'bold', marginTop: '-2px', textAlign: 'right', opacity: 0.8 }}>
                            ~${convertToUsd(amount, decimals).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                        </div>
                    )}
                    {address && status === 0 && (
                        <AiMatchRating jobId={jobId} freelancerAddress={address} />
                    )}
                </div>
            </div>

            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--text-main)' }}>
                {metadata?.title || `Premium Gig #${jobId}`}
            </h3>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                    {metadata?.category || 'General'}
                </span>
                {deadline > 0n && (
                    <span className="badge" style={{
                        background: Math.floor(Date.now() / 1000) > Number(deadline) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                        color: Math.floor(Date.now() / 1000) > Number(deadline) ? 'var(--danger)' : 'var(--text-dim)',
                        fontSize: '0.7rem'
                    }}>
                        🕒 {new Date(Number(deadline) * 1000).toLocaleDateString()}
                    </span>
                )}
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px', flex: 1 }}>
                {metadata?.description?.slice(0, 160) || 'Secure decentralized work agreement with automated escrow protection.'}
                {metadata?.description?.length > 160 && '...'}
            </p>

            <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(45deg, #6366f1, #a855f7)' }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Client:</span>
                        <UserLink address={client} style={{ fontSize: '0.85rem' }} />
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: freelancer !== '0x0000000000000000000000000000000000000000' ? 'linear-gradient(45deg, #10b981, #3b82f6)' : '#334155' }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Pro:</span>
                        {freelancer === '0x0000000000000000000000000000000000000000' ? (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Seeking...</span>
                        ) : (
                            <UserLink address={freelancer} style={{ fontSize: '0.85rem' }} />
                        )}
                    </div>
                    {/* Chat Button Integration */}
                    <button
                        onClick={() => onSelectChat(isClient ? freelancer : client)}
                        className="btn-ghost"
                        style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px' }}
                    >
                        <MessageSquare size={14} />
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
                {!isClient && !isFreelancer && status === 0 && (
                    <button onClick={handleAccept} className="btn-primary" style={{ width: '100%' }} disabled={isPending || isConfirming}>
                        Pick Gig
                    </button>
                )}

                {isFreelancer && (status === 1 || status === 2) && (
                    <button onClick={handleSubmit} className="btn-primary" style={{ width: '100%' }} disabled={isPending || isConfirming}>
                        Deliver Work
                    </button>
                )}

                {isClient && status === 2 && (
                    <button onClick={handleRelease} className="btn-primary" style={{ width: '100%', background: 'var(--accent)' }} disabled={isPending || isConfirming}>
                        Approve & Pay
                    </button>
                )}

                {status === 4 && (
                    <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--accent)', fontWeight: '700' }}>
                        <CheckCircle size={20} /> Project Completed
                    </div>
                )}
            </div>
        </div>
    );
}); // Closing memo

export default JobsList;
