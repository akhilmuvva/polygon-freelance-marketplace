import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useAccount, useWalletClient, useWriteContract } from 'wagmi';
import React, { useState, useEffect } from 'react';
import { 
    RefreshCcw, Search, Filter, Briefcase, Rocket, Zap, 
    ArrowUpDown, Loader2, CheckCircle2, ChevronRight,
    MapPin, Clock
} from 'lucide-react';
import { formatUnits, parseUnits } from 'viem';
import { SUPPORTED_TOKENS, CONTRACT_ADDRESS } from '../constants';
import UserLink from './UserLink';
import AiMatchRating from './AiMatchRating';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import JobService from '../services/JobService';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import ProofOfWorkBadge from './ProofOfWorkBadge';
import JobDetailsModal from './JobDetailsModal';
import './JobsList.css';

const GET_JOBS = gql`
    query GetJobs {
        jobs(orderBy: createdAt, orderDirection: desc, first: 100) {
            id
            jobId
            client
            freelancer
            amount
            status
            deadline
            categoryId
            ipfsHash
            createdAt
            token
        }
    }
`;

const JobsList = ({ onSelectChat, onFiatPay, address: propAddress }) => {
    const { address: wagmiAddress, isConnected } = useAccount();
    const address = propAddress || wagmiAddress;
    
    const { loading: isLoadingJobs, data: subgraphData, refetch: fetchSubgraph } = useQuery(GET_JOBS, {
        pollInterval: 15000,
        errorPolicy: 'all',
    });

    const jobs = subgraphData?.jobs || [];
    const [filter, setFilter] = useState('All Categories');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('Newest');
    const [showMyJobs, setShowMyJobs] = useState(false);

    const filteredJobs = React.useMemo(() => {
        const pendingJobs = JSON.parse(localStorage.getItem('zenith_pending_jobs') || '[]');
        const localIntents = pendingJobs.map(intent => ({
            ...intent,
            jobId: 'INTENT-' + (intent.ipfsHash ? intent.ipfsHash.slice(-6).toUpperCase() : Math.random().toString(36).substring(7).toUpperCase()),
            status: '0', 
            isIntent: true
        }));

        let res = [...jobs, ...localIntents];

        if (filter !== 'All Categories') {
            res = res.filter(j => (j.categoryId?.toString() === filter || j.category === filter));
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            res = res.filter(j =>
                (j.jobId && j.jobId.toString().toLowerCase().includes(q)) ||
                (j.client && j.client.toLowerCase().includes(q)) ||
                (j.title && j.title.toLowerCase().includes(q))
            );
        }

        if (showMyJobs && address) {
            res = res.filter(j =>
                j.client?.toLowerCase() === address.toLowerCase() ||
                j.freelancer?.toLowerCase() === address.toLowerCase()
            );
        }

        if (sortBy === 'Newest') {
            res = res.sort((a, b) => {
                if (a.isIntent && !b.isIntent) return -1;
                if (!a.isIntent && b.isIntent) return 1;
                const idA = parseInt(a.jobId?.toString().replace(/\D/g, '')) || 0;
                const idB = parseInt(b.jobId?.toString().replace(/\D/g, '')) || 0;
                return idB - idA;
            });
        } else if (sortBy === 'Budget: High to Low') {
            res = res.sort((a, b) => {
                const getTokenDecimals = (job) => {
                    const token = SUPPORTED_TOKENS.find(t => 
                        (t.address?.toLowerCase() === job.token?.toLowerCase()) || 
                        (t.symbol?.toUpperCase() === job.token?.toUpperCase())
                    );
                    return token ? token.decimals : 18;
                };
                const valA = a.isIntent ? parseFloat(a.amount || 0) : Number(formatUnits(BigInt(a.amount || 0), getTokenDecimals(a)));
                const valB = b.isIntent ? parseFloat(b.amount || 0) : Number(formatUnits(BigInt(b.amount || 0), getTokenDecimals(b)));
                return valB - valA;
            });
        } else if (sortBy === 'Deadline') {
            res = res.sort((a, b) => Number(a.deadline || 0) - Number(b.deadline || 0));
        }

        return res;
    }, [jobs, filter, searchQuery, showMyJobs, address, sortBy]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08 }
        }
    };

    return (
        <div className="jobs-container">
            <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="jobs-header"
            >
                <div>
                    <h1 className="jobs-title">
                        Active <span className="shimmer-text">Missions</span>
                    </h1>
                    <p className="jobs-subtitle">
                        Access high-impact sovereign contracts across the decentralized mesh.
                    </p>
                </div>
                <div className="jobs-actions">
                    <button 
                        onClick={() => fetchSubgraph()} 
                        className="btn-secondary btn-sm"
                    >
                        <RefreshCcw size={14} className={isLoadingJobs ? 'animate-spin' : ''} />
                        Sync Mesh
                    </button>
                    <button 
                        onClick={() => window.dispatchEvent(new CustomEvent('NAV_TO_CREATE'))} 
                        className="btn-primary btn-sm"
                    >
                        <Zap size={14} />
                        Initiate Mission
                    </button>
                </div>
            </motion.header>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="filter-bar"
            >
                <div className="filter-input-wrapper">
                    <Search className="filter-icon" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search mission parameters..." 
                        className="filter-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="filter-input-wrapper">
                    <Filter className="filter-icon" size={14} />
                    <select 
                        className="filter-select"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option>All Categories</option>
                        <option>Development</option>
                        <option>Design</option>
                        <option>Marketing</option>
                    </select>
                </div>

                <div className="filter-input-wrapper">
                    <ArrowUpDown className="filter-icon" size={14} />
                    <select 
                        className="filter-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option>Newest</option>
                        <option>Budget: High to Low</option>
                        <option>Deadline</option>
                    </select>
                </div>

                <div className="filter-toggle">
                    <span className="toggle-label">My Missions</span>
                    <button 
                        onClick={() => setShowMyJobs(!showMyJobs)}
                        className="w-10 h-5 rounded-full transition-all relative"
                        style={{ background: showMyJobs ? 'var(--accent)' : 'rgba(255,255,255,0.1)' }}
                    >
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${showMyJobs ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>
            </motion.div>

            {isLoadingJobs ? (
                <div className="job-grid">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="skeleton h-64 rounded-3xl" />
                    ))}
                </div>
            ) : filteredJobs.length === 0 ? (
                <div className="empty-missions-state">
                    <Briefcase size={64} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: 24 }} />
                    <h3 className="empty-missions-title">No Missions Detected</h3>
                    <p className="empty-missions-desc">The decentralized coordination mesh returned no active missions for your current parameters.</p>
                </div>
            ) : (
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="job-grid"
                >
                    {filteredJobs.map((job) => (
                        <JobCard 
                            key={job.jobId} 
                            job={job} 
                            address={address} 
                            isConnected={isConnected}
                            onSelectChat={onSelectChat} 
                            onFiatPay={onFiatPay} 
                        />
                    ))}
                </motion.div>
            )}
        </div>
    );
};

const JobCard = ({ job, address, isConnected, onSelectChat, onFiatPay }) => {
    const tokenInfo = SUPPORTED_TOKENS.find(t => 
        (t.address?.toLowerCase() === job.token?.toLowerCase()) || 
        (t.symbol?.toUpperCase() === job.token?.toUpperCase())
    ) || SUPPORTED_TOKENS[0];
    
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const { writeContract, writeContractAsync, isPending } = useWriteContract();

    const [meta, setMeta] = useState({
        title: job.title || 'Loading Mission...',
        description: job.description || 'Decrypting decentralized metadata...',
        category: job.category || 'General'
    });

    useEffect(() => {
        const resolve = async () => {
            if (!job.title || !job.description) {
                const resolved = await JobService.resolveMetadata(job.ipfsHash);
                if (resolved && resolved.type !== 'ProofOfWork') {
                    setMeta(resolved);
                }
            }
        };
        resolve();
    }, [job.ipfsHash, job.title, job.description]);

    const isClient = address?.toLowerCase() === job.client?.toLowerCase();
    const isFreelancer = address?.toLowerCase() === job.freelancer?.toLowerCase();

    const STATUS_MAP = { 'Created': 0, 'Accepted': 1, 'Ongoing': 2, 'Disputed': 3, 'Arbitration': 4, 'Completed': 5, 'Cancelled': 6 };
    const statusCode = typeof job.status === 'string' ? (STATUS_MAP[job.status] ?? 0) : Number(job.status || 0);
    
    const statusConfig = {
        0: { label: 'Open', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
        1: { label: 'Hiring', color: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/20' },
        2: { label: 'Active', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
        3: { label: 'Disputed', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
        4: { label: 'Arbitration', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
        5: { label: 'Completed', color: 'text-zinc-400', bg: 'bg-white/10', border: 'border-white/10' },
        default: { label: 'Inactive', color: 'text-zinc-500', bg: 'bg-white/5', border: 'border-white/5' }
    };
    
    const config = statusConfig[statusCode] || statusConfig.default;

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const actuateApplyIntent = async () => {
        if (job.isIntent) return toast.error('Local intent must be finalized on-chain.');
        try {
            let amountBigInt = job.isIntent ? parseUnits(job.amount || '0', tokenInfo.decimals) : BigInt(job.amount || '0');
            const stake = (amountBigInt * 5n) / 100n;
            const isNative = !job.token || job.token === '0x0000000000000000000000000000000000000000';

            if (!isNative && stake > 0n) {
                toast.loading('Authorizing escrow lock...', { id: 'applyReq' });
                await writeContractAsync({
                    address: job.token,
                    abi: [{ type: 'function', name: 'approve', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] }],
                    functionName: 'approve',
                    args: [CONTRACT_ADDRESS, stake]
                });
            }

            writeContract({
                address: CONTRACT_ADDRESS,
                abi: FreelanceEscrowABI.abi,
                functionName: 'applyForJob',
                args: [BigInt(job.jobId)],
                value: isNative ? stake : 0n,
                gas: 1000000n
            });
            toast.success('Application broadcasted.', { id: 'applyReq' });
        } catch (err) {
            toast.error('Application friction detected.', { id: 'applyReq' });
        }
    };

    return (
        <motion.div 
            variants={itemVariants}
            className="job-card"
        >
            <div className="card-top">
                <div className={`status-badge ${config.bg} ${config.color} ${config.border}`}>
                    {meta.category} • {config.label}
                </div>
                <div className="budget-wrap">
                    <span className="budget-amount">
                        {job.isIntent ? parseFloat(job.amount || 0).toLocaleString() : formatUnits(BigInt(job.amount || '0'), tokenInfo.decimals)}
                    </span>
                    <span className="budget-symbol">{tokenInfo.symbol}</span>
                </div>
            </div>

            <h3 className="card-title">{meta.title}</h3>

            {statusCode === 2 && (
                <div className="mb-4 relative z-10">
                    <ProofOfWorkBadge
                        ipfsHash={job.ipfsHash}
                        status={statusCode}
                        isClient={isClient}
                        onReleaseFunds={() => {}}
                    />
                </div>
            )}

            <p className="card-desc">{meta.description}</p>

            <div className="card-meta">
                <div className="meta-item">
                    <span className="meta-label">Contract Client</span>
                    <div className="meta-value">
                        <UserLink address={job.client} />
                    </div>
                </div>
                <div className="meta-item">
                    <span className="meta-label">Deadline</span>
                    <div className="meta-value">
                        <Clock size={14} className="text-zinc-500" />
                        {isNaN(Number(job.deadline)) ? 'Open Ended' : new Date(Number(job.deadline) * 1000).toLocaleDateString()}
                    </div>
                </div>
            </div>

            <div className="card-footer">
                {statusCode === 0 && !isClient && (
                    <button 
                        disabled={!isConnected || isPending}
                        onClick={actuateApplyIntent} 
                        className="btn-primary flex-1 btn-sm"
                    >
                        {isPending ? <Loader2 size={14} className="animate-spin" /> : <><Zap size={14} /> Commit Proof</>}
                    </button>
                )}
                <button 
                    onClick={() => setIsDetailsOpen(true)} 
                    className="btn-secondary flex-1 btn-sm"
                >
                    Telemetry <ChevronRight size={14} />
                </button>
            </div>

            {address && (
                <div className="mt-6 pt-4 border-t border-white/5">
                    <AiMatchRating jobId={job.jobId} freelancerAddress={address} />
                </div>
            )}

            <JobDetailsModal 
                isOpen={isDetailsOpen} 
                onClose={() => setIsDetailsOpen(false)} 
                job={job} 
                meta={meta} 
                tokenInfo={tokenInfo}
                onSelectChat={onSelectChat}
                onFiatPay={onFiatPay}
                onAccept={() => {}}
                onApply={actuateApplyIntent}
                onPickFreelancer={(f) => {
                    const id = job.jobId;
                    if (!id || isNaN(id)) return toast.error('Invalid mission ID.');
                    writeContract({
                        address: CONTRACT_ADDRESS,
                        abi: FreelanceEscrowABI.abi,
                        functionName: 'pickFreelancer',
                        args: [BigInt(id), f],
                        gas: 1000000n
                    });
                    toast.success('Specialist Assigned.');
                }}
                address={address}
                isEligibleToApply={statusCode === 0 && !isClient}
                isEligibleToAccept={statusCode === 1 && isFreelancer}
            />
        </motion.div>
    );
};

export default JobsList;
