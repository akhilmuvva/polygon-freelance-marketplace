import React from 'react';
import { motion } from 'motion/react';
import { 
    Shield, Globe, Mail, Wallet, Zap, ShieldCheck, Sparkles, 
    ChevronRight, Fingerprint, Lock, Cpu, Star
} from 'lucide-react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import './LandingPage.css';

const LandingPage = ({ onSocialLogin, onBypass, isLoggingIn }) => {
    const { openConnectModal } = useConnectModal();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0, 
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
        }
    };

    return (
        <div className="landing-portal">
            <div className="neural-background">
                <div className="neural-grid" />
            </div>

            {/* Navigation */}
            <nav className="landing-nav">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="landing-logo"
                >
                    <span>POLYLANCE</span>
                    <span className="logo-sub">Zenith Protocol</span>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-6"
                >
                    <button onClick={onBypass} className="text-[10px] font-bold tracking-widest text-zinc-500 hover:text-[#8b5cf6] transition-colors uppercase">
                        Sovereign Bypass
                    </button>
                    <div className="h-4 w-px bg-white/10" />
                    <button 
                        onClick={openConnectModal}
                        className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#8b5cf6]/50 text-[10px] font-bold tracking-widest uppercase transition-all"
                    >
                        Connect Node
                    </button>
                </motion.div>
            </nav>

            {/* Main Hero Section */}
            <motion.main 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="landing-hero"
            >
                <div className="hero-content">
                    <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-[#8b5cf6] text-[10px] font-bold tracking-widest uppercase mb-8">
                        <Sparkles size={12} /> The Future of Work is Sovereign
                    </motion.div>
                    
                    <motion.h1 variants={itemVariants}>
                        Sovereign <br />
                        <span className="text-gradient">Coordination</span> <br />
                        Protocol.
                    </motion.h1>

                    <motion.p variants={itemVariants} className="hero-description">
                        PolyLance Zenith is the world's first trustless freelance mesh. 
                        No intermediaries. No rent-seeking. Just raw contributor power 
                        secured by the Polygon PoS network.
                    </motion.p>

                    <motion.div variants={itemVariants} className="flex gap-12 mt-12">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                                <Lock size={20} className="text-[#8b5cf6]" />
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Security</div>
                                <div className="text-lg font-bold text-white">UUPS Escrow</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                                <Cpu size={20} className="text-emerald-500" />
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Compute</div>
                                <div className="text-lg font-bold text-white">Gasless UX</div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <motion.div variants={itemVariants} className="auth-container">
                    <div className="auth-glow" />
                    <div className="auth-header">
                        <h2>Initialize Access</h2>
                        <p>Authenticate with your digital identity to enter the mesh.</p>
                    </div>

                    <div className="space-y-4">
                        <button 
                            onClick={onSocialLogin}
                            disabled={isLoggingIn}
                            className="auth-button"
                        >
                            <div className="auth-icon">
                                <Fingerprint size={24} />
                            </div>
                            <div className="flex-1">
                                <div className="auth-text-main">
                                    <span>Social Auth</span>
                                    <span className="auth-badge">Recommended</span>
                                </div>
                                <div className="auth-text-sub">Google / Email / X · Gasless</div>
                            </div>
                            <ChevronRight size={16} className="text-zinc-600" />
                        </button>

                        <button 
                            onClick={openConnectModal}
                            className="auth-button"
                        >
                            <div className="auth-icon">
                                <Wallet size={24} />
                            </div>
                            <div className="flex-1">
                                <div className="auth-text-main">Web3 Native</div>
                                <div className="auth-text-sub">MetaMask / Ledger / WalletConnect</div>
                            </div>
                            <ChevronRight size={16} className="text-zinc-600" />
                        </button>
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/5">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span>Polygon Amoy Mainnet</span>
                            </div>
                            <span>v1.5.0-Zenith</span>
                        </div>
                    </div>
                </motion.div>
            </motion.main>

            {/* Feature Bento Section */}
            <motion.section 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="landing-features"
            >
                <div className="feature-card">
                    <div className="feature-icon"><Shield size={24} /></div>
                    <h3>Trustless Escrow</h3>
                    <p>Milestone-based payments held in immutable smart contracts. Funds only release when you prove the work.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon"><Globe size={24} /></div>
                    <h3>On-Chain Reputation</h3>
                    <p>Every completed job builds your Gravity Rank—a non-transferable soulbound identity recognized globally.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon"><Zap size={24} /></div>
                    <h3>Neural Matchmaking</h3>
                    <p>Our proprietary indexing engine matches specialists to bounties based on real historical performance data.</p>
                </div>
            </motion.section>
        </div>
    );
};

export default LandingPage;
