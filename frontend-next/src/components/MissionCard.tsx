'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { formatUnits } from 'viem';
import { Clock, Zap, ChevronRight, ShieldCheck, Target, Globe, Lock } from 'lucide-react';
import { SUPPORTED_TOKENS } from '../lib/constants';
import { resolveJobMetadata } from '../lib/ipfs';
import UserLink from './UserLink';

interface MissionCardProps {
  job: any;
  userAddress?: string;
  isConnected: boolean;
}

export const MissionCard: React.FC<MissionCardProps> = ({ job, userAddress, isConnected }) => {
  const [meta, setMeta] = useState<any>(null);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);

  const tokenInfo = SUPPORTED_TOKENS.find(t => 
    t.address.toLowerCase() === job.token.toLowerCase()
  ) || SUPPORTED_TOKENS[0];

  useEffect(() => {
    const fetchMeta = async () => {
      setIsLoadingMeta(true);
      const data = await resolveJobMetadata(job.ipfsHash);
      setMeta(data);
      setIsLoadingMeta(false);
    };
    fetchMeta();
  }, [job.ipfsHash]);

  const statusCode = Number(job.status);
  const statusConfig: Record<number, any> = {
    0: { label: 'Open', color: 'text-emerald-400', glow: 'shadow-[0_0_15px_rgba(52,211,153,0.2)]' },
    1: { label: 'Hiring', color: 'text-violet-400', glow: 'shadow-[0_0_15px_rgba(167,139,250,0.2)]' },
    2: { label: 'Active', color: 'text-blue-400', glow: 'shadow-[0_0_15px_rgba(96,165,250,0.2)]' },
    3: { label: 'Disputed', color: 'text-amber-400', glow: 'shadow-[0_0_15px_rgba(251,191,36,0.2)]' },
    4: { label: 'Arbitration', color: 'text-red-400', glow: 'shadow-[0_0_15_rgba(248,113,113,0.2)]' },
    5: { label: 'Completed', color: 'text-zinc-400', glow: '' },
    6: { label: 'Cancelled', color: 'text-zinc-600', glow: '' },
  };

  const config = statusConfig[statusCode] || statusConfig[0];
  const isClient = userAddress?.toLowerCase() === job.client.toLowerCase();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="group relative zenith-glass rounded-3xl p-6 overflow-hidden flex flex-col h-full"
    >
      <div className="scanline opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Top Section */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')} ${config.glow}`} />
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${config.color}`}>
              {config.label}
            </span>
          </div>
          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-1">
             <Target size={12} className="text-zinc-600" />
             {meta?.category || 'Mission'}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-white italic tracking-tighter">
            {formatUnits(job.amount, tokenInfo.decimals)}
          </div>
          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
            {tokenInfo.symbol} Settlement
          </div>
        </div>
      </div>

      {/* Title & Description */}
      <div className="flex-1 space-y-3">
        <Link href={`/missions/${job.id}`}>
          <h3 className="text-xl font-bold text-white group-hover:text-violet-400 transition-colors leading-tight line-clamp-2 cursor-pointer">
            {isLoadingMeta ? (
              <div className="space-y-2">
                <div className="h-6 w-full bg-white/5 animate-pulse rounded-lg" />
                <div className="h-6 w-2/3 bg-white/5 animate-pulse rounded-lg" />
              </div>
            ) : (
              meta?.title || `Mission Alpha-${job.id}`
            )}
          </h3>
        </Link>
        <p className="text-zinc-400 text-sm font-medium line-clamp-3 leading-relaxed">
          {isLoadingMeta ? (
             <div className="space-y-2 pt-2">
               <div className="h-3 w-full bg-white/5 animate-pulse rounded" />
               <div className="h-3 w-5/6 bg-white/5 animate-pulse rounded" />
             </div>
          ) : (
            meta?.description || 'Strategic intelligence pending verification from the decentralized mesh.'
          )}
        </p>
      </div>

      {/* Meta Footer */}
      <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                 <Globe size={14} className="text-zinc-500" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-zinc-600 leading-none mb-1">Contractor</div>
                <UserLink address={job.client} />
              </div>
           </div>
           <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-zinc-600 leading-none mb-1">Deadline</div>
              <div className="flex items-center gap-1.5 text-zinc-200 text-xs font-bold">
                <Clock size={12} className="text-zinc-500" />
                {Number(job.deadline) > 0 
                  ? new Date(Number(job.deadline) * 1000).toLocaleDateString() 
                  : 'Sovereign'}
              </div>
           </div>
        </div>

        {/* Action Bar */}
        <div className="flex gap-3">
           {statusCode === 0 && !isClient ? (
             <button
                disabled={!isConnected}
                className="flex-1 py-3 bg-white text-black hover:bg-violet-400 hover:text-white transition-all rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-white/5 group/btn"
             >
                <Zap size={14} className="group-hover/btn:fill-current" />
                Commit Proof
             </button>
           ) : (
              <Link 
                href={`/missions/${job.id}`}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-200 transition-all rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
              >
                Telemetry
                <ChevronRight size={14} />
              </Link>
           )}
           <button className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-400 rounded-xl transition-all">
              <Lock size={16} />
           </button>
        </div>

        {job.zkRequired && (
          <div className="flex items-center gap-2 text-[9px] font-black text-violet-500 uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
            <ShieldCheck size={12} />
            Zenith Secure • ZK-Verification Enabled
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MissionCard;
