'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useWriteContract } from 'wagmi';
import { parseUnits } from 'viem';
import { toast } from 'react-hot-toast';
import { 
  Rocket, Shield, Clock, DollarSign, 
  Zap, PlusCircle, LayoutGrid, User, 
  LogOut, ChevronDown, CheckCircle2
} from 'lucide-react';
import { SUPPORTED_TOKENS, CONTRACT_ADDRESSES } from '../lib/constants';
import FreelanceEscrowABI from '../lib/abi/FreelanceEscrow.json';
import { uploadMetadata } from '../lib/storage';

import { useZenithAuth } from '../context/AuthContext';
import { encodeFunctionData } from 'viem';

export const InitiateMission = () => {
  const { address, isConnected } = useAccount();
  const { smartAccount, isSocialConnected } = useZenithAuth();
  const { writeContract, isPending } = useWriteContract();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Development');
  const [durationDays, setDurationDays] = useState('30');
  const [freelancer, setFreelancer] = useState('');
  const [selectedToken, setSelectedToken] = useState(SUPPORTED_TOKENS[0]);
  const [isUploading, setIsUploading] = useState(false);

  const handleInitiate = async () => {
    if (!isConnected) return toast.error('Sovereign Identity Required.');
    if (!title || !amount) return toast.error('Mission parameters incomplete.');

    setIsUploading(true);
    try {
      const metadata = {
        title,
        description,
        category,
        client: address,
        freelancer: freelancer || "Open Mesh",
        amount,
        token: selectedToken.symbol,
        timestamp: Date.now(),
        version: 'Zenith-Sovereign-2.0'
      };

      const { cid } = await uploadMetadata(metadata);
      
      const rawAmount = parseUnits(amount, selectedToken.decimals);
      const categoryMap: Record<string, bigint> = { 'Development': 1n, 'Design': 2n, 'Security': 3n, 'Marketing': 4n };
      const deadline = Math.floor(Date.now() / 1000) + (Number(durationDays) * 86400);

      const params = {
        categoryId: categoryMap[category] || 1n,
        freelancer: (freelancer && freelancer.startsWith('0x')) ? (freelancer as `0x${string}`) : '0x0000000000000000000000000000000000000000' as `0x${string}`,
        token: selectedToken.address,
        amount: rawAmount,
        ipfsHash: cid,
        deadline: BigInt(deadline),
        mAmounts: [rawAmount], // Single milestone for simplicity in this view
        mHashes: [description],
        mIsUpfront: [false],
        yieldStrategy: 0,
        paymentToken: selectedToken.address,
        paymentAmount: rawAmount,
        minAmountOut: 0n
      };

      if (isSocialConnected && smartAccount) {
        const data = encodeFunctionData({
          abi: FreelanceEscrowABI.abi,
          functionName: 'createJob',
          args: [params]
        });

        const tx = {
          to: CONTRACT_ADDRESSES.ESCROW,
          data,
          value: selectedToken.address === '0x0000000000000000000000000000000000000000' ? rawAmount : 0n
        };

        const userOpResponse = await smartAccount.sendTransaction(tx);
        const { transactionHash } = await userOpResponse.waitForTxHash();
        console.log('[Zenith] Mission Actuated via Smart Account:', transactionHash);
      } else {
        writeContract({
          address: CONTRACT_ADDRESSES.ESCROW,
          abi: FreelanceEscrowABI.abi,
          functionName: 'createJob',
          args: [params],
          value: selectedToken.address === '0x0000000000000000000000000000000000000000' ? rawAmount : 0n
        });
      }

      toast.success('Protocol Deployment Sequence Initiated.');
    } catch (err) {
      toast.error('Mission Actuation Failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#00ffd5]/30 pb-20">
      {/* Sovereign Header (Matches Image 1) */}
      <header className="px-8 py-6 flex items-center justify-between border-b border-white/5 bg-[#050505]/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex flex-col">
          <h2 className="text-xl font-black tracking-tight uppercase leading-none">Create Job</h2>
          <div className="flex items-center gap-1.5 mt-1">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
             <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Polygon POS On-Chain</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-5 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors cursor-pointer group">
              <Shield size={14} className="text-zinc-400 group-hover:text-white" />
              <span className="text-[10px] font-black text-zinc-400 group-hover:text-white uppercase tracking-[0.2em]">Sovereign Shield</span>
           </div>
           
           <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1 px-3">
              <div className="w-8 h-8 bg-violet-500/20 rounded-xl flex items-center justify-center border border-violet-500/30">
                 <Zap size={16} className="text-violet-400" />
              </div>
              <ChevronDown size={14} className="text-zinc-600" />
           </div>

           <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
              <User size={18} className="text-zinc-400" />
           </div>

           <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/20 transition-colors cursor-pointer group">
              <LogOut size={18} className="text-zinc-600 group-hover:text-red-400" />
           </div>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto pt-20 px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-16"
        >
          {/* Main Title Section */}
          <div className="flex items-center gap-6">
             <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl border border-cyan-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                <PlusCircle size={32} className="text-[#00ffd5]" />
             </div>
             <h1 className="text-5xl font-black text-white tracking-tight">Initialize Contract</h1>
          </div>

          {/* Form Grid */}
          <div className="space-y-12">
             <div className="grid md:grid-cols-2 gap-10">
                {/* Contract Title */}
                <div className="space-y-4">
                   <label className="text-xs font-black text-zinc-600 uppercase tracking-[0.2em]">Contract Title</label>
                   <input 
                      type="text"
                      placeholder="e.g. Zenith Interface Development"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-[#0c0c0e] border border-white/5 hover:border-white/10 focus:border-[#00ffd5]/50 rounded-2xl py-5 px-6 text-white font-bold text-lg outline-none transition-all placeholder:text-zinc-800"
                   />
                </div>

                {/* Category */}
                <div className="space-y-4">
                   <label className="text-xs font-black text-zinc-600 uppercase tracking-[0.2em]">Category</label>
                   <div className="relative">
                      <select 
                         value={category}
                         onChange={(e) => setCategory(e.target.value)}
                         className="w-full bg-[#0c0c0e] border border-white/5 hover:border-white/10 focus:border-[#00ffd5]/50 rounded-2xl py-5 px-6 text-white font-bold text-lg outline-none transition-all appearance-none cursor-pointer"
                      >
                         <option>Development</option>
                         <option>Design</option>
                         <option>Security</option>
                         <option>Marketing</option>
                      </select>
                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" size={20} />
                   </div>
                </div>
             </div>

             {/* Description */}
             <div className="space-y-4">
                <label className="text-xs font-black text-zinc-600 uppercase tracking-[0.2em]">Description & Requirements</label>
                <textarea 
                   placeholder="Detail the weightless deliverables..."
                   value={description}
                   onChange={(e) => setDescription(e.target.value)}
                   className="w-full h-48 bg-[#0c0c0e] border border-white/5 hover:border-white/10 focus:border-[#00ffd5]/50 rounded-[32px] py-6 px-8 text-zinc-400 font-medium text-lg outline-none transition-all resize-none placeholder:text-zinc-800"
                />
             </div>

             <div className="grid md:grid-cols-2 gap-10">
                {/* Budget Amount */}
                <div className="space-y-4">
                   <label className="text-xs font-black text-zinc-600 uppercase tracking-[0.2em]">Budget Amount</label>
                   <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 font-bold text-xl">$</span>
                      <input 
                         type="text"
                         placeholder="0.00"
                         value={amount}
                         onChange={(e) => setAmount(e.target.value)}
                         className="w-full bg-[#0c0c0e] border border-white/5 hover:border-white/10 focus:border-[#00ffd5]/50 rounded-2xl py-5 pl-12 pr-6 text-white font-black text-xl outline-none transition-all placeholder:text-zinc-800"
                      />
                   </div>
                </div>

                {/* Payment Token */}
                <div className="space-y-4">
                   <label className="text-xs font-black text-zinc-600 uppercase tracking-[0.2em]">Payment Token</label>
                   <div className="relative">
                      <select 
                         value={selectedToken.symbol}
                         onChange={(e) => setSelectedToken(SUPPORTED_TOKENS.find(t => t.symbol === e.target.value)!)}
                         className="w-full bg-[#0c0c0e] border border-white/5 hover:border-white/10 focus:border-[#00ffd5]/50 rounded-2xl py-5 px-6 text-white font-black text-xl outline-none transition-all appearance-none cursor-pointer"
                      >
                         {SUPPORTED_TOKENS.map(t => <option key={t.symbol}>{t.symbol}</option>)}
                      </select>
                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" size={20} />
                   </div>
                </div>
             </div>

             <div className="grid md:grid-cols-2 gap-10">
                {/* Freelancer Address */}
                <div className="space-y-4">
                   <label className="text-xs font-black text-zinc-600 uppercase tracking-[0.2em]">Freelancer Address (Optional)</label>
                   <input 
                      type="text"
                      placeholder="0x..."
                      value={freelancer}
                      onChange={(e) => setFreelancer(e.target.value)}
                      className="w-full bg-[#0c0c0e] border border-white/5 hover:border-white/10 focus:border-[#00ffd5]/50 rounded-2xl py-5 px-6 text-zinc-500 font-mono text-sm outline-none transition-all placeholder:text-zinc-800"
                   />
                </div>

                {/* Duration */}
                <div className="space-y-4">
                   <label className="text-xs font-black text-zinc-600 uppercase tracking-[0.2em]">Duration (Days)</label>
                   <input 
                      type="number"
                      value={durationDays}
                      onChange={(e) => setDurationDays(e.target.value)}
                      className="w-full bg-[#0c0c0e] border border-white/5 hover:border-white/10 focus:border-[#00ffd5]/50 rounded-2xl py-5 px-6 text-white font-bold text-xl outline-none transition-all"
                   />
                </div>
             </div>

             {/* Main Actuate Button */}
             <div className="pt-10">
                <button 
                   onClick={handleInitiate}
                   disabled={isPending || isUploading}
                   className="w-full h-24 rounded-[32px] bg-gradient-to-r from-[#00ffd5] via-[#4d94ff] to-[#8c52ff] p-[2px] transition-all hover:scale-[1.01] active:scale-[0.99] group shadow-[0_20px_50px_rgba(0,255,213,0.15)]"
                >
                   <div className="w-full h-full bg-transparent rounded-[30px] flex items-center justify-center gap-4 text-black font-black text-xl uppercase tracking-widest relative overflow-hidden">
                      {isPending || isUploading ? (
                         <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                         <>
                            <Rocket size={24} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                            Actuate Contract
                         </>
                      )}
                      {/* Subtle shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                   </div>
                </button>
             </div>
          </div>
        </motion.div>
      </main>

      {/* Background Decorative noise */}
      <div className="fixed inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
    </div>
  );
};

export default InitiateMission;
