'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Shield, Star, Briefcase, 
  Search, Filter, Globe, Cpu, 
  Terminal, Zap, Fingerprint, Award,
  ChevronRight, ExternalLink, Network,
  MessageSquare, Layers, Target, Trophy
} from 'lucide-react';

const EXPERTS = [
  { 
    id: 1, 
    name: 'Xeno.eth', 
    role: 'Solidity Architect', 
    rating: 4.9, 
    missions: 142, 
    skills: ['EVM', 'Assembly', 'ZK-Proofs'],
    reputation: 98,
    avatar: 'Xeno',
    status: 'Available'
  },
  { 
    id: 2, 
    name: 'Neural_Dev', 
    role: 'AI Infrastructure', 
    rating: 5.0, 
    missions: 89, 
    skills: ['Python', 'TensorFlow', 'LLMs'],
    reputation: 95,
    avatar: 'Neural',
    status: 'In Mission'
  },
  { 
    id: 3, 
    name: 'Sovereign_Dev', 
    role: 'UI/UX Protocol', 
    rating: 4.8, 
    missions: 215, 
    skills: ['Figma', 'React', 'Motion'],
    reputation: 92,
    avatar: 'Sovereign',
    status: 'Available'
  },
  { 
    id: 4, 
    name: 'Ghost_Audit', 
    role: 'Security Specialist', 
    rating: 5.0, 
    missions: 64, 
    skills: ['Slither', 'Mythril', 'Formal Verification'],
    reputation: 99,
    avatar: 'Ghost',
    status: 'Available'
  },
];

export const ExpertNetwork = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Sectors');

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
               <Network size={12} className="text-[#00ffd5]" />
               <span className="text-[10px] font-black text-[#00ffd5] uppercase tracking-[0.3em]">Verified Sovereign Agents</span>
             </div>
             <div className="flex items-center gap-1.5 text-emerald-500 font-black text-[10px] tracking-widest uppercase">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> 1,284 ONLINE
             </div>
          </div>
          <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-none">
            ZENITH <span className="text-[#00ffd5]">AGENTS</span>
          </h1>
          <p className="text-zinc-500 text-lg font-medium max-w-2xl leading-relaxed">
            The elite talent layer of the decentralized frontier. Connect with 
            sovereign architects, neural engineers, and security specialists.
          </p>
        </div>

        <div className="w-full lg:w-96">
           <div className="relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-zinc-500 group-hover:text-[#00ffd5] transition-colors">
                <Search size={18} />
              </div>
              <input 
                type="text" 
                placeholder="SEARCH AGENTS..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white font-black text-xs outline-none focus:border-[#00ffd5]/50 focus:bg-white/[0.07] transition-all tracking-[0.2em]"
              />
           </div>
        </div>
      </motion.header>

      {/* Filter Bar */}
      <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
         {['All Sectors', 'Development', 'Security', 'Design', 'AI/Neural', 'Legal'].map(cat => (
           <button 
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border ${
              selectedCategory === cat 
              ? 'bg-[#00ffd5] text-black border-[#00ffd5]' 
              : 'bg-white/5 text-zinc-500 border-white/5 hover:border-white/20'
            }`}
           >
             {cat}
           </button>
         ))}
      </div>

      {/* Expert Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <AnimatePresence>
          {EXPERTS.map((expert, i) => (
            <motion.div 
              key={expert.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -10 }}
              className="zenith-glass p-8 rounded-[3rem] border border-white/5 relative overflow-hidden group cursor-pointer"
            >
              <div className="scanline opacity-10" />
              
              <div className="flex justify-between items-start mb-8">
                 <div className="w-20 h-20 rounded-[32px] bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl group-hover:scale-110 transition-transform">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${expert.avatar}`} 
                      alt={expert.name} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                    />
                 </div>
                 <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                   expert.status === 'Available' 
                   ? 'bg-[#00ffd5]/10 text-[#00ffd5] border-[#00ffd5]/20' 
                   : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                 }`}>
                   {expert.status}
                 </div>
              </div>

              <div className="space-y-1 mb-8">
                 <h3 className="text-2xl font-black text-white italic tracking-tight group-hover:text-[#00ffd5] transition-colors">
                   {expert.name}
                 </h3>
                 <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                   {expert.role}
                 </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-1">Reputation</span>
                    <div className="text-lg font-black text-emerald-400">{expert.reputation}%</div>
                 </div>
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-1">Missions</span>
                    <div className="text-lg font-black text-[#00ffd5]">{expert.missions}</div>
                 </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-10 min-h-[60px]">
                 {expert.skills.map(skill => (
                   <span key={skill} className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-bold text-zinc-400 uppercase tracking-wider border border-white/5">
                     {skill}
                   </span>
                 ))}
              </div>

              <div className="flex gap-3">
                 <button className="flex-1 py-4 bg-[#00ffd5] text-black font-black uppercase tracking-widest rounded-2xl text-[10px] hover:bg-white transition-all active:scale-95 shadow-xl shadow-[#00ffd5]/10">
                    HIRE AGENT
                 </button>
                 <button className="p-4 bg-white/5 border border-white/10 rounded-2xl text-zinc-400 hover:bg-white/10 transition-all active:scale-95">
                    <MessageSquare size={18} />
                 </button>
              </div>

              {/* Soulbound Badge Decoration */}
              <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity pointer-events-none">
                 <Award size={140} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Featured Sectors */}
      <div className="grid lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 zenith-glass p-10 rounded-[40px] border border-white/5 relative overflow-hidden">
            <div className="relative z-10 space-y-6">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#00ffd5]/10 rounded-2xl">
                     <Layers size={24} className="text-[#00ffd5]" />
                  </div>
                  <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Protocol Recruitment</h3>
               </div>
               <p className="text-zinc-500 font-medium text-lg leading-relaxed max-w-xl">
                 Zenith agents are vetted via on-chain reputation scores and 
                 historical mission performance. Every engagement is protected by the Zenith Security Oracle.
               </p>
               <div className="flex gap-8">
                  <div className="flex flex-col">
                     <span className="text-3xl font-black text-white italic">4.9/5.0</span>
                     <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">AVG RATING</span>
                  </div>
                  <div className="w-px h-12 bg-white/10" />
                  <div className="flex flex-col">
                     <span className="text-3xl font-black text-white italic">$4.2M</span>
                     <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">SETTLED VALUE</span>
                  </div>
               </div>
            </div>
            <div className="absolute -right-20 -top-20 opacity-5">
               <Globe size={300} />
            </div>
         </div>

         <div className="zenith-glass p-10 rounded-[40px] border border-[#00ffd5]/20 bg-gradient-to-br from-[#00ffd5]/20 via-transparent to-transparent shadow-2xl shadow-[#00ffd5]/5 relative overflow-hidden group">
            <div className="scanline opacity-10" />
            <div className="relative z-10 space-y-6">
               <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
                 JOIN THE <br/><span className="text-[#00ffd5]">ZENITH MESH</span>
               </h3>
               <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                 Are you a sovereign architect? Deploy your profile and start participating in high-stakes protocol missions.
               </p>
               <button className="w-full py-5 bg-[#00ffd5] text-black font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-white transition-all text-[10px] shadow-xl active:scale-95">
                 CREATE AGENT PROFILE
               </button>
            </div>
            <div className="absolute -right-10 -bottom-10 text-[#00ffd5] opacity-10 group-hover:scale-110 transition-transform">
               <Zap size={180} />
            </div>
         </div>
      </div>
    </div>
  );
};
