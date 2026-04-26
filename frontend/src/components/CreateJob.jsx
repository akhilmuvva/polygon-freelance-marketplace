import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAccount, useWalletClient, useWriteContract } from 'wagmi';
import { parseUnits } from 'viem';
import { toast as hotToast } from 'react-hot-toast';
import { 
  Loader2, Rocket, Shield, Clock, DollarSign, Briefcase, 
  Cpu, Zap, Plus, Hash, Terminal, Box, ChevronRight,
  Eye, FileText, Activity
} from 'lucide-react';
import { SUPPORTED_TOKENS, CONTRACT_ADDRESS } from '../constants';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { createJobGasless } from '../utils/biconomy';
import StorageService from '../services/StorageService';
import './CreateJob.css';

const CreateJob = ({ onJobCreated, gasless, smartAccount: propSmartAccount }) => {
    const { address: activeAddress, isConnected } = useAccount();
    const { writeContract, isPending } = useWriteContract();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Development');
    const [durationDays, setDurationDays] = useState('30');
    const [freelancer, setFreelancer] = useState('');
    const [selectedToken, setSelectedToken] = useState(SUPPORTED_TOKENS[0]);
    const [milestones, setMilestones] = useState([{ amount: '', description: 'Initial Milestone' }]);
    const [isProcessingGasless, setIsProcessingGasless] = useState(false);

    const addMilestone = () => setMilestones([...milestones, { amount: '', description: '' }]);
    const updateMilestone = (index, field, value) => {
        const newMilestones = [...milestones];
        newMilestones[index][field] = value;
        setMilestones(newMilestones);
    };

    const handleCreateJob = async () => {
        if (!isConnected) {
            hotToast.error('Identity required. Connect wallet to proceed.');
            return;
        }

        if (!amount || !title) {
            hotToast.error('Critical parameters missing: Title and Budget required.');
            return;
        }

        setIsProcessingGasless(true); 

        try {
            const rawAmount = parseUnits(amount || "0", selectedToken.decimals);
            
            const metadata = {
                title,
                description,
                category,
                client: activeAddress, 
                freelancer: freelancer || "Unassigned", 
                amount: amount.toString(), 
                token: selectedToken.symbol,
                status: freelancer ? 'Created' : 'Pending Intent', 
                milestones: milestones.map(m => ({ 
                    amount: m.amount, 
                    description: m.description 
                })), 
                timestamp: Date.now() 
            };

            const { cid } = await StorageService.uploadMetadata(metadata);
            
            const resolvedFreelancer = (freelancer && freelancer.startsWith('0x') && freelancer.length === 42)
                ? freelancer
                : '0x0000000000000000000000000000000000000000';

            const categoryMap = { 'Development': 1n, 'Design': 2n, 'Marketing': 3n, 'Writing': 4n };
            const resolvedCategoryId = categoryMap[category] || 1n;
            const deadline = Math.floor(Date.now() / 1000) + (Number(durationDays) * 86400);

            const params = {
                categoryId: resolvedCategoryId,
                freelancer: resolvedFreelancer,
                token: selectedToken.address,
                amount: rawAmount,
                ipfsHash: cid, 
                deadline: BigInt(deadline),
                mAmounts: milestones.filter(m => m.amount).map(m => parseUnits(m.amount, selectedToken.decimals)),
                mHashes: milestones.filter(m => m.amount).map(m => m.description || ""),
                mIsUpfront: milestones.filter(m => m.amount).map(() => false),
                yieldStrategy: 0n,
                paymentToken: selectedToken.address,
                paymentAmount: rawAmount,
                minAmountOut: 0n
            };

            if (gasless && propSmartAccount) {
                const res = await createJobGasless(propSmartAccount, CONTRACT_ADDRESS, FreelanceEscrowABI.abi, params);
                if (res) {
                    hotToast.success('Protocol Initialized Gaslessly');
                    onJobCreated?.();
                }
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
            
            hotToast.success('Broadcast sequence initiated.');
        } catch (err) {
            console.error('[GRAVITY] Actuation failure:', err);
            hotToast.error("Actuation sequence failed.");
        } finally {
            setIsProcessingGasless(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1, 
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
    };

    return (
        <motion.div 
            className="mission-control-container"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <div className="mission-grid">
                {/* --- Left Column: Configuration --- */}
                <div className="config-pane">
                    <motion.header className="pane-header" variants={itemVariants}>
                        <div className="status-orb pulse"></div>
                        <h2 className="pane-title">Initiate Mission</h2>
                        <p className="pane-subtitle">Configure sovereign work protocol parameters.</p>
                    </motion.header>

                    <div className="config-form">
                        <motion.div className="input-row" variants={itemVariants}>
                            <div className="input-group full">
                                <label><Hash size={14} /> Mission Identifier</label>
                                <input 
                                    placeholder="e.g. Protocol Interface Overhaul" 
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                        </motion.div>

                        <motion.div className="input-row" variants={itemVariants}>
                            <div className="input-group">
                                <label><Cpu size={14} /> Domain</label>
                                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                                    <option>Development</option>
                                    <option>Design</option>
                                    <option>Marketing</option>
                                    <option>Writing</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label><Clock size={14} /> Duration (Days)</label>
                                <input 
                                    type="number" 
                                    value={durationDays}
                                    onChange={(e) => setDurationDays(e.target.value)}
                                />
                            </div>
                        </motion.div>

                        <motion.div className="input-group full" variants={itemVariants}>
                            <label><FileText size={14} /> Mission Parameters</label>
                            <textarea 
                                placeholder="Outline objectives and success criteria..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </motion.div>

                        <motion.div className="input-row" variants={itemVariants}>
                            <div className="input-group">
                                <label><DollarSign size={14} /> Economic Weight</label>
                                <input 
                                    placeholder="0.00" 
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>
                            <div className="input-group">
                                <label><Box size={14} /> Asset Type</label>
                                <select 
                                    value={selectedToken.symbol}
                                    onChange={(e) => setSelectedToken(SUPPORTED_TOKENS.find(t => t.symbol === e.target.value))}
                                >
                                    {SUPPORTED_TOKENS.map(t => <option key={t.symbol}>{t.symbol}</option>)}
                                </select>
                            </div>
                        </motion.div>

                        <motion.div className="input-group full" variants={itemVariants}>
                            <label><Shield size={14} /> Designated Specialist (Optional)</label>
                            <input 
                                placeholder="0x... (Leave empty for open marketplace)" 
                                value={freelancer}
                                onChange={(e) => setFreelancer(e.target.value)}
                            />
                        </motion.div>

                        <motion.div className="milestone-section" variants={itemVariants}>
                            <div className="section-header">
                                <label><Activity size={14} /> Settlement Milestones</label>
                                <button className="add-milestone-btn" onClick={addMilestone}>
                                    <Plus size={14} /> Add
                                </button>
                            </div>
                            {milestones.map((m, idx) => (
                                <div key={idx} className="milestone-row">
                                    <input 
                                        className="m-desc" 
                                        placeholder="Deliverable..." 
                                        value={m.description}
                                        onChange={(e) => updateMilestone(idx, 'description', e.target.value)}
                                    />
                                    <input 
                                        className="m-amt" 
                                        placeholder="Amt" 
                                        value={m.amount}
                                        onChange={(e) => updateMilestone(idx, 'amount', e.target.value)}
                                    />
                                </div>
                            ))}
                        </motion.div>

                        <motion.button 
                            className="btn-initiate"
                            variants={itemVariants}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleCreateJob}
                            disabled={isPending || isProcessingGasless}
                        >
                            {isPending || isProcessingGasless ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <>
                                    <Rocket size={18} />
                                    <span>Deploy Protocol</span>
                                </>
                            )}
                        </motion.button>
                    </div>
                </div>

                {/* --- Right Column: Preview --- */}
                <div className="preview-pane">
                    <motion.div className="browser-frame" variants={itemVariants}>
                        <div className="browser-header">
                            <div className="dot red"></div>
                            <div className="dot yellow"></div>
                            <div className="dot green"></div>
                            <div className="browser-address">polylance.zenith/protocol/preview</div>
                        </div>
                        <div className="browser-content">
                            <div className="preview-hero">
                                <span className="preview-category">{category}</span>
                                <h1 className="preview-title">{title || "Untitled Mission"}</h1>
                                <div className="preview-budget">
                                    {amount || "0"} {selectedToken.symbol}
                                </div>
                            </div>
                            
                            <div className="preview-details">
                                <div className="preview-card">
                                    <label>Specialist</label>
                                    <div className="value truncate">{freelancer || "Open Access"}</div>
                                </div>
                                <div className="preview-card">
                                    <label>Timeline</label>
                                    <div className="value">{durationDays} Days</div>
                                </div>
                            </div>

                            <div className="preview-milestones">
                                <label>Protocol Settlement Layers</label>
                                {milestones.map((m, i) => (
                                    <div key={i} className="preview-m-item">
                                        <div className="m-idx">{i + 1}</div>
                                        <div className="m-info">
                                            <div className="m-label">{m.description || "Deliverable"}</div>
                                            <div className="m-val">{m.amount || "0"} {selectedToken.symbol}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="preview-terminal">
                                <div className="term-line">&gt; INITIALIZING ACTUATION SEQUENCE...</div>
                                <div className="term-line">&gt; NETWORK: POLYGON AMOY</div>
                                <div className="term-line">&gt; IPFS METADATA: READY</div>
                                <div className="term-line anim">&gt; AWAITING SIGNATURE...</div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div className="preview-telemetry" variants={itemVariants}>
                        <div className="telemetry-item">
                            <span className="tel-label">Network Fee</span>
                            <span className="tel-val">{gasless ? '0.00 MATIC' : 'Estimate...'}</span>
                        </div>
                        <div className="telemetry-item">
                            <span className="tel-label">Security Protocol</span>
                            <span className="tel-val">UUPS Proxy v2</span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default CreateJob;

