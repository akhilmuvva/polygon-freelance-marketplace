"use client";

import React from 'react';
import { cn } from "@/lib/utils";
import { 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  Terminal, 
  Cpu,
  Globe,
  Award,
  Users,
  Activity,
  Zap,
  Briefcase,
  Trophy,
  Search,
  LayoutGrid,
  Bell,
  Eye,
  Radar
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const STATS = [
  { label: 'Network Security', value: '99.98%', icon: ShieldCheck, color: 'text-emerald-500' },
  { label: 'Active Missions', value: '412', icon: Briefcase, color: 'text-violet-500' },
  { label: 'Protocol TVL', value: '$840K', icon: Zap, color: 'text-[#00ffd5]' },
  { label: 'Threats Blocked', value: '12.4K', icon: Lock, color: 'text-red-500' },
];

const RECENT_ACTIVITY = [
  { id: '1', action: 'Smart Contract Audit Pass', target: 'EscrowV2.sol', status: 'SUCCESS', time: '2m ago' },
  { id: '2', action: 'Identity Verification', target: 'Agent_0x82...44', status: 'VERIFIED', time: '15m ago' },
  { id: '3', action: 'New Mission Initialized', target: 'ZK_Parser_Security', status: 'ACTIVE', time: '1h ago' },
];

export default function CommandCenter() {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Header HUD */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00ffd5]/10 border border-[#00ffd5]/20 text-[#00ffd5] text-[10px] font-black uppercase tracking-widest">
            <Radar className="w-3 h-3 animate-spin-slow" />
            <span>Scanning Polygon Mainnet for Opportunities</span>
          </div>
          <h1 className="font-space-grotesk text-6xl md:text-8xl font-black tracking-tighter italic uppercase leading-none">
            COMMAND <span className="text-zinc-600">CENTER</span>
          </h1>
          <p className="text-zinc-500 font-bold text-lg tracking-wide max-w-xl">
            Welcome back, Agent. Your sovereign reputation is currently <span className="text-[#8b5cf6] font-black">RANK_EXCEPTIONAL</span>. 
            Security oracles are nominal.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="px-8 py-6 bg-white/5 border border-white/10 rounded-3xl flex flex-col items-end backdrop-blur-xl">
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Current Gas Price</span>
              <span className="text-2xl font-black text-[#00ffd5] italic">32.4 GWEI</span>
           </div>
           <Link href="/initiate">
             <button className="px-10 py-6 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:bg-[#00ffd5] transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-3 group">
                <Zap size={18} className="group-hover:fill-current" />
                Initiate New Mission
             </button>
           </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {STATS.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="zenith-glass rounded-[32px] p-8 group hover:border-[#8b5cf6]/30 transition-all duration-500 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
               <stat.icon size={80} />
            </div>
            <div className="flex items-start justify-between mb-6">
              <div className={cn("p-4 bg-white/5 rounded-2xl border border-white/5 group-hover:scale-110 transition-transform duration-500", stat.color)}>
                <stat.icon size={24} />
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Growth</span>
                <span className="text-[10px] font-black text-emerald-500">+12.5%</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="font-space-grotesk text-4xl font-black text-white italic tracking-tighter">{stat.value}</div>
              <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid: Mission Tracker & System Logs */}
      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8">
        {/* Active Missions Console */}
        <div className="zenith-glass rounded-[48px] p-10 md:p-12 relative overflow-hidden border border-white/5">
          <div className="scanline opacity-[0.03]" />
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-[#8b5cf6]/10 rounded-2xl flex items-center justify-center border border-[#8b5cf6]/20 text-[#8b5cf6]">
                <Briefcase size={28} />
              </div>
              <h2 className="font-space-grotesk text-4xl font-black text-white italic uppercase tracking-tight">Mission Stream</h2>
            </div>
            <button className="text-[10px] font-black text-zinc-600 hover:text-white uppercase tracking-[0.4em] flex items-center gap-3 transition-all">
              Filter by Priority <Search size={18} />
            </button>
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map((m) => (
              <div key={m} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-violet-500/30 transition-all group cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#00ffd5]/10 rounded-xl border border-[#00ffd5]/20 flex items-center justify-center text-[#00ffd5] font-black italic">
                      #Z{m}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white italic uppercase tracking-tight">ZK Resume Protocol Security Layer</h4>
                      <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        <span>Client: Zenith_DAO</span>
                        <div className="w-1 h-1 rounded-full bg-zinc-700" />
                        <span className="text-[#00ffd5]">Reward: 2,500 MATIC</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-3 py-1 bg-violet-600/20 text-violet-400 text-[10px] font-black rounded-full uppercase tracking-widest">Phase_0{m}</span>
                    <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-violet-500 w-2/3" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
             <Link href="/missions" className="w-full py-4 border border-white/5 bg-white/2 hover:bg-white/5 rounded-2xl flex items-center justify-center gap-3 text-xs font-black text-zinc-400 hover:text-white uppercase tracking-[0.3em] transition-all">
                Enter Full Mission Terminal <ArrowRight size={16} />
             </Link>
          </div>
        </div>

        {/* Real-time System Logs */}
        <div className="space-y-8">
           <div className="zenith-glass rounded-3xl p-8 border border-white/5 relative overflow-hidden h-full">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                    <Activity size={20} />
                 </div>
                 <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">System Logs</h2>
              </div>

              <div className="space-y-6 font-mono">
                 {RECENT_ACTIVITY.map((log) => (
                    <div key={log.id} className="relative pl-6 border-l border-white/10 group">
                       <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-zinc-700 group-hover:bg-[#00ffd5] transition-colors" />
                       <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black text-[#00ffd5] uppercase tracking-widest">{log.status}</span>
                          <span className="text-[10px] font-black text-zinc-600 uppercase">{log.time}</span>
                       </div>
                       <div className="text-sm font-bold text-white mb-0.5">{log.action}</div>
                       <div className="text-[10px] text-zinc-500 truncate">TARGET_REF: {log.target}</div>
                    </div>
                 ))}
              </div>

              <div className="mt-12 p-6 rounded-2xl bg-[#00ffd5]/5 border border-[#00ffd5]/10 flex items-center gap-4 group cursor-help">
                 <div className="w-12 h-12 bg-[#00ffd5]/20 rounded-xl flex items-center justify-center text-[#00ffd5]">
                    <Eye size={24} className="group-hover:animate-pulse" />
                 </div>
                 <div>
                    <div className="text-xs font-black text-white uppercase tracking-widest mb-1">Audit Mode Active</div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase leading-relaxed">Watching for anomalies in real-time contract execution.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Background Decorative Text */}
      <div className="fixed bottom-12 right-12 opacity-5 pointer-events-none select-none">
         <div className="text-[120px] font-black text-white leading-none tracking-tighter uppercase italic">SOC_CENTER</div>
      </div>
    </div>
  );
}
