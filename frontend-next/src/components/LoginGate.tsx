"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Shield, 
  Lock, 
  ArrowRight, 
  Mail, 
  Globe,
  Wallet,
  Star,
  CheckCircle2,
  LayoutDashboard,
  LogOut,
  Infinity,
  Cpu,
  Fingerprint
} from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useZenithAuth } from '@/context/AuthContext';

export default function LoginGate() {
  const { loginWithSocial, isLoggingIn } = useZenithAuth();

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] flex items-center justify-center overflow-hidden font-sans">
      {/* Background Mesh Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#00ffd5]/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/5 blur-[120px] rounded-full" />
      
      {/* Dynamic Grid Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Top Header Navigation Mock */}
      <div className="absolute top-0 left-0 right-0 h-24 px-12 flex items-center justify-between border-b border-white/5 bg-[#050505]/50 backdrop-blur-xl">
         <div className="flex items-center gap-6">
            <div className="flex flex-col">
               <span className="text-xl font-black tracking-tighter text-white uppercase italic">POLYLANCE <span className="text-[#00ffd5]">ZENITH</span></span>
               <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em]">Protocol Active</span>
               </div>
            </div>
         </div>
         <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 px-5 py-2 bg-white/5 border border-white/10 rounded-full">
               <Shield size={14} className="text-[#00ffd5]" />
               <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Sovereign Shield Active</span>
            </div>
            <div className="w-10 h-10 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/5 transition-all cursor-pointer">
               <Globe size={18} className="text-zinc-500" />
            </div>
         </div>
      </div>

      <div className="relative z-10 w-full max-w-[1400px] px-12 grid lg:grid-cols-2 gap-24 items-center">
        {/* Left Side: Brand & Value Prop */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "circOut" }}
          className="space-y-12"
        >
          <div className="inline-flex items-center gap-3 px-5 py-2 bg-[#00ffd5]/10 border border-[#00ffd5]/20 rounded-full">
             <Cpu size={14} className="text-[#00ffd5]" />
             <span className="text-[10px] font-black text-[#00ffd5] uppercase tracking-[0.3em]">Sovereign Identity Protocol</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-[100px] font-black leading-[0.85] tracking-tighter text-white uppercase italic">
              OWN YOUR <br />
              <span className="text-[#00ffd5] drop-shadow-[0_0_30px_rgba(0,255,213,0.3)]">DESTINY.</span>
            </h1>
            <p className="text-zinc-500 text-xl max-w-xl leading-relaxed font-medium">
              The world's first weightless freelance protocol. Secure, trustless, and entirely on-chain.
            </p>
          </div>

          <div className="flex items-center gap-16 pt-6">
             <div className="space-y-2">
                <div className="text-4xl font-black text-white italic tracking-tighter">$4.2M+</div>
                <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Settled Value</div>
             </div>
             <div className="w-px h-12 bg-white/10" />
             <div className="space-y-2">
                <div className="text-4xl font-black text-white italic tracking-tighter">1.2K+</div>
                <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Verified Agents</div>
             </div>
             <div className="w-px h-12 bg-white/10" />
             <div className="space-y-2">
                <div className="text-4xl font-black text-white italic tracking-tighter">0.0s</div>
                <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Settlement Lag</div>
             </div>
          </div>

          <div className="flex items-center gap-4 text-zinc-600 font-bold text-xs uppercase tracking-[0.3em]">
             <CheckCircle2 size={16} className="text-emerald-500" /> NO GAS FEES FOR NEW AGENTS
          </div>
        </motion.div>

        {/* Right Side: Access Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          {/* Outer Glow */}
          <div className="absolute -inset-4 bg-[#00ffd5]/5 blur-2xl rounded-[4rem] opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="zenith-glass border border-white/10 rounded-[4rem] p-12 shadow-[0_40px_100px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="scanline opacity-[0.05]" />
            
            <div className="mb-12 space-y-2 text-center">
               <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">INITIALIZE PORTAL</h2>
               <p className="text-zinc-500 font-medium tracking-wide">Select your sovereign authentication method.</p>
            </div>

            <div className="space-y-6">
               {/* Recommended: Social Login */}
               <button 
                 onClick={loginWithSocial}
                 disabled={isLoggingIn}
                 className="w-full group/btn relative"
               >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00ffd5] to-violet-500 rounded-3xl blur opacity-20 group-hover/btn:opacity-100 transition duration-1000 group-hover/btn:duration-200" />
                  <div className="relative flex items-center justify-between p-8 bg-[#0c0c0e] border border-white/10 rounded-3xl transition-all">
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 bg-[#00ffd5]/10 rounded-2xl flex items-center justify-center border border-[#00ffd5]/20 group-hover/btn:scale-110 transition-transform">
                          <Fingerprint size={32} className="text-[#00ffd5]" />
                       </div>
                       <div className="text-left">
                          <div className="flex items-center gap-3 mb-1">
                             <span className="text-xl font-black text-white uppercase tracking-tight">Social Identity</span>
                             <span className="text-[9px] font-black bg-[#00ffd5] text-black px-2 py-0.5 rounded-full uppercase tracking-widest">Recommended</span>
                          </div>
                          <div className="text-sm text-zinc-500 font-medium tracking-wide">Sign in with Google, X, or Email</div>
                       </div>
                    </div>
                    {isLoggingIn ? (
                      <div className="w-6 h-6 border-4 border-[#00ffd5] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ArrowRight size={24} className="text-zinc-700 group-hover/btn:text-[#00ffd5] group-hover/btn:translate-x-2 transition-all" />
                    )}
                  </div>
               </button>

               <div className="relative flex items-center py-4">
                  <div className="flex-grow border-t border-white/5"></div>
                  <span className="flex-shrink mx-4 text-[10px] font-black text-zinc-700 uppercase tracking-[0.5em]">OR PROTOCOL DIRECT</span>
                  <div className="flex-grow border-t border-white/5"></div>
               </div>

               {/* Web3 Wallet */}
               <ConnectButton.Custom>
                  {({ openConnectModal, connectModalOpen }) => (
                     <button 
                       onClick={openConnectModal}
                       className="w-full flex items-center justify-between p-8 bg-white/[0.02] border border-white/5 hover:border-white/20 rounded-3xl transition-all group/btn"
                     >
                        <div className="flex items-center gap-6">
                           <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover/btn:border-white/30 transition-colors">
                              <Wallet size={32} className="text-zinc-400 group-hover/btn:text-white transition-colors" />
                           </div>
                           <div className="text-left">
                              <span className="text-xl font-black text-white uppercase tracking-tight block mb-1">Hardcore Web3</span>
                              <div className="text-sm text-zinc-500 font-medium tracking-wide">MetaMask, Ledger, or WalletConnect</div>
                           </div>
                        </div>
                        {connectModalOpen ? (
                          <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          <ArrowRight size={24} className="text-zinc-700 group-hover/btn:text-white group-hover/btn:translate-x-2 transition-all" />
                        )}
                     </button>
                  )}
               </ConnectButton.Custom>
            </div>

            <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-6">
               <div className="flex items-center gap-8">
                  <img src="https://cryptologos.cc/logos/polygon-matic-logo.png" className="h-6 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-help" alt="Polygon" title="Polygon POS Network" />
                  <div className="w-px h-4 bg-white/10" />
                  <img src="https://www.chainlink.education/chainlink-logo-blue.png" className="h-5 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-help" alt="Chainlink" title="Chainlink Oracles" />
                  <div className="w-px h-4 bg-white/10" />
                  <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Biconomy Gasless</span>
               </div>
               
               <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em] text-center max-w-xs leading-relaxed">
                  By entering, you agree to the Sovereign Zenith Protocol Charter & On-chain Terms.
               </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Background Bottom Text */}
      <div className="absolute bottom-12 left-12 flex flex-col">
         <span className="text-[10px] font-black text-zinc-800 uppercase tracking-[0.5em]">SYSTEM VERSION 2.0.4_RC</span>
         <span className="text-[10px] font-black text-zinc-800 uppercase tracking-[0.5em]">BUILD_ZENITH_SVRGN</span>
      </div>
    </div>
  );
}
