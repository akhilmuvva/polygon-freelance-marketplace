'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, Medal, Star, Target, 
  Zap, Shield, Globe, Award,
  ChevronUp, ChevronDown, Activity,
  Users, TrendingUp, Crown, Fingerprint
} from 'lucide-react';

const LEADERS = [
  { id: 1, name: 'Xeno.eth', xp: 12450, missions: 142, earned: '42,000 POL', rank: 1, trend: 'up' },
  { id: 2, name: 'Ghost_Audit', xp: 11200, missions: 64, earned: '38,500 POL', rank: 2, trend: 'up' },
  { id: 3, name: 'Neural_Dev', xp: 9800, missions: 89, earned: '31,200 POL', rank: 3, trend: 'down' },
  { id: 4, name: 'Sovereign_01', xp: 8400, missions: 42, earned: '24,000 POL', rank: 4, trend: 'up' },
  { id: 5, name: 'Cyber_Architect', xp: 7200, missions: 56, earned: '19,500 POL', rank: 5, trend: 'stable' },
  { id: 6, name: 'Void_Seeker', xp: 6800, missions: 31, earned: '15,200 POL', rank: 6, trend: 'up' },
];

export const ZenithLeaderboard = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-32">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 border-b border-white/5 pb-12"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4">
             <div className="px-3 py-1 bg-[#00ffd5]/10 border border-[#00ffd5]/20 rounded-full flex items-center gap-2">
               <Trophy size={12} className="text-[#00ffd5]" />
               <span className="text-[10px] font-black text-[#00ffd5] uppercase tracking-[0.3em]">Hall of Sovereigns</span>
             </div>
             <div className="flex items-center gap-1.5 text-zinc-500 font-black text-[10px] tracking-widest uppercase">
               Season 1 Protocol Resonance
             </div>
          </div>
          <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-none">
            ELITE <span className="text-[#00ffd5]">LEADERBOARD</span>
          </h1>
          <p className="text-zinc-500 text-lg font-medium max-w-2xl leading-relaxed">
            Celebrating the architects of the decentralized frontier. 
            Ranked by mission complexity, trust score, and protocol impact.
          </p>
        </div>

        <div className="flex gap-4">
           <div className="zenith-glass px-8 py-6 rounded-[32px] border border-white/5 text-center min-w-[160px]">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Active Nodes</span>
              <div className="text-4xl font-black text-white italic tracking-tighter">1,284</div>
           </div>
           <div className="zenith-glass px-8 py-6 rounded-[32px] border border-white/5 text-center min-w-[160px]">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Total Rewards</span>
              <div className="text-4xl font-black text-[#00ffd5] italic tracking-tighter">$420K</div>
           </div>
        </div>
      </motion.header>

      {/* Podium - High Fidelity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end max-w-5xl mx-auto py-12">
         {/* Rank 2 */}
         <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="zenith-glass p-8 rounded-[40px] border border-white/5 h-[340px] relative flex flex-col items-center justify-end group cursor-pointer hover:border-white/10 transition-all"
         >
            <div className="absolute top-0 inset-x-0 p-8 flex flex-col items-center">
               <div className="w-20 h-20 rounded-[28px] bg-zinc-800 border border-white/10 flex items-center justify-center text-2xl font-black text-zinc-400 italic mb-4 overflow-hidden relative">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ghost" alt="Rank 2" className="w-full h-full opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center">GA</div>
               </div>
               <h3 className="text-xl font-black text-white italic">{LEADERS[1].name}</h3>
               <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Protocol Auditor</span>
            </div>
            <div className="text-center pb-4">
               <div className="text-2xl font-black text-zinc-400 italic">{LEADERS[1].xp} XP</div>
            </div>
            <div className="absolute -bottom-4 bg-zinc-900 px-6 py-2 rounded-xl text-[10px] font-black text-zinc-500 border border-white/5 tracking-[0.2em]">PLATINUM NODE</div>
         </motion.div>

         {/* Rank 1 */}
         <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="zenith-glass p-10 rounded-[50px] border border-[#00ffd5]/30 h-[460px] relative flex flex-col items-center justify-end group cursor-pointer bg-[#00ffd5]/5 shadow-2xl shadow-[#00ffd5]/10"
         >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none rounded-[50px]" />
            <div className="absolute top-0 inset-x-0 p-10 flex flex-col items-center">
               <div className="relative">
                  <div className="w-28 h-28 rounded-[36px] bg-gradient-to-br from-[#00ffd5] to-blue-600 flex items-center justify-center text-5xl font-black text-black italic shadow-2xl shadow-[#00ffd5]/40 mb-6 overflow-hidden">
                     <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Xeno" alt="Rank 1" className="w-full h-full" />
                  </div>
                  <div className="absolute -top-4 -right-4 bg-[#00ffd5] p-2.5 rounded-xl shadow-xl animate-bounce">
                     <Crown size={24} className="text-black" />
                  </div>
               </div>
               <h3 className="text-3xl font-black text-white italic tracking-tighter">{LEADERS[0].name}</h3>
               <span className="text-[10px] font-black text-[#00ffd5] uppercase tracking-[0.4em] mt-1">Supreme Architect</span>
            </div>
            <div className="text-center pb-12">
               <div className="text-5xl font-black text-white italic tracking-tighter">{LEADERS[0].xp} XP</div>
               <div className="text-[10px] text-[#00ffd5] font-black uppercase tracking-[0.2em] mt-2">Unstoppable Identity</div>
            </div>
            <div className="absolute -bottom-5 bg-white text-black px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.3em] border border-white shadow-[0_10px_40px_rgba(255,255,255,0.2)]">ZENITH PRIME</div>
         </motion.div>

         {/* Rank 3 */}
         <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="zenith-glass p-8 rounded-[40px] border border-white/5 h-[300px] relative flex flex-col items-center justify-end group cursor-pointer hover:border-white/10 transition-all"
         >
            <div className="absolute top-0 inset-x-0 p-8 flex flex-col items-center">
               <div className="w-18 h-18 rounded-[24px] bg-zinc-800 border border-white/10 flex items-center justify-center text-xl font-black text-zinc-400 italic mb-4 overflow-hidden relative">
                   <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Neural" alt="Rank 3" className="w-full h-full opacity-50" />
                   <div className="absolute inset-0 flex items-center justify-center">ND</div>
               </div>
               <h3 className="text-xl font-black text-white italic">{LEADERS[2].name}</h3>
               <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Neural Specialist</span>
            </div>
            <div className="text-center pb-4">
               <div className="text-2xl font-black text-zinc-400 italic">{LEADERS[2].xp} XP</div>
            </div>
            <div className="absolute -bottom-4 bg-zinc-900 px-6 py-2 rounded-xl text-[10px] font-black text-zinc-500 border border-white/5 tracking-[0.2em]">GOLD NODE</div>
         </motion.div>
      </div>

      {/* Main Table */}
      <div className="zenith-glass rounded-[40px] border border-white/5 overflow-hidden">
         <div className="px-10 py-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Fingerprint size={20} className="text-[#00ffd5]" />
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Global Ranking Archive</h3>
            </div>
            <div className="flex gap-4">
               <select className="bg-transparent text-[10px] font-black text-zinc-500 uppercase tracking-widest outline-none cursor-pointer hover:text-white transition-colors">
                  <option>Season 1</option>
                  <option>Legacy</option>
               </select>
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full">
               <thead>
                  <tr className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] border-b border-white/5">
                     <th className="px-10 py-8 text-left">Sovereign Identity</th>
                     <th className="px-10 py-8 text-center">Missions</th>
                     <th className="px-10 py-8 text-center">XP Rating</th>
                     <th className="px-10 py-8 text-right">Yield Settled</th>
                     <th className="px-10 py-8 text-right">Resonance</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {LEADERS.slice(3).map((leader, i) => (
                     <tr key={leader.id} className="hover:bg-white/[0.02] transition-all group cursor-pointer">
                        <td className="px-10 py-8">
                           <div className="flex items-center gap-6">
                              <span className="text-xl font-black text-zinc-800 italic group-hover:text-zinc-600 transition-colors">#{leader.rank}</span>
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-zinc-500 italic border border-white/5 overflow-hidden">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${leader.name}`} alt="" className="w-full h-full opacity-60 group-hover:opacity-100 transition-opacity" />
                                 </div>
                                 <div>
                                    <div className="text-lg font-black text-white italic group-hover:text-[#00ffd5] transition-colors tracking-tight">{leader.name}</div>
                                    <div className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Sovereign Expert</div>
                                 </div>
                              </div>
                           </div>
                        </td>
                        <td className="px-10 py-8 text-center">
                           <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                              <Zap size={14} className="text-[#00ffd5]" />
                              <span className="text-xs font-black text-white">{leader.missions}</span>
                           </div>
                        </td>
                        <td className="px-10 py-8 text-center">
                           <span className="text-xl font-black text-white italic tracking-tighter">{leader.xp.toLocaleString()}</span>
                        </td>
                        <td className="px-10 py-8 text-right">
                           <span className="text-xl font-black text-[#00ffd5] italic tracking-tighter">{leader.earned}</span>
                        </td>
                        <td className="px-10 py-8 text-right">
                           <div className={`flex items-center justify-end gap-1.5 font-black text-[10px] uppercase tracking-widest ${
                              leader.trend === 'up' ? 'text-emerald-500' : leader.trend === 'down' ? 'text-red-500' : 'text-zinc-500'
                           }`}>
                              {leader.trend === 'up' ? <ChevronUp size={16} /> : leader.trend === 'down' ? <ChevronDown size={16} /> : <Activity size={16} />}
                              {leader.trend}
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};
