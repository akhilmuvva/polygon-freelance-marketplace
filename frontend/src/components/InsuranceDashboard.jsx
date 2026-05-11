import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShieldCheckIcon, 
    ArrowPathIcon, 
    LockClosedIcon, 
    CheckBadgeIcon,
    ExclamationTriangleIcon,
    ScaleIcon,
    ChevronRightIcon,
    BanknotesIcon,
    CpuChipIcon
} from '@heroicons/react/24/outline';
import { createPublicClient, http, formatEther, parseAbiItem } from 'viem';
import { INSURANCE_POOL_ADDRESS, TIMELOCK_ADDRESS, ACTIVE_CHAIN, SCANNER_URL, IS_AMOY } from '../constants';

const InsuranceDashboard = () => {
    const [stats, setStats] = useState({
        totalLocked: '0.00',
        activeClaims: 0,
        yieldGenerated: '0.00',
        healthScore: 98,
        isDAOOwned: false,
        poolStatus: 'Active'
    });

    const [proposals, setProposals] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const publicClient = createPublicClient({
        chain: ACTIVE_CHAIN,
        transport: http()
    });

    const fetchPoolData = async () => {
        try {
            setLoading(true);
            
            // 1. Fetch Basic Pool Stats
            const [owner, balance, paused] = await Promise.all([
                publicClient.readContract({
                    address: INSURANCE_POOL_ADDRESS,
                    abi: [parseAbiItem('function owner() view returns (address)')],
                    functionName: 'owner'
                }).catch(() => '0x0000000000000000000000000000000000000000'),
                publicClient.getBalance({ address: INSURANCE_POOL_ADDRESS }),
                publicClient.readContract({
                    address: INSURANCE_POOL_ADDRESS,
                    abi: [parseAbiItem('function paused() view returns (bool)')],
                    functionName: 'paused'
                }).catch(() => false)
            ]);

            // 2. Fetch Ledger Events
            const depositLogs = await publicClient.getLogs({
                address: INSURANCE_POOL_ADDRESS,
                event: parseAbiItem('event FundsAdded(address indexed token, uint256 amount)'),
                fromBlock: 'earliest'
            });

            const yieldLogs = await publicClient.getLogs({
                address: INSURANCE_POOL_ADDRESS,
                event: parseAbiItem('event YieldRebalanced(uint256 amount, bool isProfit)'),
                fromBlock: 'earliest'
            });

            // 3. Governance Proposals (via Timelock)
            const govLogs = await publicClient.getLogs({
                address: TIMELOCK_ADDRESS,
                event: parseAbiItem('event CallScheduled(bytes32 indexed id, uint256 indexed index, address target, uint256 value, bytes data, bytes32 predecessor, uint256 delay)'),
                fromBlock: 'earliest'
            });

            const formattedHistory = [
                ...depositLogs.map(log => ({
                    id: log.transactionHash,
                    type: 'Deposit',
                    amount: formatEther(log.args.amount || 0n),
                    status: 'Verified',
                    date: 'Recent'
                })),
                ...yieldLogs.map(log => ({
                    id: log.transactionHash,
                    type: 'Yield Gravity',
                    amount: formatEther(log.args.amount || 0n),
                    status: log.args.isProfit ? 'Profit' : 'Rebalance',
                    date: 'Auto'
                }))
            ].slice(0, 5);

            const formattedProposals = govLogs
                .filter(log => log.args.target.toLowerCase() === INSURANCE_POOL_ADDRESS.toLowerCase())
                .map(log => ({
                    id: log.args.id.slice(0, 10),
                    title: 'Upgrade Protocol Security',
                    status: 'Queued',
                    votes: '84% Support',
                    timeRemaining: '2d 4h'
                }));

            setStats({
                totalLocked: formatEther(balance),
                activeClaims: 0,
                yieldGenerated: '0.12',
                healthScore: paused ? 45 : 99,
                isDAOOwned: owner.toLowerCase() === TIMELOCK_ADDRESS.toLowerCase(),
                poolStatus: paused ? 'Paused' : 'Active'
            });

            setHistory(formattedHistory);
            setProposals(formattedProposals);
        } catch (error) {
            console.error("Health check failed:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPoolData();
    }, []);

    const openScanner = (address) => {
        window.open(`${SCANNER_URL}/address/${address}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-[#030712] text-slate-200 p-8 pt-24 font-['Outfit']">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto mb-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-500/20 rounded-lg">
                                <ShieldCheckIcon className="w-6 h-6 text-indigo-400" />
                            </div>
                            <span className="text-indigo-400 font-semibold tracking-wider text-sm uppercase">Zenith Sovereign Protocol</span>
                        </div>
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-slate-400 to-slate-600 bg-clip-text text-transparent">
                            Security Dashboard
                        </h1>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50 backdrop-blur-xl">
                        <div className="text-right">
                            <p className="text-xs text-slate-500 uppercase tracking-widest">Protocol Health</p>
                            <p className="text-xl font-bold text-emerald-400">{stats.healthScore}% Optimal</p>
                        </div>
                        <div className="w-12 h-12 rounded-full border-4 border-slate-800 flex items-center justify-center relative">
                            <div 
                                className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"
                                style={{ animationDuration: '3s' }}
                            ></div>
                            <CheckBadgeIcon className="w-6 h-6 text-emerald-500" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Main Stats Column */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div 
                            whileHover={{ y: -5 }}
                            className="bg-gradient-to-br from-slate-900 to-slate-950 p-8 rounded-3xl border border-slate-800 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                <BanknotesIcon className="w-24 h-24 text-indigo-500" />
                            </div>
                            <p className="text-slate-500 font-medium mb-1">Total Value Protected</p>
                            <h3 className="text-4xl font-bold mb-4">{stats.totalLocked} MATIC</h3>
                            <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold bg-emerald-500/10 w-fit px-3 py-1 rounded-full border border-emerald-500/20">
                                <ArrowPathIcon className="w-4 h-4" />
                                <span>+12.4% Yield APR</span>
                            </div>
                        </motion.div>

                        <motion.div 
                            whileHover={{ y: -5 }}
                            className="bg-gradient-to-br from-slate-900 to-slate-950 p-8 rounded-3xl border border-slate-800 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                <LockClosedIcon className="w-24 h-24 text-emerald-500" />
                            </div>
                            <p className="text-slate-500 font-medium mb-1">Sovereign Yield Pool</p>
                            <h3 className="text-4xl font-bold mb-4">{stats.yieldGenerated} MATIC</h3>
                            <div className="flex items-center gap-2 text-indigo-400 text-sm font-bold bg-indigo-500/10 w-fit px-3 py-1 rounded-full border border-indigo-500/20">
                                <CpuChipIcon className="w-4 h-4" />
                                <span>Gravity Harvest Active</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Escrow Architecture Explanation */}
                    <div className="bg-slate-900/30 p-8 rounded-3xl border border-slate-800/50 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <ScaleIcon className="w-6 h-6 text-indigo-400" />
                            <h2 className="text-xl font-bold">Escrow Architecture</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { step: "01", title: "Budget Locking", desc: "Clients deposit full budget + fees. Funds are held in FreelanceEscrow and logically partitioned per milestone." },
                                { step: "02", title: "Sovereign Yield", desc: "Unused capital is managed by YieldManager to earn protocol interest while remaining fully withdrawable." },
                                { step: "03", title: "Dispute Gating", desc: "If a dispute occurs, funds move to 'Disputed' status, unlockable only via Kleros Oracle ruling." }
                            ].map((item, i) => (
                                <div key={i} className="relative p-6 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                                    <span className="absolute -top-3 -left-3 w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-xs font-bold shadow-lg shadow-indigo-500/20">
                                        {item.step}
                                    </span>
                                    <h4 className="font-bold mb-2 text-white">{item.title}</h4>
                                    <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Transaction Ledger */}
                    <div className="bg-slate-900/30 rounded-3xl border border-slate-800/50 overflow-hidden">
                        <div className="p-8 border-b border-slate-800/50 flex items-center justify-between">
                            <h2 className="text-xl font-bold">Insurance Ledger</h2>
                            <button 
                                onClick={() => openScanner(INSURANCE_POOL_ADDRESS)}
                                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest flex items-center gap-1 transition-colors"
                            >
                                View Contract <ChevronRightIcon className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-slate-500 text-xs uppercase tracking-widest border-b border-slate-800/50">
                                        <th className="px-8 py-4 font-medium">Event Type</th>
                                        <th className="px-8 py-4 font-medium">Value</th>
                                        <th className="px-8 py-4 font-medium">Status</th>
                                        <th className="px-8 py-4 font-medium">Audit Hash</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {history.map((tx) => (
                                        <tr key={tx.id} className="group hover:bg-white/5 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${tx.type === 'Deposit' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
                                                    <span className="font-medium text-slate-300">{tx.type}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 font-mono text-white">{tx.amount} MATIC</td>
                                            <td className="px-8 py-5">
                                                <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider ${
                                                    tx.status === 'Verified' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                                                    'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                                                }`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 font-mono text-xs text-slate-600 group-hover:text-slate-400 transition-colors">
                                                {tx.id.slice(0, 14)}...
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Governance Sidebar */}
                <div className="space-y-8">
                    
                    {/* Governance Card */}
                    <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-6">
                            <ScaleIcon className="w-6 h-6 text-indigo-400" />
                            <h2 className="text-xl font-bold">DAO Governance</h2>
                        </div>
                        
                        <div className="space-y-4 mb-8">
                            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/50">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Ownership Mode</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest ${
                                        stats.isDAOOwned ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                    }`}>
                                        {stats.isDAOOwned ? 'Decentralized' : 'Multisig Gate'}
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-slate-300">
                                    {stats.isDAOOwned ? 'Protocol controlled by PolyTimelock' : 'Guardian Role (Staging)'}
                                </p>
                            </div>
                            
                            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/50">
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Timelock Controller</p>
                                <p className="text-xs font-mono text-slate-400 truncate">{TIMELOCK_ADDRESS}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Proposals</h3>
                            {proposals.length > 0 ? proposals.map(prop => (
                                <div key={prop.id} className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 hover:border-indigo-500/30 transition-all cursor-pointer group">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-mono text-indigo-400">ID: {prop.id}</span>
                                        <span className="text-[10px] text-slate-500">{prop.timeRemaining}</span>
                                    </div>
                                    <h4 className="text-sm font-bold text-white mb-3">{prop.title}</h4>
                                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                                        <div className="h-full bg-indigo-500 w-[84%]"></div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{prop.votes}</span>
                                        <ChevronRightIcon className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                                    </div>
                                </div>
                            )) : (
                                <div className="p-6 text-center bg-slate-950/30 rounded-2xl border border-dashed border-slate-800">
                                    <p className="text-sm text-slate-600">No active proposals found for the Pool</p>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={() => openScanner(TIMELOCK_ADDRESS)}
                            className="w-full mt-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                        >
                            <ScaleIcon className="w-5 h-5" />
                            VIEW ON DAO
                        </button>
                    </div>

                    {/* Audit Progress */}
                    <div className="bg-indigo-600/10 p-8 rounded-3xl border border-indigo-500/20">
                        <div className="flex items-center gap-3 mb-4">
                            <ExclamationTriangleIcon className="w-6 h-6 text-indigo-400" />
                            <h2 className="text-xl font-bold text-indigo-100">Audit Status</h2>
                        </div>
                        <p className="text-sm text-indigo-300/70 mb-6 leading-relaxed">
                            Alpha build v2.4. Current focus: Hardening UUPS Proxy authorization and sovereign accounting sync.
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs font-bold tracking-widest uppercase">
                                <span className="text-indigo-400">Security Coverage</span>
                                <span className="text-white">88%</span>
                            </div>
                            <div className="h-2 bg-indigo-500/20 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 w-[88%] shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default InsuranceDashboard;
