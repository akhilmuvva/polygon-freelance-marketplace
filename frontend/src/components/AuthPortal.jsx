import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Wallet, ShieldCheck, Globe, Zap, Cpu, Sparkles } from 'lucide-react';
import { useConnectModal } from '@rainbow-me/rainbowkit';

const st = {
    page: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '80vh', padding: '40px 20px',
    },
    wrap: { maxWidth: 960, width: '100%' },
    grid: {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 60,
        alignItems: 'center',
    },
    // Left column
    badge: {
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 14px', borderRadius: 20,
        background: 'rgba(124,92,252,0.08)',
        border: '1px solid rgba(124,92,252,0.18)',
        marginBottom: 28,
    },
    badgeText: {
        fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: '0.12em', color: 'var(--accent-light)',
    },
    heading: {
        fontSize: '3.2rem', fontWeight: 900, lineHeight: 1,
        letterSpacing: '-0.04em', marginBottom: 20, color: '#fff',
    },
    headingAccent: {
        background: 'linear-gradient(135deg, var(--accent-light), var(--accent))',
        WebkitBackgroundClip: 'text', backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    desc: {
        fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.7,
        maxWidth: 420, marginBottom: 32,
    },
    features: {
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20,
    },
    featureItem: {
        display: 'flex', alignItems: 'center', gap: 12,
    },
    featureIcon: {
        width: 44, height: 44, borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },
    featureLabel: {
        fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 2,
    },
    featureValue: {
        fontSize: '0.85rem', fontWeight: 700, color: '#fff',
    },
    // Right column — auth card
    authCard: {
        background: 'linear-gradient(145deg, #111128, #0d0d22)',
        border: '1px solid var(--border)',
        borderRadius: 20, padding: 36, position: 'relative', overflow: 'hidden',
    },
    authGlow: {
        position: 'absolute', top: -60, right: -60, width: 180, height: 180,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,92,252,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
    },
    authTitle: {
        fontSize: '1.5rem', fontWeight: 800, marginBottom: 6,
        letterSpacing: '-0.02em', color: '#fff',
    },
    authSub: {
        fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 28,
    },
    btnGroup: {
        display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28,
    },
    authBtn: (accent) => ({
        display: 'flex', alignItems: 'center', gap: 14, width: '100%',
        padding: '16px 20px', borderRadius: 14,
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${accent === 'purple' ? 'rgba(124,92,252,0.15)' : 'rgba(236,72,153,0.15)'}`,
        cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left',
        color: '#fff', position: 'relative', overflow: 'hidden',
    }),
    authBtnIcon: (accent) => ({
        width: 44, height: 44, borderRadius: 12,
        background: accent === 'purple'
            ? 'linear-gradient(135deg, rgba(124,92,252,0.2), rgba(124,92,252,0.05))'
            : 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(236,72,153,0.05))',
        border: `1px solid ${accent === 'purple' ? 'rgba(124,92,252,0.2)' : 'rgba(236,72,153,0.2)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    }),
    authBtnTitle: {
        fontSize: '0.85rem', fontWeight: 700, marginBottom: 2, color: '#fff',
    },
    authBtnSub: {
        fontSize: '0.68rem', color: 'var(--text-tertiary)',
    },
    authFooter: {
        borderTop: '1px solid var(--border)', paddingTop: 20,
        textAlign: 'center',
    },
    statusRow: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 6, marginBottom: 8,
    },
    statusDot: {
        width: 6, height: 6, borderRadius: '50%', background: '#34d399',
        boxShadow: '0 0 8px rgba(52,211,153,0.5)',
    },
    statusText: {
        fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.08em', color: 'var(--text-tertiary)',
    },
    securedBy: {
        fontSize: '0.62rem', color: 'var(--text-tertiary)', opacity: 0.5,
    },
};

const AuthPortal = ({ onSocialLogin, isLoggingIn }) => {
    const { openConnectModal } = useConnectModal();

    return (
        <div style={st.page}>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={st.wrap}
            >
                <div style={st.grid}>
                    {/* ── Left: Branding ── */}
                    <div>
                        <div style={st.badge}>
                            <Sparkles size={13} style={{ color: 'var(--accent-light)' }} />
                            <span style={st.badgeText}>PolyLance Protocol</span>
                        </div>

                        <h1 style={st.heading}>
                            The Freelance<br />
                            <span style={st.headingAccent}>Marketplace</span><br />
                            for Web3.
                        </h1>

                        <p style={st.desc}>
                            Connect your wallet to access decentralized escrow, on-chain reputation, and global cross-chain payments.
                        </p>

                        <div style={st.features}>
                            <div style={st.featureItem}>
                                <div style={{ ...st.featureIcon, background: 'rgba(124,92,252,0.08)', border: '1px solid rgba(124,92,252,0.12)' }}>
                                    <ShieldCheck size={20} style={{ color: 'var(--accent-light)' }} />
                                </div>
                                <div>
                                    <div style={st.featureLabel}>Security</div>
                                    <div style={st.featureValue}>On-chain Escrow</div>
                                </div>
                            </div>
                            <div style={st.featureItem}>
                                <div style={{ ...st.featureIcon, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.12)' }}>
                                    <Globe size={20} style={{ color: 'var(--success)' }} />
                                </div>
                                <div>
                                    <div style={st.featureLabel}>Network</div>
                                    <div style={st.featureValue}>Multi-Chain</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Right: Auth Card ── */}
                    <div style={st.authCard}>
                        <div style={st.authGlow} />

                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <h3 style={st.authTitle}>Seamless Access</h3>
                            <p style={st.authSub}>Experience the hyper-structure with zero friction.</p>

                            <div style={st.btnGroup}>
                                <motion.button
                                    whileHover={{ scale: 1.01, y: -2 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={onSocialLogin}
                                    disabled={isLoggingIn}
                                    aria-label="Login with Google, Email, or X"
                                    aria-busy={isLoggingIn}
                                    style={st.authBtn('purple')}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,92,252,0.45)'; e.currentTarget.style.background = 'rgba(124,92,252,0.08)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(124,92,252,0.15)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                                >
                                    <div style={st.authBtnIcon('purple')} aria-hidden="true">
                                        {isLoggingIn
                                            ? <div className="loading-spinner" role="status" style={{ width: 22, height: 22, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}>
                                                <span style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>Loading...</span>
                                            </div>
                                            : <Mail size={20} style={{ color: 'var(--accent-light)' }} />
                                        }
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={st.authBtnTitle}>Google / Email / X</div>
                                            <span style={{ fontSize: '0.55rem', fontWeight: 900, background: 'var(--success)', color: '#000', padding: '2px 6px', borderRadius: 4 }}>RECOMMENDED</span>
                                        </div>
                                        <div style={st.authBtnSub}>Instant Smart Wallet · Zero Gas Fees</div>
                                    </div>
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.01, y: -2 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={openConnectModal}
                                    aria-label="Connect traditional Web3 wallet"
                                    style={st.authBtn('pink')}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(236,72,153,0.45)'; e.currentTarget.style.background = 'rgba(236,72,153,0.08)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(236,72,153,0.15)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                                >
                                    <div style={st.authBtnIcon('pink')} aria-hidden="true">
                                        <Wallet size={20} style={{ color: '#ec4899' }} />
                                    </div>
                                    <div>
                                        <div style={st.authBtnTitle}>Web3 Foundation</div>
                                        <div style={st.authBtnSub}>MetaMask · WalletConnect · Ledger</div>
                                    </div>
                                </motion.button>
                            </div>

                            <div style={st.authFooter}>
                                <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Zap size={14} style={{ color: 'var(--warning)', fill: 'var(--warning)' }} />
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textAlign: 'left', lineHeight: 1.4 }}>
                                        <strong>Gasless Mode:</strong> New users get 10 free transactions upon account activation.
                                    </span>
                                </div>
                                <div style={st.statusRow}>
                                    <div style={st.statusDot} />
                                    <span style={st.statusText}>Network: Polygon Amoy</span>
                                </div>
                                <p style={st.securedBy}>Secured by Chainlink & Biconomy</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AuthPortal;
