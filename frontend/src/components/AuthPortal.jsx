import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Wallet, ShieldCheck, Globe, Zap, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import './AuthPortal.css';

const AuthPortal = ({ actuateOnSocialLoginIntent, isLoggingIn }) => {
    const { openConnectModal } = useConnectModal();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
    };

    return (
        <div className="auth-portal-container">
            {/* Background Layers */}
            <div className="auth-bg-orb orb-1" />
            <div className="auth-bg-orb orb-2" />
            <div className="auth-mesh-grid" />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="auth-content-wrap"
            >
                {/* ── Left: Branding ── */}
                <div className="auth-brand-section">
                    <motion.div variants={itemVariants} className="auth-badge">
                        <Sparkles size={14} />
                        <span className="auth-badge-text">Sovereign Coordination Protocol</span>
                    </motion.div>

                    <motion.h1 variants={itemVariants} className="auth-hero-title">
                        Your Work,<br />
                        <span className="title-shimmer">Your Destiny.</span>
                    </motion.h1>

                    <motion.p variants={itemVariants} className="auth-hero-desc">
                        PolyLance Zenith is the trustless layer for professional coordination. 
                        No intermediaries, no friction, just sovereign smart contracts.
                    </motion.p>

                    <motion.div variants={itemVariants} className="auth-features-bento">
                        <div className="auth-feature-card">
                            <div className="feature-card-icon">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <div className="feature-card-label">Security</div>
                                <div className="feature-card-value">On-chain Escrow</div>
                            </div>
                        </div>
                        <div className="auth-feature-card">
                            <div className="feature-card-icon">
                                <Globe size={20} />
                            </div>
                            <div>
                                <div className="feature-card-label">Network</div>
                                <div className="feature-card-value">Polygon Zenith Mesh</div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ── Right: Auth Card ── */}
                <motion.div variants={itemVariants} className="protocol-gateway-card">
                    <div className="gateway-glow" />

                    <div className="gateway-header">
                        <h3 className="gateway-title">Protocol Gateway</h3>
                        <p className="gateway-subtitle">Synchronize your identity with the mesh.</p>
                    </div>

                    <div className="auth-actions-group">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={actuateOnSocialLoginIntent}
                            disabled={isLoggingIn}
                            className="gateway-btn primary"
                        >
                            <span className="recommended-tag">OPTIMIZED</span>
                            <div className="btn-icon-box">
                                {isLoggingIn ? (
                                    <Loader2 size={24} className="animate-spin" />
                                ) : (
                                    <Mail size={24} />
                                )}
                            </div>
                            <div className="btn-content">
                                <span className="btn-label">Social Induction</span>
                                <span className="btn-subtext">Google · Email · X · Gasless</span>
                            </div>
                            <ArrowRight size={16} className="opacity-20" />
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={openConnectModal}
                            className="gateway-btn"
                        >
                            <div className="btn-icon-box">
                                <Wallet size={24} />
                            </div>
                            <div className="btn-content">
                                <span className="btn-label">Web3 Sync</span>
                                <span className="btn-subtext">MetaMask · WalletConnect · Ledger</span>
                            </div>
                            <ArrowRight size={16} className="opacity-20" />
                        </motion.button>
                    </div>

                    <div className="gateway-footer">
                        <div className="gasless-banner">
                            <Zap size={16} style={{ color: '#fbbf24', flexShrink: 0 }} />
                            <span className="banner-text">
                                <strong>High-Performance UX:</strong> Account Abstraction enabled. New entities receive a gas stipend upon induction.
                            </span>
                        </div>
                        <div className="network-status">
                            <div className="status-indicator" />
                            <span className="status-label">Polygon Amoy Testnet • v2.1.0-zenith</span>
                        </div>
                        <p className="secured-by">Secured by Biconomy & XMTP V3</p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default AuthPortal;
