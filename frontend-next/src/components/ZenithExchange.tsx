'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowDownUp, Info, Settings, 
  TrendingUp, TrendingDown, Clock,
  Wallet, ChevronDown, Percent,
  Activity, Zap, Shield, Globe,
  BarChart3, LayoutGrid, List
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const CHART_DATA = [
  { time: '00:00', price: 0.82 },
  { time: '04:00', price: 0.85 },
  { time: '08:00', price: 0.83 },
  { time: '12:00', price: 0.89 },
  { time: '16:00', price: 0.94 },
  { time: '20:00', price: 0.91 },
  { time: '23:59', price: 0.96 },
];

export const ZenithExchange = () => {
  const [fromToken, setFromToken] = useState({ symbol: 'MATIC', name: 'Polygon', balance: '124.5', price: '0.94' });
  const [toToken, setToToken] = useState({ symbol: 'ZEN', name: 'Zenith', balance: '0.0', price: '1.24' });
  const [fromAmount, setFromAmount] = useState('');
  
  const toAmount = fromAmount ? (parseFloat(fromAmount) * 0.75).toFixed(2) : '0.00';

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12 pb-32">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 border-b border-white/5 pb-12"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4">
             <span className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-[10px] font-black text-violet-400 uppercase tracking-[0.2em]">
               Liquidity Protocol v3
             </span>
             <div className="flex items-center gap-1.5 text-emerald-500 font-black text-[10px] tracking-widest">
               <Activity size={12} /> NETWORK OPTIMAL
             </div>
          </div>
          <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-none">
            ZENITH <span className="text-violet-500">EXCHANGE</span>
          </h1>
          <p className="text-zinc-500 text-lg font-medium max-w-2xl">
            Sovereign liquidity layer for the Polygon ecosystem. Zero slippage, 
            instant settlement, and protocol-native yields.
          </p>
        </div>
        <div className="flex gap-4">
           <div className="zenith-glass px-8 py-4 rounded-[24px] border border-white/5 flex items-center gap-4">
              <div className="text-right">
                 <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Global Volume (24h)</span>
                 <div className="text-xl font-black text-white">$14.2M</div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="flex items-center gap-2 text-emerald-500 font-black">
                 <TrendingUp size={20} /> +12.4%
              </div>
           </div>
        </div>
      </motion.header>

      <div className="grid lg:grid-cols-12 gap-12">
        
        {/* Swap Console */}
        <div className="lg:col-span-5 space-y-6">
           <div className="zenith-glass p-8 rounded-[40px] border border-white/10 relative overflow-hidden group shadow-2xl shadow-violet-500/5">
              <div className="scanline opacity-10" />
              
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-lg font-black text-white italic tracking-tight">SWAP PROTOCOL</h3>
                 <div className="flex gap-2">
                    <button className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-zinc-400">
                       <Settings size={18} />
                    </button>
                    <button className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-zinc-400">
                       <RefreshCcw size={18} />
                    </button>
                 </div>
              </div>

              <div className="space-y-4">
                 {/* From Token */}
                 <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Source Asset</span>
                       <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Balance: {fromToken.balance}</span>
                    </div>
                    <div className="flex items-center gap-4">
                       <input 
                        type="number" 
                        placeholder="0.0"
                        value={fromAmount}
                        onChange={(e) => setFromAmount(e.target.value)}
                        className="flex-1 bg-transparent border-none text-4xl font-black text-white outline-none placeholder:text-zinc-800"
                       />
                       <button className="bg-black/40 border border-white/10 p-3 rounded-2xl flex items-center gap-3 hover:bg-black/60 transition-all">
                          <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center font-black text-[10px]">{fromToken.symbol[0]}</div>
                          <span className="font-black text-white">{fromToken.symbol}</span>
                          <ChevronDown size={16} className="text-zinc-500" />
                       </button>
                    </div>
                 </div>

                 {/* Divider/Flip */}
                 <div className="flex justify-center -my-6 relative z-10">
                    <button className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-black shadow-2xl hover:scale-110 active:scale-95 transition-all">
                       <ArrowDownUp size={20} />
                    </button>
                 </div>

                 {/* To Token */}
                 <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Target Asset</span>
                       <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Est. Recieved</span>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="flex-1 text-4xl font-black text-white italic">
                          {toAmount}
                       </div>
                       <button className="bg-black/40 border border-white/10 p-3 rounded-2xl flex items-center gap-3 hover:bg-black/60 transition-all">
                          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-black text-[10px]">{toToken.symbol[0]}</div>
                          <span className="font-black text-white">{toToken.symbol}</span>
                          <ChevronDown size={16} className="text-zinc-500" />
                       </button>
                    </div>
                 </div>
              </div>

              {/* Execution Details */}
              <div className="mt-8 p-6 bg-black/20 rounded-3xl border border-white/5 space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Exchange Rate</span>
                    <span className="text-xs font-bold text-white">1 {fromToken.symbol} = 0.75 {toToken.symbol}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Network Fee</span>
                    <span className="text-xs font-bold text-emerald-400">GASLESS</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Price Impact</span>
                    <span className="text-xs font-bold text-zinc-400">&lt; 0.01%</span>
                 </div>
              </div>

              <button className="w-full mt-8 py-6 bg-white text-black hover:bg-violet-500 hover:text-white transition-all rounded-[24px] font-black text-lg uppercase tracking-[0.1em] flex items-center justify-center gap-4 shadow-2xl shadow-white/5 active:scale-95 group">
                <Zap size={24} className="group-hover:scale-125 transition-transform" />
                SWAP ASSETS
              </button>
           </div>

           <div className="zenith-glass p-6 rounded-[32px] border border-white/5 flex items-center gap-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                 <Shield size={24} />
              </div>
              <div>
                 <h4 className="text-xs font-black text-white uppercase tracking-widest">Zenith Protection</h4>
                 <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Anti-MEV and Slippage protection active.</p>
              </div>
           </div>
        </div>

        {/* Intelligence Column */}
        <div className="lg:col-span-7 space-y-8">
           
           {/* Chart Terminal */}
           <div className="zenith-glass rounded-[40px] border border-white/5 overflow-hidden">
              <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                 <div className="flex items-center gap-4">
                    <div className="p-2 bg-emerald-500/10 rounded-xl">
                       <BarChart3 size={20} className="text-emerald-500" />
                    </div>
                    <div>
                       <h3 className="text-sm font-black uppercase tracking-[0.1em] text-white italic">{fromToken.symbol} / {toToken.symbol} ANALYTICS</h3>
                       <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">+12.4% vs 24h</p>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    {['1H', '4H', '1D', '1W'].map(t => (
                      <button key={t} className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${t === '1D' ? 'bg-violet-500 text-white' : 'text-zinc-500 hover:bg-white/5'}`}>
                        {t}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="h-[400px] w-full p-8 relative">
                 <div className="absolute inset-0 scanline opacity-5" />
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={CHART_DATA}>
                       <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <XAxis dataKey="time" hide />
                       <YAxis hide domain={['auto', 'auto']} />
                       <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                        itemStyle={{ color: '#8b5cf6', fontWeight: 'bold' }}
                       />
                       <Area 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#8b5cf6" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorPrice)" 
                       />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Market Stats Grid */}
           <div className="grid grid-cols-2 gap-6">
              <div className="zenith-glass p-8 rounded-[32px] border border-white/5">
                 <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-4">Liquidity Depth</span>
                 <div className="flex items-center justify-between">
                    <div className="text-3xl font-black text-white italic">$4.2M</div>
                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                       <Layers size={20} />
                    </div>
                 </div>
              </div>
              <div className="zenith-glass p-8 rounded-[32px] border border-white/5">
                 <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-4">Protocol Yield (v3)</span>
                 <div className="flex items-center justify-between">
                    <div className="text-3xl font-black text-emerald-500 italic">4.2% APR</div>
                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
                       <Percent size={20} />
                    </div>
                 </div>
              </div>
           </div>

           {/* Recent Transfers / Activity */}
           <div className="zenith-glass rounded-[40px] border border-white/5 overflow-hidden">
              <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                 <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Live Settlement Feed</h3>
              </div>
              <div className="p-2">
                 {[
                   { user: '0x3c...f9b4', action: 'Swapped', pair: 'MATIC/ZEN', amt: '4,200', time: '1m ago' },
                   { user: '0x8f...e1a2', action: 'Added Liquidity', pair: 'USDC/ZEN', amt: '10,000', time: '5m ago' },
                   { user: '0x7d...a5c8', action: 'Swapped', pair: 'ETH/ZEN', amt: '0.42', time: '12m ago' },
                 ].map((act, i) => (
                    <div key={i} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-all rounded-3xl">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                             <Globe size={18} className="text-zinc-500" />
                          </div>
                          <div>
                             <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white italic">{act.user}</span>
                                <span className="px-2 py-0.5 bg-violet-500/10 rounded text-[9px] font-black text-violet-400 uppercase">{act.action}</span>
                             </div>
                             <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">{act.pair} • {act.amt}</p>
                          </div>
                       </div>
                       <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{act.time}</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};
