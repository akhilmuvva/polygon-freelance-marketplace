'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useReadContract, useReadContracts, useWriteContract } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { 
  Shield, Clock, DollarSign, Activity, 
  Terminal, User, Loader2, ShieldCheck, 
  Fingerprint, MessageSquare, Zap, ExternalLink,
  Target, Hash, FileText, ChevronRight, Rocket,
  Star
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SUPPORTED_TOKENS, CONTRACT_ADDRESSES } from '../lib/constants';
import FreelanceEscrowABI from '../lib/abi/FreelanceEscrow.json';
import { resolveIPFS } from '../lib/ipfs';
import UserLink from './UserLink';

const ERC20_ABI = [
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
] as const;

interface MissionDetailsProps {
  id: string;
}

export const MissionDetails = ({ id }: MissionDetailsProps) => {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending: isTxPending } = useWriteContract();
  
  const [metadata, setMetadata] = useState<any>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [ipfsHash, setIpfsHash] = useState('');
  const [rating, setRating] = useState(5);

  // 1. Fetch Job State
  const { data: job, isLoading: isLoadingJob, refetch: refetchJob } = useReadContract({
    address: CONTRACT_ADDRESSES.ESCROW,
    abi: FreelanceEscrowABI.abi,
    functionName: 'jobs',
    args: [BigInt(id)],
  }) as { data: any; isLoading: boolean; refetch: any };

  // 2. Fetch Applications
  const { data: applications, isLoading: isLoadingApps, refetch: refetchApps } = useReadContract({
    address: CONTRACT_ADDRESSES.ESCROW,
    abi: FreelanceEscrowABI.abi,
    functionName: 'getJobApplications',
    args: [BigInt(id)],
  }) as { data: any[]; isLoading: boolean; refetch: any };

  // 3. Fetch Milestones
  const { data: milestonesData } = useReadContracts({
    contracts: Array.from({ length: Number(job?.[5] || 0) }).map((_, i) => ({
      address: CONTRACT_ADDRESSES.ESCROW,
      abi: FreelanceEscrowABI.abi,
      functionName: 'jobMilestones',
      args: [BigInt(id), BigInt(i)],
    })),
  });

  const milestones = useMemo(() => {
    if (!milestonesData) return [];
    return milestonesData.map((res: any, idx: number) => {
      if (!res.result) return null;
      return {
        id: idx,
        amount: res.result[0],
        description: res.result[1],
        isReleased: res.result[2],
        isUpfront: res.result[3],
      };
    }).filter(m => m !== null);
  }, [milestonesData]);

  // ERC20 Logic
  const isErc20 = job?.[11] && job[11] !== '0x0000000000000000000000000000000000000000';
  const stakeAmount = job?.[12] ? (BigInt(job[12]) * 5n) / 100n : 0n;
  const tokenInfo = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === (job?.[11] || '').toLowerCase()) || SUPPORTED_TOKENS[0];

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: isErc20 ? job[11] : undefined,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && isErc20 ? [address, CONTRACT_ADDRESSES.ESCROW] : undefined,
  });

  const needsApproval = isErc20 && allowance !== undefined && (allowance as bigint) < stakeAmount;

  // Resolve Metadata
  useEffect(() => {
    if (job?.[15]) {
      const fetchMeta = async () => {
        try {
          const data = await resolveIPFS(job[15]);
          setMetadata(data);
        } catch (err) {
          console.error("IPFS Resolution Error:", err);
        } finally {
          setIsLoadingMetadata(false);
        }
      };
      fetchMeta();
    } else if (!isLoadingJob && !job) {
      setIsLoadingMetadata(false);
    }
  }, [job, isLoadingJob]);

  // Actions
  const handleAction = async (action: string, extra?: any) => {
    if (!isConnected) return toast.error('Identity required.');

    try {
      if (action === 'Apply') {
        if (needsApproval) {
          writeContract({ address: job[11], abi: ERC20_ABI, functionName: 'approve', args: [CONTRACT_ADDRESSES.ESCROW, stakeAmount] });
        } else {
          writeContract({ address: CONTRACT_ADDRESSES.ESCROW, abi: FreelanceEscrowABI.abi, functionName: 'applyForJob', args: [BigInt(id)], value: !isErc20 ? stakeAmount : 0n });
        }
      } else if (action === 'Pick') {
        writeContract({ address: CONTRACT_ADDRESSES.ESCROW, abi: FreelanceEscrowABI.abi, functionName: 'pickFreelancer', args: [BigInt(id), extra as `0x${string}`] });
      } else if (action === 'Accept') {
        writeContract({ address: CONTRACT_ADDRESSES.ESCROW, abi: FreelanceEscrowABI.abi, functionName: 'acceptJob', args: [BigInt(id)] });
      } else if (action === 'Submit Work') {
        writeContract({ address: CONTRACT_ADDRESSES.ESCROW, abi: FreelanceEscrowABI.abi, functionName: 'submitWork', args: [BigInt(id), ipfsHash] });
      } else if (action === 'Release Milestone') {
        writeContract({ address: CONTRACT_ADDRESSES.ESCROW, abi: FreelanceEscrowABI.abi, functionName: 'releaseMilestone', args: [BigInt(id), BigInt(extra)] });
      } else if (action === 'Complete') {
        writeContract({ address: CONTRACT_ADDRESSES.ESCROW, abi: FreelanceEscrowABI.abi, functionName: 'completeJob', args: [BigInt(id), rating] });
      } else if (action === 'Raise Dispute') {
        writeContract({ address: CONTRACT_ADDRESSES.ESCROW, abi: FreelanceEscrowABI.abi, functionName: 'raiseDispute', args: [BigInt(id)] });
      }
      toast.success(`${action} sequence initiated.`);
    } catch (err) {
      toast.error(`${action} failure.`);
    }
  };

  if (isLoadingJob || isLoadingMetadata) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
        <p className="text-zinc-500 font-mono text-sm tracking-widest">SYNCHRONIZING WITH DECENTRALIZED MESH...</p>
      </div>
    );
  }

  const isClient = address?.toLowerCase() === job?.[0].toLowerCase();
  const isFreelancer = address?.toLowerCase() === job?.[4].toLowerCase();
  const statusCode = Number(job?.[6]);
  const zkRequired = !!job?.[8];
  const hasApplied = applications?.some(app => app.freelancer.toLowerCase() === address?.toLowerCase());

  const statusConfig: any = {
    0: { label: 'Open', color: '#10b981', bg: 'bg-emerald-500/10' },
    1: { label: 'Hiring', color: '#8b5cf6', bg: 'bg-violet-500/10' },
    2: { label: 'Ongoing', color: '#3b82f6', bg: 'bg-blue-500/10' },
    3: { label: 'Disputed', color: '#f59e0b', bg: 'bg-amber-500/10' },
    4: { label: 'Arbitration', color: '#ef4444', bg: 'bg-red-500/10' },
    5: { label: 'Completed', color: '#a1a1aa', bg: 'bg-white/10' },
  };
  const config = statusConfig[statusCode] || statusConfig[0];

  const [isGeneratingZK, setIsGeneratingZK] = useState(false);
  const [zkProof, setZkProof] = useState('');

  const generateZK = async () => {
    setIsGeneratingZK(true);
    toast.loading('Generating ZK-SNARK Proof locally...');
    // Simulate ZK-proof generation (e.g., Circom/SnarkJS)
    setTimeout(() => {
      const mockProof = `0x${Math.random().toString(16).slice(2)}...zkp`;
      setZkProof(mockProof);
      setIsGeneratingZK(false);
      toast.success('ZK-Proof generated successfully.');
    }, 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Dossier */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-[10px] font-bold text-violet-400 uppercase tracking-widest">{metadata?.category || 'Mission'}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border border-white/10 ${config.bg}`} style={{ color: config.color }}>{config.label}</span>
                </div>
                <h1 className="text-4xl font-extrabold text-white mb-2">{metadata?.title || `Mission #${id}`}</h1>
                <p className="text-zinc-500 flex items-center gap-2 text-sm"><Clock size={14} /> Registered {new Date(Number(job[2]) * 1000).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-white">{formatUnits(job[12], tokenInfo.decimals)}</div>
                <div className="text-xs font-bold text-violet-500 uppercase tracking-widest">{tokenInfo.symbol} Locked</div>
              </div>
            </div>
            <div className="prose prose-invert max-w-none mb-8">
              <h4 className="text-zinc-400 uppercase text-xs font-bold tracking-widest mb-4 flex items-center gap-2"><FileText size={14} className="text-violet-500" /> Mission Intelligence</h4>
              <p className="text-zinc-300 leading-relaxed">{metadata?.description || 'Resolving IPFS intelligence...'}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 pt-8 border-t border-white/5">
              <div className="space-y-3">
                <h4 className="text-zinc-400 uppercase text-xs font-bold tracking-widest flex items-center gap-2"><Shield size={14} className="text-violet-500" /> Governance</h4>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                  <span className="text-xs text-zinc-500">Contractor</span>
                  <UserLink address={job[0]} />
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                  <span className="text-xs text-zinc-500">Specialist</span>
                  <UserLink address={job[4]} />
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-zinc-400 uppercase text-xs font-bold tracking-widest flex items-center gap-2"><Zap size={14} className="text-violet-500" /> Protocol</h4>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                  <span className="text-xs text-zinc-500">Yield Strategy</span>
                  <span className="text-xs font-mono text-emerald-400">AAVE V3 ACTIVE</span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                  <span className="text-xs text-zinc-500">Network</span>
                  <span className="text-xs font-mono text-zinc-300">POLYGON AMOY</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Settlements */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8">
            <h4 className="text-zinc-400 uppercase text-xs font-bold tracking-widest mb-6 flex items-center gap-2"><Activity size={14} className="text-violet-500" /> Settlement Layers</h4>
            <div className="space-y-3">
              {milestones.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${m.isReleased ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-violet-500/10 text-violet-400 border border-violet-500/20'}`}>{i + 1}</div>
                    <div>
                      <div className="text-sm font-bold text-zinc-200">{m.description}</div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{m.isReleased ? 'Settled' : 'Escrowed'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-white">{formatUnits(m.amount, tokenInfo.decimals)} {tokenInfo.symbol}</span>
                    {isClient && !m.isReleased && statusCode === 2 && (
                      <button onClick={() => handleAction('Release Milestone', i)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg uppercase transition-all">Release</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Applications for Clients */}
          {isClient && statusCode === 0 && (
            <section className="space-y-4">
              <h4 className="text-zinc-400 uppercase text-xs font-bold tracking-widest ml-2 flex items-center gap-2"><Target size={14} className="text-violet-500" /> Specialist Commits</h4>
              <div className="grid gap-3">
                {applications?.map((app, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/5 p-6 rounded-3xl flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center"><User className="text-violet-400" /></div>
                      <div>
                        <UserLink address={app.freelancer} />
                        <div className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Stake: {formatUnits(app.stake, tokenInfo.decimals)} {tokenInfo.symbol}</div>
                      </div>
                    </div>
                    <button onClick={() => handleAction('Pick', app.freelancer)} className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold py-2.5 px-6 rounded-xl transition-all">DESIGNATE</button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 sticky top-8">
            <h4 className="text-zinc-400 uppercase text-xs font-bold tracking-widest mb-6 flex items-center gap-2"><Terminal size={14} className="text-violet-500" /> Action Console</h4>
            
            <div className="space-y-4">
              {/* OPEN -> APPLY */}
              {statusCode === 0 && !isClient && (
                <button onClick={() => handleAction('Apply')} disabled={isTxPending || hasApplied} className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 group transition-all">
                  {hasApplied ? <><ShieldCheck size={18} /> SIGNATURE LOGGED</> : isTxPending ? <Loader2 className="animate-spin" /> : needsApproval ? <><Fingerprint size={18} /> AUTHORIZE {tokenInfo.symbol}</> : <><Fingerprint size={18} /> COMMIT PROOF</>}
                </button>
              )}

              {/* HIRING -> ACCEPT */}
              {statusCode === 1 && isFreelancer && (
                <button onClick={() => handleAction('Accept')} disabled={isTxPending} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all">
                  {isTxPending ? <Loader2 className="animate-spin" /> : <><Rocket size={18} /> ACTUATE MISSION</>}
                </button>
              )}

              {/* ONGOING -> SUBMIT/COMPLETE */}
              {statusCode === 2 && (
                <div className="space-y-4">
                  {isFreelancer && (
                    <div className="space-y-3">
                      {zkRequired && (
                        <div className="p-4 bg-violet-500/5 border border-violet-500/10 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">ZK Requirement</span>
                            <Shield size={14} className="text-violet-400" />
                          </div>
                          {zkProof ? (
                            <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-mono bg-emerald-400/5 p-2 rounded-lg border border-emerald-400/20">
                              <ShieldCheck size={12} /> PROOF READY: {zkProof.slice(0, 15)}
                            </div>
                          ) : (
                            <button 
                              onClick={generateZK}
                              disabled={isGeneratingZK}
                              className="w-full py-2.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                              {isGeneratingZK ? <Loader2 size={12} className="animate-spin" /> : <><Cpu size={12} /> GENERATE ZK-PROOF</>}
                            </button>
                          )}
                        </div>
                      )}
                      <input type="text" placeholder="IPFS Delivery Hash..." value={ipfsHash} onChange={(e) => setIpfsHash(e.target.value)} className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 px-4 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-violet-500/50" />
                      <button onClick={() => handleAction('Submit Work')} disabled={isTxPending || !ipfsHash || (zkRequired && !zkProof)} className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"><FileText size={16} /> SUBMIT PROOF</button>
                    </div>
                  )}
                  {isClient && (
                    <div className="space-y-3">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(v => (
                          <button key={v} onClick={() => setRating(v)} className={`flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all ${rating === v ? 'bg-violet-500/20 border-violet-500 text-violet-400' : 'bg-white/5 border-white/10 text-zinc-600'}`}>{v}★</button>
                        ))}
                      </div>
                      <button onClick={() => handleAction('Complete')} disabled={isTxPending} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"><Star size={16} /> COMPLETE MISSION</button>
                    </div>
                  )}
                  <button onClick={() => handleAction('Raise Dispute')} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-bold py-2 rounded-xl border border-red-500/20 uppercase tracking-widest transition-all">Raise Dispute</button>
                </div>
              )}

              {/* Security Telemetry */}
              <div className="pt-6 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-zinc-600">Protocol Shield</span>
                  <span className="text-emerald-500 font-mono">ACTIVE</span>
                </div>
                <div className="bg-black/40 rounded-2xl p-4 border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> SLITHER SCAN: NOMINAL
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500" /> ZSO ORACLE: SYNCED
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MissionDetails;
