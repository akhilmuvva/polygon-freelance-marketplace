"use client";

import React from 'react';
import { 
  Shield, 
  Fingerprint, 
  Milestone, 
  Cpu, 
  Github, 
  Linkedin, 
  Zap,
  ChevronRight,
  Sparkles,
  Command
} from 'lucide-react';
import { motion } from 'framer-motion';

const COUNCIL = [
  {
    name: "Akhil Muvva",
    role: "Founder & CEO",
    bio: "Lead Architect of the PolyLance protocol. Driven by the mission of decentralized identity and RWA settlement.",
    initials: "AM",
    specialty: "Protocol Architecture",
    github: "https://github.com/akhilmuvva",
    linkedin: "https://linkedin.com/in/akhilmuvva",
    color: "#00ffd5"
  },
  {
    name: "Jhansi Kupireddy",
    role: "Co-Founder",
    bio: "Community & Growth Lead. Building the bridges between Web3 talent and real-world opportunity across the PolyLance ecosystem.",
    initials: "JK",
    specialty: "Ecosystem Growth",
    github: "https://github.com/jhansikupireddy-lang",
    linkedin: "https://www.linkedin.com/in/jhansi-kupireddy-54393235a/",
    color: "#a855f7",
    featured: true
  },
  {
    name: "Balram Taddi",
    role: "Co-Founder",
    bio: "Protocol Strategist. Mapping the expansion of PolyLance across the multichain ecosystem.",
    initials: "BT",
    specialty: "Cross-chain Strategy",
    github: "https://github.com/balramtaddi",
    color: "#3b82f6"
  }
];

export default function ZenithManifesto() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
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
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-24 pb-24"
    >
      {/* Hero Section */}
      <motion.section variants={itemVariants} className="relative pt-12">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#00ffd5]/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00ffd5]/10 border border-[#00ffd5]/20 text-[#00ffd5] text-[10px] font-black uppercase tracking-[0.2em]">
            <Shield className="w-3 h-3" />
            Sovereign Protocol
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.9]">
            THE <span className="text-[#00ffd5] drop-shadow-[0_0_30px_rgba(0,255,213,0.3)]">ZENITH</span><br />
            MANIFESTO
          </h1>
          
          <p className="max-w-2xl mx-auto text-zinc-400 text-lg font-medium leading-relaxed">
            Anchoring human capital in the decentralized layer. A new standard for trustless coordination and reputation sovereignty.
          </p>
        </div>
      </motion.section>

      {/* Philosophy Grid */}
      <motion.section variants={itemVariants} className="grid md:grid-cols-2 gap-8">
        <div className="p-8 rounded-[2.5rem] bg-[#09090b] border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Fingerprint className="w-32 h-32 text-[#00ffd5]" />
          </div>
          
          <div className="relative space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-[#00ffd5]/10 flex items-center justify-center border border-[#00ffd5]/20">
              <Fingerprint className="w-6 h-6 text-[#00ffd5]" />
            </div>
            <h2 className="text-3xl font-black italic uppercase tracking-tight">Identity Sovereignty</h2>
            <div className="space-y-4 text-zinc-400 font-medium">
              <p>
                In a world of opaque platforms, PolyLance Zenith represents the transition from code sovereignty to identity sovereignty. We believe every contributor is an architect of their own destiny.
              </p>
              <p className="p-4 rounded-2xl bg-white/5 border border-white/5 text-zinc-300 italic">
                "The Sovereign Resume is not a static PDF; it is a live, verifiable stream of proof-of-work, secured by Polygon."
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 rounded-[2.5rem] bg-[#09090b] border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Milestone className="w-32 h-32 text-purple-500" />
          </div>
          
          <div className="relative space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <Milestone className="w-6 h-6 text-purple-500" />
            </div>
            <h2 className="text-3xl font-black italic uppercase tracking-tight">Trustless Settlement</h2>
            <div className="space-y-4 text-zinc-400 font-medium">
              <p>
                Our protocol is a weightless freelance engine. Designed to facilitate trustless, gasless, and decentralized exchange of human expertise for the RWA talent layer.
              </p>
              <p className="p-4 rounded-2xl bg-white/5 border border-white/5 text-zinc-300 italic">
                "Milestone escrows ensure that truth remains the only currency that matters in the Zenith ecosystem."
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* The Architect Council */}
      <motion.section variants={itemVariants} className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-[#00ffd5]">
              <Cpu className="w-8 h-8" />
              <span className="text-xs font-black uppercase tracking-[0.3em]">System Core</span>
            </div>
            <h2 className="text-5xl font-black italic uppercase tracking-tighter">The Architect Council</h2>
          </div>
          <p className="max-w-md text-zinc-500 font-medium">
            The core team steering the evolution of PolyLance towards a fully decentralized future.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {COUNCIL.map((member, i) => (
            <motion.div
              key={member.name}
              whileHover={{ y: -10 }}
              className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${
                member.featured 
                  ? 'bg-gradient-to-br from-[#09090b] to-[#16161a] border-[#00ffd5]/20 shadow-[0_20px_50px_rgba(0,255,213,0.1)]' 
                  : 'bg-[#09090b] border-white/5'
              }`}
            >
              <div className="space-y-8">
                <div className="flex items-start justify-between">
                  <div 
                    className="w-20 h-20 rounded-3xl flex items-center justify-center text-2xl font-black italic border-2"
                    style={{ 
                      borderColor: `${member.color}40`,
                      background: `${member.color}10`,
                      color: member.color,
                      boxShadow: `0 0 30px ${member.color}20`
                    }}
                  >
                    {member.initials}
                  </div>
                  {member.featured && (
                    <div className="px-3 py-1 rounded-full bg-[#00ffd5]/10 border border-[#00ffd5]/20 text-[#00ffd5] text-[10px] font-black uppercase tracking-widest">
                      Featured
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500" style={{ color: `${member.color}cc` }}>
                    {member.specialty}
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight italic">{member.name}</h3>
                  <div className="text-sm font-bold text-zinc-400">{member.role}</div>
                </div>

                <p className="text-zinc-500 text-sm font-medium leading-relaxed min-h-[80px]">
                  {member.bio}
                </p>

                <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                  <a href={member.github} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white">
                    <Github className="w-5 h-5" />
                  </a>
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white">
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <button className="ml-auto p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Final Call */}
      <motion.section variants={itemVariants} className="text-center py-24 relative overflow-hidden rounded-[4rem] border border-white/5 bg-[#09090b]">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:40px_40px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#00ffd5]/5" />
        
        <div className="relative space-y-8 px-8">
          <Zap className="w-16 h-16 text-[#00ffd5] mx-auto drop-shadow-[0_0_20px_rgba(0,255,213,0.5)]" />
          <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter">
            THE FUTURE IS <span className="text-[#00ffd5]">VERIFIED.</span>
          </h2>
          <p className="max-w-xl mx-auto text-zinc-500 text-lg font-medium">
            PolyLance Zenith is built by architects who believe in the power of code and the resonance of identity.
          </p>
          <div className="h-1 w-24 bg-gradient-to-r from-transparent via-[#00ffd5] to-transparent mx-auto" />
        </div>
      </motion.section>
    </motion.div>
  );
}
