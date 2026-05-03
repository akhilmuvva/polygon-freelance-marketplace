import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { 
    Shield, Award, Zap, Rocket, Clock, TrendingUp, Cpu, Flame,
    CheckCircle2, ArrowUpRight, Trophy, Star, Activity, Globe,
    ChevronRight, Layout, PieChart, Wallet, Plus, ZapOff,
    Target, BarChart3, Fingerprint, Layers, ExternalLink,
    Lock, Unlock, Radio, Server
} from 'lucide-react';
import { Card, Metric, Text, Flex, BadgeDelta, Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell, Badge, Tracker } from '@tremor/react';
import { Box, Grid, Heading, Button as ChakraButton } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import SubgraphService from '../services/SubgraphService';
import ProfileService from '../services/ProfileService';
import { useSovereignLogic } from '../hooks/useSovereignLogic';
import ReasoningProofModal from './ReasoningProofModal';
import DemoProtocol from '../services/DemoProtocol';
import { parseProtocolValue } from '../utils/protocolUtils';
import './Dashboard.css';

const Dashboard = ({ address: propAddress }) => {
    const { address: wagmiAddress } = useAccount();
    const address = propAddress || wagmiAddress;
    const isConnected = !!address;
    const { calculateGravity } = useSovereignLogic();
    
    const [selectedProof, setSelectedProof] = useState(null);
    const [isProofModalOpen, setIsProofModalOpen] = useState(false);
    const [tbaInfo, setTbaInfo] = useState(null);

    const { data: qStats } = useQuery({
        queryKey: ['protocolStats'],
        queryFn: () => SubgraphService.getProtocolStats(),
    });

    const { data: pData } = useQuery({
        queryKey: ['profile', address],
        queryFn: () => ProfileService.getProfile(address),
        enabled: !!address
    });

    const { data: aData } = useQuery({
        queryKey: ['ecosystem-stats'],
        queryFn: () => SubgraphService.getEcosystemStats(),
    });


    const { data: portfolioRaw } = useQuery({
        queryKey: ['portfolio', address],
        queryFn: () => SubgraphService.getUserPortfolio(address),
        enabled: !!address
    });

    const activeEscrows = useMemo(() => {
        if (!address || !portfolioRaw) return [];
        const clientJobs = portfolioRaw.client?.jobs || [];
        const freelancerJobs = portfolioRaw.freelancer?.jobs || [];
        const allJobsRaw = [...clientJobs, ...freelancerJobs];
        
        const STATUS_MAP = { 'Created': 0, 'Accepted': 1, 'Ongoing': 2, 'Disputed': 3, 'Arbitration': 4, 'Completed': 5, 'Cancelled': 6 };
        
        const jobIds = new Set();
        return allJobsRaw.filter(j => {
            if (jobIds.has(j.jobId)) return false;
            jobIds.add(j.jobId);
            return (STATUS_MAP[j.status] ?? 0) < 5;
        }).map(j => ({
            id: j.jobId,
            title: `Contract #${j.jobId}`,
            statusLabel: j.status || 'Active',
            amount: formatEther(parseProtocolValue(j.amount))
        }));
    }, [address, portfolioRaw]);

    useEffect(() => {
        if (address) {
            DemoProtocol.getTBAVisualProof(address).then(setTbaInfo);
        }
    }, [address]);

    const gravityStats = useMemo(() => {
        return calculateGravity({
            averageRating: pData?.averageRating || 0,
            totalJobs: aData?.totalJobs || 0,
            karmaBalance: pData?.reputationScore || 0
        });
    }, [pData, aData, calculateGravity]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { 
            opacity: 1, 
            y: 0, 
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
        }
    };

    return (
        <motion.div 
            className="dashboard-container"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* Background Aesthetic */}
            <div className="bg-pattern-grid" />
            <div className="ambient-glow" style={{ top: '10%', left: '20%', opacity: 0.1 }} />
            <div className="ambient-glow" style={{ bottom: '20%', right: '10%', background: '#d946ef', opacity: 0.05 }} />

            {/* Header Section */}
            <motion.div variants={itemVariants} className="dashboard-header mb-12">
                <Box>
                    <div className="system-status mb-3">
                        <div className="status-dot" />
                        <span className="status-text text-sm">Sovereign Node: <span className="font-black text-[#00c896]">Active</span></span>
                    </div>
                    <Heading size="2xl" className="dashboard-title">
                        Command <span className="accent-text">Center</span>
                    </Heading>
                    <Text className="dashboard-subtitle mt-3 text-gray-400 font-medium tracking-tight">
                        Orchestrating trustless coordination for <span className="text-white font-black underline decoration-[#00c896]/30 underline-offset-4">{pData?.name || (address ? `${address.slice(0,6)}...${address.slice(-4)}` : 'Operator')}</span>. 
                    </Text>
                </Box>
                <div className="header-actions flex gap-4">
                    <ChakraButton 
                      variant="ghost" 
                      leftIcon={<BarChart3 size={18} />}
                      _hover={{ bg: 'whiteAlpha.100', transform: 'translateY(-2px)' }}
                      transition="all 0.2s"
                    >
                        Intelligence
                    </ChakraButton>
                    <ChakraButton 
                        bg="#00c896"
                        color="black"
                        _hover={{ bg: '#00e0a8', transform: 'translateY(-2px)', shadow: '0 8px 24px rgba(0,200,150,0.3)' }}
                        _active={{ bg: '#00b084' }}
                        fontWeight="900"
                        leftIcon={<Plus size={20} />}
                        onClick={() => window.dispatchEvent(new CustomEvent('NAV_TO_TAB', { detail: 'jobs' }))}
                    >
                        New Mission
                    </ChakraButton>
                </div>
            </motion.div>

            {/* Bento Grid */}
            <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6}>
                
                {/* 1. Reputation Mastery */}
                <motion.div variants={itemVariants} whileHover={{ scale: 1.01 }} className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/0 rounded-[22px] blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                    <Card decoration="top" decorationColor="emerald" className="relative h-full bg-[#0a0f12]/80 border border-white/5 backdrop-blur-xl rounded-[20px] overflow-hidden">
                        <Flex alignItems="start" justifyContent="between">
                            <div>
                                <Text className="flex items-center gap-2 font-bold tracking-wider text-xs uppercase opacity-50"><Trophy size={14} className="text-emerald-400" /> Reputation Frequency</Text>
                                <Metric className="mt-4 flex items-baseline gap-2">
                                  <span className="text-5xl font-black">{pData?.reputationScore || '0'}</span>
                                  <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">RP UNIT</span>
                                </Metric>
                            </div>
                            <Badge size="xl" color="emerald" className="px-4 py-1.5 rounded-full font-black text-[0.6rem] tracking-[0.15em] uppercase border border-emerald-500/20 bg-emerald-500/5">
                                {gravityStats.orbitCategory?.split('(')[0].trim() || 'Unranked'}
                            </Badge>
                        </Flex>
                        
                        <Grid templateColumns="repeat(3, 1fr)" gap={4} className="mt-8 pt-8 border-t border-white/5">
                            <div className="group/stat">
                                <Text className="text-[0.6rem] font-black uppercase tracking-widest opacity-30 group-hover/stat:opacity-100 transition-opacity">Gravity</Text>
                                <div className="text-xl font-black mt-2 flex items-center gap-2">
                                    {(pData?.averageRating || 0).toFixed(1)}
                                    <Star size={14} fill="#00c896" color="#00c896" className="animate-pulse" />
                                </div>
                            </div>
                            <div className="group/stat">
                                <Text className="text-[0.6rem] font-black uppercase tracking-widest opacity-30 group-hover/stat:opacity-100 transition-opacity">Equilibrium</Text>
                                <div className="text-xl font-black text-emerald-400 mt-2">
                                    {gravityStats.equilibriumAdjustment || '+0.0'}
                                </div>
                            </div>
                            <div className="group/stat">
                                <Text className="text-[0.6rem] font-black uppercase tracking-widest opacity-30 group-hover/stat:opacity-100 transition-opacity">Missions</Text>
                                <div className="text-xl font-black mt-2">
                                    {aData?.totalJobs || '0'}
                                </div>
                            </div>
                        </Grid>
                    </Card>
                </motion.div>

                {/* 2. Identity Anchor */}
                <motion.div variants={itemVariants} whileHover={{ scale: 1.01 }} className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-blue-500/0 rounded-[22px] blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                    <Card decoration="top" decorationColor="purple" className="relative h-full bg-[#0a0f12]/80 border border-white/5 backdrop-blur-xl rounded-[20px] overflow-hidden text-center p-8">
                        <Flex justifyContent="between" className="mb-6">
                            <Text className="flex items-center gap-2 font-bold tracking-wider text-xs uppercase opacity-50"><Fingerprint size={16} /> Identity Anchor</Text>
                            <Badge color="purple" className="rounded-full px-3 py-1 text-[0.6rem] font-black tracking-widest uppercase">ERC-6551</Badge>
                        </Flex>
                        
                        <div className="flex justify-center my-8 relative">
                            <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full scale-50 opacity-50" />
                            <div className="w-28 h-28 rounded-full border-2 border-purple-500/30 p-1.5 shadow-[0_0_40px_rgba(124,58,237,0.2)] bg-black/40 relative z-10">
                                <img 
                                    src={`https://api.dicebear.com/7.x/shapes/svg?seed=${address}&backgroundColor=050505`} 
                                    alt="Sovereign Identity" 
                                    className="w-full h-full rounded-full opacity-90 hover:opacity-100 transition-opacity"
                                />
                            </div>
                        </div>

                        <Text className="text-[0.6rem] font-black uppercase tracking-[0.2em] mb-3 opacity-30">Binding Hash</Text>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 font-mono text-[0.65rem] text-white/40 break-all mb-6 leading-relaxed select-all hover:text-white/70 transition-colors">
                            {tbaInfo?.tbaAddress ? tbaInfo.tbaAddress : 'Synchronizing Protocol State...'}
                        </div>
                        <ChakraButton 
                          variant="outline" 
                          size="md" 
                          width="full" 
                          colorScheme="purple"
                          fontWeight="900"
                          textTransform="uppercase"
                          fontSize="xs"
                          letterSpacing="0.1em"
                          _hover={{ bg: 'purple.500', color: 'white', shadow: '0 0 20px rgba(124,58,237,0.4)' }}
                        >
                            Verify Identity Proof
                        </ChakraButton>
                    </Card>
                </motion.div>

                {/* 3. Stats Blocks */}
                <motion.div variants={itemVariants} className="flex flex-col gap-6">
                    <Card className="flex-1 bg-[#0a0f12]/80 border border-emerald-500/20 backdrop-blur-xl rounded-[20px] hover:border-emerald-500/40 transition-colors group">
                        <Flex alignItems="center" gap={6} className="h-full">
                            <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                                <Activity size={32} />
                            </div>
                            <div>
                                <Text className="text-[0.6rem] font-black uppercase tracking-widest opacity-40">Active Missions</Text>
                                <Metric className="font-black text-4xl mt-1">{activeEscrows.length}</Metric>
                            </div>
                        </Flex>
                    </Card>

                    <Card className="flex-1 bg-[#0a0f12]/80 border border-emerald-500/20 backdrop-blur-xl rounded-[20px] hover:border-emerald-500/40 transition-colors group">
                        <Flex alignItems="center" gap={6} className="h-full">
                            <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                                <Globe size={32} />
                            </div>
                            <div>
                                <Text className="text-[0.6rem] font-black uppercase tracking-widest opacity-40">Mesh Consistency</Text>
                                <Metric className="font-black text-4xl mt-1">99.9<span className="text-xl opacity-40">%</span></Metric>
                            </div>
                        </Flex>
                    </Card>
                </motion.div>
            </Grid>

            {/* 4. Telemetry Grid */}
            <motion.div variants={itemVariants} className="mt-8">
                <Card className="bg-[#0a0f12]/80 border border-white/5 backdrop-blur-xl rounded-[24px] overflow-hidden">
                    <Flex className="mb-8 px-2" justifyContent="between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                <Radio size={20} className="animate-pulse" />
                            </div>
                            <div>
                                <Text className="font-black text-white uppercase tracking-[0.15em] text-sm">Mission Telemetry</Text>
                                <Text className="text-[0.6rem] font-bold opacity-30 uppercase tracking-widest">Real-time Protocol Stream</Text>
                            </div>
                        </div>
                        <Badge color="emerald" icon={Activity} className="rounded-full px-4 font-black text-[0.6rem] tracking-widest uppercase bg-emerald-500/5 border border-emerald-500/20">
                            LIVE SIGNAL
                        </Badge>
                    </Flex>
                    
                    {activeEscrows.length > 0 ? (
                        <div className="px-2">
                            <Table>
                                <TableHead>
                                    <TableRow className="border-b border-white/5">
                                        <TableHeaderCell className="text-[0.6rem] font-black uppercase tracking-widest opacity-30 py-4">Vector Identifier</TableHeaderCell>
                                        <TableHeaderCell className="text-[0.6rem] font-black uppercase tracking-widest opacity-30 py-4">Protocol State</TableHeaderCell>
                                        <TableHeaderCell className="text-right text-[0.6rem] font-black uppercase tracking-widest opacity-30 py-4">Value Core</TableHeaderCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {activeEscrows.map((job) => (
                                        <TableRow key={job.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer border-b border-white/[0.03]">
                                            <TableCell className="py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-400 group-hover:shadow-[0_0_12px_#34d399] transition-shadow" />
                                                    <div>
                                                        <div className="font-black tracking-tight text-white">MISSION_{job.id}</div>
                                                        <div className="text-[0.55rem] font-bold opacity-30 uppercase tracking-[0.2em] mt-1">Hash Verification Active</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge color="gray" className="rounded-full px-3 py-1 font-black text-[0.55rem] tracking-widest uppercase border border-white/10">
                                                    {job.statusLabel}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="font-black text-white text-lg tracking-tight">
                                                    {parseFloat(job.amount).toFixed(2)} <span className="text-[0.65rem] opacity-30 uppercase">POL</span>
                                                </div>
                                                <div className="text-[0.55rem] font-bold text-emerald-400/50 uppercase tracking-widest mt-1">Escrowed Secured</div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="py-24 text-center">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 border border-white/5">
                                <ZapOff size={32} className="opacity-20" />
                            </div>
                            <Text className="font-black tracking-[0.3em] uppercase text-sm opacity-40">No active missions detected</Text>
                            <Text className="text-xs mt-3 opacity-20 font-bold uppercase tracking-widest">Initiate a mission to begin sovereign orchestration</Text>
                            <ChakraButton 
                              mt={8} 
                              variant="outline" 
                              size="sm" 
                              colorScheme="emerald" 
                              borderColor="emerald.500/20"
                              _hover={{ bg: 'emerald.500/10' }}
                              onClick={() => window.dispatchEvent(new CustomEvent('NAV_TO_TAB', { detail: 'jobs' }))}
                            >
                                Initialize Protocol Vector
                            </ChakraButton>
                        </div>
                    )}

                    <motion.div 
                        className="telemetry-table-container"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                    >
                        <div className="table-header">
                            <div className="table-title-wrap">
                                <Activity size={18} className="text-[#00c896]" />
                                <h3 className="table-title">PROTOCOL_MESH_FEED</h3>
                            </div>
                            <div className="scanning-indicator">
                                <div className="scanning-dot"></div>
                                <span>LIVE_MESH_SCAN</span>
                            </div>
                        </div>

                        <div className="telemetry-table">
                            <div className="table-row head">
                                <div>SIGNATURE</div>
                                <div>STATUS</div>
                                <div>LATENCY</div>
                                <div>VALENCE</div>
                            </div>
                            {[
                                { id: 'TX_7742', status: 'INDEXED', latency: '12ms', valence: '98.2%' },
                                { id: 'TX_7743', status: 'PENDING', latency: '45ms', valence: '82.4%' },
                                { id: 'TX_7744', status: 'INDEXED', latency: '18ms', valence: '99.1%' }
                            ].map((row, i) => (
                                <motion.div 
                                    key={row.id} 
                                    className="table-row"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1 + (i * 0.1) }}
                                >
                                    <div className="font-mono text-xs opacity-60">{row.id}</div>
                                    <div>
                                        <span className={`status-pill ${row.status.toLowerCase()}`}>
                                            {row.status}
                                        </span>
                                    </div>
                                    <div className="font-mono text-xs text-[#00c896]">{row.latency}</div>
                                    <div className="valence-meter">
                                        <div className="meter-bar" style={{ width: row.valence }}></div>
                                        <span className="meter-val">{row.valence}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                    
                    <div className="mt-8 pt-6 border-t border-white/5 text-center px-8 pb-8">
                        <ChakraButton variant="link" size="xs" colorScheme="gray" rightIcon={<ExternalLink size={12} />} className="font-black uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity">
                            Access Archived Coordinates & Proofs
                        </ChakraButton>
                    </div>
                </Card>
            </motion.div>

            <ReasoningProofModal 
                isOpen={isProofModalOpen} 
                onClose={() => setIsProofModalOpen(false)} 
                proof={selectedProof} 
            />
        </motion.div>
    );
};

export default Dashboard;

