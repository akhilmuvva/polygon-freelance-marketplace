"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  ArrowUpRight, 
  Terminal,
  Globe,
  Cpu,
  Fingerprint
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const RESONANCE_DATA = [
  { name: '00:00', value: 400, pulse: 240 },
  { name: '04:00', value: 300, pulse: 139 },
  { name: '08:00', value: 200, pulse: 980 },
  { name: '12:00', value: 278, pulse: 390 },
  { name: '16:00', value: 189, pulse: 480 },
  { name: '20:00', value: 239, pulse: 380 },
  { name: '23:59', value: 349, pulse: 430 },
];

const STATS = [
  { label: 'Network Latency', value: '12ms', icon: Activity, trend: '-2%', color: 'text-emerald-400' },
  { label: 'Active Missions', value: '1,284', icon: Zap, trend: '+12%', color: 'text-violet-400' },
  { label: 'Oracle Confidence', value: '99.9%', icon: ShieldCheck, trend: 'Stable', color: 'text-blue-400' },
  { label: 'Total Value Locked', value: '$42.8M', icon: TrendingUp, trend: '+5.4%', color: 'text-fuchsia-400' },
];

export default function Dashboard() {
  return (
    <div className="space-y-8 pb-10">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="zenith-glass p-6 rounded-2xl relative overflow-hidden group cursor-pointer"
          >
            <div className="scanline opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-xl bg-white/5 border border-white/5 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full bg-white/5 ${stat.color.replace('text-', 'text- opacity-70')}`}>
                {stat.trend}
              </span>
            </div>
            <div className="mt-4">
              <div className="text-zinc-500 text-sm font-medium">{stat.label}</div>
              <div className="text-2xl font-black mt-1 italic tracking-tight">{stat.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 zenith-glass p-8 rounded-3xl relative"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Activity className="text-violet-500 w-5 h-5" />
                Protocol Resonance
              </h2>
              <p className="text-zinc-500 text-sm mt-1">Real-time throughput and verification frequency</p>
            </div>
            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs outline-none hover:bg-white/10 transition-colors">
              <option>Live Feed</option>
              <option>Last 24h</option>
              <option>Last 7d</option>
            </select>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={RESONANCE_DATA}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d946ef" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#d946ef" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#71717a" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff10', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="pulse" 
                  stroke="#d946ef" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fillOpacity={1} 
                  fill="url(#colorPulse)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Intelligence Feed */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="zenith-glass p-8 rounded-3xl"
        >
          <div className="flex items-center gap-2 mb-6">
            <Fingerprint className="text-fuchsia-500 w-5 h-5" />
            <h2 className="text-xl font-bold">Zenith Intelligence</h2>
          </div>
          
          <div className="space-y-6">
            {[
              { id: '1', type: 'SEC', msg: 'New mission verification detected on Polygon Amoy', time: '2m ago', icon: Globe },
              { id: '2', type: 'AI', msg: 'Milestone auto-generation completed for "Neural Link"', time: '14m ago', icon: Cpu },
              { id: '3', type: 'SYS', msg: 'Oracle consensus reached with 99.8% precision', time: '45m ago', icon: Terminal },
              { id: '4', type: 'SEC', msg: 'Escrow release authorized for Mission #842', time: '1h ago', icon: ShieldCheck },
            ].map((item, i) => (
              <div key={item.id} className="flex gap-4 group cursor-pointer">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center group-hover:border-violet-500/50 transition-colors">
                    <item.icon className="w-4 h-4 text-zinc-400 group-hover:text-violet-400" />
                  </div>
                  {i !== 3 && <div className="w-px h-full bg-white/5 mt-2" />}
                </div>
                <div className="pb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 bg-white/5 px-2 rounded">
                      {item.type}
                    </span>
                    <span className="text-[10px] text-zinc-600 font-bold">{item.time}</span>
                  </div>
                  <p className="text-sm text-zinc-300 font-medium group-hover:text-white transition-colors">
                    {item.msg}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 py-3 rounded-xl bg-white/5 border border-white/5 text-sm font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2">
            View All Events
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>

      {/* Protocol Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="lg:col-span-1 zenith-glass p-6 rounded-2xl border-l-4 border-l-violet-500">
           <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Network Status</h3>
           <div className="space-y-4">
             <div className="flex items-center justify-between">
               <span className="text-sm">Consensus Node #1</span>
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
             </div>
             <div className="flex items-center justify-between">
               <span className="text-sm">Storage Layer</span>
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
             </div>
             <div className="flex items-center justify-between">
               <span className="text-sm">Oracle Mesh</span>
               <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
             </div>
           </div>
        </div>
        
        <div className="lg:col-span-2 zenith-glass p-6 rounded-2xl bg-gradient-to-br from-violet-600/10 to-transparent border border-violet-500/10">
           <div className="flex items-center justify-between">
             <div>
               <h3 className="text-lg font-bold italic">Sovereign Rewards Available</h3>
               <p className="text-zinc-400 text-sm">Boost your protocol reputation by completing expert reviews.</p>
             </div>
             <button className="px-6 py-2 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform">
               Claim 12.5 ZNT
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
