import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, FileText, Send, X, ShieldCheck, Link, Code, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { CONTRACT_ADDRESS } from '../constants';
import StorageService from '../services/StorageService';

const ProofOfWorkModal = ({ isOpen, onClose, jobId, onSubmitted }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [externalLink, setExternalLink] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const { data: hash, writeContract, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    /// @notice Actuates a verifiable proof submission by anchoring work-evidence to a sovereign CID.
    /// @dev This constitutes "Work-Done" signal in the protocol, clearing the path for milestone actuation.
    const actuateProofSubmissionIntent = async () => {
        if (!title.trim() || !description.trim()) {
            toast.warn("Verifiable Intent Incomplete: Title and Summary required.");
            return;
        }

        setIsUploading(true);
        try {
            // 1. Pack PoW Metadata: Capturing the "Proof of Effort" for the immutable record.
            const powMetadata = {
                title,
                description,
                externalLink,
                type: 'ProofOfWork',
                timestamp: Date.now(),
                version: '1.0'
            };

            // 2. Upload to IPFS: Anchoring the evidence outside the reach of centralized friction.
            const { cid } = await StorageService.uploadMetadata(powMetadata);

            // 3. Submit to Blockchain: Notifying the EVM state via the resilient transport layer.
            writeContract({
                address: CONTRACT_ADDRESS,
                abi: FreelanceEscrowABI.abi,
                functionName: 'submitWork',
                args: [BigInt(jobId), cid],
                gas: 1000000n // Directive 02: Simulation Bypass for Functional Finality
            });

        } catch (err) {
            console.error('[GRAVITY] PoW Submission failed:', err);
            toast.error("Evidence synchronization neutralized. Check network health.");
        } finally {
            setIsUploading(false);
        }
    };

    React.useEffect(() => {
        if (isSuccess) {
            toast.success("Work submitted successfully! The client has been notified. 🚀");
            if (onSubmitted) onSubmitted();
            onClose();
        }
    }, [isSuccess]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div style={styles.overlay}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 30 }}
                    style={styles.modal}
                >
                    <header style={styles.header}>
                        <div style={styles.headerLeft}>
                            <div style={styles.iconBox}>
                                <Rocket size={22} color="var(--accent-light)" />
                            </div>
                            <div>
                                <h3 style={styles.title}>Submit Proof of Work</h3>
                                <p style={styles.subtitle}>GIG #{jobId} | Verified Evidence Submission</p>
                            </div>
                        </div>
                        <button onClick={onClose} style={styles.closeBtn}>
                            <X size={20} />
                        </button>
                    </header>

                    <div style={styles.content}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Deliverable Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Completed Social Media Dashboard"
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Work Summary</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the main features or work completed. Mention any important notes for the client."
                                style={styles.textarea}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>External Link (GitHub, Figma, Google Drive etc.)</label>
                            <div style={styles.linkInputWrap}>
                                <Link size={16} style={styles.linkIcon} />
                                <input
                                    type="text"
                                    value={externalLink}
                                    onChange={(e) => setExternalLink(e.target.value)}
                                    placeholder="https://github.com/my-project..."
                                    style={styles.inputWithIcon}
                                />
                            </div>
                        </div>

                        <div style={styles.infoBox}>
                            <ShieldCheck size={18} color="var(--accent-light)" />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <span style={{ fontWeight: 700, fontSize: '0.72rem' }}>On-chain submission active</span>
                                <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>This will notify the client to review your work and release the payment milestone.</span>
                            </div>
                        </div>
                    </div>

                    <footer style={styles.footer}>
                        <button onClick={onClose} style={styles.btnCancel}>Discard</button>
                        <button
                            onClick={actuateProofSubmissionIntent}
                            disabled={isUploading || isPending || isConfirming}
                            className="btn btn-primary"
                            style={styles.btnSubmit}
                        >
                            {(isUploading || isPending || isConfirming) ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    {isUploading ? 'Pinning to IPFS...' : isPending ? 'Waiting for Sign...' : 'Confirming...'}
                                </>
                            ) : (
                                <>
                                    <Send size={16} /> Submit Proof of Work
                                </>
                            )}
                        </button>
                    </footer>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const styles = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(1, 2, 4, 0.9)', backdropFilter: 'blur(12px)',
        zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24
    },
    modal: {
        width: '100%', maxWidth: 540, background: 'var(--bg-surface)',
        border: '1px solid var(--border-strong)', borderRadius: 28,
        boxShadow: '0 32px 64px rgba(0,0,0,0.6)', overflow: 'hidden',
        position: 'relative'
    },
    header: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '28px 32px', borderBottom: '1px solid var(--border)'
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: 18 },
    iconBox: {
        width: 48, height: 48, borderRadius: 16,
        background: 'rgba(45, 212, 191, 0.08)',
        border: '1px solid var(--accent-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 20px var(--accent-glow)'
    },
    title: { fontSize: '1.25rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' },
    subtitle: { fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: 0, marginTop: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' },
    closeBtn: {
        background: 'transparent', border: 'none', color: 'var(--text-tertiary)',
        cursor: 'pointer', padding: 6, borderRadius: 10, transition: 'all 0.2s',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
    },
    content: { padding: '32px' },
    label: {
        display: 'block', fontSize: '0.68rem', fontWeight: 800,
        color: 'var(--text-tertiary)', textTransform: 'uppercase',
        letterSpacing: '0.1em', marginBottom: 10
    },
    inputGroup: { marginBottom: 24 },
    input: {
        width: '100%', padding: '14px 18px', borderRadius: 12,
        border: '1px solid var(--border)', background: 'var(--bg-input)',
        color: 'var(--text-primary)', fontSize: '0.92rem', outline: 'none',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    inputWithIcon: {
        width: '100%', padding: '14px 18px 14px 44px', borderRadius: 12,
        border: '1px solid var(--border)', background: 'var(--bg-input)',
        color: 'var(--text-primary)', fontSize: '0.92rem', outline: 'none'
    },
    linkInputWrap: { position: 'relative' },
    linkIcon: { position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' },
    textarea: {
        width: '100%', minHeight: 140, background: 'var(--bg-input)',
        border: '1px solid var(--border)', borderRadius: 14,
        padding: 18, color: 'var(--text-primary)', fontSize: '0.92rem',
        outline: 'none', transition: 'border-color 0.2s', resize: 'vertical',
        lineHeight: 1.6
    },
    infoBox: {
        marginTop: 8, padding: '16px 20px', borderRadius: 16,
        background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)',
        color: 'var(--text-primary)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 14
    },
    footer: {
        padding: '24px 32px', background: 'rgba(255,255,255,0.01)',
        borderTop: '1px solid var(--border)', display: 'flex', gap: 14,
        justifyContent: 'flex-end'
    },
    btnCancel: {
        padding: '12px 24px', borderRadius: 12, border: '1px solid var(--border-strong)',
        background: 'transparent', color: 'var(--text-secondary)',
        fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer',
        transition: 'all 0.2s'
    },
    btnSubmit: {
        padding: '12px 28px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8,
        fontWeight: 800, fontSize: '0.88rem'
    }
};

export default ProofOfWorkModal;
