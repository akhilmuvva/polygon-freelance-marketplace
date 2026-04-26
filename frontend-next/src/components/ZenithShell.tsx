"use client";

import React, { useState } from 'react';
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
  ScrollText
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NAV_ITEMS = [
  { name: 'Command Center', icon: LayoutDashboard, href: '/' },
  { name: 'Zenith Exchange', icon: Flame, href: '/exchange' },
  { name: 'Find a Job', icon: Briefcase, href: '/missions' },
  { name: 'Expert Network', icon: User, href: '/experts' },
  { name: 'Initialize Contract', icon: PlusCircle, href: '/initiate' },
  { name: 'Elite Leaderboard', icon: Trophy, href: '/leaderboard' },
  { name: 'Zenith Manifesto', icon: ScrollText, href: '/manifesto' },
  { name: 'Profile Updater', icon: UserCircle, href: '/profile' },
  { name: 'Zenith Reputation', icon: UserCheck, href: '/reputation' },
];

export default function ZenithShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#050505] text-white overflow-hidden selection:bg-violet-500/30">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-[#09090b]/80 backdrop-blur-xl border-r border-white/5 transition-all duration-500 ease-in-out lg:relative lg:translate-x-0",
          !isSidebarOpen && "-translate-x-full lg:w-20"
        )}
      >
        {/* Logo Section */}
        <div className="flex items-center h-20 px-8 border-b border-white/5">
          <div className="flex items-center gap-4">
            <motion.div 
              whileHover={{ rotate: 180 }}
              className="p-2.5 bg-violet-600/20 rounded-2xl border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
            >
              <Zap className="w-6 h-6 text-violet-400" />
            </motion.div>
            {isSidebarOpen && (
              <span className="text-xl font-black tracking-tighter italic uppercase">
                ZENITH <span className="text-violet-500">PRO</span>
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="px-4 py-8 space-y-8 overflow-y-auto h-[calc(100vh-160px)]">
          <div>
            <div className={cn("px-4 mb-6 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600", !isSidebarOpen && "hidden")}>
              Main Modules
            </div>
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative",
                      isActive 
                        ? "bg-white/5 text-white" 
                        : "text-zinc-500 hover:text-zinc-200 hover:bg-white/2"
                    )}
                  >
                    <item.icon className={cn(
                      "w-6 h-6 transition-transform group-hover:scale-110",
                      isActive ? "text-white" : "group-hover:text-zinc-300"
                    )} />
                    {isSidebarOpen && <span className="font-bold text-[15px] tracking-tight">{item.name}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/5 bg-[#09090b]">
           <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Network Live</span>
              </div>
           </div>
          <Link
            href="/settings"
            className="flex items-center gap-4 px-4 py-3 text-zinc-500 hover:text-white rounded-2xl hover:bg-white/5 transition-all group"
          >
            <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
            {isSidebarOpen && <span className="font-bold text-sm">System Config</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 flex items-center justify-between px-8 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40">
          <div className="flex items-center gap-8 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 hover:bg-white/5 rounded-xl transition-colors border border-transparent hover:border-white/10"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Search Bar */}
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/5 rounded-2xl w-full max-w-md group focus-within:border-violet-500/50 transition-all">
               <span className="text-zinc-500 text-xs font-bold bg-white/5 px-1.5 py-0.5 rounded border border-white/10">/</span>
               <input 
                 type="text" 
                 placeholder="Search missions, assets, or oracle data..." 
                 className="bg-transparent outline-none text-sm w-full placeholder:text-zinc-600 font-medium"
               />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <button className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all relative">
                 <Bell className="w-5 h-5" />
                 <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-violet-500 rounded-full border-2 border-[#050505]" />
               </button>
            </div>
            
            <div className="h-8 w-px bg-white/5" />

            <div className="flex items-center gap-4">
              <Link href="/initiate">
                <button className="group hidden sm:flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                  <PlusCircle className="w-4 h-4" />
                  <span>Initiate Mission</span>
                </button>
              </Link>
              <div className="scale-110">
                <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 lg:p-12 relative">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
