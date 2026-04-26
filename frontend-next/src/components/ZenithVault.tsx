'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, Unlock, Shield, Wallet, 
  ArrowUpRight, ArrowDownLeft, History,
  TrendingUp, Globe, Cpu, Zap,
  Layers, HardDrive, Eye, Terminal,
  Fingerprint, Box, AlertCircle
} from 'lucide-react';

const ASSETS = [
  { symbol: 'MATIC', name: 'Polygon', balance: '1,284.50', value: '$1,207.43', yield: '4.2%' },
  { symbol: 'ZEN', name: 'Zenith', balance: '50,000.00', value: '$62,000.00', yield: '12.8%' },
  { symbol: 'USDC', name: 'Circle USD', balance: '2,500.00', value: '$2,500.00', yield: '2.1%' },
];

const TRANSACTIONS = [
  { id: 'TX-402', type: 'Settlement', asset: 'MATIC', amount: '+1,200', status: 'Completed', time: '2h ago' },
  { id: 'TX-399', type: 'Withdrawal', asset: 'ZEN', amount: '-5,000', status: 'Verifying', time: '5h ago' },
  { id: 'TX-395', type: 'Yield Dist.', asset: 'USDC', amount: '+42.50', status: 'Completed', time: '12h ago' },
];

export const ZenithVault = () => {
  const [isVaultLocked, setIsVaultLocked] = useState(true);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12 pb-32">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 border-b border-white/5 pb-12"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4">
             <div className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full flex items-center gap-2">
               <Lock size={12} className="text-violet-400" />
               <span className="text-[10px] font-black text-violet-400 uppercase tracking-[0.2em]">Secure Custody Layer</span>
             </div>
             <div className="flex items-center gap-1.5 text-emerald-500 font-black text-[10px] tracking-widest uppercase">
               AES-256 Multi-Sig Active
             </div>
          </div>
          <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-none">
            ASSET <span className="text-violet-500">VAULT</span>
          </h1>
          <p className="text-zinc-500 text-lg font-medium max-w-2xl">
            Non-custodial asset management and yield optimization. Your sovereign 
            treasury, secured by the Zenith mesh and the Security Oracle.
          </p>
        </div>

        <div className="flex gap-4">
           <button 
            onClick={() => setIsVaultLocked(!isVaultLocked)}
            className={`px-8 py-4 rounded-[24px] border font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 ${
              isVaultLocked 
              ? 'bg-violet-600 border-violet-500 text-white shadow-xl shadow-violet-600/20' 
              : 'bg-white text-black border-white shadow-xl'
            }`}
           >
             {isVaultLocked ? <Lock size={18} /> : <Unlock size={18} />}
             {isVaultLocked ? 'UNLOCK VAULT' : 'SECURE VAULT'}
           </button>
        </div>
      </motion.header>

      <div className="grid lg:grid-cols-12 gap-12">
        
        {/* Main Treasury View */}
        <div className="lg:col-span-8 space-y-8">
           
           {/* Total Value Visualization */}
           <div className="zenith-glass p-12 rounded-[50px] border border-white/5 relative overflow-hidden group">
              <div className="scanline opacity-10" />
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                 <Globe size={300} />
              </div>
              
              <div className="relative z-10 space-y-12">
                 <div>
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] block mb-4">Total Protocol Value</span>
                    <div className="flex items-baseline gap-6">
                       <h2 className="text-8xl font-black text-white italic tracking-tighter leading-none">$65,714</h2>
                       <span className="text-3xl font-black text-emerald-500 italic">.93</span>
                    </div>
                    <div className="flex items-center gap-2 mt-6 text-emerald-500 font-black text-sm uppercase tracking-widest">
                       <TrendingUp size={20} /> +2.4% vs Last Cycle
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-white/5">
                    {ASSETS.map(asset => (
                       <div key={asset.symbol} className="space-y-2">
                          <div className="flex items-center gap-2">
                             <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] ${
                               asset.symbol === 'ZEN' ? 'bg-violet-500/20 text-violet-400' : 'bg-white/5 text-zinc-400'
                             }`}>
                               {asset.symbol[0]}
                             </div>
                             <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">{asset.name}</span>
                          </div>
                          <div className="text-2xl font-black text-white italic">{asset.balance} {asset.symbol}</div>
                          <div className="text-[10px] font-bold text-zinc-600 uppercase">{asset.value} • {asset.yield} APY</div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* Distribution Grid */}
           <div className="grid md:grid-cols-2 gap-8">
              <div className="zenith-glass p-10 rounded-[40px] border border-white/5 space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                       <Layers size={24} />
                    </div>
                    <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Yield Engine</h3>
                 </div>
                 <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                   Your assets are automatically optimized across Zenith liquidity pools and 
                   partner protocols for maximum risk-adjusted returns.
                 </p>
                 <div className="pt-4 flex items-center justify-between">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Active Strategy</span>
                    <span className="text-xs font-black text-emerald-500 uppercase">Aggressive Yield v3</span>
                 </div>
              </div>
              <div className="zenith-glass p-10 rounded-[40px] border border-white/5 space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-violet-500/10 rounded-2xl text-violet-400">
                       <HardDrive size={24} />
                    </div>
                    <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Vault Integrity</h3>
                 </div>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                       <span className="text-zinc-600">Verification Depth</span>
                       <span className="text-white">OPTIMAL</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full w-[94%] bg-violet-500" />
                    </div>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase mt-2">
                      Last security handshake: 14m ago by Oracle-Alpha.
                    </p>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Column: Settlement Feed */}
        <div className="lg:col-span-4 space-y-8">
           
           {/* Actions Card */}
           <div className="zenith-glass p-10 rounded-[40px] border border-white/5 space-y-8 relative overflow-hidden">
              <div className="scanline opacity-10" />
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em]">Vault Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                 <button className="flex flex-col items-center gap-4 p-6 bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/20 rounded-[32px] transition-all group">
                    <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                       <ArrowDownLeft size={24} />
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Deposit</span>
                 </button>
                 <button className="flex flex-col items-center gap-4 p-6 bg-white/5 hover:bg-violet-500/10 border border-white/5 hover:border-violet-500/20 rounded-[32px] transition-all group">
                    <div className="p-4 rounded-2xl bg-violet-500/10 text-violet-500 group-hover:scale-110 transition-transform">
                       <ArrowUpRight size={24} />
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Withdraw</span>
                 </button>
              </div>

              <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-4">
                 <AlertCircle className="text-amber-500 shrink-0" size={20} />
                 <p className="text-[10px] text-amber-500/80 font-bold leading-relaxed uppercase">
                   Vault is currently LOCKED. No withdrawals possible without ZK-Identity verification.
                 </p>
              </div>
           </div>

           {/* Transaction Archive */}
           <div className="zenith-glass rounded-[40px] border border-white/5 overflow-hidden flex flex-col">
              <div className="px-8 py-6 border-b border-white/5 flex items-center gap-4 bg-white/[0.02]">
                 <History size={18} className="text-zinc-500" />
                 <h3 className="text-xs font-black uppercase tracking-widest text-white italic">Settlement Feed</h3>
              </div>
              <div className="p-2 flex-1">
                 {TRANSACTIONS.map((tx, i) => (
                    <div key={tx.id} className="p-6 hover:bg-white/[0.02] transition-all rounded-3xl group cursor-pointer">
                       <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                             <div className={`p-3 rounded-xl ${
                               tx.type === 'Settlement' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-zinc-500'
                             }`}>
                                {tx.type === 'Settlement' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                             </div>
                             <div>
                                <div className="text-sm font-black text-white italic tracking-tight">{tx.type}</div>
                                <div className="text-[10px] font-mono text-zinc-600 mt-0.5">{tx.id} • {tx.asset}</div>
                             </div>
                          </div>
                          <div className="text-right">
                             <div className={`text-sm font-black italic tracking-tighter ${
                               tx.amount.startsWith('+') ? 'text-emerald-500' : 'text-white'
                             }`}>{tx.amount}</div>
                             <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-0.5">{tx.time}</div>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
              <button className="p-6 bg-white/[0.01] border-t border-white/5 text-[10px] font-black text-violet-500 hover:text-white uppercase tracking-[0.3em] transition-all">
                VIEW FULL ARCHIVE
              </button>
           </div>

           {/* Console Log Subsystem */}
           <div className="bg-[#050505] border border-white/10 p-6 rounded-[32px] font-mono text-[10px] space-y-2">
              <div className="text-violet-500 flex items-center gap-2">
                <Terminal size={12} />
                <span>VAULT_SUBSYSTEM_LOG</span>
              </div>
              <div className="text-zinc-600">&gt; Authenticating multisig quorum...</div>
              <div className="text-emerald-500/60">&gt; [OK] Identity verified via ZK-Proof</div>
              <div className="text-emerald-500/60">&gt; [OK] Yield strategy re-balanced</div>
              <div className="text-zinc-600">&gt; Awaiting block confirmation...</div>
           </div>
        </div>

      </div>
    </div>
  );
};
