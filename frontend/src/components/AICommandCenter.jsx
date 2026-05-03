import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Card, CardBody, CardHeader, Button, Progress, Badge, 
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Chip, Tooltip as HeroTooltip, Avatar
} from "@heroui/react";
import { 
    Cpu, Zap, ShieldCheck, Activity, Brain, Server, 
    Terminal, Lock, CheckCircle2, AlertCircle, Bot, Code,
    RefreshCw, Gavel, Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import ProfileService from '../services/ProfileService';

const AICommandCenter = ({ address, isAdmin }) => {
    const [profile, setProfile] = useState(null);

    const [activeAgents, setActiveAgents] = useState([
        { id: 'Zenith-Alpha', status: 'AUDITING', task: 'Milestone #4 Code Review', confidence: 94, type: 'LLM-Agent' },
        { id: 'Zenith-Beta', status: 'MONITORING', task: 'Contract Escrow #128', confidence: 88, type: 'Security-Probe' },
        { id: 'Zenith-Gamma', status: 'SETTLING', task: 'RWA IP Verification', confidence: 99, type: 'Oracle-Node' }
    ]);

    const [verificationQueue, setVerificationQueue] = useState([
        { id: 'RQ-882', mission: 'DEX Interface Revamp', type: 'Code Audit', proof: 'ipfs://qm...x2', status: 'IN_ANALYSIS', risk: 'LOW' },
        { id: 'RQ-883', mission: 'Zenith Mobile SDK', type: 'ZK-Proof Validation', proof: 'ipfs://qm...y1', status: 'PENDING', risk: 'HIGH' },
        { id: 'RQ-884', mission: 'Lending Logic V2', type: 'Fuzzer Run', proof: 'ipfs://qm...z3', status: 'COMPLETED', risk: 'NONE' }
    ]);

    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (address) {
                const data = await ProfileService.getProfile(address);
                setProfile(data);
            }
        };
        fetchProfile();

        const handleUpdate = (e) => {
            if (e.detail.toLowerCase() === address?.toLowerCase()) {
                fetchProfile();
            }
        };
        window.addEventListener('IDENTITY_UPDATED', handleUpdate);
        return () => window.removeEventListener('IDENTITY_UPDATED', handleUpdate);
    }, [address]);


    const refreshTelemetry = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setIsRefreshing(false);
            toast.success("Neural Telemetry Synchronized");
        }, 1500);
    };

    return (
        <div className="flex flex-col gap-10 py-10 max-w-7xl mx-auto">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                            <Brain className="text-purple-400" size={32} />
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter uppercase italic">
                            AI <span className="text-purple-400">Oracle</span>
                        </h1>
                    </div>
                    <p className="text-slate-400 text-lg max-w-xl font-medium leading-relaxed">
                        Autonomous Settlement Infrastructure. Verifying cryptographic proofs and digital labor with objective machine intelligence.
                    </p>
                </div>
                
                <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-md">
                    <CardBody className="p-6">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Oracle Stability</div>
                        <div className="flex items-center gap-4">
                            <div className="text-3xl font-black text-purple-400 tracking-tighter">98.4%</div>
                            <Progress 
                                value={98.4} 
                                color="secondary" 
                                size="sm" 
                                className="w-24"
                                isStriped
                            />
                        </div>
                    </CardBody>
                </Card>
            </header>

            {/* Quick Metrics & Operator Profile */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: "Inference Latency", value: "42 ms", icon: Activity, color: "success" },
                        { label: "Auto-Settle Cap", value: "80%", icon: ShieldCheck, color: "secondary" },
                        { label: "Execution Context", value: "Decentralized", icon: Server, color: "primary" }
                    ].map((m, i) => (
                        <Card key={i} className="bg-slate-900/30 border-slate-800/50 hover:border-purple-500/30 transition-all group">
                            <CardBody className="p-8 flex items-center gap-6">
                                <div className={`p-4 rounded-2xl bg-${m.color}-500/10 group-hover:scale-110 transition-transform`}>
                                    <m.icon className={`text-${m.color}-400`} size={24} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{m.label}</div>
                                    <div className="text-2xl font-black">{m.value}</div>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>

                {/* Operator Identity Card */}
                <Card className="bg-purple-500/5 border-purple-500/20 backdrop-blur-md relative overflow-hidden">
                    <div className="absolute top-2 right-2 z-10">
                        <Button 
                            isIconOnly 
                            size="sm" 
                            variant="light" 
                            className="text-purple-400/50 hover:text-purple-400"
                            onClick={() => {
                                console.info('[COMMAND-CENTER] Manual identity synchronization triggered.');
                                ProfileService.getProfile(address).then(setProfile);
                                toast.success("Identity Sync Actuated");
                            }}
                        >
                            <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
                        </Button>
                    </div>
                    <CardBody className="p-6">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Active Operator</div>
                        <div className="flex items-center gap-4">
                            <Avatar 
                                name={profile?.name || '??'} 
                                src={profile?.avatar} 
                                size="lg" 
                                isBordered 
                                color="secondary"
                                classNames={{ base: "border-purple-500/50" }}
                            />
                            <div className="overflow-hidden">
                                <div className="text-lg font-black text-white truncate">{profile?.name || 'Unknown Node'}</div>
                                <div className="text-[10px] font-bold text-purple-400 truncate tracking-tight">{address?.slice(0,6)}...{address?.slice(-4)}</div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-purple-500/10">
                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed line-clamp-2 italic">
                                "{profile?.bio || 'No operator bio configured on the decentralized layer.'}"
                            </p>
                        </div>
                        {profile?.skills && (
                            <div className="flex flex-wrap gap-1 mt-3">
                                {(Array.isArray(profile.skills) ? profile.skills : profile.skills.split(',')).slice(0, 3).map((s, i) => (
                                    <span key={i} className="text-[8px] font-black bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20 uppercase">
                                        {s.trim()}
                                    </span>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>


            {/* Admin Override Section */}
            {isAdmin && (
                <Card className="bg-red-500/5 border-red-500/20 backdrop-blur-xl">
                    <CardBody className="p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-red-500/20 rounded-full animate-pulse">
                                <Gavel className="text-red-400" size={32} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-red-400 tracking-tight">JUDICIAL_OVERRIDE_ENABLED</h3>
                                <p className="text-sm text-red-300/60 font-medium">Verified Zenith Judge session active. AI automation can be manually bypassed.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <Button color="danger" variant="shadow" className="font-black px-8" startContent={<Lock size={16} />}>
                                PAUSE_ORACLE
                            </Button>
                            <Button variant="bordered" className="font-black border-red-500/30 text-red-400">
                                AUDIT_LOGS
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Cognitive Entities */}
                <section className="space-y-6">
                    <div className="flex justify-between items-center px-2">
                        <h2 className="text-2xl font-black tracking-tight">COGNITIVE_ENTITIES</h2>
                        <Button 
                            isIconOnly 
                            variant="light" 
                            className="text-slate-500 hover:text-white"
                            onClick={refreshTelemetry}
                            isLoading={isRefreshing}
                        >
                            <RefreshCw size={20} />
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {activeAgents.map(agent => (
                            <Card key={agent.id} className="bg-slate-900/20 border-slate-800/40 hover:bg-slate-900/40 transition-colors">
                                <CardBody className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <Avatar 
                                                icon={<Bot size={20} />} 
                                                classNames={{ base: "bg-purple-500/20 text-purple-400", icon: "text-purple-400" }} 
                                            />
                                            <div>
                                                <div className="text-lg font-black">{agent.id}</div>
                                                <div className="text-[10px] font-bold text-slate-500">{agent.type}</div>
                                            </div>
                                        </div>
                                        <Chip 
                                            color={agent.status === 'SETTLING' ? 'success' : 'secondary'} 
                                            variant="dot"
                                            className="font-black text-[10px]"
                                        >
                                            {agent.status}
                                        </Chip>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <span className="text-xs font-bold text-slate-400">TASK: <span className="text-white uppercase">{agent.task}</span></span>
                                            <span className="text-xs font-black text-purple-400">{agent.confidence}% CONFIDENCE</span>
                                        </div>
                                        <Progress 
                                            value={agent.confidence} 
                                            color="secondary" 
                                            className="h-1.5"
                                            radius="full"
                                        />
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Verification Pipeline */}
                <section className="space-y-6">
                    <div className="flex justify-between items-center px-2">
                        <h2 className="text-2xl font-black tracking-tight">VERIFICATION_PIPELINE</h2>
                        <Button size="sm" variant="bordered" className="font-black border-slate-800 text-slate-400" startContent={<Search size={14} />}>
                            EXPLORE_PROOFS
                        </Button>
                    </div>
                    <Table 
                        aria-label="Verification Queue"
                        classNames={{
                            base: "bg-transparent",
                            table: "bg-slate-900/10 border border-slate-800/50 rounded-2xl",
                            thead: "bg-slate-900/50",
                            th: "bg-transparent text-slate-500 font-black text-[10px] uppercase tracking-widest border-b border-slate-800/50 h-14 px-6",
                            td: "px-6 py-4 font-medium text-sm border-b border-slate-800/20"
                        }}
                    >
                        <TableHeader>
                            <TableColumn>MISSION</TableColumn>
                            <TableColumn>RISK</TableColumn>
                            <TableColumn>STATUS</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {verificationQueue.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Code size={16} className="text-slate-500" />
                                            <div>
                                                <div className="font-black">{req.mission}</div>
                                                <div className="text-[10px] text-slate-500 font-bold">{req.id}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            size="sm" 
                                            color={req.risk === 'HIGH' ? 'danger' : req.risk === 'LOW' ? 'warning' : 'success'} 
                                            variant="flat"
                                            className="font-black text-[9px]"
                                        >
                                            {req.risk}
                                        </Chip>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {req.status === 'COMPLETED' ? <CheckCircle2 size={14} className="text-success" /> : <Activity size={14} className="text-secondary animate-pulse" />}
                                            <span className="text-[10px] font-black">{req.status}</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </section>
            </div>
        </div>
    );
};

export default AICommandCenter;
