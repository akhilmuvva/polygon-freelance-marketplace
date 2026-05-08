import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, ShieldCheck, Landmark, DollarSign, Activity, PieChart, Lock, ArrowUpRight, History, Loader2 } from 'lucide-react';
import { useAccount, useReadContracts, usePublicClient } from 'wagmi';
import { formatUnits, parseAbiItem } from 'viem';
import { INSURANCE_POOL_ADDRESS, SUPPORTED_TOKENS, CHAINLINK_PRICE_FEEDS, PRICE_FEED_ABI } from '../constants';
import InsurancePoolABI from '../contracts/InsurancePool.json';
import toast from 'react-hot-toast';

const cardBg = { padding: 32, borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' };
const dimLabel = { fontSize: '0.68rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-tertiary)', marginBottom: 12, display: 'block' };

const InsuranceDashboard = () => {
    const { address } = useAccount();
    const publicClient = usePublicClient();
    const [ledger, setLedger] = useState([]);
    const [fetchingLogs, setFetchingLogs] = useState(true);
    const blockCache = useMemo(() => new Map(), []);

    // Prepare contract calls for all tokens + Price Feeds
    const calls = useMemo(() => {
        const c = [];
        // 1. Pool Data
        SUPPORTED_TOKENS.forEach(token => {
            c.push({
                address: INSURANCE_POOL_ADDRESS,
                abi: InsurancePoolABI.abi,
                functionName: 'balances',
                args: [token.address],
            });
            c.push({
                address: INSURANCE_POOL_ADDRESS,
                abi: InsurancePoolABI.abi,
                functionName: 'totalInsurancePool',
                args: [token.address],
            });
        });

        // 2. Price Feed Data (All supported tokens)
        SUPPORTED_TOKENS.forEach(token => {
            const feedAddress = CHAINLINK_PRICE_FEEDS[token.symbol];
            if (feedAddress && feedAddress !== '0x0000000000000000000000000000000000000000') {
                c.push({
                    address: feedAddress,
                    abi: PRICE_FEED_ABI,
                    functionName: 'latestRoundData',
                });
            }
        });

        return c;
    }, []);

    const { data: results, isLoading } = useReadContracts({
        contracts: calls,
    });

    // Fetch Shield Ledger (Deposits + Payouts)
    useEffect(() => {
        const fetchShieldLedger = async () => {
            if (!publicClient) return;
            try {
                setFetchingLogs(true);
                
                // 1. Fetch Payouts
                const payoutLogs = await publicClient.getLogs({
                    address: INSURANCE_POOL_ADDRESS,
                    event: parseAbiItem('event PayoutExecuted(address indexed token, address indexed recipient, uint256 amount)'),
                    fromBlock: 'earliest'
                });

                // 2. Fetch Deposits (Protocol Fees)
                const depositLogs = await publicClient.getLogs({
                    address: INSURANCE_POOL_ADDRESS,
                    event: parseAbiItem('event FundsAdded(address indexed token, uint256 amount)'),
                    fromBlock: 'earliest'
                });

                const allLogs = [
                    ...payoutLogs.map(l => ({ ...l, type: 'PAYOUT' })),
                    ...depositLogs.map(l => ({ ...l, type: 'DEPOSIT' }))
                ].sort((a, b) => Number(b.blockNumber - a.blockNumber)); // Newest first

                const formattedLedger = await Promise.all(allLogs.map(async (log, index) => {
                    const tokenAddr = log.args.token;
                    const token = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === tokenAddr.toLowerCase()) || { symbol: '???', decimals: 18 };
                    
                    // Fetch block with cache
                    let timestamp = 0;
                    if (blockCache.has(log.blockHash)) {
                        timestamp = blockCache.get(log.blockHash);
                    } else {
                        try {
                            const block = await publicClient.getBlock({ blockHash: log.blockHash });
                            timestamp = Number(block.timestamp);
                            blockCache.set(log.blockHash, timestamp);
                        } catch (e) {
                            console.warn("Could not fetch block timestamp for log", index);
                        }
                    }

                    const dateStr = timestamp ? new Date(timestamp * 1000).toLocaleDateString() : 'Recently';

                    return {
                        id: `${log.type}-${index}`,
                        type: log.type,
                        token: token.symbol,
                        amount: formatUnits(log.args.amount, token.decimals),
                        recipient: log.args.recipient ? `${log.args.recipient.slice(0, 6)}...${log.args.recipient.slice(-4)}` : 'Shield Pool',
                        reason: log.type === 'PAYOUT' ? 'Insurance Claim Executed' : 'Protocol Fee Collection',
                        date: dateStr,
                        hash: log.transactionHash,
                        status: 'SUCCESS'
                    };
                }));

                setLedger(formattedLedger);
            } catch (err) {
                console.error("Failed to fetch Shield ledger:", err);
                toast.error("Real-time ledger indexing failed");
            } finally {
                setFetchingLogs(false);
            }
        };

        fetchShieldLedger();
    }, [publicClient, blockCache]);

    const stats = useMemo(() => {
        if (!results) return { totalUSD: 0, availableUSD: 0, payoutsUSD: 0, breakDown: [] };
        
        let totalUSD = 0;
        let availableUSD = 0;
        let payoutsUSD = 0;
        const breakDown = [];

        SUPPORTED_TOKENS.forEach((token, i) => {
            const balanceRaw = results[i * 2]?.result || 0n;
            const totalRaw = results[i * 2 + 1]?.result || 0n;
            const payoutRaw = totalRaw - balanceRaw;

            const balance = parseFloat(formatUnits(balanceRaw, token.decimals));
            const total = parseFloat(formatUnits(totalRaw, token.decimals));
            const payout = parseFloat(formatUnits(payoutRaw, token.decimals));

            // Determine USD price from Chainlink results
            // Note: results index for price feeds starts after all balance/total calls
            const priceFeedStartIndex = SUPPORTED_TOKENS.length * 2;
            
            // Find the price feed index for this token
            const feedIndex = SUPPORTED_TOKENS.filter(t => CHAINLINK_PRICE_FEEDS[t.symbol] && CHAINLINK_PRICE_FEEDS[t.symbol] !== '0x0000000000000000000000000000000000000000')
                                               .findIndex(t => t.symbol === token.symbol);
            
            let price = 1.0;
            if (feedIndex !== -1) {
                const feedResult = results[priceFeedStartIndex + feedIndex]?.result;
                if (feedResult) {
                    price = parseFloat(formatUnits(feedResult[1], 8));
                }
            }

            totalUSD += total * price; 
            availableUSD += balance * price;
            payoutsUSD += payout * price;

            breakDown.push({
                symbol: token.symbol,
                available: balance,
                total: total,
                payouts: payout,
                valueUSD: balance * price
            });
        });

        return { totalUSD, availableUSD, payoutsUSD, breakDown };
    }, [results]);

    if (isLoading) {
        return (
            <div style={{ height: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                <Loader2 className="animate-spin" size={48} style={{ color: 'var(--accent-light)' }} />
                <p style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Calculating Shield Reserves...</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40, padding: '40px 0' }}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                        Zenith <span style={{ color: 'var(--accent-light)' }}>Shield</span>
                    </h1>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.92rem', marginTop: 12, maxWidth: 500 }}>
                        The Sovereign Safety Net. Collateralized protection for high-value missions and community liquidity.
                    </p>
                </div>
                <div style={{ ...cardBg, padding: '16px 24px', textAlign: 'right' }}>
                    <span style={dimLabel}>Shield Health</span>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#34d399' }}>
                        {stats.totalUSD > 0 ? ((stats.availableUSD / stats.totalUSD) * 100).toFixed(1) : '100'}% 
                        <ShieldCheck size={20} style={{ display: 'inline', marginLeft: 4 }} />
                    </div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                <div style={cardBg}>
                    <Landmark size={24} style={{ color: 'var(--accent-light)', marginBottom: 16 }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>${stats.totalUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    <span style={dimLabel}>Total Value Staked (USD)</span>
                </div>
                <div style={cardBg}>
                    <ShieldCheck size={24} style={{ color: '#34d399', marginBottom: 16 }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>${stats.availableUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    <span style={dimLabel}>Available Coverage (USD)</span>
                </div>
                <div style={cardBg}>
                    <ShieldAlert size={24} style={{ color: '#f87171', marginBottom: 16 }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>${stats.payoutsUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    <span style={dimLabel}>Total Dispute Payouts (USD)</span>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>Asset Breakdown</h2>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                        Pool Contract: <span style={{ color: 'var(--accent-light)' }}>{INSURANCE_POOL_ADDRESS.slice(0,10)}...</span>
                    </span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                    {stats.breakDown.map(item => (
                        <div key={item.symbol} style={{ ...cardBg, padding: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{item.symbol}</div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#34d399', background: 'rgba(52,211,153,0.1)', padding: '4px 10px', borderRadius: 20 }}>ACTIVE</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>Available</span>
                                    <span style={{ fontWeight: 800 }}>{item.available.toLocaleString()} {item.symbol}</span>
                                </div>
                                <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', background: 'var(--accent-light)', width: `${item.total > 0 ? (item.available / item.total) * 100 : 0}%` }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>Value (USD)</span>
                                    <span style={{ fontWeight: 800 }}>${item.valueUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>Shield Ledger</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                    {fetchingLogs ? (
                        <div style={{ ...cardBg, textAlign: 'center', padding: 60 }}>
                            <Loader2 className="animate-spin" size={32} style={{ color: 'var(--text-tertiary)', marginBottom: 16, margin: '0 auto' }} />
                            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>Indexing blockchain events...</p>
                        </div>
                    ) : ledger.length === 0 ? (
                        <div style={{ ...cardBg, textAlign: 'center', padding: 60 }}>
                            <History size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 16, opacity: 0.1 }} />
                            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>No historical activity detected.</p>
                        </div>
                    ) : (
                        ledger.map(p => (
                            <motion.div 
                                key={p.id} 
                                whileHover={{ x: 4 }} 
                                style={{ ...cardBg, cursor: 'pointer' }}
                                onClick={() => window.open(`${SCANNER_URL}/tx/${p.hash}`, '_blank')}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{ 
                                            width: 48, 
                                            height: 48, 
                                            borderRadius: 12, 
                                            background: p.type === 'PAYOUT' ? 'rgba(248,113,113,0.05)' : 'rgba(52,211,153,0.05)', 
                                            border: p.type === 'PAYOUT' ? '1px solid rgba(248,113,113,0.1)' : '1px solid rgba(52,211,153,0.1)', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center' 
                                        }}>
                                            {p.type === 'PAYOUT' ? (
                                                <ShieldAlert size={20} style={{ color: '#f87171' }} />
                                            ) : (
                                                <ArrowUpRight size={20} style={{ color: '#34d399' }} />
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '1rem', fontWeight: 800 }}>{p.reason}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                                                {p.type === 'PAYOUT' ? `Paid to ${p.recipient}` : `Received from Protocol`} • {p.date}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: p.type === 'PAYOUT' ? '#f87171' : '#34d399' }}>
                                            {p.type === 'PAYOUT' ? '-' : '+'}{p.amount} {p.token}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginTop: 4 }}>
                                            <span style={{ fontSize: '0.62rem', fontWeight: 900, background: 'rgba(255,255,255,0.05)', color: 'var(--text-tertiary)', padding: '2px 8px', borderRadius: 4 }}>
                                                {p.hash.slice(0,10)}...
                                            </span>
                                            <span style={{ fontSize: '0.62rem', fontWeight: 900, background: 'rgba(52,211,153,0.1)', color: '#34d399', padding: '2px 8px', borderRadius: 4 }}>{p.status}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default InsuranceDashboard;

