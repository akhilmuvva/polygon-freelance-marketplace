import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDemo } from '../context/DemoContext';
import { Wallet, Activity, CheckCircle, Clock, ExternalLink, X } from 'lucide-react';

const DemoWallet = () => {
    const { isDemoMode, demoWalletAddress, demoTransactions, deactivateDemoMode } = useDemo();
    const [isOpen, setIsOpen] = useState(false);

    if (!isDemoMode) return null;

    return (
        <>
            {/* Persistent floating indicator */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed bottom-6 left-6 z-[9999] flex flex-col gap-2"
            >
                <div 
                    onClick={() => setIsOpen(!isOpen)}
                    className="cursor-pointer bg-gradient-to-r from-teal-900/90 to-emerald-900/90 border border-teal-500/30 backdrop-blur-xl rounded-xl p-3 shadow-2xl flex items-center gap-3 hover:border-teal-400/50 transition-all group"
                >
                    <div className="bg-teal-500/20 p-2 rounded-lg">
                        <Wallet size={20} className="text-teal-400" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-teal-300 uppercase tracking-wider">Demo Mode Active</div>
                        <div className="text-[10px] text-teal-100/60 font-mono">
                            {demoWalletAddress?.slice(0, 8)}...{demoWalletAddress?.slice(-6)}
                        </div>
                    </div>
                    <div className="ml-2 w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                </div>
            </motion.div>

            {/* Expanded panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: -20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -20, scale: 0.95 }}
                        className="fixed bottom-24 left-6 z-[9999] w-80 bg-[#080b0e] border border-teal-500/20 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl"
                    >
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <div className="flex items-center gap-2">
                                <Activity size={16} className="text-teal-400" />
                                <span className="text-sm font-bold text-white tracking-wide">Demo Activity</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white">
                                <X size={16} />
                            </button>
                        </div>
                        
                        <div className="p-4 max-h-64 overflow-y-auto">
                            {demoTransactions.length === 0 ? (
                                <div className="text-center text-xs text-white/40 py-6">
                                    No demo transactions yet.<br />Try posting a job!
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {demoTransactions.map(tx => (
                                        <div key={tx.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                            {tx.status === 'pending' ? (
                                                <Clock size={16} className="text-yellow-400 animate-spin-slow mt-0.5" />
                                            ) : (
                                                <CheckCircle size={16} className="text-teal-400 mt-0.5" />
                                            )}
                                            <div className="flex-1">
                                                <div className="text-xs font-bold text-white/90">{tx.name}</div>
                                                <div className="text-[10px] text-white/40 flex items-center gap-1 mt-1">
                                                    Status: {tx.status === 'pending' ? 'Confirming...' : 'Success'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-white/5 bg-black/20">
                            <button
                                onClick={deactivateDemoMode}
                                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white/70 hover:text-white transition-colors uppercase tracking-wider"
                            >
                                Exit Demo Mode
                            </button>
                            <div className="text-center text-[9px] text-white/30 mt-3 uppercase tracking-widest">
                                Read-only experience
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default DemoWallet;
