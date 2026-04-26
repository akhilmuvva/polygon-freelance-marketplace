'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Shield, TrendingUp, Wallet, 
  Clock, CheckCircle2, AlertCircle,
  ArrowUpRight, ArrowDownRight, Activity,
  Terminal, Cpu, Globe, Database,
  ExternalLink, ChevronRight, Fingerprint
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

const data = [
  { name: '00:00', value: 400 },
  { name: '04:00', value: 300 },
  { name: '08:00', value: 900 },
  { name: '12:00', value: 1480 },
  { name: '16:00', value: 1200 },
  { name: '20:00', value: 1900 },
  { name: '23:59', value: 2400 },
];

const feedItems = [
  { id: 1, type: 'SUCCESS', message: 'Mission #842 initialized on Polygon POS.', time: '2m ago' },
  { id: 2, type: 'ALERT', message: 'Protocol resonance shift detected in Sector 7.', time: '5m ago' },
  { id: 3, type: 'INFO', message: 'Reputation batch #492 minted to Sovereign identity.', time: '12m ago' },
  { id: 4, type: 'SUCCESS', message: 'Escrow settlement completed for Zenith Labs.', time: '18m ago' },
  { id: 5, type: 'INFO', message: 'New expert node joining the Zenith Network.', time: '25m ago' },
];

export const ZenithDashboard = () => {
  const [terminalText, setTerminalText] = useState('');
  const fullText = "SYSTEM READY: ZENITH PROTOCOL V2.0.4. INITIALIZING COMMAND CENTER... ACCESS GRANTED TO SOVEREIGN IDENTITY #001.";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTerminalText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden p-8 rounded-[2rem] bg-gradient-to-br from-[#00ffd5]/10 via-transparent to-transparent border border-[#00ffd5]/20"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#00ffd5] animate-pulse" />
            <span className="text-[10px] font-black text-[#00ffd5] uppercase tracking-[0.3em]">Protocol Active</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">
            Welcome back, <span className="text-[#00ffd5]">Sovereign</span>
          </h1>
          <p className="text-zinc-400 max-w-lg text-sm leading-relaxed">
            Your decentralized intelligence hub is fully operational. All security layers are engaged and gasless operations are optimized.
          </p>
        </div>
        
        {/* Background Decorative */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-64 h-64 bg-[#00ffd5] rounded-full blur-[120px]" />
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Sovereign Balance', value: '14,280', unit: 'POL', icon: Wallet, color: '#00ffd5' },
          { label: 'Escrow Locked', value: '4,500', unit: 'USDC', icon: Shield, color: '#a855f7' },
          { label: 'Protocol Reputation', value: '1,240', unit: 'RP', icon: Zap, color: '#fbbf24' },
          { label: 'Active Vectors', value: '12', unit: 'JOBS', icon: Activity, color: '#3b82f6' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="zenith-glass p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 rounded-2xl bg-white/5 group-hover:scale-110 transition-transform">
                <stat.icon size={24} style={{ color: stat.color }} />
              </div>
              <div className="h-1 w-12 bg-white/5 rounded-full overflow-hidden mt-3">
                <div className="h-full bg-white/20 w-2/3" />
              </div>
            </div>
            <div>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">{stat.label}</span>
              <div className="text-3xl font-black text-white flex items-baseline gap-2">
                {stat.value}
                <span className="text-xs font-bold text-zinc-600">{stat.unit}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Middle Grid: Terminal + Resonance Chart */}
      <div className="grid lg:grid-cols-5 gap-8">
        {/* Intelligence Feed (Terminal) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 zenith-glass rounded-[2rem] border border-white/5 overflow-hidden flex flex-col"
        >
          <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-[#00ffd5]" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Intelligence Feed</span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-zinc-800" />
              <div className="w-2 h-2 rounded-full bg-zinc-800" />
              <div className="w-2 h-2 rounded-full bg-zinc-800" />
            </div>
          </div>
          <div className="p-6 font-mono text-[11px] flex-1 space-y-4">
            <div className="text-[#00ffd5] leading-relaxed">
              {terminalText}<span className="animate-pulse">_</span>
            </div>
            <div className="space-y-3 pt-4">
              {feedItems.map((item) => (
                <div key={item.id} className="flex gap-3 text-zinc-500 hover:text-zinc-300 transition-colors cursor-default">
                  <span className={`shrink-0 ${
                    item.type === 'SUCCESS' ? 'text-emerald-500' : 
                    item.type === 'ALERT' ? 'text-red-500' : 'text-blue-500'
                  }`}>[{item.type}]</span>
                  <span className="flex-1">{item.message}</span>
                  <span className="text-[9px] text-zinc-700">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Protocol Resonance (Chart) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3 zenith-glass rounded-[2rem] border border-white/5 p-8"
        >
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Cpu size={16} className="text-[#a855f7]" />
                <h3 className="text-lg font-bold text-white">Protocol Resonance</h3>
              </div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Compute efficiency & gas savings</p>
            </div>
            <div className="flex gap-2">
              <div className="flex flex-col items-end">
                <span className="text-xl font-black text-white">99.9%</span>
                <span className="text-[9px] text-[#00ffd5] font-bold uppercase">Uptime</span>
              </div>
            </div>
          </div>
          
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="resonanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ffd5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#00ffd5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#ffffff10" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  hide
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#00ffd5', fontSize: '10px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#00ffd5" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#resonanceGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row: Active Nodes & Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Active Nodes */}
        <div className="zenith-glass p-8 rounded-[2rem] border border-white/5 lg:col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <Globe size={16} className="text-blue-500" />
            <h3 className="text-md font-bold text-white">Global Nodes</h3>
          </div>
          <div className="space-y-4">
            {['Singapore', 'New York', 'London', 'Tokyo'].map((city, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00ffd5]" />
                  <span className="text-xs font-bold text-zinc-300">{city}</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">24ms</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions / Vectors */}
        <div className="lg:col-span-2 zenith-glass p-8 rounded-[2rem] border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Database size={16} className="text-orange-500" />
              <h3 className="text-md font-bold text-white">Execution Layer</h3>
            </div>
            <button className="text-[10px] font-black text-[#00ffd5] uppercase tracking-widest hover:underline">
              View Explorer
            </button>
          </div>
          <div className="space-y-1">
            {[
              { id: '0x842...f21', action: 'Initiate Mission', value: '+2,400 POL', time: '2m ago' },
              { id: '0x219...a10', action: 'Reputation Mint', value: '+15 RP', time: '12m ago' },
              { id: '0xf92...11d', action: 'Escrow Lock', value: '-400 USDC', time: '45m ago' },
            ].map((tx, i) => (
              <div key={i} className="group flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-xl bg-white/5 text-zinc-400 group-hover:text-white">
                    <Fingerprint size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-200">{tx.action}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">{tx.id}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-white">{tx.value}</div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase">{tx.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
