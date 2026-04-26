'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  User, Mail, Globe, Twitter, 
  Github, Shield, BadgeCheck,
  Camera, Save, Settings, Key
} from 'lucide-react';

export const ZenithProfile = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Profile Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="zenith-glass rounded-[2rem] border border-white/5 p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-violet-600/20 to-blue-600/20" />
        
        <div className="relative pt-16 flex flex-col md:flex-row items-end gap-6">
          <div className="relative group">
            <div className="w-32 h-32 rounded-3xl bg-[#09090b] border-4 border-[#050505] overflow-hidden">
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sovereign" 
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <button className="absolute bottom-2 right-2 p-2 rounded-xl bg-[#00ffd5] text-black hover:scale-110 transition-transform">
              <Camera size={16} />
            </button>
          </div>
          
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-black text-white">Sovereign Explorer</h2>
              <BadgeCheck className="text-[#00ffd5]" size={20} />
            </div>
            <p className="text-zinc-500 text-sm font-mono">0x71C...392A</p>
          </div>

          <div className="flex gap-3 pb-2">
            <button className="px-6 py-2.5 rounded-xl bg-[#00ffd5] text-black text-xs font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(0,255,213,0.3)] transition-all">
              Save Changes
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Sidebar Settings */}
        <div className="space-y-2">
          {[
            { label: 'General', icon: User, active: true },
            { label: 'Security', icon: Shield, active: false },
            { label: 'Notifications', icon: Settings, active: false },
            { label: 'Connected Apps', icon: Key, active: false },
          ].map((item, i) => (
            <button 
              key={i}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all text-sm font-bold ${
                item.active 
                ? 'bg-[#00ffd5]/10 border-[#00ffd5]/20 text-[#00ffd5]' 
                : 'bg-white/5 border-transparent text-zinc-500 hover:bg-white/10'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Main Form */}
        <div className="md:col-span-2 space-y-6">
          <div className="zenith-glass rounded-[2rem] border border-white/5 p-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Display Name</label>
                <input 
                  type="text" 
                  defaultValue="Sovereign Explorer"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00ffd5]/50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
                <input 
                  type="email" 
                  defaultValue="sovereign@zenith.network"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00ffd5]/50 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Bio</label>
              <textarea 
                rows={4}
                defaultValue="Building the decentralized future on Polygon. Expert in ZK-proofs and smart contract architecture."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00ffd5]/50 transition-colors resize-none"
              />
            </div>

            <div className="pt-4 space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-widest">Social Identities</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                  <Twitter size={16} className="text-blue-400" />
                  <span className="text-xs text-zinc-300">@sovereign_dev</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                  <Github size={16} className="text-white" />
                  <span className="text-xs text-zinc-300">sovereign-git</span>
                </div>
              </div>
            </div>
          </div>

          <div className="zenith-glass rounded-[2rem] border border-white/5 p-8">
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4">Privacy Settings</h4>
            <div className="space-y-4">
              {[
                'Show wallet address on profile',
                'Enable on-chain reputation tracking',
                'Allow direct expert inquiries'
              ].map((setting, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-zinc-300">{setting}</span>
                  <div className="w-10 h-5 bg-[#00ffd5] rounded-full relative">
                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
