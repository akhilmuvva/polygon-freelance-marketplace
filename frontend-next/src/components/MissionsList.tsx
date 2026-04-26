'use client';

import React, { useState, useMemo } from 'react';
import { useReadContract, useReadContracts, useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ArrowUpDown, RefreshCcw, Zap, Briefcase, Cpu, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { CONTRACT_ADDRESSES } from '../lib/constants';
import FreelanceEscrowABI from '../lib/abi/FreelanceEscrow.json';
import MissionCard from './MissionCard';

export const MissionsList = () => {
  const { address, isConnected } = useAccount();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All Categories');
  const [sortBy, setSortBy] = useState('Newest');

  const { data: jobCount, isLoading: isLoadingCount, refetch: refetchCount } = useReadContract({
    address: CONTRACT_ADDRESSES.ESCROW,
    abi: FreelanceEscrowABI.abi,
    functionName: 'jobCount',
  });

  const jobIds = useMemo(() => {
    if (!jobCount) return [];
    const count = Number(jobCount);
    const ids = [];
    for (let i = count - 1; i >= 0 && i >= count - 20; i--) {
      ids.push(BigInt(i));
    }
    return ids;
  }, [jobCount]);

  const { data: jobsData, isLoading: isLoadingJobs } = useReadContracts({
    contracts: jobIds.map(id => ({
      address: CONTRACT_ADDRESSES.ESCROW,
      abi: FreelanceEscrowABI.abi,
      functionName: 'jobs',
      args: [id],
    })),
  });

  const jobs = useMemo(() => {
    if (!jobsData) return [];
    return jobsData
      .map((res: any) => {
        if (!res.result) return null;
        const job: any = res.result;
        return {
          client: job[0],
          id: job[1].toString(),
          deadline: Number(job[2]),
          categoryId: Number(job[3]),
          freelancer: job[4],
          milestoneCount: Number(job[5]),
          status: Number(job[6]),
          paid: job[7],
          zkRequired: job[8],
          yieldStrategy: job[9],
          rating: job[10],
          token: job[11],
          amount: job[12],
          freelancerStake: job[13],
          totalPaidOut: job[14],
          ipfsHash: job[15]
        };
      })
      .filter(j => j !== null);
  }, [jobsData]);

  const filteredJobs = useMemo(() => {
    return jobs
      .filter(job => {
        const matchesSearch = !searchQuery || 
          job.id.includes(searchQuery) || 
          job.client.toLowerCase().includes(searchQuery.toLowerCase());
        
        const categoryMap: Record<string, number> = { 
          'Development': 1, 
          'Design': 2, 
          'Security': 3, 
          'Marketing': 4 
        };
        const matchesCategory = filter === 'All Categories' || job.categoryId === categoryMap[filter];
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'Budget: High to Low') return Number(b.amount) - Number(a.amount);
        if (sortBy === 'Deadline') return a.deadline - b.deadline;
        return Number(b.id) - Number(a.id);
      });
  }, [jobs, searchQuery, filter, sortBy]);

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      {/* Premium Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative p-10 zenith-glass rounded-[40px] overflow-hidden border border-white/5"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00ffd5]/5 blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-[#00ffd5]/10 border border-[#00ffd5]/20 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-[#00ffd5]">
                Protocol Stream Active
              </span>
              <div className="w-2 h-2 rounded-full bg-[#00ffd5] animate-pulse shadow-[0_0_10px_rgba(0,255,213,0.5)]" />
            </div>
            <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-none">
              FIND A <span className="text-[#00ffd5]">JOB</span>
            </h1>
            <p className="text-zinc-500 max-w-xl text-lg font-medium leading-relaxed">
              Scan the global settlement layer for high-impact missions. 
              Sovereign contracts verified by Zenith Oracle intelligence.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
             <div className="zenith-glass px-6 py-4 rounded-2xl border border-white/5 text-center min-w-[120px]">
                <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1 tracking-widest">Available</div>
                <div className="text-2xl font-black italic">{isLoadingCount ? '...' : jobCount?.toString()}</div>
             </div>
             <button 
               onClick={() => refetchCount()}
               className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-zinc-400 hover:text-white"
             >
               <RefreshCcw size={24} className={isLoadingCount ? 'animate-spin' : ''} />
             </button>
          </div>
        </div>
      </motion.div>

      {/* Advanced Filter Bar */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-12 gap-4"
      >
        <div className="md:col-span-6 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-violet-400 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search mission parameters, IDs, or contractors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/5 hover:border-white/10 focus:border-violet-500/50 rounded-2xl py-4 pl-14 pr-6 text-white placeholder:text-zinc-600 font-bold text-sm outline-none transition-all"
          />
        </div>
        <div className="md:col-span-3">
           <div className="relative group">
              <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-violet-400 transition-colors" size={18} />
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-white/5 border border-white/5 hover:border-white/10 focus:border-violet-500/50 rounded-2xl py-4 pl-14 pr-10 text-white font-bold text-sm outline-none transition-all appearance-none cursor-pointer"
              >
                <option>All Categories</option>
                <option>Development</option>
                <option>Design</option>
                <option>Security</option>
              </select>
           </div>
        </div>
        <div className="md:col-span-3">
          <div className="relative group">
            <ArrowUpDown className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-violet-400 transition-colors" size={18} />
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-white/5 border border-white/5 hover:border-white/10 focus:border-violet-500/50 rounded-2xl py-4 pl-14 pr-10 text-white font-bold text-sm outline-none transition-all appearance-none cursor-pointer"
            >
              <option>Newest First</option>
              <option>Budget: High to Low</option>
              <option>Deadline</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Grid with Staggered Animation */}
      <AnimatePresence mode="wait">
        {(isLoadingCount || isLoadingJobs) ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-96 zenith-glass rounded-3xl animate-pulse" />
            ))}
          </motion.div>
        ) : filteredJobs.length === 0 ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-32 zenith-glass rounded-[40px] flex flex-col items-center justify-center text-center px-10"
          >
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/5 shadow-inner">
              <ShieldAlert size={40} className="text-zinc-700" />
            </div>
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4">No Missions Detected</h3>
            <p className="text-zinc-500 max-w-sm font-medium">
              The decentralized coordination mesh has no active missions matching your filters.
            </p>
          </motion.div>
        ) : (
          <motion.div 
            key="grid"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredJobs.map((job, idx) => (
              <motion.div
                key={job.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 }
                }}
              >
                <MissionCard 
                  job={job} 
                  userAddress={address} 
                  isConnected={isConnected} 
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MissionsList;
