import React, { useEffect, useState } from 'react';
import {
    Card,
    AreaChart,
    BarList,
    Title,
    Text,
    Flex,
    Grid,
    Metric,
    Icon,
    BadgeDelta,
} from "@tremor/react";
import {
    Activity, Users, Briefcase, DollarSign, BarChart3, Loader2, Shield
} from 'lucide-react';
import SubgraphService from '../services/SubgraphService';
import { formatEther } from 'viem';

export default function AnalyticsDashboard({ address, isAdmin }) {
    const [data, setData] = useState({
        totalJobs: 0, totalVolume: 0, avgReputation: 0, totalUsers: 0, tvl: 0,
        trends: [], categoryDistribution: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => { fetchAnalytics(); }, []);

    const fetchAnalytics = async () => {
        try {
            const [stats, leaderboard, allJobs] = await Promise.all([
                SubgraphService.getEcosystemStats(),
                SubgraphService.getLeaderboard(),
                SubgraphService.getJobs(50)
            ]);

            if (stats) {
                const categoryNames = ['Fullstack', 'Frontend', 'Backend', 'UI/UX', 'Marketing', 'Legal'];
                const distributionMap = {};
                allJobs.forEach(j => {
                    const catId = Number(j.categoryId || 0);
                    const name = categoryNames[catId] || 'Others';
                    distributionMap[name] = (distributionMap[name] || 0) + 1;
                });
                const categoryDistribution = Object.entries(distributionMap).map(([name, value]) => ({ name, value }));

                const trendsMap = {};
                allJobs.forEach(j => {
                    const date = new Date(Number(j.createdAt || 0) * 1000).toLocaleDateString();
                    trendsMap[date] = (trendsMap[date] || 0) + 1;
                });
                const trends = Object.entries(trendsMap)
                    .map(([date, count]) => ({ date, "Active Jobs": count }))
                    .sort((a, b) => new Date(a.date) - new Date(b.date));

                setData({
                    totalJobs: Number(stats.totalJobs),
                    totalVolume: parseFloat(formatEther(BigInt(stats.totalVolume))),
                    totalUsers: stats.activeUsers?.length || 0,
                    tvl: parseFloat(formatEther(BigInt(stats.totalVolume))),
                    avgReputation: avgRep,
                    trends: trends.length > 0 ? trends : [{ date: new Date().toISOString(), count: 0 }],
                    categoryDistribution: categoryDistribution.length > 0 ? categoryDistribution : [{ name: 'Stable', value: 1 }]
                });
            }
        } catch (err) {
            console.error('Failed to fetch decentralized analytics:', err);
            setError('The Graph indexing node is currently unreachable.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!loading && data) {
            staggerFadeIn('.analytics-stat-card', 100);
            revealOnScroll('.analytics-reveal');

            statRefs.current.forEach((el) => {
                if (el) {
                    const attrVal = el.getAttribute('data-value') || '0';
                    const val = parseFloat(attrVal.replace(/[^0-9.]/g, ''));
                    if (!isNaN(val)) countUp(el, val, 2000);
                }
            });
        }
    }, [loading, data]);

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
            <Loader2 size={40} className="animate-spin" style={{ color: 'var(--accent-light)' }} />
            <p style={dimLabel}>Synchronizing Neural Data...</p>
        </div>
    );

    if (error) return (
        <div style={{ ...cardBg, textAlign: 'center', color: '#f43f5e', padding: 40 }}>
            <Activity size={40} style={{ marginBottom: 16, opacity: 0.5 }} />
            <h3 style={{ fontWeight: 800 }}>Network Connection Interrupted</h3>
            <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>{error}</p>
            <button onClick={fetchAnalytics} className="btn btn-secondary btn-sm" style={{ marginTop: 20 }}>Retry Sync</button>
        </div>
    );

    const stats = [
        { label: 'Total Value Locked', value: `$${parseFloat(data.tvl || 0).toLocaleString()}`, icon: DollarSign, color: '#10b981' },
        { label: 'Network Citizens', value: data.totalUsers.toString(), icon: Users, color: '#60a5fa' },
        { label: 'Active Contracts', value: data.totalJobs.toString(), icon: Briefcase, color: 'var(--accent-light)' },
        { label: 'Ecosystem Volume', value: `$${parseFloat(data.totalVolume || 0).toLocaleString()}`, icon: Activity, color: '#a855f7' },
        { label: 'POL Rep Staked', value: `${(data.tvl * 0.15).toFixed(2)} POL`, icon: Shield, color: '#8b5cf6' },
        { label: 'AggLayer Velocity', value: `${(data.totalJobs * 1.2).toFixed(1)}x`, icon: Zap, color: '#f43f5e' }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingBottom: 48 }}>
            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                {stats.map((stat, i) => (
                    <div key={i} className="analytics-stat-card"
                        style={{ ...cardBg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0 }}>
                        <div>
                            <p style={dimLabel}>{stat.label}</p>
                            <h3 style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.04em' }}>
                                <span ref={el => statRefs.current[i] = el} data-value={stat.value}>0</span>
                            </h3>
                        </div>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: `${stat.color}15`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <stat.icon size={22} />
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
                {/* Growth Trends */}
                <div className="analytics-reveal" style={{ ...cardBg, height: 400, opacity: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <TrendingUp size={18} style={{ color: 'var(--accent-light)' }} /> Growth Velocity
                            </h3>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>30-day transactional pulse</p>
                        </div>
                    </div>
                    <div style={{ minHeight: 300, width: '100%', position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.trends.length ? data.trends : [{ date: new Date().toISOString(), count: 0 }]}>
                                <defs>
                                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--accent-light)" stopOpacity={0.4} />
                                        <stop offset="100%" stopColor="var(--accent-light)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false}
                                    tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} />
                                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ background: 'rgba(10,10,25,0.95)', border: '1px solid var(--border)', borderRadius: 12, backdropFilter: 'blur(10px)' }}
                                    itemStyle={{ color: 'var(--accent-light)', fontWeight: 700 }}
                                />
                                <Area type="monotone" dataKey="count" stroke="var(--accent-light)" strokeWidth={3} fill="url(#chartGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sector Allocation */}
                <div className="analytics-reveal" style={{ ...cardBg, height: 400, opacity: 0 }}>
                    <div style={{ marginBottom: 32 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <PieIcon size={18} style={{ color: '#a855f7' }} /> Sector Allocation
                        </h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Network distribution by vertical</p>
                    </div>
                    <div style={{ minHeight: 300, width: '100%', position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.categoryDistribution.length ? data.categoryDistribution : [{ name: 'Stable', value: 1 }]}
                                    innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                                >
                                    {(data.categoryDistribution.length ? data.categoryDistribution : [{ name: 'Stable', value: 1 }]).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: 'rgba(10,10,25,0.95)', border: '1px solid var(--border)', borderRadius: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {data.categoryDistribution.slice(0, 4).map((entry, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], boxShadow: `0 0 10px ${COLORS[i % COLORS.length]}60` }} />
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Neural Summary */}
            <div className="analytics-reveal" style={{ ...cardBg, background: 'linear-gradient(135deg, rgba(124,92,252,0.06), rgba(124,92,252,0.02))', borderColor: 'rgba(124,92,252,0.2)', opacity: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(124,92,252,0.3)', flexShrink: 0 }}>
                        <Globe size={32} className="animate-spin-slow" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span style={{ padding: '3px 8px', borderRadius: 4, background: '#34d399', color: '#000', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase' }}>SYNCHRONIZED</span>
                            <span style={{ padding: '3px 8px', borderRadius: 4, background: '#8b5cf6', color: '#fff', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase' }}>POL NATIVE</span>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>PolyLance Ecosystem Pulse</h3>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, fontWeight: 500 }}>
                            The network is currently processing <span style={{ color: 'var(--accent-light)', fontWeight: 700 }}>{data.totalJobs} live contracts</span> with a total ecosystem volume of <span style={{ color: '#10b981', fontWeight: 700 }}>{data.totalVolume.toFixed(2)} MATIC/POL</span>.
                            Our **AggLayer Velocity** has reached <span style={{ color: '#f43f5e', fontWeight: 700 }}>{(data.totalJobs * 1.2).toFixed(1)}x</span> re-anchoring efficiency, with <span style={{ color: '#8b5cf6', fontWeight: 700 }}>{(data.tvl * 0.15).toFixed(2)} POL</span> committed to the Reputation Safety Module.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

