import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Zap, ShieldCheck, Activity, Brain, Server, Terminal, Lock, CheckCircle2, AlertCircle, Bot, Code } from 'lucide-react';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';

const cardBg = { padding: 32, borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' };
const dimLabel = { fontSize: '0.68rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-tertiary)', marginBottom: 12, display: 'block' };

const AICommandCenter = () => {
    const { address } = useAccount();
    const [activeAgents, setActiveAgents] = useState([
        { id: 'Zenith-Alpha', status: 'AUDITING', task: 'Milestone #4 Code Review', confidence: 94, health: 'Optimized' },
        { id: 'Zenith-Beta', status: 'MONITORING', task: 'Contract Escrow #128', confidence: 88, health: 'Healthy' },
        { id: 'Zenith-Gamma', status: 'SETTLING', task: 'RWA IP Verification', confidence: 99, health: 'Standby' }
    ]);

    const [verificationQueue, setVerificationQueue] = useState([
        { id: 'RQ-882', mission: 'DEX Interface Revamp', type: 'Code Audit', proof: 'ipfs://qm...x2', status: 'In Analysis' },
        { id: 'RQ-883', mission: 'Zenith Mobile SDK', type: 'ZK-Proof Validation', proof: 'ipfs://qm...y1', status: 'Pending Verification' }
    ]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40, padding: '40px 0' }}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                        AI <span style={{ color: 'var(--accent-light)' }}>Oracle</span>
                    </h1>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.92rem', marginTop: 12, maxWidth: 500 }}>
                        Autonomous Settlement Infrastructure. Verifying cryptographic proofs and digital labor with objective machine intelligence.
                    </p>
                </div>
                <div style={{ ...cardBg, padding: '16px 24px', textAlign: 'right' }}>
                    <span style={dimLabel}>Oracle Confidence</span>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-light)' }}>98.4% <Brain size={20} style={{ display: 'inline', marginLeft: 4 }} /></div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                <div style={cardBg}>
                    <Activity size={24} style={{ color: '#34d399', marginBottom: 16 }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>42 ms</div>
                    <span style={dimLabel}>Inference Latency</span>
                </div>
                <div style={cardBg}>
                    <ShieldCheck size={24} style={{ color: 'var(--accent-light)', marginBottom: 16 }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>80% Cap</div>
                    <span style={dimLabel}>Auto-Settle Threshold</span>
                </div>
                <div style={cardBg}>
                    <Server size={24} style={{ color: '#818cf8', marginBottom: 16 }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>Decentralized</div>
                    <span style={dimLabel}>Execution Context</span>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>Active Cognitive Entities</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    {activeAgents.map(agent => (
                        <motion.div key={agent.id} whileHover={{ y: -5 }} style={cardBg}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                <div style={{ padding: 8, borderRadius: 10, background: 'rgba(255,255,255,0.03)', color: 'var(--accent-light)' }}>
                                    <Bot size={20} />
                                </div>
                                <span style={{ fontSize: '0.62rem', fontWeight: 900, background: 'rgba(52,211,153,0.1)', color: '#34d399', padding: '4px 10px', borderRadius: 10 }}>{agent.status}</span>
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: 800 }}>{agent.id}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 4 }}>Current Task: <span style={{ color: '#fff' }}>{agent.task}</span></div>
                            <div style={{ marginTop: 16, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                                <div style={{ width: `${agent.confidence}%`, height: '100%', background: 'var(--gradient-primary)', borderRadius: 2 }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                                <span style={dimLabel}>Confidence</span>
                                <span style={{ fontSize: '0.68rem', fontWeight: 900, color: 'var(--accent-light)' }}>{agent.confidence}%</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>Verification Pipeline</h2>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 20 }}>
                    {verificationQueue.map((req, idx) => (
                        <div key={req.id} style={{ padding: '20px 24px', borderBottom: idx === verificationQueue.length - 1 ? 'none' : '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Code size={18} style={{ color: 'var(--text-tertiary)' }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{req.mission}</div>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>{req.id} • {req.type}</div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--accent-light)' }}>{req.status}</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: 2 }}>Proof: {req.proof.slice(0, 15)}...</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AICommandCenter;
