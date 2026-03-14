import { useQuery } from '@apollo/client/react/index.js';
import { gql } from '@apollo/client/core/index.js';
import { useAccount, useWalletClient, useWriteContract } from 'wagmi';
import React, { useState, useEffect, useRef } from 'react';
// import axios from 'axios';
import { useAnimeAnimations } from '../hooks/useAnimeAnimations';
import { createBiconomySmartAccount } from '../utils/biconomy';
import { RefreshCcw, Search, Filter, ChevronDown, Briefcase, Calendar, DollarSign, ArrowRight, ArrowUpDown, MessageSquare, CreditCard, Rocket, Zap } from 'lucide-react';
import { formatUnits } from 'viem';
import { SUPPORTED_TOKENS, CONTRACT_ADDRESS } from '../constants';
import UserLink from './UserLink';
import AiMatchRating from './AiMatchRating';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import JobService from '../services/JobService';
import SubgraphService from '../services/SubgraphService';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import ProofOfWorkModal from './ProofOfWorkModal';
import ProofOfWorkBadge from './ProofOfWorkBadge';
import JobDetailsModal from './JobDetailsModal';

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
        }
    }
`;

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

const JobsList = ({ onSelectChat, onFiatPay, gasless, smartAccount: propSmartAccount, address: propAddress }) => {
    const { address: wagmiAddress } = useAccount();
    const address = propAddress || wagmiAddress;
    const { data: walletClient } = useWalletClient();
    const [smartAccount, setSmartAccount] = useState(null);
    const { staggerFadeIn, slideInLeft } = useAnimeAnimations();
    const headerRef = useRef(null);

    const { loading: isLoadingJobs, data: subgraphData, refetch: fetchSubgraph } = useQuery(GET_JOBS, {
        pollInterval: 15000,
        errorPolicy: 'all',
    });

    const jobs = subgraphData?.jobs || [];
    const [filter, setFilter] = useState('All Categories');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('Newest');
    const [statusFilter] = useState('All');
    const [showMyJobs, setShowMyJobs] = useState(false);
    const [isApiLoading] = useState(false);
    const [isAiLoading] = useState(false);

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

    const filteredJobs = React.useMemo(() => {
        // Merge Subgraph jobs with local intents from the Sovereign Mesh
        const localIntents = JSON.parse(localStorage.getItem('SOVEREIGN_INTENTS') || '[]')
            .map(intent => ({
                ...intent,
                jobId: 'INTENT-' + (intent.ipfsHash ? intent.ipfsHash.slice(-6).toUpperCase() : Math.random().toString(36).substring(7).toUpperCase()),
                status: '0', // Native status for un-actuated intent
                isIntent: true
            }));

        let res = [...jobs, ...localIntents];

        if (filter !== 'All Categories') {
            res = res.filter(j => (j.categoryId?.toString() === filter || j.category === filter));
        }

        if (statusFilter !== 'All') {
            res = res.filter(j => j.status != null && j.status.toString() === statusFilter);
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
                // Safe numeric comparison for IDs
                const idA = parseInt(a.jobId?.toString().replace(/\D/g, '')) || 0;
                const idB = parseInt(b.jobId?.toString().replace(/\D/g, '')) || 0;
                return idB - idA;
            });
        } else if (sortBy === 'Budget: High to Low') {
            res = res.sort((a, b) => {
                const valA = a.isIntent ? parseFloat(a.amount || 0) : Number(formatUnits(BigInt(a.amount || 0), 6));
                const valB = b.isIntent ? parseFloat(b.amount || 0) : Number(formatUnits(BigInt(b.amount || 0), 6));
                return valB - valA;
            });
        } else if (sortBy === 'Deadline') {
            res = res.sort((a, b) => Number(a.deadline || 0) - Number(b.deadline || 0));
        }

        return res;
    }, [jobs, filter, statusFilter, searchQuery, showMyJobs, address, sortBy]);

    useEffect(() => {
        if (filteredJobs.length > 0) setTimeout(() => staggerFadeIn('.job-card-wrapper', 60), 100);
    }, [filteredJobs.length]);

    const isLoading = isLoadingJobs;

    /// @notice Actuates a state synchronization refresh from the decentralized subgraph mesh.
    const actuateRefreshIntent = () => {
        fetchSubgraph();
    };

    return (
        <div style={st.container}>
            <header ref={headerRef} style={st.header}>
                <div>
                    <h1 style={st.title}>
                        Find a <span style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>Job</span>
                    </h1>
                    <p style={st.subtitle}>
                        Find high-value blockchain opportunities and secure your next contract.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={actuateRefreshIntent} style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, padding: '10px 16px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                        <RefreshCcw size={16} style={{ animation: (isLoadingJobs || isApiLoading) ? 'spin 2s linear infinite' : 'none' }} />
                        Refresh
                    </button>
                    <button onClick={() => {
                        // Task: Synchronize with App's tab state mechanism
                        window.dispatchEvent(new CustomEvent('NAV_TO_CREATE'));
                    }} className="btn btn-primary" style={{ borderRadius: 12, padding: '10px 18px' }}>Create a Listing</button>
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
                        <JobCard key={job.jobId} job={job} address={address} onSelectChat={onSelectChat} onFiatPay={onFiatPay} />
                    ))}
                </div>
            )}
        </div>
    );
};


const JobCard = ({ job, address, onSelectChat, onFiatPay }) => {
    // Resilience Logic: Resolve token info by Address OR Symbol (for local intents)
    const tokenInfo = SUPPORTED_TOKENS.find(t => 
        (t.address?.toLowerCase() === job.token?.toLowerCase()) || 
        (t.symbol?.toUpperCase() === job.token?.toUpperCase())
    ) || SUPPORTED_TOKENS[0];
    const [isPoWOpen, setIsPoWOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Contract Interactions
    const { writeContract, writeContractAsync, isPending } = useWriteContract();

    // Local state for IPFS-resolved data
    const [meta, setMeta] = useState({
        title: job.title || 'Loading...',
        description: job.description || 'Fetching decentralized metadata...',
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

    // Status Logic
    const statusCode = Number(job.status || 0);
    const statusColor = statusCode === 5 ? 'var(--success)' : (statusCode === 3 || statusCode === 4) ? 'var(--danger)' : 'var(--accent-light)';

    /// @notice Actuates the final economic settlement for a milestone.
    /// @dev This confirms the "Weightless" transfer of value from escrow to the sovereign actor.
    const actuatePaymentIntent = async () => {
        if (!address) {
            toast.error('Identity required for settlement.');
            return;
        }

        try {
            // Actuating payment triggers a chain reaction: yield harvest, fee neutralization, and reputation level-up.
            writeContract({
                address: CONTRACT_ADDRESS,
                abi: FreelanceEscrowABI.abi,
                functionName: 'actuatePayment',
                args: [BigInt(job.jobId)],
                gas: 1000000n // Directive 02: Simulation Bypass for Functional Finality
            });
            toast.success('Settlement Intent Broadcasted');
        } catch (err) {
            console.error('[GRAVITY] Settlement failed:', err);
            toast.error('Settlement friction detected. Check gas resonance.');
        }
    };

    /// @notice Actuates the sovereign commitment to a contract.
    /// @dev This constitutes the "Proof of Intent" where a freelancer joins the escrow loop.
    const actuateAcceptanceIntent = async () => {
        if (typeof job.jobId === 'string' && job.jobId.startsWith('INTENT-')) {
            toast.error('This is a local intent. It must be finalized on-chain by the client before it can be accepted.');
            return;
        }
        try {
            writeContract({
                address: CONTRACT_ADDRESS,
                abi: FreelanceEscrowABI.abi,
                functionName: 'acceptJob',
                args: [BigInt(job.jobId)],
                gas: 1000000n
            });
            toast.success('Acceptance Intent Broadcasted');
        } catch (err) {
            console.error('[GRAVITY] Acceptance failed:', err);
            toast.error('Acceptance friction detected.');
        }
    };

    const actuateApplyIntent = async () => {
        if (typeof job.jobId === 'string' && job.jobId.startsWith('INTENT-')) {
            toast.error('This is a local intent. It must be finalized on-chain by the client before you can apply.');
            return;
        }

        try {
            // Harmonic Resolution: Handle both subgraph BigInts and local intent floats.
            let amountBigInt;
            if (job.isIntent) {
                amountBigInt = parseUnits(job.amount || '0', tokenInfo.decimals);
            } else {
                amountBigInt = BigInt(job.amount || '0');
            }
            
            const stake = (amountBigInt * 5n) / 100n; // 5% capacity stake required by Escrow
            const isNative = !job.token || job.token === '0x0000000000000000000000000000000000000000';

            if (!isNative && stake > 0n) {
                toast.loading('Authorizing escrow lock...', { id: 'applyReq' });
                await writeContractAsync({
                    address: job.token,
                    abi: [{ type: 'function', name: 'approve', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] }],
                    functionName: 'approve',
                    args: [CONTRACT_ADDRESS, stake]
                });
                toast.success('Escrow lock authorized.', { id: 'applyReq' });
            }

            writeContract({
                address: CONTRACT_ADDRESS,
                abi: FreelanceEscrowABI.abi,
                functionName: 'applyForJob',
                args: [BigInt(job.jobId)],
                value: isNative ? stake : 0n,
                gas: 1000000n
            });
            toast.success('Funds locked & application broadcasted.', { id: 'applyReq' });
        } catch (err) {
            console.error('[GRAVITY] Application failed:', err);
            toast.error('Application friction detected.', { id: 'applyReq' });
        }
    };

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
                    {meta.category} • {['Created', 'Accepted', 'Ongoing', 'Disputed', 'Arbitration', 'Completed', 'Cancelled'][statusCode]}
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>
                    {job.isIntent ? (
                        parseFloat(job.amount || 0).toLocaleString()
                    ) : (
                        formatUnits(BigInt(job.amount || '0'), tokenInfo.decimals)
                    )} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-tertiary)' }}>{tokenInfo.symbol}</span>
                </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 12, lineHeight: 1.4, color: '#fff' }}>{meta.title}</h3>

            {/* Proof of Work Showcase */}
            {statusCode === 2 && (
                <div style={{ marginBottom: 20 }}>
                    <ProofOfWorkBadge
                        ipfsHash={job.ipfsHash}
                        status={statusCode}
                        isClient={isClient}
                        onReleaseFunds={actuatePaymentIntent}
                    />
                </div>
            )}

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.6 }}>
                {meta.description}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Client</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600 }}><UserLink address={job.client} /></span>
                </div>
                {job.freelancer && job.freelancer !== '0x0000000000000000000000000000000000000000' && (
                    <>
                        <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Freelancer</span>
                            <span style={{ fontSize: '0.78rem', fontWeight: 600 }}><UserLink address={job.freelancer} shielded={true} /></span>
                        </div>
                    </>
                )}
                <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Deadline</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{isNaN(Number(job.deadline)) ? 'No deadline' : new Date(Number(job.deadline) * 1000).toLocaleDateString()}</span>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
                {isFreelancer && statusCode === 2 ? (
                    <button onClick={() => setIsPoWOpen(true)} className="btn btn-primary" style={{ flex: 1, height: 40, borderRadius: 10, fontSize: '0.8rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff' }}>
                        <Rocket size={15} /> Submit Proof
                    </button>
                ) : (statusCode === 0 || isNaN(statusCode)) ? (
                    <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                        <button onClick={actuateApplyIntent} className="btn btn-primary" style={{ flex: 1, height: 40, borderRadius: 10, fontSize: '0.8rem', background: 'linear-gradient(135deg, #10b981, #3b82f6)', color: '#fff' }}>
                            <Rocket size={14} /> Apply
                        </button>
                        <button onClick={actuateAcceptanceIntent} className="btn btn-secondary" style={{ flex: 1, height: 40, borderRadius: 10, fontSize: '0.8rem', border: '1px solid var(--accent-light)', color: 'var(--accent-light)' }}>
                            <Zap size={14} /> Accept
                        </button>
                    </div>
                ) : (
                    <button onClick={() => setIsDetailsOpen(true)} className="btn btn-primary" style={{ flex: 1, height: 40, borderRadius: 10, fontSize: '0.8rem', fontWeight: 700 }}>View Details</button>
                )}

                {onFiatPay && (
                    <button onClick={() => onFiatPay(job.freelancer || job.client)} className="btn btn-secondary" style={{ height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0 12px' }}>
                        <CreditCard size={14} /> <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>Fiat Pay</span>
                    </button>
                )}
                <button onClick={() => onSelectChat(job.client)} className="btn btn-ghost" style={{ width: 40, height: 40, padding: 0, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageSquare size={16} />
                </button>
            </div>

            <ProofOfWorkModal isOpen={isPoWOpen} onClose={() => setIsPoWOpen(false)} jobId={job.jobId} />
            <JobDetailsModal 
                isOpen={isDetailsOpen} 
                onClose={() => setIsDetailsOpen(false)} 
                job={job} 
                meta={meta} 
                tokenInfo={tokenInfo}
                onSelectChat={onSelectChat}
                onFiatPay={onFiatPay}
                onAccept={actuateAcceptanceIntent}
                onApply={actuateApplyIntent}
                isEligibleToApply={statusCode === 0 || isNaN(statusCode)}
                isEligibleToAccept={statusCode === 0 || isNaN(statusCode)}
            />

            {address && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <AiMatchRating jobId={job.jobId} freelancerAddress={address} />
                </div>
            )}
        </motion.div>
    );
};

export default JobsList;
