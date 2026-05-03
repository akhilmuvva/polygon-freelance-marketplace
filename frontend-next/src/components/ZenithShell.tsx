"use client";

import React, { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  Zap, 
  Shield, 
  Briefcase, 
  Users, 
  User,
  UserCheck,
  UserCircle,
  BarChart3, 
  Settings, 
  LayoutDashboard,
  Menu,
  X,
  PlusCircle,
  Plus,
  Bell,
  Repeat,
  BrainCircuit,
  Trophy,
  Wallet2,
  Flame,
  LogOut,
  ScrollText,
  Activity,
  Cpu,
  Monitor,
  Gavel,
  Database
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { name: 'Command Center', icon: LayoutDashboard, href: '/' },
  { name: 'Identity Node', icon: UserCheck, href: '/identity' },
  { name: 'Missions Node', icon: Briefcase, href: '/missions' },
  { name: 'Zenith Exchange', icon: Flame, href: '/exchange' },
  { name: 'Expert Network', icon: User, href: '/experts' },
  { name: 'Arbitration Court', icon: Gavel, href: '/disputes' },
  { name: 'Tokenization', icon: Database, href: '/assets' },
  { name: 'Compliance', icon: Shield, href: '/compliance' },
  { name: 'Leaderboard', icon: Trophy, href: '/leaderboard' },
];

export default function ZenithShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen bg-[#020202] text-white overflow-hidden selection:bg-[#00ffd5]/30 selection:text-white font-sans">
      {/* Background HUD Overlay */}
      <div className="fixed inset-0 zenith-grid opacity-10 pointer-events-none" />
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-[#080808]/90 backdrop-blur-2xl border-r border-white/5 transition-all duration-500 ease-in-out lg:relative lg:translate-x-0",
          !isSidebarOpen && "-translate-x-full lg:w-24"
        )}
      >
        <div className="scanline opacity-[0.02]" />
        
        {/* Logo Section */}
        <div className="flex items-center h-24 px-8 border-b border-white/5 bg-[#0a0a0a]">
          <div className="flex items-center gap-4">
            <motion.div 
              whileHover={{ rotate: 90, scale: 1.1 }}
              className="p-3 bg-[#00ffd5]/10 rounded-xl border border-[#00ffd5]/30 shadow-[0_0_20px_rgba(0,255,213,0.2)]"
            >
              <Cpu className="w-6 h-6 text-[#00ffd5]" />
            </motion.div>
            {isSidebarOpen && (
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tighter italic uppercase leading-none">
                  ZENITH <span className="text-[#00ffd5]">OS</span>
                </span>
                <span className="text-[8px] font-black text-zinc-600 tracking-[0.4em] uppercase mt-1">Sovereign_V2</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="px-4 py-8 space-y-10 overflow-y-auto h-[calc(100vh-200px)]">
          <div>
            <div className={cn("px-4 mb-6 text-[9px] font-black uppercase tracking-[0.4em] text-zinc-700 flex items-center gap-2", !isSidebarOpen && "justify-center")}>
              <Activity size={10} /> {isSidebarOpen ? "Active Modules" : ""}
            </div>
            <nav className="space-y-2">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                      isActive 
                        ? "bg-[#00ffd5]/10 text-[#00ffd5] border border-[#00ffd5]/20" 
                        : "text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent"
                    )}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="nav-active"
                        className="absolute inset-0 bg-gradient-to-r from-[#00ffd5]/5 to-transparent pointer-events-none" 
                      />
                    )}
                    <item.icon className={cn(
                      "w-5 h-5 transition-all group-hover:scale-110",
                      isActive ? "text-[#00ffd5]" : "group-hover:text-white"
                    )} />
                    {isSidebarOpen && <span className="font-black text-xs uppercase tracking-widest">{item.name}</span>}
                    
                    {/* HUD Corner on Active */}
                    {isActive && isSidebarOpen && (
                       <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ffd5] rounded-full animate-pulse" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Status Section */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/5 bg-[#0a0a0a]">
           {isSidebarOpen && (
             <div className="mb-6 space-y-3">
                <div className="flex items-center justify-between">
                   <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Network Load</span>
                   <span className="text-[8px] font-black text-emerald-500 uppercase">Stable</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500/50 w-1/3" />
                </div>
             </div>
           )}
          <Link
            href="/settings"
            className="flex items-center gap-4 px-4 py-3 text-zinc-600 hover:text-white rounded-xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/10"
          >
            <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
            {isSidebarOpen && <span className="font-black text-[10px] uppercase tracking-widest">System_Cfg</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-24 flex items-center justify-between px-12 bg-[#020202]/80 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-40">
          <div className="flex items-center gap-8 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-3 hover:bg-white/5 rounded-xl transition-colors border border-white/10 hover:border-[#00ffd5]/30 text-zinc-500 hover:text-[#00ffd5]"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* HUD Path Display */}
            <div className="hidden lg:flex items-center gap-4 text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">
               <Monitor size={14} />
               <span>ROOT</span>
               <ChevronRight size={12} className="text-zinc-800" />
               <span className="text-white">{pathname === '/' ? 'COMMAND_CENTER' : pathname.slice(1).toUpperCase()}</span>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4">
               <button className="p-3 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all relative border border-transparent hover:border-white/10">
                 <Bell className="w-5 h-5" />
                 <span className="absolute top-3 right-3 w-2 h-2 bg-[#00ffd5] rounded-full border-2 border-[#020202] shadow-[0_0_10px_rgba(0,255,213,0.5)]" />
               </button>
            </div>
            
            <div className="h-10 w-px bg-white/10" />

            <div className="flex items-center gap-6">
              <div className="scale-110">
                <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-12 lg:p-16 relative">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function ChevronRight({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
