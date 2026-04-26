'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, Award, Shield, Star, 
  Hexagon, Flame, Target, Trophy,
  ChevronRight, Lock
} from 'lucide-react';

const badges = [
  { id: 1, name: 'Genesis Contributor', desc: 'Pioneer of the Zenith Protocol', icon: Trophy, color: '#f59e0b', earned: true },
  { id: 2, name: 'Smart Contract Elite', desc: 'Completed 50+ high-stakes missions', icon: Shield, color: '#00ffd5', earned: true },
  { id: 3, name: 'ZK-Proof Sage', desc: 'Expertise in zero-knowledge systems', icon: Hexagon, color: '#a855f7', earned: true },
  { id: 4, name: 'Network Guardian', desc: 'Maintained 99.9% uptime for 6 months', icon: Target, color: '#3b82f6', earned: false },
  { id: 5, name: 'Oracle Master', desc: 'Secured data feeds for 10+ DAOs', icon: Star, color: '#ec4899', earned: false },
];

export const ZenithReputation = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-12">
      {/* Reputation Hero */}
      <div className="text-center space-y-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative inline-block"
        >
          <div className="absolute inset-0 bg-[#00ffd5]/20 blur-[60px] rounded-full" />
          <div className="relative w-48 h-48 rounded-full border-2 border-[#00ffd5]/30 flex flex-col items-center justify-center bg-[#09090b]">
            <span className="text-5xl font-black text-white tracking-tighter">1,240</span>
            <span className="text-[10px] font-black text-[#00ffd5] uppercase tracking-widest mt-1">Reputation Score</span>
          </div>
        </motion.div>
        
        <h1 className="text-3xl font-black text-white tracking-tight">Sovereign Standing</h1>
        <p className="text-zinc-500 max-w-md mx-auto text-sm leading-relaxed">
          Your reputation is an immutable soulbound record of your contributions to the Zenith Ecosystem.
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Global Rank', value: '#42', icon: Trophy },
          { label: 'Trust Score', value: '98.2%', icon: Shield },
          { label: 'Active Streak', value: '14 Days', icon: Flame },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="zenith-glass p-6 rounded-3xl border border-white/5 text-center"
          >
            <div className="flex justify-center mb-3">
              <stat.icon className="text-zinc-500" size={20} />
            </div>
            <div className="text-2xl font-black text-white mb-1">{stat.value}</div>
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Badges Section */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Soulbound Badges</h3>
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">3 / 12 Earned</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((badge, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className={`zenith-glass p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group ${!badge.earned ? 'opacity-50 grayscale' : ''}`}
            >
              {!badge.earned && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex flex-col items-center gap-2">
                    <Lock size={24} className="text-white" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Locked</span>
                  </div>
                </div>
              )}
              
              <div className="relative z-0">
                <div className="p-4 rounded-2xl bg-white/5 w-fit mb-6">
                  <badge.icon size={32} style={{ color: badge.color }} />
                </div>
                <h4 className="text-md font-bold text-white mb-2">{badge.name}</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">{badge.desc}</p>
                
                {badge.earned && (
                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[9px] font-mono text-zinc-600">ID: #SB-00{badge.id}</span>
                    <button className="text-[9px] font-black text-[#00ffd5] uppercase tracking-widest hover:underline flex items-center gap-1">
                      On-Chain <ChevronRight size={10} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
