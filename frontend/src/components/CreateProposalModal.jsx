import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Shield, Info } from 'lucide-react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { GOVERNANCE_ABI } from '../utils/daoABIs';
import { GOVERNANCE_ADDRESS } from '../constants';
import toast from 'react-hot-toast';

const CreateProposalModal = ({ isOpen, onClose }) => {
    const [description, setDescription] = useState('');
    const [target, setTarget] = useState('0x0000000000000000000000000000000000000000');
    
    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            writeContract({
                address: GOVERNANCE_ADDRESS,
                abi: GOVERNANCE_ABI,
                functionName: 'createProposal',
                args: [
                    description,
                    true, // useQuadratic
                    false, // isOptimistic
                    false, // isSecret
                    false, // isConviction
                    false, // isZK
                    0n, // threshold
                    target,
                    '0x' // data
                ]
            });
        } catch (err) {
            toast.error("Failed to initiate proposal: " + err.message);
        }
    };

    React.useEffect(() => {
        if (isSuccess) {
            toast.success("Sovereign Proposal Synchronized!");
            setTimeout(() => {
                onClose();
                window.location.reload(); // Refresh to show new proposal
            }, 1500);
        }
    }, [isSuccess, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 6000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        style={{ 
                            position: 'relative', 
                            width: '100%', 
                            maxWidth: '500px', 
                            background: '#0a0b10', 
                            border: '1px solid rgba(255,255,255,0.1)', 
                            borderRadius: '32px', 
                            padding: '40px', 
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' 
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>New Proposal</h2>
                            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '8px' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '12px' }}>Proposal Objective</label>
                                <textarea
                                    required
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe the directive..."
                                    style={{ 
                                        width: '100%', 
                                        background: 'rgba(255,255,255,0.02)', 
                                        border: '1px solid rgba(255,255,255,0.08)', 
                                        borderRadius: '16px', 
                                        padding: '16px', 
                                        color: '#fff', 
                                        fontSize: '0.9rem',
                                        minHeight: '120px',
                                        resize: 'none',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#00f5d4'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '12px' }}>Execution Target (HEX)</label>
                                <input
                                    value={target}
                                    onChange={(e) => setTarget(e.target.value)}
                                    style={{ 
                                        width: '100%', 
                                        background: 'rgba(255,255,255,0.02)', 
                                        border: '1px solid rgba(255,255,255,0.08)', 
                                        borderRadius: '16px', 
                                        padding: '16px', 
                                        color: '#00f5d4', 
                                        fontFamily: 'monospace',
                                        fontSize: '0.8rem',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <div style={{ padding: '20px', background: 'rgba(0,245,212,0.03)', border: '1px solid rgba(0,245,212,0.1)', borderRadius: '16px', display: 'flex', gap: '12px' }}>
                                <Info size={18} style={{ color: '#00f5d4', flexShrink: 0 }} />
                                <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: 'rgba(0,245,212,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.5 }}>
                                    Broadcast requires 500 Reputation. Quadratic resonance distribution is active.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={isPending || isConfirming}
                                style={{ 
                                    width: '100%', 
                                    height: '60px', 
                                    background: '#00f5d4', 
                                    color: '#000', 
                                    border: 'none', 
                                    borderRadius: '16px', 
                                    fontSize: '11px', 
                                    fontWeight: 900, 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '0.3em',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {isPending || isConfirming ? <div className="animate-pulse">Broadcasting...</div> : (
                                    <><Send size={16} /> Actuate Proposal</>
                                )}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CreateProposalModal;
