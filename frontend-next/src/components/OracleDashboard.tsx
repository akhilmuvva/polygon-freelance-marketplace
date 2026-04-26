'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Activity, Cpu, Zap, 
  Terminal, Lock, AlertTriangle, ShieldCheck,
  Search, RefreshCcw, Database, Globe,
  FileText, BarChart3, Binary, Fingerprint,
  ChevronRight, Radar, Radio, Wifi,
  HardDrive, Layers, Eye
} from 'lucide-react';

export const OracleDashboard = () => {
  const [activeReports, setActiveReports] = useState([
    { id: 'ZSO-902', target: 'Settlement-Polygon-v1', status: 'Verified', severity: 'None', time: '2h ago', hash: '0x8f...e1a2' },
    { id: 'ZSO-899', target: 'YieldEngine_Mainnet', status: 'Verified', severity: 'Low', time: '5h ago', hash: '0x3c...f9b4' },
    { id: 'ZSO-895', target: 'Mission #42 Payload', status: 'Scanning', severity: 'TBD', time: 'Now', hash: '0x7d...a5c8' },
    { id: 'ZSO-891', target: 'Identity-ZK-Proof-7', status: 'Verified', severity: 'None', time: '12h ago', hash: '0x1a...b2d3' },
  ]);

  const [metrics] = useState({
    threatLevel: 'Low',
    activeScans: 14,
    totalVerified: 1284,
    protocolIntegrity: 99.98,
    mempoolStatus: 'Optimal',
    oracleConsensus: 'Synchronized'
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12 pb-32">
      {/* Cinematic Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 border-b border-white/5 pb-12"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)] animate-pulse" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Oracle Node: 0x71...Alpha</span>
            </div>
            <div className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full flex items-center gap-2">
              <Wifi size={10} className="text-violet-400" />
              <span className="text-[10px] font-black text-violet-400 uppercase tracking-[0.2em]">Consensus: {metrics.oracleConsensus}</span>
            </div>
          </div>
          <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-none">
            SECURITY <span className="text-violet-500">ORACLE</span>
          </h1>
          <p className="text-zinc-500 text-lg font-medium max-w-2xl">
            Sovereign smart contract telemetry, decentralized vulnerability scanning, 
            and real-time protocol resonance monitoring.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="zenith-glass px-8 py-6 rounded-[32px] border border-white/10 relative overflow-hidden group">
            <div className="scanline opacity-10" />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Protocol Integrity</span>
            <div className="text-4xl font-black text-emerald-500 italic tracking-tighter">
              {metrics.protocolIntegrity}<span className="text-xl text-zinc-600">%</span>
            </div>
            <div className="mt-2 flex gap-1">
               {[1,2,3,4,5,6,7,8,9,10].map(i => (
                 <div key={i} className={`h-1 w-3 rounded-full ${i < 9 ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
               ))}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Grid Layout */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Left Column: Metrics & Radar */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Performance Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Threat Surface', value: 'MINIMAL', icon: Shield, color: 'text-emerald-400', detail: '0 Vectors High-Risk' },
              { label: 'Neural Processing', value: '1.2ms', icon: Cpu, color: 'text-violet-400', detail: 'Latency Optimized' },
              { label: 'Settlement Nodes', value: '42 Active', icon: Globe, color: 'text-blue-400', detail: 'Global Propagation' },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="zenith-glass p-8 rounded-[32px] relative overflow-hidden group hover:border-white/20 transition-all border border-white/5"
              >
                <div className={`absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-10 transition-opacity ${stat.color}`}>
                  <stat.icon size={120} />
                </div>
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-2xl bg-white/5 ${stat.color}`}>
                    <stat.icon size={20} />
                  </div>
                  <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Live</div>
                </div>
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">{stat.label}</span>
                <div className="text-2xl font-black text-white italic uppercase tracking-tighter">{stat.value}</div>
                <div className="text-[10px] font-bold text-zinc-600 mt-2">{stat.detail}</div>
              </motion.div>
            ))}
          </div>

          {/* Main Intelligence Feed */}
          <div className="zenith-glass rounded-[40px] border border-white/5 overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-violet-500/10 rounded-xl">
                   <Activity size={20} className="text-violet-500" />
                </div>
                <div>
                   <h3 className="text-sm font-black uppercase tracking-[0.1em] text-white italic">Intelligence Stream</h3>
                   <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Analyzing Block 19284712</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black text-zinc-400 flex items-center gap-2 transition-all active:scale-95">
                <RefreshCcw size={14} /> RE-SYNC
              </button>
            </div>

            <div className="p-2">
               <div className="divide-y divide-white/5">
                 {activeReports.map((report, i) => (
                   <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className="p-6 hover:bg-white/[0.03] transition-all flex items-center justify-between group cursor-pointer"
                   >
                     <div className="flex items-center gap-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
                          report.status === 'Scanning' 
                          ? 'bg-amber-500/5 border-amber-500/20 text-amber-500 animate-pulse' 
                          : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500'
                        }`}>
                           {report.status === 'Scanning' ? <Radio size={20} /> : <ShieldCheck size={20} />}
                        </div>
                        <div>
                           <div className="flex items-center gap-3">
                              <span className="text-lg font-black text-white italic tracking-tight group-hover:text-violet-400 transition-colors">
                                {report.target}
                              </span>
                              <span className="text-[10px] font-mono text-zinc-600 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                                {report.id}
                              </span>
                           </div>
                           <div className="flex items-center gap-3 mt-1.5">
                              <div className="flex items-center gap-1.5">
                                 <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                                 <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{report.time}</span>
                              </div>
                              <div className="w-1 h-1 rounded-full bg-zinc-800" />
                              <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${
                                report.severity === 'None' ? 'text-emerald-500' : 'text-amber-500'
                              }`}>
                                Threat Index: {report.severity}
                              </span>
                              <div className="w-1 h-1 rounded-full bg-zinc-800" />
                              <span className="text-[10px] font-mono text-zinc-700 uppercase">{report.hash}</span>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end opacity-0 group-hover:opacity-100 transition-opacity">
                           <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Integrity Check</span>
                           <span className="text-[10px] font-bold text-emerald-400">PASSED</span>
                        </div>
                        <div className="p-3 bg-white/5 border border-white/10 rounded-2xl group-hover:bg-violet-500 group-hover:border-violet-500 transition-all shadow-lg group-hover:shadow-violet-500/20">
                          <ChevronRight size={18} className="text-white" />
                        </div>
                     </div>
                   </motion.div>
                 ))}
               </div>
            </div>

            <div className="p-6 bg-white/[0.01] border-t border-white/5 text-center">
               <button className="text-[10px] font-black text-violet-500 hover:text-white uppercase tracking-[0.3em] transition-all hover:gap-4 flex items-center justify-center gap-2 w-full">
                  <Layers size={14} /> ACCESS FULL TELEMETRY ARCHIVE <Layers size={14} />
               </button>
            </div>
          </div>
        </div>

        {/* Right Column: Console & Action */}
        <div className="lg:col-span-4 space-y-8">
           
          {/* Action Card */}
          <div className="bg-violet-600 rounded-[40px] p-10 border border-violet-500 shadow-2xl shadow-violet-600/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Zap size={120} />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                 <Search size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none mb-3">
                  INITIATE <br/>DEEP AUDIT
                </h3>
                <p className="text-violet-200 text-sm font-medium leading-relaxed">
                  Submit any contract address for exhaustive static analysis and formal verification.
                </p>
              </div>
              <div className="space-y-3">
                 <input 
                  type="text" 
                  placeholder="0x..."
                  className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 px-6 text-white font-mono text-xs outline-none focus:border-white/30 transition-all"
                 />
                 <button className="w-full py-5 bg-white text-violet-600 font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-zinc-100 transition-all text-xs shadow-xl active:scale-95">
                    Deploy Audit Drone
                 </button>
              </div>
            </div>
          </div>

          {/* Vulnerability Matrix */}
          <div className="zenith-glass rounded-[40px] p-8 border border-white/5 space-y-8">
             <div className="flex items-center gap-3">
                <BarChart3 size={18} className="text-zinc-500" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Security Matrix</h3>
             </div>
             <div className="space-y-6">
               {[
                 { label: 'Reentrancy Gating', level: 'Secure', color: 'bg-emerald-500', pct: 100 },
                 { label: 'Integer Sanitization', level: 'Secure', color: 'bg-emerald-500', pct: 100 },
                 { label: 'Mempool Privacy', level: 'Optimal', color: 'bg-blue-500', pct: 92 },
                 { label: 'Oracle Latency', level: 'Stable', color: 'bg-violet-500', pct: 88 },
               ].map((v, i) => (
                 <div key={i} className="space-y-2">
                   <div className="flex justify-between items-center">
                     <span className="text-xs text-zinc-300 font-black uppercase tracking-tight italic">{v.label}</span>
                     <span className="text-[10px] font-black text-white uppercase opacity-60">{v.level}</span>
                   </div>
                   <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${v.pct}%` }}
                        transition={{ duration: 1.5, delay: i * 0.1 }}
                        className={`h-full ${v.color} shadow-[0_0_10px_rgba(255,255,255,0.1)]`}
                      />
                   </div>
                 </div>
               ))}
             </div>
          </div>

          {/* Terminal Console */}
          <div className="bg-black border border-white/10 rounded-[32px] p-6 font-mono text-[11px] space-y-3 relative overflow-hidden min-h-[240px]">
            <div className="scanline opacity-20" />
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
               <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/30 border border-red-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/30 border border-amber-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30 border border-emerald-500/50" />
               </div>
               <div className="text-zinc-700 text-[9px] font-black uppercase tracking-widest">Kernel v2.04</div>
            </div>
            <div className="space-y-1.5">
               <div className="text-violet-500 font-black flex items-center gap-2">
                  <Terminal size={12} />
                  <span>ZENITH_ORACLE_SHELL</span>
               </div>
               <div className="text-zinc-600 italic tracking-tight">$ tail -f /var/log/zenith/oracle.log</div>
               <div className="text-emerald-500/80">&gt; [OK] Block 19284712 Sync Validated</div>
               <div className="text-emerald-500/80">&gt; [OK] Oracle Consensus: Quorum Reached (42/42)</div>
               <div className="text-zinc-500">&gt; [SCAN] Analyzing Mission #1204 Metadata...</div>
               <div className="text-amber-500/80">&gt; [WARN] Low Liquidity Detected in Pool_X9</div>
               <div className="text-violet-400 animate-pulse">&gt; [INFO] Neural Audit Subsystem Standby...</div>
               <div className="flex items-center gap-1 mt-4">
                  <span className="text-zinc-700">$</span>
                  <div className="w-2 h-4 bg-violet-500/50 animate-pulse" />
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
