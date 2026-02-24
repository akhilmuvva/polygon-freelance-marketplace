import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUp, FileText, Send, X, ShieldCheck, Link, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import { useArbitration } from '../hooks/useArbitration';

const EvidenceModal = ({ isOpen, onClose, jobId }) => {
    const [evidenceText, setEvidenceText] = useState('');
    const [evidenceLink, setEvidenceLink] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { submitEvidence } = useArbitration();

    const handleSubmit = async () => {
        if (!evidenceText.trim() && !evidenceLink.trim()) {
            toast.warn("Please provide some evidence description or a link.");
            return;
        }

        setIsSubmitting(true);
        try {
            const evidenceData = {
                jobId,
                timestamp: Date.now(),
                description: evidenceText,
                externalLink: evidenceLink,
                type: 'Manual Submission'
            };

            await submitEvidence(jobId, evidenceData);
            toast.success("Evidence secured on IPFS and linked to Case #" + jobId);
            setEvidenceText('');
            setEvidenceLink('');
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
                                <FileUp size={20} color="var(--accent-light)" />
                            </div>
                            <div>
                                <h3 style={styles.title}>Submit Evidence</h3>
                                <p style={styles.subtitle}>Case #{jobId} | On-chain Court</p>
                            </div>
                        </div>
                        <button onClick={onClose} style={styles.closeBtn}>
                            <X size={18} />
                        </button>
                    </header>

                    <div style={styles.content}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Detailed Description</label>
                            <textarea
                                value={evidenceText}
                                onChange={(e) => setEvidenceText(e.target.value)}
                                placeholder="Explain why this evidence supports your case. Be as specific as possible."
                                style={styles.textarea}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>External Media / Doc Link</label>
                            <div style={styles.linkInputWrap}>
                                <Link size={16} style={styles.linkIcon} />
                                <input
                                    type="text"
                                    value={evidenceLink}
                                    onChange={(e) => setEvidenceLink(e.target.value)}
                                    placeholder="IPFS Link, Google Doc, or GitHub Commit..."
                                    style={styles.input}
                                />
                            </div>
                        </div>

                        <div style={styles.infoBox}>
                            <ShieldCheck size={16} color="var(--success)" />
                            <span>This submission will be permanently recorded on the blockchain and IPFS.</span>
                        </div>
                    </div>

                    <footer style={styles.footer}>
                        <button onClick={onClose} style={styles.btnCancel}>Discard</button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            style={styles.btnSubmit}
                        >
                            {isSubmitting ? 'Securing...' : 'Submit Evidence'}
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
        border: '1px solid var(--border)', borderRadius: 24,
        boxShadow: '0 24px 48px rgba(0,0,0,0.5)', overflow: 'hidden'
    },
    header: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '24px 28px', borderBottom: '1px solid var(--border)'
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: 16 },
    iconBox: {
        width: 40, height: 40, borderRadius: 12,
        background: 'rgba(96, 165, 250, 0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
    },
    title: { fontSize: '1.1rem', fontWeight: 800, margin: 0 },
    subtitle: { fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0, marginTop: 2 },
    closeBtn: {
        background: 'transparent', border: 'none', color: 'var(--text-tertiary)',
        cursor: 'pointer', padding: 4
    },
    content: { padding: '24px 28px' },
    label: {
        display: 'block', fontSize: '0.65rem', fontWeight: 800,
        color: 'var(--text-tertiary)', textTransform: 'uppercase',
        letterSpacing: '0.08em', marginBottom: 8
    },
    inputGroup: { marginBottom: 20 },
    textarea: {
        width: '100%', minHeight: 120, background: 'rgba(0,0,0,0.3)',
        border: '1px solid var(--border)', borderRadius: 14,
        padding: 16, color: 'var(--text-primary)', fontSize: '0.9rem',
        outline: 'none', transition: 'border-color 0.2s', resize: 'vertical'
    },
    linkInputWrap: { position: 'relative' },
    linkIcon: { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' },
    input: {
        width: '100%', padding: '12px 14px 12px 40px', borderRadius: 10,
        border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)',
        color: 'var(--text-primary)', fontSize: '0.9rem'
    },
    infoBox: {
        marginTop: 24, padding: '12px 16px', borderRadius: 12,
        background: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.1)',
        color: 'var(--success)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 10
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
        background: 'var(--accent)', color: '#fff',
        fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(124, 92, 252, 0.3)'
    }
};

export default EvidenceModal;
