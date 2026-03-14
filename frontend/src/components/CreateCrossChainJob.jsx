import React, { useState, useEffect } from 'react';
import { useMultiChain } from '../hooks/useMultiChain';
import { ethers } from 'ethers';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Globe, Zap, Layout, CreditCard, ListTodo, CheckCircle2,
    ArrowRight, ChevronLeft, ChevronRight, X, Plus, Trash2,
    ShieldCheck, Info
} from 'lucide-react';
import { CROSS_CHAIN_ESCROW_MANAGER_ADDRESS } from '../constants';

const CreateCrossChainJob = ({ onClose, onSuccess }) => {
    const {
        currentChain,
        getMainnetChains,
        getTestnetChains,
        estimateCrossChainFee
    } = useMultiChain();

    const signer = useEthersSigner();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'development',
        amount: '',
        token: 'USDC',
        deadline: '',
        sourceChain: currentChain?.id || 137,
        destinationChain: 1,
        freelancer: '',
        milestones: []
    });

    const [estimatedFee, setEstimatedFee] = useState(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    const chains = [...getMainnetChains(), ...getTestnetChains()];

    useEffect(() => {
        if (formData.destinationChain && currentChain) {
            estimateFee();
        }
    }, [formData.destinationChain, currentChain]);

    const estimateFee = async () => {
        try {
            const fee = await estimateCrossChainFee(
                formData.destinationChain,
                'CREATE_JOB',
                null
            );
            setEstimatedFee(fee);
        } catch (err) {
            console.error('Fee estimation failed', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addMilestone = () => {
        setFormData(prev => ({
            ...prev,
            milestones: [...prev.milestones, { description: '', amount: '', isUpfront: false }]
        }));
    };

    const updateMilestone = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            milestones: prev.milestones.map((m, i) => i === index ? { ...m, [field]: value } : m)
        }));
    };

    const removeMilestone = (index) => {
        setFormData(prev => ({
            ...prev,
            milestones: prev.milestones.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0) {
            toast.error('Please enter a valid allocation amount');
            return;
        }
        if (!formData.title) {
            toast.error('Please enter a mission title');
            return;
        }

        setLoading(true);
        try {
            // Logic remains same as original but with cleaner state handling
            const ipfsHash = 'QmExample...';
            const escrowManagerAddress = CROSS_CHAIN_ESCROW_MANAGER_ADDRESS;
            const escrowManagerABI = [
                'function createCrossChainJob(uint64 destinationChain, address freelancer, uint256 amount, address token, bytes calldata jobData) external payable returns (uint256 localJobId, bytes32 messageId)'
            ];

            const escrowManager = new ethers.Contract(escrowManagerAddress, escrowManagerABI, signer);
            const encodedJobData = ethers.AbiCoder.defaultAbiCoder().encode(
                ['string', 'string', 'uint256', 'string[]', 'uint256[]', 'bool[]'],
                [
                    ipfsHash,
                    formData.category,
                    formData.deadline ? Math.floor(new Date(formData.deadline).getTime() / 1000) : 0,
                    formData.milestones.map(m => m.description || ''),
                    formData.milestones.map(m => {
                        const amt = String(m.amount || '0').trim();
                        return ethers.parseUnits(amt === '' || isNaN(amt) ? '0' : amt, 6);
                    }),
                    formData.milestones.map(m => !!m.isUpfront)
                ]
            );

            const destinationChainInfo = chains.find(c => c.id.toString() === formData.destinationChain.toString());
            const destinationSelector = destinationChainInfo?.ccipSelector;
            const tokenAddress = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'; // Simplified for demo
            
            // Native Fee Resilience: Ensuring the routing fee is never malformed
            const feeValue = String(estimatedFee?.nativeFee || '0.01').trim();
            const totalFee = ethers.parseUnits(isNaN(feeValue) ? '0.01' : feeValue, 18);

            const tx = await escrowManager.createCrossChainJob(
                destinationSelector,
                formData.freelancer || ethers.ZeroAddress,
                ethers.parseUnits(String(formData.amount || '0').trim(), 6),
                tokenAddress,
                encodedJobData,
                { value: totalFee }
            );

            const tid = toast.loading('Initiating cross-chain transaction...', { theme: 'dark' });
            await tx.wait();
            toast.update(tid, {
                render: 'Job created successfully across chains!',
                type: 'success',
                isLoading: false,
                autoClose: 5000
            });
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to create cross-chain job:', error);
            toast.error(error.message || 'Failed to create job', { theme: 'dark' });
        } finally {
            setLoading(false);
        }
    };

    const stepLabel = (num, icon, text) => (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1,
            opacity: step === num ? 1 : 0.4, transition: 'opacity 0.3s'
        }}>
            <div style={{
                width: 40, height: 40, borderRadius: 12, background: step === num ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                border: step === num ? 'none' : '1px solid var(--border)'
            }}>
                {icon}
            </div>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{text}</span>
            <div style={{ width: '100%', height: 3, background: step === num ? 'var(--accent)' : 'rgba(255,255,255,0.05)', borderRadius: 2 }} />
        </div>
    );

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="card"
                style={{ width: '100%', maxWidth: 720, maxHeight: '95vh', overflowY: 'auto', padding: 0, position: 'relative', border: '1px solid rgba(255,255,255,0.08)' }}
            >
                {/* Header */}
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(13,13,31,0.8)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>Protocol Genesis</h2>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>Deploy workforce requirements to the hyper-structure</p>
                    </div>
                    <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Stepper */}
                <div style={{ display: 'flex', gap: 12, padding: '20px 32px 0' }}>
                    {stepLabel(1, <Layout size={18} />, 'Specs')}
                    {stepLabel(2, <Globe size={18} />, 'Routing')}
                    {stepLabel(3, <ListTodo size={18} />, 'Nodes')}
                    {stepLabel(4, <ShieldCheck size={18} />, 'Verify')}
                </div>

                <div style={{ padding: 32 }}>
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                    <div className="input-group-glass">
                                        <label className="form-label">Mission Title</label>
                                        <input className="form-input" name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g. Architect Decentralized Indexer" />
                                    </div>
                                    <div className="input-group-glass">
                                        <label className="form-label">Objective Description</label>
                                        <textarea className="form-input" name="description" value={formData.description} onChange={handleInputChange} placeholder="Define the technical requirements..." rows={5} style={{ resize: 'none' }} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                        <div className="input-group-glass">
                                            <label className="form-label">Vector Category</label>
                                            <select className="form-input" name="category" value={formData.category} onChange={handleInputChange}>
                                                <option value="development">Development</option>
                                                <option value="design">Design</option>
                                                <option value="marketing">Marketing</option>
                                                <option value="infrastructure">Infrastructure</option>
                                            </select>
                                        </div>
                                        <div className="input-group-glass">
                                            <label className="form-label">Deadline</label>
                                            <input className="form-input" type="date" name="deadline" value={formData.deadline} onChange={handleInputChange} />
                                        </div>
                                    </div>
                                    <button className="btn-primary" style={{ marginTop: 12 }} onClick={() => setStep(2)}>Continue to Routing <ChevronRight size={18} /></button>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 24, borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 8 }}>Source Node</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }} />
                                                {currentChain?.name || 'Polygon'}
                                            </div>
                                        </div>
                                        <ArrowRight size={24} style={{ color: 'var(--accent)' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 8 }}>Target Node</div>
                                            <select className="form-input" name="destinationChain" value={formData.destinationChain} onChange={handleInputChange} style={{ padding: '6px 12px', height: 40 }}>
                                                {chains.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                        <div className="input-group-glass">
                                            <label className="form-label">Allocation Amount</label>
                                            <input className="form-input" type="number" name="amount" value={formData.amount} onChange={handleInputChange} placeholder="5000" />
                                        </div>
                                        <div className="input-group-glass">
                                            <label className="form-label">Currency</label>
                                            <select className="form-input" name="token" value={formData.token} onChange={handleInputChange}>
                                                <option value="USDC">USDC (Polygon)</option>
                                                <option value="DAI">DAI (Multi-Chain)</option>
                                                <option value="USDT">USDT</option>
                                            </select>
                                        </div>
                                    </div>

                                    {estimatedFee && (
                                        <div style={{ padding: 20, borderRadius: 12, background: 'rgba(59, 130, 246, 0.04)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--info)', marginBottom: 12 }}>
                                                <Zap size={16} />
                                                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Chainlink CCIP Routing Fee</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                <span style={{ color: 'var(--text-tertiary)' }}>Estimated Cost:</span>
                                                <span style={{ fontWeight: 800, color: '#fff' }}>{estimatedFee.nativeFee} {estimatedFee.currency} (~${estimatedFee.usdFee.toFixed(2)})</span>
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                                        <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(1)}><ChevronLeft size={18} /> Back</button>
                                        <button className="btn-primary" style={{ flex: 1.5 }} onClick={() => setStep(3)}>Define Milestones <ChevronRight size={18} /></button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Execution Milestones</h3>
                                        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', gap: 6 }} onClick={addMilestone}>
                                            <Plus size={14} /> Add Target
                                        </button>
                                    </div>

                                    {formData.milestones.length === 0 ? (
                                        <div style={{ border: '1px dashed var(--border)', borderRadius: 12, padding: 40, textAlign: 'center' }}>
                                            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No individual milestones defined. The total amount will be released upon job completion.</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            {formData.milestones.map((m, i) => (
                                                <div key={i} style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                                                    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                                                        <input className="form-input" style={{ flex: 2 }} placeholder="Target description..." value={m.description} onChange={e => updateMilestone(i, 'description', e.target.value)} />
                                                        <input className="form-input" style={{ flex: 1 }} type="number" placeholder="Amt" value={m.amount} onChange={e => updateMilestone(i, 'amount', e.target.value)} />
                                                        <button onClick={() => removeMilestone(i)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: 'var(--danger)', cursor: 'pointer', borderRadius: 8, padding: '0 12px' }}><Trash2 size={16} /></button>
                                                    </div>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                        <input type="checkbox" checked={m.isUpfront} onChange={e => updateMilestone(i, 'isUpfront', e.target.checked)} />
                                                        <span>Activate as Upfront Payment (Locked on Genesis)</span>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                                        <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(2)}><ChevronLeft size={18} /> Back</button>
                                        <button className="btn-primary" style={{ flex: 1.5 }} onClick={() => setStep(4)}>Review Mission <ChevronRight size={18} /></button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div key="step4" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                    <div style={{ padding: 24, borderRadius: 16, background: 'rgba(124, 92, 252, 0.05)', border: '1px solid rgba(124, 92, 252, 0.2)' }}>
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-light)', textTransform: 'uppercase', marginBottom: 16 }}>Mission Summary</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>Title:</span>
                                                <span style={{ fontWeight: 700, color: '#fff' }}>{formData.title}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>Total Allocation:</span>
                                                <span style={{ fontWeight: 800, color: 'var(--accent-light)', fontSize: '1.2rem' }}>{formData.amount} {formData.token}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>Vector:</span>
                                                <span style={{ fontWeight: 700, color: '#fff', textTransform: 'capitalize' }}>{formData.category}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ padding: 20, borderRadius: 12, background: 'rgba(255,158,11,0.05)', border: '1px solid rgba(255,158,11,0.2)', display: 'flex', gap: 12 }}>
                                        <Info size={20} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                            Upon confirmation, your funds will be locked in the cross-chain escrow smart contract on <strong>{currentChain?.name}</strong> and transmitted to the destination chain via Chainlink CCIP.
                                        </p>
                                    </div>

                                    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                                        <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(3)}><ChevronLeft size={18} /> Back</button>
                                        <button className="btn-primary" style={{ flex: 2, background: 'linear-gradient(135deg, var(--accent), var(--accent-light))' }} onClick={handleSubmit} disabled={loading}>
                                            {loading ? 'Initializing Genesis...' : 'Deploy Mission Contract 🚀'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default CreateCrossChainJob;
