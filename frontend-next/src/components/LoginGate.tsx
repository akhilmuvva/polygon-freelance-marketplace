"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Globe, 
  Wallet, 
  Zap, 
  Sparkles, 
  ChevronRight, 
  Fingerprint, 
  Lock, 
  Cpu,
  Activity,
  ArrowRight
} from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useZenithAuth } from '@/context/AuthContext';

export default function LoginGate() {
  const { loginWithSocial, isLoggingIn } = useZenithAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050505] text-white overflow-hidden font-sans">
      {/* Heritage Neural Mesh Background */}
      <div className="neural-background" />
      <div className="neural-grid" />
      
      {/* Navigation */}
      <nav className="relative z-[100] flex justify-between items-center px-8 md:px-20 py-10 max-w-[1600px] mx-auto">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col group cursor-default"
        >
          <span className="font-space-grotesk text-3xl font-black tracking-tighter leading-none">POLYLANCE</span>
          <span className="text-[10px] font-black text-[#8b5cf6] uppercase tracking-[0.4em] mt-1 group-hover:tracking-[0.5em] transition-all duration-500">
            Zenith Protocol
          </span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-6"
        >
          <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Polygon Amoy Node Active</span>
          </div>
        </motion.div>
      </nav>

      {/* Main Hero Section */}
      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-50 max-w-[1600px] mx-auto px-8 md:px-20 grid lg:grid-cols-[1.2fr_1fr] items-center gap-16 md:gap-24 min-h-[calc(100vh-200px)]"
      >
        <div className="space-y-12">
          <div>
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-[#8b5cf6] text-[10px] font-black tracking-widest uppercase mb-8">
              <Sparkles size={12} /> The Future of Work is Sovereign
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="font-space-grotesk text-7xl md:text-9xl font-black tracking-tighter leading-[0.8] mb-8">
              Sovereign <br />
              <span className="zenith-gradient-text">Coordination</span> <br />
              Protocol.
            </motion.h1>

            <motion.p variants={itemVariants} className="text-xl md:text-2xl text-zinc-500 font-medium leading-relaxed max-w-xl">
              PolyLance Zenith is the world's first trustless freelance mesh. 
              No intermediaries. No rent-seeking. Just raw contributor power 
              secured by the Polygon PoS network.
            </motion.p>
          </div>

          <motion.div variants={itemVariants} className="flex flex-wrap gap-12">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group hover:border-[#8b5cf6]/50 transition-colors">
                <Lock size={24} className="text-[#8b5cf6]" />
              </div>
              <div>
                <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Security</div>
                <div className="text-xl font-bold text-white">UUPS Escrow</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group hover:border-emerald-500/50 transition-colors">
                <Cpu size={24} className="text-emerald-500" />
              </div>
              <div>
                <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Compute</div>
                <div className="text-xl font-bold text-white">Gasless UX</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Auth Container */}
        <motion.div variants={itemVariants} className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#8b5cf6]/20 to-emerald-500/20 rounded-[48px] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
          <div className="relative bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/10 rounded-[48px] p-10 md:p-16 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <Fingerprint size={120} className="text-[#8b5cf6]" />
            </div>
            
            <div className="relative z-10 space-y-10">
              <div>
                <h2 className="font-space-grotesk text-4xl font-bold tracking-tight mb-4 italic uppercase">Initialize Access</h2>
                <p className="text-zinc-500 text-lg font-medium leading-relaxed">Authenticate with your digital identity to enter the mesh.</p>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={loginWithSocial}
                  disabled={isLoggingIn}
                  className="w-full flex items-center gap-6 p-6 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 hover:border-[#8b5cf6]/30 hover:translate-x-2 transition-all group duration-500 text-left"
                >
                  <div className="w-16 h-16 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-zinc-500 group-hover:text-[#8b5cf6] group-hover:bg-[#8b5cf6]/10 transition-all duration-500">
                    <Fingerprint size={32} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xl font-bold text-white">Social Auth</span>
                      <span className="text-[9px] font-black bg-[#8b5cf6] text-white px-2 py-0.5 rounded-md uppercase tracking-widest">Recommended</span>
                    </div>
                    <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest group-hover:text-zinc-400 transition-colors">Google / Email / X · Gasless</div>
                  </div>
                  <ChevronRight size={20} className="text-zinc-700 group-hover:text-white transition-colors" />
                </button>

                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <button 
                      onClick={openConnectModal}
                      className="w-full flex items-center gap-6 p-6 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 hover:border-white/20 hover:translate-x-2 transition-all group duration-500 text-left"
                    >
                      <div className="w-16 h-16 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-zinc-500 group-hover:text-white transition-all duration-500">
                        <Wallet size={32} />
                      </div>
                      <div className="flex-1">
                        <div className="text-xl font-bold text-white mb-1">Web3 Native</div>
                        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest group-hover:text-zinc-400 transition-colors">MetaMask / Ledger / WalletConnect</div>
                      </div>
                      <ChevronRight size={20} className="text-zinc-700 group-hover:text-white transition-colors" />
                    </button>
                  )}
                </ConnectButton.Custom>
              </div>

              <div className="pt-10 border-t border-white/5 flex items-center justify-between opacity-40">
                <div className="flex items-center gap-3">
                  <Activity size={14} className="text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Protocol Version v2.1</span>
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest">SVRGN_ACCESS_NODE</div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.main>

      {/* Feature Bento Section */}
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="relative z-50 grid md:grid-cols-3 gap-8 px-8 md:px-20 py-32 max-w-[1600px] mx-auto"
      >
        <div className="p-12 bg-white/2 border border-white/5 rounded-[40px] hover:border-[#8b5cf6]/20 hover:bg-[#8b5cf6]/2 transition-all duration-500 group">
          <div className="w-16 h-16 bg-[#8b5cf6]/10 text-[#8b5cf6] rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
            <Shield size={28} />
          </div>
          <h3 className="font-space-grotesk text-3xl font-bold mb-4 uppercase tracking-tight">Trustless Escrow</h3>
          <p className="text-zinc-500 text-lg leading-relaxed">Milestone-based payments held in immutable smart contracts. Funds only release when you prove the work.</p>
        </div>
        
        <div className="p-12 bg-white/2 border border-white/5 rounded-[40px] hover:border-emerald-500/20 hover:bg-emerald-500/2 transition-all duration-500 group">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
            <Globe size={28} />
          </div>
          <h3 className="font-space-grotesk text-3xl font-bold mb-4 uppercase tracking-tight">On-Chain Reputation</h3>
          <p className="text-zinc-500 text-lg leading-relaxed">Every completed job builds your Gravity Rank—a non-transferable soulbound identity recognized globally.</p>
        </div>

        <div className="p-12 bg-white/2 border border-white/5 rounded-[40px] hover:border-white/20 hover:bg-white/2 transition-all duration-500 group">
          <div className="w-16 h-16 bg-white/5 text-white rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
            <Zap size={28} />
          </div>
          <h3 className="font-space-grotesk text-3xl font-bold mb-4 uppercase tracking-tight">Neural Matchmaking</h3>
          <p className="text-zinc-500 text-lg leading-relaxed">Our proprietary indexing engine matches specialists to bounties based on real historical performance data.</p>
        </div>
      </motion.section>

      {/* Side Status Indicators */}
      <div className="fixed left-8 bottom-8 z-[100] flex flex-col gap-2 opacity-20 pointer-events-none">
        <div className="flex items-center gap-2 text-[8px] font-black text-zinc-500 tracking-[0.5em] uppercase">
          Handshake Status: <span className="text-[#00ffd5]">Synched</span>
        </div>
        <div className="flex items-center gap-2 text-[8px] font-black text-zinc-500 tracking-[0.5em] uppercase">
          Network Load: <span className="text-[#00ffd5]">Nominal</span>
        </div>
      </div>
    </div>
  );
}
