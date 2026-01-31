import React, { useState } from 'react';
import { useAccount, useWalletClient, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, parseUnits, erc20Abi } from 'viem';
import { Send, Loader2, Info, CreditCard, Plus, Trash2, Calendar, Target, DollarSign, Cpu } from 'lucide-react';
import StripeOnrampModal from './StripeOnrampModal';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { CONTRACT_ADDRESS, SUPPORTED_TOKENS } from '../constants';
import { api } from '../services/api';
import { uploadJSONToIPFS } from '../utils/ipfs';
import { useTransactionToast } from '../hooks/useTransactionToast';
import { createBiconomySmartAccount, createJobGasless } from '../utils/biconomy';

function CreateJob({ onJobCreated, gasless }) {
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
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();
    const [smartAccount, setSmartAccount] = useState(null);

    React.useEffect(() => {
        if (gasless && walletClient && !smartAccount) {
            createBiconomySmartAccount(walletClient).then(setSmartAccount).catch(console.error);
        }
    }, [gasless, walletClient, smartAccount]);

    const { data: hash, writeContract, isPending, error } = useWriteContract();
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
            try {
                const txHash = await createJobGasless(smartAccount, CONTRACT_ADDRESS, FreelanceEscrowABI.abi, params);
                // Trigger the same success logic as Wagmi
                api.saveJobMetadata({ jobId: Number(jobCount) + 1, title, description, category })
                    .then(() => onJobCreated()).catch(err => { console.error(err); onJobCreated(); });
                return;
            } catch (err) {
                console.error('[BICONOMY] Gasless failed, falling back:', err);
            }
        }

        writeContract({
            address: CONTRACT_ADDRESS,
            abi: FreelanceEscrowABI.abi,
            functionName: 'createJob',
            args: [params],
            value: selectedToken.address === '0x0000000000000000000000000000000000000000' ? rawAmount : 0n,
        });
    };

    React.useEffect(() => {
        if (isSuccess && jobCount !== undefined) {
            api.saveJobMetadata({ jobId: Number(jobCount), title, description, category })
                .then(() => onJobCreated()).catch(err => { console.error(err); onJobCreated(); });
        }
    }, [isSuccess, jobCount]);

    return (
        <div className="animate-fade">
            <header className="mb-12 text-center">
                <h1 className="text-6xl font-black mb-6 tracking-tighter shimmer-text">
                    Post a Mandate
                </h1>
                <p className="text-text-muted text-xl max-w-2xl mx-auto leading-relaxed font-medium">
                    Secure the best talent with automated on-chain escrow protection.
                </p>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">Industry Category</label>
                        <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)}>
                            <option>Development</option>
                            <option>Design</option>
                            <option>Marketing</option>
                            <option>Writing</option>
                        </select>
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
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

                <div className="glass-panel" style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '20px' }}>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="input-label">Budget</label>
                            <div style={{ position: 'relative' }}>
                                <DollarSign size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Amount"
                                    className="input-field"
                                    style={{ paddingLeft: '48px' }}
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="input-label">Asset</label>
                            <select
                                className="input-field"
                                value={selectedToken.symbol}
                                onChange={(e) => setSelectedToken(SUPPORTED_TOKENS.find(t => t.symbol === e.target.value))}
                            >
                                {SUPPORTED_TOKENS.map(t => <option key={t.symbol}>{t.symbol}</option>)}
                            </select>
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="input-label">Due Days</label>
                            <div style={{ position: 'relative' }}>
                                <Calendar size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                <input
                                    type="number"
                                    placeholder="7"
                                    className="input-field"
                                    style={{ paddingLeft: '48px' }}
                                    value={durationDays}
                                    onChange={(e) => setDurationDays(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </div>

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

                <div style={{ display: 'flex', gap: '16px', marginTop: '40px' }}>
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
                        disabled={isPending || isConfirming}
                    >
                        {isPending || isConfirming ? (
                            <><Loader2 className="animate-spin" size={20} /> Processing On-Chain...</>
                        ) : (
                            <><Cpu size={20} /> Deploy Escrow Contract</>
                        )}
                    </button>
                </div>
            </form>

            <StripeOnrampModal
                address={address}
                isOpen={isStripeModalOpen}
                onClose={() => setIsStripeModalOpen(false)}
            />
        </div>
    );
}

export default CreateJob;
