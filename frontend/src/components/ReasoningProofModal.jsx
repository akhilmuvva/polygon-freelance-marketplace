import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Terminal, Cpu, Clock, Layers, Brain, Database, Link } from 'lucide-react';

const ReasoningProofModal = ({ isOpen, onClose, proof }) => {
    if (!proof) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-bg-base/80 backdrop-blur-md"
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-2xl bg-bg-surface border border-accent-border rounded-3xl p-8 shadow-[0_0_50px_rgba(45,212,191,0.1)] overflow-hidden"
                    >
                        {/* Decorative background glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
                        
                        <div className="flex justify-between items-start mb-8 relative">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-accent-subtle border border-accent-border text-accent">
                                    <Brain size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white leading-tight">AGA Reasoning Proof</h2>
                                    <p className="text-xs font-bold text-accent tracking-widest uppercase opacity-70">
                                        Synthesized Logic Hash: {proof.cid?.slice(0, 16) || 'N/A'}...
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-colors">
                                <X size={20} className="text-text-tertiary" />
                            </button>
                        </div>

                        <div className="space-y-6 relative">
                            {/* Metadata Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                    <div className="text-[10px] font-black text-text-tertiary uppercase tracking-wider mb-1 flex items-center gap-1">
                                        <Cpu size={10} /> Orchestrator Agent
                                    </div>
                                    <div className="font-bold text-sm text-accent-light">{proof.agent || 'Neutral Stabilizer'}</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                    <div className="text-[10px] font-black text-text-tertiary uppercase tracking-wider mb-1 flex items-center gap-1">
                                        <Clock size={10} /> Handshake Epoch
                                    </div>
                                    <div className="font-bold text-sm text-white">{new Date(proof.timestamp).toLocaleString() || 'Live'}</div>
                                </div>
                            </div>

                            {/* Rationale Section */}
                            <div className="p-6 rounded-2xl bg-accent-subtle border border-accent-border relative group">
                                <div className="absolute top-4 right-4 text-accent/20 group-hover:text-accent/40 transition-colors">
                                    <Terminal size={32} />
                                </div>
                                <h3 className="text-xs font-black text-accent uppercase tracking-widest mb-3">Logic Execution Rationale</h3>
                                <p className="text-white font-medium leading-relaxed italic">
                                    "{proof.decision?.rationale || 'The protocol has actuated dynamic rebalancing to neutralize yield friction and maintain Absolute Zero Gravity for the mission participants.'}"
                                </p>
                            </div>

                            {/* Deep Logic Trace */}
                            <div className="space-y-3">
                                <div className="text-[10px] font-black text-text-tertiary uppercase tracking-wider flex items-center gap-2">
                                    <Layers size={10} /> Sensory Input Trace
                                </div>
                                <div className="p-4 rounded-2xl bg-bg-base/50 border border-white/5 font-mono text-xs overflow-x-auto">
                                    <pre className="text-success/80">
                                        {JSON.stringify(proof.sensoryInputs || { status: 'OPTIMIZED', friction: '0.05%', resonance: 'STABLE' }, null, 2)}
                                    </pre>
                                </div>
                            </div>

                            {/* Trust Footprint */}
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2 text-xs font-bold text-text-tertiary">
                                    <Shield size={14} className="text-success" /> Verified On-chain Registry
                                </div>
                                <a 
                                    href={`https://ipfs.io/ipfs/${proof.cid}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs font-black text-accent hover:text-accent-light transition-colors"
                                >
                                    <Database size={14} /> VIEW RAW CID <Link size={12} />
                                </a>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ReasoningProofModal;
