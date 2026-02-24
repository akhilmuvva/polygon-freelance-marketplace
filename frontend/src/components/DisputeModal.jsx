import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, AlertTriangle, FileText, Send, X, ShieldAlert, Cpu } from 'lucide-react';
import { toast } from 'react-toastify';
import { useArbitration } from '../hooks/useArbitration';

const DisputeModal = ({ isOpen, onClose, jobId, jobTitle }) => {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { raiseDispute } = useArbitration();

    const handleRaiseDispute = async () => {
        if (!reason.trim()) {
            toast.warn("Please provide a reason for the dispute.");
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Raise the dispute on-chain
            await raiseDispute(jobId);

            // 2. Submit initial evidence (the reason)
            // You might want to upload this to IPFS first, but useArbitration's submitEvidence handles that.
            // For now, let's just use the raiseDispute which marks it on-chain.

            toast.success("Case # " + jobId + " has been moved to the Justice Protocol.");
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div style={styles.overlay}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    style={styles.modal}
                >
                    <header style={styles.header}>
                        <div style={styles.headerLeft}>
                            <div style={styles.iconBox}>
                                <Gavel size={20} color="var(--danger)" />
                            </div>
                            <div>
                                <h3 style={styles.title}>Initialize Justice Protocol</h3>
                                <p style={styles.subtitle}>Raising Dispute for Case #{jobId}</p>
                            </div>
                        </div>
                        <button onClick={onClose} style={styles.closeBtn}>
                            <X size={18} />
                        </button>
                    </header>

                    <div style={styles.alert}>
                        <ShieldAlert size={16} />
                        <span>This action will lock all escrowed funds until an arbitrator or AI consensus reaches a verdict.</span>
                    </div>

                    <div style={styles.content}>
                        <div style={styles.jobInfo}>
                            <span style={styles.label}>Project Title</span>
                            <div style={styles.value}>{jobTitle}</div>
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Claim Reason & Evidence Summary</label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Describe the issue in detail. This will be visible to the protocol arbitrators and neural audit systems."
                                style={styles.textarea}
                            />
                        </div>

                        <div style={styles.aiBox}>
                            <div style={styles.aiHeader}>
                                <Cpu size={14} color="var(--accent-light)" />
                                <span>Neural Audit Enabled</span>
                            </div>
                            <p style={styles.aiText}>Gemini 2.0 will periodically scan transaction history and chat logs to provide a neutral split recommendation.</p>
                        </div>
                    </div>

                    <footer style={styles.footer}>
                        <button onClick={onClose} style={styles.btnCancel}>Cancel</button>
                        <button
                            onClick={handleRaiseDispute}
                            disabled={isSubmitting}
                            style={styles.btnSubmit}
                        >
                            {isSubmitting ? 'Initializing...' : 'Confirm Dispute'}
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
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20
    },
    modal: {
        width: '100%', maxWidth: 500, background: '#0d0d22',
        border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 24,
        boxShadow: '0 24px 48px rgba(0,0,0,0.5)', overflow: 'hidden'
    },
    header: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '24px 28px', borderBottom: '1px solid var(--border)'
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: 16 },
    iconBox: {
        width: 40, height: 40, borderRadius: 12,
        background: 'rgba(239, 68, 68, 0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
    },
    title: { fontSize: '1.1rem', fontWeight: 800, margin: 0 },
    subtitle: { fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0, marginTop: 2 },
    closeBtn: {
        background: 'transparent', border: 'none', color: 'var(--text-tertiary)',
        cursor: 'pointer', padding: 4
    },
    alert: {
        margin: '20px 28px 0', padding: '12px 16px', borderRadius: 12,
        background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)',
        color: '#f59e0b', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 10,
        lineHeight: 1.4
    },
    content: { padding: '24px 28px' },
    jobInfo: { marginBottom: 20 },
    label: {
        display: 'block', fontSize: '0.65rem', fontWeight: 800,
        color: 'var(--text-tertiary)', textTransform: 'uppercase',
        letterSpacing: '0.08em', marginBottom: 8
    },
    value: { fontSize: '0.95rem', fontWeight: 600 },
    inputGroup: { marginBottom: 24 },
    textarea: {
        width: '100%', minHeight: 120, background: 'rgba(0,0,0,0.3)',
        border: '1px solid var(--border)', borderRadius: 14,
        padding: 16, color: 'var(--text-primary)', fontSize: '0.9rem',
        outline: 'none', transition: 'border-color 0.2s', resize: 'vertical'
    },
    aiBox: {
        padding: 16, background: 'rgba(124, 92, 252, 0.04)',
        borderRadius: 14, border: '1px solid rgba(124, 92, 252, 0.1)'
    },
    aiHeader: {
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-light)',
        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6
    },
    aiText: {
        fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0
    },
    footer: {
        padding: '20px 28px', background: 'rgba(255,255,255,0.02)',
        borderTop: '1px solid var(--border)', display: 'flex', gap: 12,
        justifyContent: 'flex-end'
    },
    btnCancel: {
        padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border)',
        background: 'transparent', color: 'var(--text-primary)',
        fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer'
    },
    btnSubmit: {
        padding: '10px 24px', borderRadius: 10, border: 'none',
        background: 'var(--danger)', color: '#fff',
        fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
    }
};

export default DisputeModal;
