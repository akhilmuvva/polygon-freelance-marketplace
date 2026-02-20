import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { Send, Loader2, Info, Plus, Trash2, Target, Cpu, Sparkles } from 'lucide-react';
import { createJobGasless } from '../utils/biconomy';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { CONTRACT_ADDRESS, SUPPORTED_TOKENS } from '../constants';
import { uploadJSONToIPFS } from '../utils/ipfs';
import { useTransactionToast } from '../hooks/useTransactionToast';
import { useAnimeAnimations } from '../hooks/useAnimeAnimations';

const st = {
    page: { maxWidth: 800, margin: '0 auto' },
    header: { textAlign: 'center', marginBottom: 36 },
    badge: {
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 12px', borderRadius: 8,
        background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)',
        marginBottom: 18,
    },
    badgeText: {
        fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.08em', color: 'var(--success)',
    },
    title: {
        fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8, color: '#fff'
    },
    subtitle: {
        fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto', lineHeight: 1.6,
    },
    form: {
        borderRadius: 16, padding: 32,
        background: 'linear-gradient(145deg, rgba(17,17,40,0.6), rgba(13,13,34,0.6))',
        border: '1px solid var(--border)',
    },
    section: { marginBottom: 24 },
    sectionTitle: {
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
    },
    sectionLabel: { fontSize: '0.78rem', fontWeight: 700 },
    row: (cols) => ({
        display: 'grid', gridTemplateColumns: cols, gap: 14,
    }),
    inputWrap: { marginBottom: 14 },
    label: { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' },
    input: { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '0.9rem' },
    select: { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '0.9rem' },
    actions: { display: 'flex', gap: 12, marginTop: 28 },
};

function CreateJob({ onJobCreated, gasless, smartAccount }) {
    const [freelancer, setFreelancer] = useState('');
    const [amount, setAmount] = useState('');
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Development');
    const [selectedToken, setSelectedToken] = useState(SUPPORTED_TOKENS[0]);
    const [yieldStrategy, setYieldStrategy] = useState(0);
    const [milestones, setMilestones] = useState([{ amount: '', description: '' }]);
    const [durationDays, setDurationDays] = useState('7');
    const [isProcessingGasless, setIsProcessingGasless] = useState(false);
    const { address } = useAccount();

    // Anime.js hooks
    const headerRef = React.useRef(null);
    const { slideInLeft, staggerFadeIn } = useAnimeAnimations();

    React.useEffect(() => {
        if (headerRef.current) slideInLeft(headerRef.current, 30);
        setTimeout(() => staggerFadeIn('.create-job-section', 80), 200);
    }, []);



    const { data: hash, writeContract, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
    useTransactionToast(hash, isPending, isConfirming, isSuccess, error);

    const handleAddMilestone = () => setMilestones([...milestones, { amount: '', description: '' }]);
    const handleRemoveMilestone = (idx) => setMilestones(milestones.filter((_, i) => i !== idx));
    const handleMilestoneChange = (index, field, value) => {
        const n = [...milestones]; n[index][field] = value; setMilestones(n);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!freelancer || !amount || !title) return;
        const rawAmount = parseUnits(amount, selectedToken.decimals);
        let ipfsHash = '';
        try {
            ipfsHash = await uploadJSONToIPFS({
                title, category, client: address, freelancer, amount, token: selectedToken.symbol,
                milestones: milestones.map(m => ({ amount: m.amount, description: m.description }))
            });
        } catch (err) { console.error('IPFS failed:', err); }

        const deadline = Math.floor(Date.now() / 1000) + (Number(durationDays) * 86400);

        if (gasless && smartAccount) {
            setIsProcessingGasless(true);
            try {
                const res = await createJobGasless(smartAccount, CONTRACT_ADDRESS, FreelanceEscrowABI.abi, {
                    categoryId: 1, freelancer, token: selectedToken.address, amount: rawAmount, ipfsHash, deadline: BigInt(deadline),
                    mAmounts: milestones.filter(m => m.amount).map(m => parseUnits(m.amount, selectedToken.decimals)),
                    mHashes: milestones.filter(m => m.amount).map(m => m.description || "")
                });
                if (res) onJobCreated();
            } catch (err) { console.error(err); }
            finally { setIsProcessingGasless(false); }
            return;
        }

        writeContract({
            address: CONTRACT_ADDRESS, abi: FreelanceEscrowABI.abi, functionName: 'createJob',
            args: [1, freelancer, selectedToken.address, rawAmount, ipfsHash, BigInt(deadline),
                milestones.filter(m => m.amount).map(m => parseUnits(m.amount, selectedToken.decimals)),
                milestones.filter(m => m.amount).map(m => m.description || "")]
        });
    };

    React.useEffect(() => { if (isSuccess) onJobCreated(); }, [isSuccess]);

    return (
        <div style={st.page}>
            <div ref={headerRef} style={{ ...st.header, opacity: 0 }}>
                <div style={st.badge}>
                    <Sparkles size={12} className="text-emerald-400" />
                    <span style={st.badgeText}>New Opportunity</span>
                </div>
                <h1 style={st.title}>Initialize Contract</h1>
                <p style={st.subtitle}>Create a secure, decentralized task agreement on the Polygon network.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* 1. Job Basics */}
                <div className="card create-job-section" style={{ ...st.card, opacity: 0, transform: 'translateY(20px)' }}>
                    <div style={st.inputWrap}>
                        <label style={st.label}>Project Title</label>
                        <input type="text" style={st.input} placeholder="e.g. DEX Interface Design"
                            value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>

                    <div style={{ ...st.row('1fr 1fr'), marginBottom: 20 }}>
                        <div>
                            <label style={st.label}>Category</label>
                            <select style={st.select} value={category} onChange={(e) => setCategory(e.target.value)}>
                                <option>Development</option><option>Design</option>
                                <option>Marketing</option><option>Writing</option>
                            </select>
                        </div>
                        <div>
                            <label style={st.label}>Freelancer Address</label>
                            <input type="text" style={st.input} placeholder="0x..."
                                value={freelancer} onChange={(e) => setFreelancer(e.target.value)} required />
                        </div>
                    </div>
                </div>

                {/* 2. Budget & Duration */}
                <div className="card create-job-section" style={{ ...st.card, opacity: 0, transform: 'translateY(20px)' }}>
                    <div style={{ padding: 20, borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', marginBottom: 24 }}>
                        <div style={{ ...st.row('2fr 1fr 1fr'), gap: 16 }}>
                            <div>
                                <label style={st.label}>Budget</label>
                                <input type="number" step="0.01" style={st.input} placeholder="0.00"
                                    value={amount} onChange={(e) => setAmount(e.target.value)} required />
                            </div>
                            <div>
                                <label style={st.label}>Asset</label>
                                <select style={st.select} value={selectedToken.symbol}
                                    onChange={(e) => setSelectedToken(SUPPORTED_TOKENS.find(t => t.symbol === e.target.value))}>
                                    {SUPPORTED_TOKENS.map(t => <option key={t.symbol}>{t.symbol}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={st.label}>Duration (days)</label>
                                <input type="number" style={st.input} placeholder="7"
                                    value={durationDays} onChange={(e) => setDurationDays(e.target.value)} required />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Yield Strategy */}
                <div className="card create-job-section" style={{ ...st.card, opacity: 0, transform: 'translateY(20px)' }}>
                    <div style={{ padding: 20, borderRadius: 14, background: 'rgba(52,211,153,0.03)', border: '1px solid rgba(52,211,153,0.1)', marginBottom: 24 }}>
                        <div style={st.sectionTitle}>
                            <Cpu size={16} style={{ color: 'var(--success)' }} />
                            <span style={{ ...st.sectionLabel, color: 'var(--success)' }}>Yield Strategy</span>
                        </div>
                        <div style={st.row('1fr 1fr')}>
                            <select style={st.select} value={yieldStrategy} onChange={(e) => setYieldStrategy(Number(e.target.value))}>
                                <option value={0}>Standard (No Yield)</option>
                                <option value={1}>Aave V3 (MATIC Optimizer)</option>
                                <option value={2}>Compound (USDC Yield)</option>
                            </select>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                <Info size={14} /> Funds earn interest until released to freelancer.
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Milestones */}
                <div className="card create-job-section" style={{ ...st.card, opacity: 0, transform: 'translateY(20px)' }}>
                    <div style={st.section}>
                        <div style={st.sectionTitle}>
                            <Target size={16} style={{ color: 'var(--accent-light)' }} />
                            <span style={st.sectionLabel}>Milestones</span>
                        </div>
                        {milestones.map((m, i) => (
                            <div key={i} style={{ ...st.row('120px 1fr 40px'), marginBottom: 10 }}>
                                <input type="number" style={st.input} placeholder="Amount" value={m.amount} onChange={(e) => handleMilestoneChange(i, 'amount', e.target.value)} />
                                <input type="text" style={st.input} placeholder="Description" value={m.description} onChange={(e) => handleMilestoneChange(i, 'description', e.target.value)} />
                                <button type="button" onClick={() => handleRemoveMilestone(i)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={18} /></button>
                            </div>
                        ))}
                        <button type="button" onClick={handleAddMilestone} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--accent-light)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
                            <Plus size={14} /> Add Milestone
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="create-job-section" style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', opacity: 0, transform: 'translateY(20px)' }}>
                    <button type="submit" disabled={isPending || isProcessingGasless} className="btn btn-primary" style={{ flex: 1, height: 48, borderRadius: 12, justifyContent: 'center' }}>
                        {isPending || isProcessingGasless ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} /> Post Escrow</>}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CreateJob;
