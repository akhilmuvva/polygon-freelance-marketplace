import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Landmark, Coins, TrendingUp, ShieldCheck, Activity, Users, Lock, 
    ArrowUpRight, PieChart, BarChart3, Zap, Scale, Loader2,
    Shield, Globe, Cpu, Gavel, Database, Layers
} from 'lucide-react';
import { 
    Card, CardBody, CardHeader, Button, Progress, Badge, 
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Chip, Avatar, Divider, Tooltip as HeroTooltip
} from "@heroui/react";
import {
    AreaChart,
    DonutChart,
    List,
    ListItem,
    Title,
    Text,
    Flex,
    Metric,
    Grid,
} from "@tremor/react";
import SubgraphService from '../services/SubgraphService';
import { formatEther } from 'viem';
import toast from 'react-hot-toast';
import { useAnimeAnimations } from '../hooks/useAnimeAnimations';

const ProtocolDashboard = ({ address, isAdmin }) => {
    const [metrics, setMetrics] = useState({
        tvl: '0',
        treasury: '0',
        staked: '0',
        yieldGenerated: '0',
        intents: '0',
        surplus: '0'
    });
    const [ecosystem, setEcosystem] = useState({
        totalJobs: 0,
        totalVolume: 0,
        activeUsers: 0
    });
    const [loading, setLoading] = useState(true);
    const { staggerFadeIn, countUp, revealOnScroll } = useAnimeAnimations();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [protoStats, ecoStats] = await Promise.all([
                    SubgraphService.getProtocolStats(),
                    SubgraphService.getEcosystemStats()
                ]);

                if (protoStats) {
                    setMetrics({
                        tvl: formatEther(BigInt(protoStats.totalValueLocked || '0')),
                        treasury: formatEther(BigInt(protoStats.totalSovereignSurplus || '0')),
                        staked: formatEther(BigInt(protoStats.totalOriginatorFees || '0')), // Using fees as proxy for staked for now
                        yieldGenerated: formatEther(BigInt(protoStats.totalYieldGenerated || '0')),
                        intents: protoStats.totalEliteIntents || '0',
                        surplus: formatEther(BigInt(protoStats.totalSovereignSurplus || '0'))
                    });
                }

                if (ecoStats) {
                    setEcosystem({
                        totalJobs: Number(ecoStats.totalJobs || 0),
                        totalVolume: Number(formatEther(BigInt(ecoStats.totalVolume || '0'))),
                        activeUsers: Number(ecoStats.activeUsers || 0)
                    });
                }
            } catch (err) {
                console.error('[PROTOCOL] Sync failed:', err);
                toast.error("Protocol Telemetry Offline");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!loading) {
            staggerFadeIn('.protocol-card', 60);
            revealOnScroll('.protocol-reveal');
        }
    }, [loading]);

    const allocationData = [
        { name: 'Insurance Pool', value: 45, color: 'indigo' },
        { name: 'Yield Reserve', value: 25, color: 'emerald' },
        { name: 'DAO Treasury', value: 20, color: 'amber' },
        { name: 'Protocol Burn', value: 10, color: 'rose' },
    ];

    const chartData = [
        { date: "Jan 24", "TVL": 45000, "Volume": 12000 },
        { date: "Feb 24", "TVL": 52000, "Volume": 15000 },
        { date: "Mar 24", "TVL": 48000, "Volume": 18000 },
        { date: "Apr 24", "TVL": 61000, "Volume": 22000 },
        { date: "May 24", "TVL": 75000, "Volume": 31000 },
    ];

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="animate-spin text-purple-500" size={48} />
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Decrypting Protocol Ledger...</div>
        </div>
    );

    return (
        <div className="flex flex-col gap-10 py-10 max-w-7xl mx-auto px-4 md:px-0">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                <div className="space-y-3">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                            <Landmark className="text-emerald-400" size={32} />
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">
                            Zenith <span className="text-emerald-400">Protocol</span>
                        </h1>
                    </div>
                    <p className="text-slate-400 text-lg max-w-2xl font-medium leading-relaxed">
                        Sovereign Economic Layer. Monitoring protocol health, treasury management, and decentralized governance alignment for the PolyLance ecosystem.
                    </p>
                </div>
                
                <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-md">
                    <CardBody className="p-6">
                        <div className="flex items-center gap-6">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Protocol Health</div>
                                <div className="text-2xl font-black text-emerald-400 tracking-tighter flex items-center gap-2">
                                    99.9% <ShieldCheck size={20} />
                                </div>
                            </div>
                            <Divider orientation="vertical" className="h-10 bg-slate-800" />
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Stability Tier</div>
                                <Chip color="success" variant="flat" className="font-black text-[10px]">S-TIER_RESILIENT</Chip>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </header>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Value Locked", value: `${parseFloat(metrics.tvl).toLocaleString()} POL`, icon: Lock, color: "emerald", trend: "+12.5%" },
                    { label: "Sovereign Treasury", value: `${parseFloat(metrics.treasury).toLocaleString()} USDC`, icon: Landmark, color: "blue", trend: "+5.2%" },
                    { label: "Staked Capital", value: `${parseFloat(metrics.staked).toLocaleString()} POL`, icon: Coins, color: "amber", trend: "+8.1%" },
                    { label: "Yield Resonance", value: "12.4% APR", icon: TrendingUp, color: "purple", trend: "STABLE" }
                ].map((m, i) => (
                    <Card key={i} className="protocol-card bg-slate-900/30 border-slate-800/50 hover:border-emerald-500/30 transition-all group opacity-0">
                        <CardBody className="p-8 flex items-center gap-6">
                            <div className={`p-4 rounded-2xl bg-${m.color}-500/10 group-hover:scale-110 transition-transform`}>
                                <m.icon className={`text-${m.color}-400`} size={24} />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{m.label}</div>
                                    <span className={`text-[9px] font-black text-${m.color}-400/60`}>{m.trend}</span>
                                </div>
                                <div className="text-2xl font-black tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">{m.value}</div>
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Growth Visualizer */}
                <Card className="protocol-reveal lg:col-span-2 bg-slate-900/20 border-slate-800/40 opacity-0">
                    <CardHeader className="p-8 pb-0 flex flex-col items-start gap-1">
                        <Title className="text-white font-black text-xl tracking-tight">GROWTH_RESONANCE</Title>
                        <Text className="text-slate-400 font-medium">30-day liquidity and volume projection</Text>
                    </CardHeader>
                    <CardBody className="p-8">
                        <AreaChart
                            className="h-72 mt-4"
                            data={chartData}
                            index="date"
                            categories={["TVL", "Volume"]}
                            colors={["emerald", "indigo"]}
                            valueFormatter={(number) => `$${Intl.NumberFormat("us").format(number).toString()}`}
                            showLegend={true}
                            showGridLines={false}
                            curveType="monotone"
                        />
                    </CardBody>
                </Card>

                {/* Allocation Visualizer */}
                <Card className="protocol-reveal bg-slate-900/20 border-slate-800/40 opacity-0">
                    <CardHeader className="p-8 pb-0">
                        <Title className="text-white font-black text-xl tracking-tight">TREASURY_ALLOCATION</Title>
                        <Text className="text-slate-400 font-medium">Risk-adjusted asset distribution</Text>
                    </CardHeader>
                    <CardBody className="p-8 flex flex-col gap-8">
                        <DonutChart
                            className="h-44"
                            data={allocationData}
                            category="value"
                            index="name"
                            colors={["indigo", "emerald", "amber", "rose"]}
                            variant="pie"
                            showAnimation={true}
                        />
                        <List className="mt-4">
                            {allocationData.map((item) => (
                                <ListItem key={item.name} className="py-2 border-b border-slate-800/50 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full bg-${item.color}-500`} />
                                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{item.name}</span>
                                    </div>
                                    <span className="text-xs font-black text-white">{item.value}%</span>
                                </ListItem>
                            ))}
                        </List>
                    </CardBody>
                </Card>
            </div>

            {/* Magistrate Board & Network Pulse */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Governance Card */}
                <Card className="protocol-reveal relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-700 border-none opacity-0 group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 transition-transform duration-1000">
                        <Scale size={180} />
                    </div>
                    <CardBody className="p-10 relative z-10 flex flex-col justify-between h-full min-h-[300px]">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-black/20 rounded-xl backdrop-blur-md">
                                    <Gavel className="text-white" size={24} />
                                </div>
                                <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">Magistrate Board</h3>
                            </div>
                            <p className="text-white/80 text-lg font-medium leading-relaxed max-w-md">
                                Protocol parameters are community-governed. Adjust burn rates, yield distribution, and insurance multipliers through Zenith Court.
                            </p>
                        </div>
                        <div className="flex gap-4 mt-8">
                            <Button className="bg-black text-white font-black px-8 py-6 rounded-xl hover:scale-105 transition-transform" endContent={<ArrowUpRight size={18}/>}>
                                OPEN_GOVERNANCE
                            </Button>
                            <Button variant="bordered" className="border-white/20 text-white font-black px-8 py-6 rounded-xl backdrop-blur-md">
                                VIEW_PROPOSALS
                            </Button>
                        </div>
                    </CardBody>
                </Card>

                {/* Admin Controls / Moderator Actions */}
                {isAdmin ? (
                    <Card className="protocol-reveal bg-slate-900/40 border-emerald-500/20 backdrop-blur-md opacity-0">
                        <CardHeader className="p-8 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <Shield className="text-emerald-400" size={18} />
                                </div>
                                <h3 className="text-xl font-black tracking-tight uppercase italic">Moderator_Controls</h3>
                            </div>
                        </CardHeader>
                        <CardBody className="p-8 space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol Burn Rate</label>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 w-[2.5%]" />
                                        </div>
                                        <span className="text-xs font-black text-white">0.25%</span>
                                    </div>
                                    <Button size="sm" variant="flat" color="success" className="w-full font-black text-[10px]">ADJUST_BURN</Button>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Insurance Mult.</label>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 w-[75%]" />
                                        </div>
                                        <span className="text-xs font-black text-white">1.5x</span>
                                    </div>
                                    <Button size="sm" variant="flat" color="primary" className="w-full font-black text-[10px]">MODIFY_MULT</Button>
                                </div>
                            </div>
                            
                            <Divider className="bg-slate-800/50" />
                            
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="text-xs font-black text-white">EMERGENCY_HALT</div>
                                        <div className="text-[9px] text-slate-500 font-bold uppercase">Pauses all protocol settlements</div>
                                    </div>
                                    <Button color="danger" variant="flat" size="sm" className="font-black px-6">EXECUTE_PAUSE</Button>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="text-xs font-black text-white">REBALANCE_TREASURY</div>
                                        <div className="text-[9px] text-slate-500 font-bold uppercase">Trigger automated yield sweep</div>
                                    </div>
                                    <Button color="secondary" variant="flat" size="sm" className="font-black px-6">INITIATE_SWEEP</Button>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                ) : (
                    <Card className="protocol-reveal bg-slate-900/20 border-slate-800/40 opacity-0">
                        <CardHeader className="p-8 pb-4 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                                    <Activity className="text-emerald-400" size={20} /> NETWORK_PULSE
                                </h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Live Subgraph Telemetry</p>
                            </div>
                            <Badge color="success" variant="flat" className="font-black">LIVE_SYNC</Badge>
                        </CardHeader>
                        <CardBody className="p-0">
                            <Table 
                                aria-label="Network Stats"
                                classNames={{
                                    base: "w-full",
                                    table: "min-w-full",
                                    thead: "bg-slate-900/40",
                                    th: "bg-transparent text-slate-500 font-black text-[10px] uppercase tracking-widest h-14 px-8 border-b border-slate-800/50",
                                    td: "px-8 py-5 font-medium text-sm border-b border-slate-800/20 last:border-0"
                                }}
                            >
                                <TableHeader>
                                    <TableColumn>PARAMETER</TableColumn>
                                    <TableColumn>LIVE_VALUE</TableColumn>
                                    <TableColumn>24H_DELTA</TableColumn>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Users size={16} className="text-blue-400" />
                                                <span className="font-bold">Active Citizens</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-black text-lg text-white">{ecosystem.activeUsers}</TableCell>
                                        <TableCell className="text-emerald-400 font-black">+12.4%</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Zap size={16} className="text-amber-400" />
                                                <span className="font-bold">Elite Intents</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-black text-lg text-white">{metrics.intents}</TableCell>
                                        <TableCell className="text-emerald-400 font-black">+5.8%</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Database size={16} className="text-purple-400" />
                                                <span className="font-bold">Total Contracts</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-black text-lg text-white">{ecosystem.totalJobs}</TableCell>
                                        <TableCell className="text-emerald-400 font-black">+2.1%</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Layers size={16} className="text-emerald-400" />
                                                <span className="font-bold">AggLayer Velocity</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-black text-lg text-white">1.2x</TableCell>
                                        <TableCell className="text-slate-500 font-black">STABLE</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardBody>
                    </Card>
                )}
            </div>

        </div>
    );
};

export default ProtocolDashboard;
