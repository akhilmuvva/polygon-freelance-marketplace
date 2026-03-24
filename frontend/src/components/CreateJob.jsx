import React, { useState } from 'react';
import { useAccount, useWalletClient, useWriteContract } from 'wagmi';
import { parseUnits } from 'viem';
import { toast as hotToast } from 'react-hot-toast';
import { Loader2, PlusCircle, Rocket, Shield, Clock, DollarSign, Briefcase } from 'lucide-react';
import { SUPPORTED_TOKENS, CONTRACT_ADDRESS } from '../constants';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { createJobGasless } from '../utils/biconomy';
import StorageService from '../services/StorageService';

const styles = {
    card: {
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '24px',
        border: '1px solid var(--border)',
        padding: '32px',
        position: 'relative',
        overflow: 'hidden'
    },
    label: {
        fontSize: '0.75rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--text-tertiary)',
        marginBottom: '10px',
        display: 'block'
    },
    input: {
        width: '100%',
        padding: '14px 18px',
        background: 'rgba(0,0,0,0.2)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        color: 'var(--text-primary)',
        fontSize: '0.95rem',
        marginBottom: '20px',
        outline: 'none',
        transition: 'border-color 0.2s'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px'
    }
};

const CreateJob = ({ onJobCreated, gasless, smartAccount: propSmartAccount }) => {
    const { address: activeAddress, isConnected } = useAccount();
    const { writeContract, isPending } = useWriteContract();
    const { data: walletClient } = useWalletClient();
    const [smartAccount, setSmartAccount] = useState(propSmartAccount || null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Development');
    const [durationDays, setDurationDays] = useState('30');
    const [freelancer, setFreelancer] = useState('');
    const [selectedToken, setSelectedToken] = useState(SUPPORTED_TOKENS[0]);
    const [milestones, setMilestones] = useState([{ amount: '', description: '' }]);
    const [yieldStrategy, setYieldStrategy] = useState(0); // 0 = Aave, 1 = Compound, etc
    const [isProcessingGasless, setIsProcessingGasless] = useState(false);

    const addMilestone = () => setMilestones([...milestones, { amount: '', description: '' }]);

    const handleCreateJob = async () => {
        if (!isConnected) {
            hotToast.error('Please connect your sovereign identity first.');
            return;
        }

        // Safety Verification: Ensure the actor has defined the economic parameters.
        if (!amount || !title) {
            hotToast.error('Incomplete Intent: Title and Budget required.');
            return;
        }

        setIsProcessingGasless(true); 

        try {
            const rawAmount = parseUnits(amount, selectedToken.decimals);
            let ipfshash = ''; // Changed ipfsHash to ipfshash

            // Pack job details
            const metadata = {
                title,
                description,
                category,
                client: address, // Changed activeAddress to address
                freelancer: freelancer || "Unassigned", // Changed default value
                amount: amount.toString(), // Changed from rawAmount
                token: selectedToken.symbol,
                status: freelancer ? 'Created' : 'Pending Intent', // This line was not in the snippet, keeping original logic
                milestones: milestones.map(m => ({ // This line was not in the snippet, keeping original logic
                    amount: m.amount, // This line was not in the snippet, keeping original logic
                    description: m.description // This line was not in the snippet, keeping original logic
                })), // This line was not in the snippet, keeping original logic
                timestamp: Date.now() // Added timestamp as per snippet
            };

            const { cid } = await StorageService.uploadMetadata(metadata);
            ipfshash = cid; // Changed ipfsHash to ipfshash
            
            const resolvedFreelancer = (freelancer && freelancer.startsWith('0x') && freelancer.length === 42)
                ? freelancer
                : '0x0000000000000000000000000000000000000000';

            const categoryMap = { 'Development': 1n, 'Design': 2n, 'Marketing': 3n, 'Writing': 4n };
            const resolvedCategoryId = categoryMap[category] || 1n;
            const deadline = Math.floor(Date.now() / 1000) + (Number(durationDays) * 86400);

            // Directive 14: Optimistic Intent Anchoring
            const optimisticJob = {
                id: `PENDING-${Date.now()}`,
                jobId: `PENDING-${Math.random().toString(36).substring(7).toUpperCase()}`,
                title,
                category,
                client: address, // Changed activeAddress to address
                freelancer: resolvedFreelancer,
                amount: rawAmount.toString(),
                token: selectedToken.symbol,
                status: '0', 
                deadline: deadline.toString(),
                ipfsHash: ipfshash, // Changed ipfsHash to ipfshash
                isOptimistic: true,
                createdAt: Math.floor(Date.now() / 1000).toString()
            };

            const existingIntents = JSON.parse(localStorage.getItem('zenith_pending_jobs') || '[]');
            localStorage.setItem('zenith_pending_jobs', JSON.stringify([optimisticJob, ...existingIntents]));
            
            hotToast.success('Data Anchored: Intent Broadcasted', { id: 'job-creation-success' });

            const params = {
                categoryId: resolvedCategoryId,
                freelancer: resolvedFreelancer,
                token: selectedToken.address,
                amount: rawAmount,
                ipfsHash: ipfshash, // Changed ipfsHash to ipfshash
                deadline: BigInt(deadline),
                mAmounts: milestones.filter(m => m.amount).map(m => parseUnits(m.amount, selectedToken.decimals)),
                mHashes: milestones.filter(m => m.amount).map(m => m.description || ""),
                mIsUpfront: milestones.filter(m => m.amount).map(() => false),
                yieldStrategy: yieldStrategy,
                paymentToken: selectedToken.address,
                paymentAmount: rawAmount,
                minAmountOut: 0n
            };

            if (gasless && smartAccount) {
                const res = await createJobGasless(smartAccount, CONTRACT_ADDRESS, FreelanceEscrowABI.abi, params);
                if (res) onJobCreated?.();
                return;
            }

            writeContract({
                address: CONTRACT_ADDRESS, 
                abi: FreelanceEscrowABI.abi, 
                functionName: 'createJob',
                args: [params],
                gas: 1000000n,
                value: selectedToken.address === '0x0000000000000000000000000000000000000000' ? rawAmount : 0n
            });
        } catch (err) {
            console.error('[GRAVITY] Actuation failure:', err);
            hotToast.error("Actuation sequence failed."); // Changed error message
        } finally {
            setIsProcessingGasless(false);
        }
    };

    return (
        <div style={styles.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                <PlusCircle color="var(--accent)" size={28} />
                <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Initialize Contract</h2>
            </div>

            <div style={styles.grid}>
                <div>
                    <label style={styles.label}>Contract Title</label>
                    <input 
                        style={styles.input} 
                        placeholder="e.g. Zenith Interface Development" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>
                <div>
                    <label style={styles.label}>Category</label>
                    <select 
                        style={styles.input} 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option>Development</option>
                        <option>Design</option>
                        <option>Marketing</option>
                        <option>Writing</option>
                    </select>
                </div>
            </div>

            <label style={styles.label}>Description & Requirements</label>
            <textarea 
                style={{ ...styles.input, height: '120px', resize: 'none' }} 
                placeholder="Detail the weightless deliverables..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />

            <div style={styles.grid}>
                <div>
                    <label style={styles.label}>Budget Amount</label>
                    <div style={{ position: 'relative' }}>
                        <DollarSign 
                            size={16} 
                            style={{ position: 'absolute', left: 14, top: 16, color: 'var(--text-tertiary)' }} 
                        />
                        <input 
                            style={{ ...styles.input, paddingLeft: 38 }} 
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label style={styles.label}>Payment Token</label>
                    <select 
                        style={styles.input}
                        value={selectedToken.symbol}
                        onChange={(e) => setSelectedToken(SUPPORTED_TOKENS.find(t => t.symbol === e.target.value))}
                    >
                        {SUPPORTED_TOKENS.map(t => <option key={t.symbol}>{t.symbol}</option>)}
                    </select>
                </div>
            </div>

            <div style={styles.grid}>
                <div>
                    <label style={styles.label}>Freelancer Address (Optional)</label>
                    <input 
                        style={styles.input} 
                        placeholder="0x..." 
                        value={freelancer}
                        onChange={(e) => setFreelancer(e.target.value)}
                    />
                </div>
                <div>
                    <label style={styles.label}>Duration (Days)</label>
                    <input 
                        style={styles.input} 
                        type="number"
                        value={durationDays}
                        onChange={(e) => setDurationDays(e.target.value)}
                    />
                </div>
            </div>

            <div style={{ marginTop: 20 }}>
                <button 
                    disabled={isPending || isProcessingGasless}
                    onClick={handleCreateJob}
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '16px', borderRadius: '14px', fontSize: '1rem' }}
                >
                    {isPending || isProcessingGasless ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <>
                            <Rocket size={18} style={{ marginRight: 8 }} />
                            Actuate Contract
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default CreateJob;
