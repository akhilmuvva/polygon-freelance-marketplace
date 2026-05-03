import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, Brain, Sparkles, Save, Shield, 
    Cpu, Zap, CheckCircle2, AlertCircle, 
    ChevronRight, Search, Target, Award,
    Fingerprint, Globe, Layers, Hexagon,
    ShieldCheck, QrCode, ScanFace, Activity,
    ExternalLink, Command, ShieldAlert, Gavel
} from 'lucide-react';
import hotToast from 'react-hot-toast';
import ProfileService from '../services/ProfileService';
import SubgraphService from '../services/SubgraphService';
import { formatEther } from 'viem';
import { parseProtocolValue } from '../utils/protocolUtils';
import './IdentityManager.css';

/**
 * Identity Manager — Sovereign Identity Edition
 * Manage decentralized professional identity with premium Zenith aesthetics.
 */
const IdentityManager = (props) => {
    const { address, gaslessEnabled, isAdmin } = props;
    const [activeTab, setActiveTab] = useState('SOVEREIGN_ID'); 
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const queryClient = useQueryClient();
    const [profile, setProfile] = useState({
        name: '',
        bio: '',
        skills: '',
        reputationScore: 0,
        totalEarned: 0,
        totalJobs: 0
    });
    const [matches, setMatches] = useState([]);
    const [isMatching, setIsMatching] = useState(false);

    useEffect(() => {
        if (!address) return;

        const fetchProfile = async () => {
            setIsLoading(true);
            try {
                console.info('[IDENTITY] Fetching profile for:', address);
                const [data, stats] = await Promise.all([
                    ProfileService.getProfile(address),
                    SubgraphService.getUserStats(address).catch(e => {
                        console.warn('[IDENTITY] Subgraph stats unavailable:', e.message);
                        return null;
                    })
                ]);
                
                if (data) {
                    setProfile({
                        name: data.name || '',
                        bio: data.bio || '',
                        skills: Array.isArray(data.skills) ? data.skills.join(', ') : (data.skills || ''),
                        reputationScore: stats?.freelancer?.reputationScore || data.reputationScore || 0,
                        totalEarned: stats?.freelancer?.totalEarned || data.totalEarned || 0,
                        totalJobs: (stats?.freelancer?.jobsCompleted || 0) + (stats?.client?.activeEscrows || 0)
                    });
                }
            } catch (err) {
                console.error('[IDENTITY] Initialization failed:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [address]);

    const handleSaveProfile = async () => {
        if (!address) {
            hotToast.error('Identity Anchoring requires an active address');
            return;
        }

        setIsSaving(true);
        try {
            // Directive 15: Input Normalization. Convert skills string to array before persisting.
            const skillsArray = typeof profile.skills === 'string' 
                ? profile.skills.split(',').map(s => s.trim()).filter(s => s !== '') 
                : profile.skills;

            const updatePayload = {
                ...profile,
                skills: skillsArray,
                updatedAt: Date.now()
            };

            console.info('[IDENTITY] Persisting sovereign state:', updatePayload);
            
            await ProfileService.updateProfile(address, updatePayload);
            
            // Sync the state back to the local profile so the UI stays consistent
            setProfile({
                ...profile,
                skills: typeof profile.skills === 'string' ? profile.skills : skillsArray.join(', ')
            });

            // Directive 16: Cross-Component Resonance. Broadcast update to other dashboard modules.
            window.dispatchEvent(new CustomEvent('IDENTITY_UPDATED', { detail: address }));
            window.dispatchEvent(new CustomEvent('REFRESH_DASHBOARD'));
            
            hotToast.success('Sovereign Identity Anchored');
        } catch (err) {
            console.error('[IDENTITY] Persistence failure:', err);
            hotToast.error('Failed to anchor identity to decentralized network');
        } finally {
            setIsSaving(false);
        }
    };

    const handleShadowBan = async () => {
        if (!isAdmin) return;
        
        const targetAddress = prompt("Enter the address to Shadow Ban (Ghost Moderator Mode):");
        if (!targetAddress) return;

        const reason = prompt("Enter reason for shadow ban:");
        if (!reason) return;

        try {
            await ProfileService.shadowBan(targetAddress, reason);
            hotToast.success(`Ghost Protocol: ${targetAddress.slice(0,6)}... has been restricted.`);
            
            // Log it locally for the audit trail
            const auditLog = JSON.parse(localStorage.getItem('ZENITH_AUDIT_LOG') || '[]');
            auditLog.unshift({
                action: 'SHADOW_BAN',
                target: targetAddress,
                reason,
                moderator: address,
                timestamp: Date.now()
            });
            localStorage.setItem('ZENITH_AUDIT_LOG', JSON.stringify(auditLog.slice(0, 50)));
        } catch (err) {
            hotToast.error('Ghost Moderator operation failed');
        }
    };

    const runNeuralMatching = async () => {
        setIsMatching(true);
        setActiveTab('NEXUS_VALENCE');
        try {
            const allJobs = await SubgraphService.getJobs(20);
            const skills = profile.skills.toLowerCase().split(',').map(s => s.trim());
            const scoredMatches = allJobs.map(job => {
                let score = 0;
                const text = ((job.title || '') + (job.ipfsHash || '')).toLowerCase();
                skills.forEach(skill => {
                    if (skill && text.includes(skill)) score += 33;
                });
                if (score > 100) score = 100;
                return { ...job, matchScore: score };
            }).sort((a, b) => b.matchScore - a.matchScore).filter(m => m.matchScore > 0);

            setMatches(scoredMatches);
            setTimeout(() => {
                hotToast.success('AI Engine Synced');
                setIsMatching(false);
            }, 2000);
        } catch (err) {
            hotToast.error('AI Matching Failed');
            setIsMatching(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
        }
    };

    return (
        <motion.div 
            className="identity-container"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* Background Aesthetic */}
            <div className="bg-pattern-grid" />
            <div className="ambient-glow" style={{ top: '5%', left: '10%', opacity: 0.08 }} />
            <div className="ambient-glow" style={{ bottom: '15%', right: '5%', background: '#d946ef', opacity: 0.05 }} />
            
            <motion.header 
                className="identity-header"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <div style={{ position: 'absolute', top: 0, right: 0, width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)', zIndex: 0 }}></div>
                <div className="header-top">
                    <div className="header-title-group">
                        <motion.span 
                            className="label-pill"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            SYSTEM_CORE / IDENTITY_VALENCE
                        </motion.span>
                        <h1 className="main-title">ZENITH IDENTITY_ANCHOR</h1>
                        <p className="subtitle">Sovereign identity management with zero-knowledge personhood verification.</p>
                    </div>
                    <div className="header-actions">
                        <motion.div 
                            className={`shield-status ${gaslessEnabled ? 'active' : ''}`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div className="status-orb"></div>
                            <span className="status-label">{gaslessEnabled ? 'SHIELD_ACTIVE' : 'SHIELD_OFFLINE'}</span>
                        </motion.div>
                    </div>
                </div>

                <div className="tab-navigation">
                    {['SOVEREIGN_ID', 'NEXUS_VALENCE', 'ZK_PROOFS', ...(isAdmin ? ['MODERATOR_CONTROLS'] : [])].map((tab) => (
                        <motion.button
                            key={tab}
                            className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {activeTab === tab && (
                                <motion.div 
                                    layoutId="activeTab"
                                    className="active-indicator"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <div className="flex items-center gap-2 px-1">
                                {tab === 'SOVEREIGN_ID' && <User size={14} />}
                                {tab === 'NEXUS_VALENCE' && <Brain size={14} />}
                                {tab === 'ZK_PROOFS' && <ShieldCheck size={14} />}
                                {tab === 'MODERATOR_CONTROLS' && <Gavel size={14} className="text-red-400" />}
                                <span className="tab-text">{tab.replace(/_/g, ' ')}</span>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </motion.header>

            <AnimatePresence mode="wait">
                {activeTab === 'SOVEREIGN_ID' && (
                    <motion.div 
                        key="sovereign-id-tab"
                        className="identity-main-grid"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="sovereign-card">
                            <div className="card-dot-pattern"></div>
                            <div className="card-header">
                                <h2 className="card-title">IDENTITY_SPECIFICATION</h2>
                                <p className="card-subtitle">Define your profile for the decentralized marketplace.</p>
                            </div>

                            <div className="profile-form">
                                <div className="input-group">
                                    <label className="input-label">HANDLE_ID</label>
                                    <div className="input-wrapper">
                                        <input 
                                            type="text" 
                                            placeholder="Enter username..." 
                                            className="zenith-input"
                                            value={profile.name}
                                            onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                        <div className="input-glow"></div>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Sovereign Bio</label>
                                    <textarea 
                                        value={profile.bio}
                                        onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                                        placeholder="Describe your domain expertise..."
                                        rows={5}
                                        className="zenith-input zenith-textarea"
                                    />
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Intelligence Keywords</label>
                                    <input 
                                        type="text" 
                                        value={profile.skills}
                                        onChange={(e) => setProfile(prev => ({ ...prev, skills: e.target.value }))}
                                        placeholder="Solidity, React, Rust, ZK..."
                                        className="zenith-input"
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={handleSaveProfile}
                                disabled={isSaving}
                                className="btn-anchor"
                            >
                                {isSaving ? <Activity className="animate-spin" size={20} /> : <Save size={20} />}
                                {isSaving ? 'Anchoring...' : 'Anchor Identity'}
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <motion.div variants={itemVariants} className="preview-card">
                                <div className="preview-avatar-wrap">
                                    <div className="preview-avatar">
                                        <div className="avatar-inner">
                                            {profile.name ? profile.name[0].toUpperCase() : <Command size={40} />}
                                        </div>
                                    </div>
                                    <div className="avatar-glow"></div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="preview-name">{profile.name || 'Anonymous Node'}</h3>
                                    <div className="skill-pills">
                                        {(typeof profile.skills === 'string' ? profile.skills.split(',') : []).map((skill, i) => skill.trim() && (
                                            <span key={i} className="skill-pill">
                                                {skill.trim()}
                                            </span>
                                        ))}
                                    </div>
                                    
                                    <div className="preview-stats">
                                        <div className="stat-item">
                                            <span className="stat-label">REPUTATION</span>
                                            <span className="stat-value">{profile.reputationScore}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">TOTAL_EARNED</span>
                                            <span className="stat-value">{Number(profile.totalEarned).toFixed(2)} MATIC</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'NEXUS_VALENCE' && (
                    <motion.div 
                        key="nexus-valence-tab"
                        className="nexus-valence-container"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="sovereign-card">
                            <div className="card-header">
                                <h2 className="card-title">NEURAL_RESONANCE_CONFIG</h2>
                                <p className="card-subtitle">Calibrate the AI agent's autonomous matching parameters.</p>
                            </div>

                            <div className="nexus-controls">
                                <div className="control-card">
                                    <div className="control-info">
                                        <label className="input-label">MATCH_SENSITIVITY</label>
                                        <span className="value-display">85%</span>
                                    </div>
                                    <div className="slider-wrapper">
                                        <div className="slider-track">
                                            <motion.div 
                                                className="slider-fill"
                                                initial={{ width: 0 }}
                                                animate={{ width: '85%' }}
                                            />
                                            <div className="slider-thumb" style={{ left: '85%' }}></div>
                                        </div>
                                    </div>
                                    <p className="control-desc">Higher values prioritize exact skill matches over semantic overlap.</p>
                                </div>

                                <div className="control-card">
                                    <div className="control-info">
                                        <label className="input-label">AUTONOMOUS_BIDDING</label>
                                        <div className="toggle-pill active">
                                            <div className="toggle-thumb"></div>
                                        </div>
                                    </div>
                                    <p className="control-desc">Allow AI Nexus to prepare bid drafts for matching opportunities.</p>
                                </div>
                            </div>

                            <div className="nexus-visualization">
                                <div className="resonance-wave"></div>
                                <div className="resonance-wave"></div>
                                <div className="resonance-wave"></div>
                                <div className="nexus-status-overlay">
                                    <Brain size={32} className="pulse-icon" />
                                    <span>NEURAL_ENGINE_ACTIVE</span>
                                </div>
                            </div>

                            <button 
                                onClick={runNeuralMatching}
                                disabled={isMatching}
                                className="btn-anchor"
                                style={{ marginTop: '48px', width: 'auto' }}
                            >
                                {isMatching ? <Activity className="animate-spin" size={20} /> : <Target size={20} />}
                                {isMatching ? 'SCALPING_MESH...' : 'INITIATE_RESONANCE_SCAN'}
                            </button>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'ZK_PROOFS' && (
                    <motion.div 
                        key="zk-proofs-tab"
                        className="zk-proofs-container"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="sovereign-card">
                            <div className="card-header">
                                <h2 className="card-title">ZK_PERSONHOOD_VERIFICATION</h2>
                                <p className="card-subtitle">Verify your unique identity without revealing personal data.</p>
                            </div>

                            <div className="zk-content">
                                <div className="verification-status-card">
                                    <div className="status-header">
                                        <div className="provider-logo">PRIVADO_ID</div>
                                        <div className="status-badge unverified">UNVERIFIED</div>
                                    </div>
                                    <div className="status-details">
                                        <div className="detail-item">
                                            <span className="detail-label">STARK_ROOT</span>
                                            <span className="detail-value">0x0...000</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">PROOFER_ENGINE</span>
                                            <span className="detail-value">ZENITH_ZK_v1</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="zk-action-grid">
                                    <button className="btn-verify-zk">
                                        <Fingerprint size={20} />
                                        <span>START_ZK_VERIFICATION</span>
                                    </button>
                                    <div className="security-notice">
                                        <Shield size={14} />
                                        <span>Proofs generated locally via WASM backend.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'MODERATOR_CONTROLS' && isAdmin && (
                    <motion.div 
                        key="moderator-controls-tab"
                        className="moderator-controls-container"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="sovereign-card moderator-card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                            <div className="card-header">
                                <div className="flex justify-between items-center w-full">
                                    <div>
                                        <h2 className="card-title" style={{ color: '#f87171' }}>MODERATOR_OVERRIDE_PANEL</h2>
                                        <p className="card-subtitle">Privileged access for Protocol Judges. Handle with caution.</p>
                                    </div>
                                    <div className="badge-judicial">JUDICIAL_CLEARANCE_L3</div>
                                </div>
                            </div>

                            <div className="moderator-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '32px' }}>
                                <div className="control-card danger-zone" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', padding: '24px', borderRadius: '16px' }}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <ShieldAlert className="text-red-400" />
                                        <span className="font-bold text-red-400">SHADOW_BAN_PROTOCOL</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mb-6">Hide suspicious profiles from the marketplace index across all nodes.</p>
                                    <button 
                                        onClick={handleShadowBan}
                                        className="btn-anchor" 
                                        style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                                    >
                                        <Gavel size={18} />
                                        <span>INITIATE_SHADOW_BAN</span>
                                    </button>
                                </div>

                                <div className="control-card" style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)', padding: '24px', borderRadius: '16px' }}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <Activity className="text-blue-400" />
                                        <span className="font-bold text-blue-400">TELEMETRY_DUMP</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mb-6">Export all decentralized identity resonance logs for forensic audit.</p>
                                    <button className="btn-anchor" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                        <ExternalLink size={18} />
                                        <span>EXPORT_LOGS</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default IdentityManager;
