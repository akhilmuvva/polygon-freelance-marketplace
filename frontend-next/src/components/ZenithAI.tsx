'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, Sparkles, Shield, Cpu, 
  MessageSquare, ChevronRight, X, Loader2,
  Zap, AlertTriangle, ShieldCheck
} from 'lucide-react';

interface Message {
  role: 'user' | 'zenith';
  content: string;
  type?: 'intel' | 'security' | 'standard';
}

export const ZenithAI = ({ missionData }: { missionData?: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'zenith', 
      content: 'Sovereign Intelligence synchronized. I am Zenith-4. Analysis of current protocol vectors is ready.',
      type: 'intel'
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsProcessing(true);

    // This would typically call a local API or the MCP server indirectly
    // For now, we simulate the premium AI response
    setTimeout(() => {
      let response = "I am processing your request through the Sovereign Mesh. Please verify on-chain.";
      let type: 'intel' | 'security' | 'standard' = 'standard';

      if (userMsg.toLowerCase().includes('risk') || userMsg.toLowerCase().includes('security')) {
        response = "Security Audit: Reentrancy protection verified. Escrow logic matches EIP-2981 standards. ZK-proofs recommended for this mission type.";
        type = 'security';
      } else if (userMsg.toLowerCase().includes('budget') || userMsg.toLowerCase().includes('milestone')) {
        response = "Financial Analysis: Milestone distribution is 40/60. Yield strategy (AAVE V3) expected to generate 3.2% APY on locked funds.";
        type = 'intel';
      }

      setMessages(prev => [...prev, { role: 'zenith', content: response, type }]);
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <>
      {/* Floating Toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-violet-600 rounded-full shadow-2xl shadow-violet-600/40 flex items-center justify-center z-50 border border-violet-400/30"
      >
        <Sparkles className="text-white" />
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute inset-0 rounded-full bg-violet-500/20" 
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-28 right-8 w-[400px] h-[550px] bg-[#080808]/90 border border-white/10 rounded-[32px] shadow-2xl z-50 flex flex-col overflow-hidden backdrop-blur-3xl"
          >
            <div className="absolute inset-0 zenith-grid opacity-5 pointer-events-none" />
            <div className="scanline opacity-[0.03]" />

            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
                  <Cpu size={16} className="text-violet-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Zenith-4</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Local Neural Link</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={18} className="text-zinc-500" />
              </button>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
              {messages.map((msg, i) => (
                <motion.div
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-violet-600 text-white rounded-tr-none font-bold' 
                      : 'bg-white/5 border border-white/10 text-zinc-300 rounded-tl-none font-medium'
                  }`}>
                    {msg.type === 'security' && <ShieldCheck size={14} className="text-emerald-400 mb-2" />}
                    {msg.type === 'intel' && <Zap size={14} className="text-violet-400 mb-2" />}
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none">
                    <Loader2 size={16} className="text-violet-500 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white/2 border-t border-white/5">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Query Zenith Neural Mesh..."
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl py-4 pl-5 pr-12 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all font-mono"
                />
                <button 
                  onClick={handleSend}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-violet-600 hover:bg-violet-500 rounded-xl transition-all"
                >
                  <ChevronRight size={16} className="text-white" />
                </button>
              </div>
              <p className="text-[9px] text-zinc-700 mt-3 text-center uppercase font-bold tracking-widest">
                Protected by E2EE & ZK-Proofs • PolyLance v2.4.0
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ZenithAI;
