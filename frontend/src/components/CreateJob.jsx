import React, { useState } from 'react';
import { useAccount, useWalletClient, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, parseUnits, erc20Abi } from 'viem';
import { Send, Loader2, Info, CreditCard, Plus, Trash2, Calendar, Target, DollarSign, Cpu, Sparkles } from 'lucide-react';
import { initSocialLogin, createJobGasless } from '../utils/biconomy';
import { showPendingToast, updateToastToSuccess, updateToastToError, handleError } from '../utils/feedback';
import StripeOnrampModal from './StripeOnrampModal';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { CONTRACT_ADDRESS, SUPPORTED_TOKENS } from '../constants';
import { api } from '../services/api';
import { uploadJSONToIPFS } from '../utils/ipfs';
import { useTransactionToast } from '../hooks/useTransactionToast';
import { createBiconomySmartAccount } from '../utils/biconomy';

function CreateJob({ onJobCreated, gasless, smartAccount }) {
    const [freelancer, setFreelancer] = useState('');
    const [amount, setAmount] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Development');
    const [selectedToken, setSelectedToken] = useState(SUPPORTED_TOKENS[0]);
    const [milestones, setMilestones] = useState([{ amount: '', description: '' }]);
    const [durationDays, setDurationDays] = useState('7');
    const [isApproving, setIsApproving] = useState(false);
    const [isStripeModalOpen, setIsStripeModalOpen] = useState(false);
    const [isProcessingGasless, setIsProcessingGasless] = useState(false);
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();
    // Use smartAccount from props

    const { data: hash, writeContract, writeContractAsync, isPending, error } = useWriteContract();
    const { data: jobCount } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        functionName: 'jobCount',
    });

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
    useTransactionToast(hash, isPending, isConfirming, isSuccess, error);

    const handleAddMilestone = () => setMilestones([...milestones, { amount: '', description: '' }]);
    const handleRemoveMilestone = (idx) => setMilestones(milestones.filter((_, i) => i !== idx));
    const handleMilestoneChange = (index, field, value) => {
        const newMilestones = [...milestones];
        newMilestones[index][field] = value;
        setMilestones(newMilestones);
    };

    const handleApprove = async () => {
        if (selectedToken.address === '0x0000000000000000000000000000000000000000') return;
        setIsApproving(true);
        try {
            const rawAmount = parseUnits(amount, selectedToken.decimals);
            await writeContract({
                address: selectedToken.address,
                abi: erc20Abi,
                functionName: 'approve',
                args: [CONTRACT_ADDRESS, rawAmount],
            });
        } finally { setIsApproving(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!freelancer || !amount || !title) return;
        const rawAmount = parseUnits(amount, selectedToken.decimals);

        let ipfsHash = description;
        try {
            ipfsHash = await uploadJSONToIPFS({
                title, description, category, client: address, freelancer, amount, token: selectedToken.symbol,
                milestones: milestones.map(m => ({ amount: m.amount, description: m.description }))
            });
        } catch (err) { console.error('IPFS failed:', err); }

        const currentTimestamp = Math.floor(Date.now() / 1000);
        const deadline = durationDays > 0 ? currentTimestamp + (Number(durationDays) * 86400) : 0;

        const params = {
            categoryId: 1, // Defaulting to Development for now
            freelancer: freelancer || '0x0000000000000000000000000000000000000000',
            token: selectedToken.address,
            amount: rawAmount,
            ipfsHash,
            deadline: BigInt(deadline),
            mAmounts: milestones.filter(m => m.amount).map(m => parseUnits(m.amount, selectedToken.decimals)),
            mHashes: milestones.filter(m => m.amount).map(m => m.description || "")
        };

        if (gasless && smartAccount) {
            setIsProcessingGasless(true);
            const toastId = showPendingToast();
            try {
                const txHash = await createJobGasless(smartAccount, CONTRACT_ADDRESS, FreelanceEscrowABI.abi, params);
                updateToastToSuccess(toastId, "Gasless Job Created!");
                // Trigger the same success logic as Wagmi
                api.saveJobMetadata({
                    jobId: Number(jobCount) + 1,
                    title,
                    description,
                    category,
                    ipfsHash,
                    milestones: milestones.filter(m => m.amount).map(m => ({
                        amount: m.amount,
                        description: m.description,
                        isReleased: false
                    }))
                })
                    .then(() => onJobCreated()).catch(err => { console.error(err); onJobCreated(); });
                setIsProcessingGasless(false);
                return;
            } catch (err) {
                console.error('[BICONOMY] Gasless failed, falling back:', err);
                updateToastToError(toastId, err);
                setIsProcessingGasless(false);
            }
        }

        try {
            await writeContractAsync({
                address: CONTRACT_ADDRESS,
                abi: FreelanceEscrowABI.abi,
                functionName: 'createJob',
                args: [params],
                value: selectedToken.symbol === 'MATIC' ? parseEther(amount) : 0n
            });
        } catch (error) {
            handleError(error);
        }
    };

    React.useEffect(() => {
        if (isSuccess && jobCount !== undefined) {
            api.saveJobMetadata({
                jobId: Number(jobCount),
                title,
                description,
                category,
                ipfsHash: params.ipfsHash, // Use the hash from params
                milestones: milestones.filter(m => m.amount).map(m => ({
                    amount: m.amount,
                    description: m.description,
                    isReleased: false
                }))
            })
                .then(() => onJobCreated()).catch(err => { console.error(err); onJobCreated(); });
        }
    }, [isSuccess, jobCount]);

    return (
        <div className="animate-fade">
            <header className="mb-12 text-center">
                <div className="flex justify-center mb-6">
                    <div className="badge !bg-emerald-500/20 !text-emerald-400 !border-emerald-500/20 !px-4 !py-2 flex items-center gap-2 animate-bounce">
                        <Sparkles size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Sponsorship Eligible: First Job Gas-Free</span>
                    </div>
                </div>
                <h1 className="text-6xl font-black mb-6 tracking-tighter shimmer-text">
                    Post a Mandate
                </h1>
                <p className="text-text-muted text-xl max-w-2xl mx-auto leading-relaxed font-medium mb-10">
                    Secure the best talent with automated on-chain escrow protection.
                </p>
                {gasless && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 inline-flex items-center gap-3 px-6 py-3 bg-primary/10 border border-primary/20 rounded-2xl"
                    >
                        <Sparkles size={18} className="text-primary animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-widest text-primary">Platform Sponsored: 100% Gas Free</span>
                    </motion.div>
                )}
            </header>

            <form onSubmit={handleSubmit} className="glass-card max-w-4xl mx-auto p-12">
                <div className="input-group">
                    <label className="input-label">Project Identity</label>
                    <div style={{ position: 'relative' }}>
                        <Target size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                        <input
                            type="text"
                            placeholder="e.g. Next-Gen DEX Interface Design"
                            className="input-field"
                            style={{ paddingLeft: '48px' }}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="input-group mb-0">
                        <label className="input-label">Project Category</label>
                        <select
                            className="input-field"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <option>Development</option>
                            <option>Design</option>
                            <option>Marketing</option>
                            <option>Writing</option>
                        </select>
                    </div>
                    <div className="input-group mb-0">
                        <label className="input-label">Talent Address (Pro)</label>
                        <input
                            type="text"
                            placeholder="0x..."
                            className="input-field"
                            value={freelancer}
                            onChange={(e) => setFreelancer(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="glass-panel mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="input-group mb-0 md:col-span-2">
                            <label className="input-label">Budget</label>
                            <div className="relative">
                                <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Amount"
                                    className="input-field pl-12"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="input-group mb-0">
                            <label className="input-label">Asset</label>
                            <select
                                className="input-field"
                                value={selectedToken.symbol}
                                onChange={(e) => setSelectedToken(SUPPORTED_TOKENS.find(t => t.symbol === e.target.value))}
                            >
                                {SUPPORTED_TOKENS.map(t => <option key={t.symbol}>{t.symbol}</option>)}
                            </select>
                        </div>
                        <div className="input-group mb-0">
                            <label className="input-label">Due Days</label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
                                <input
                                    type="number"
                                    placeholder="7"
                                    className="input-field pl-12"
                                    value={durationDays}
                                    onChange={(e) => setDurationDays(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {gasless && (
                    <div className="glass-panel !bg-primary/[0.03] !border-primary/10 p-6 mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <Cpu size={24} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black uppercase tracking-tight">Quantum Gas Relay</h4>
                                <p className="text-[10px] text-text-muted font-medium">Biconomy Paymaster active. No MATIC required for deployment.</p>
                            </div>
                        </div>
                        <div className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
                            Ready
                        </div>
                    </div>
                )}

                <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <label className="input-label" style={{ marginBottom: 0 }}>Project Milestones</label>
                        <button type="button" onClick={handleAddMilestone} className="btn-ghost" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                            <Plus size={14} /> Add Phase
                        </button>
                    </div>
                    {milestones.map((m, index) => (
                        <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '12px', marginBottom: '12px' }}>
                            <input
                                type="number"
                                placeholder="Amount"
                                className="input-field"
                                value={m.amount}
                                onChange={(e) => handleMilestoneChange(index, 'amount', e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="Objective / Phase Description"
                                className="input-field"
                                value={m.description}
                                onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                            />
                            {milestones.length > 1 && (
                                <button type="button" onClick={() => handleRemoveMilestone(index)} className="btn-ghost" style={{ color: 'var(--danger)', padding: '12px' }}>
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="input-group">
                    <label className="input-label">Project Brief (Stored on IPFS)</label>
                    <textarea
                        placeholder="Define scope, requirements, and deliverables..."
                        className="input-field"
                        style={{ minHeight: '160px', borderRadius: '20px' }}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className="flex flex-col md:flex-row gap-4 mt-10">
                    <button
                        type="button"
                        className="btn-ghost"
                        style={{ flex: 1, gap: '12px' }}
                        onClick={() => setIsStripeModalOpen(true)}
                    >
                        <CreditCard size={20} /> Fiat Onramp
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ flex: 2, justifyContent: 'center' }}
                        disabled={isPending || isConfirming || isProcessingGasless}
                    >
                        {isPending || isConfirming || isProcessingGasless ? (
                            <><Loader2 className="animate-spin" size={20} /> Processing On-Chain...</>
                        ) : (
                            <><Cpu size={20} /> Deploy Escrow Contract</>
                        )}
                    </button>
                </div>
            </form >

            <StripeOnrampModal
                address={address}
                isOpen={isStripeModalOpen}
                onClose={() => setIsStripeModalOpen(false)}
            />
        </div >
    );
}

export default CreateJob;
