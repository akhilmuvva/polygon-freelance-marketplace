import React from 'react';
import { 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  Terminal, 
  Cpu,
  Globe,
  Award,
  Users
} from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-6 animate-fade-in">
            <ShieldCheck className="w-4 h-4" />
            <span>Zenith Protocol V1.0 Live on Polygon</span>
          </div>
          
          <h1 className="text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-8">
            The <span className="zenith-gradient-text">Security-First</span> <br />
            Freelance Protocol.
          </h1>
          
          <p className="text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed">
            Eliminate reentrancy, rug pulls, and malicious code. Every milestone is gated by 
            on-chain security oracles and decentralized arbitration. Built for the high-integrity era.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link 
              href="/missions" 
              className="px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-violet-600/20 flex items-center gap-2 group"
            >
              Launch Console
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/oracle" 
              className="px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-white border border-white/5 rounded-2xl font-bold transition-all flex items-center gap-2"
            >
              <Terminal className="w-5 h-5 text-zinc-500" />
              View Security Oracle
            </Link>
          </div>
        </div>

        {/* Hero Image Mockup */}
        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-10" />
          <div className="rounded-3xl border border-white/5 bg-[#09090b] overflow-hidden shadow-2xl">
            <img 
              src="/hero.png" 
              alt="Zenith Protocol Dashboard" 
              className="w-full h-auto object-cover opacity-80"
            />
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-10 border-y border-white/5 flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
        <div className="flex items-center gap-2 font-bold text-xl"><Globe className="w-6 h-6"/> Polygon</div>
        <div className="flex items-center gap-2 font-bold text-xl"><Award className="w-6 h-6"/> Slither</div>
        <div className="flex items-center gap-2 font-bold text-xl"><ShieldCheck className="w-6 h-6"/> Mythril</div>
        <div className="flex items-center gap-2 font-bold text-xl"><Lock className="w-6 h-6"/> OpenZeppelin</div>
      </section>

      {/* Feature Grid */}
      <section className="grid md:grid-cols-3 gap-8">
        <div className="p-8 rounded-3xl bg-[#09090b] border border-white/5 hover:border-violet-500/30 transition-all group">
          <div className="w-12 h-12 bg-violet-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Lock className="w-6 h-6 text-violet-400" />
          </div>
          <h3 className="text-xl font-bold mb-3">Escrow Enforcement</h3>
          <p className="text-zinc-400 leading-relaxed">
            Funds are locked in non-custodial smart contracts. Milestones only release when security 
            benchmarks are hit.
          </p>
        </div>
        
        <div className="p-8 rounded-3xl bg-[#09090b] border border-white/5 hover:border-violet-500/30 transition-all group">
          <div className="w-12 h-12 bg-violet-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-6 h-6 text-violet-400" />
          </div>
          <h3 className="text-xl font-bold mb-3">ZSO Verification</h3>
          <p className="text-zinc-400 leading-relaxed">
            Zenith Security Oracle (ZSO) validates audit hashes. If the code fails the automated 
            check, the funds stay locked.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-[#09090b] border border-white/5 hover:border-violet-500/30 transition-all group">
          <div className="w-12 h-12 bg-violet-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6 text-violet-400" />
          </div>
          <h3 className="text-xl font-bold mb-3">Decentralized Court</h3>
          <p className="text-zinc-400 leading-relaxed">
            Disputes are handled by the Zenith Magistrates. Fair, transparent, and fully decentralized 
            arbitration.
          </p>
        </div>
      </section>
    </div>
  );
}
