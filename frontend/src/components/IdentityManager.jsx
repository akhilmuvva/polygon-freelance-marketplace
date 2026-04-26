import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    User, Brain, Sparkles, Save, Shield, 
    Cpu, Zap, CheckCircle2, AlertCircle, 
    ChevronRight, Search, Target, Award,
    Fingerprint, Globe, Layers, Hexagon,
    ShieldCheck, QrCode, ScanFace, Activity,
    ExternalLink, Command, ShieldAlert
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
const IdentityManager = ({ address }) => {
    const [activeSection, setActiveSection] = useState('profile'); 
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [profile, setProfile] = useState({
        name: '',
        bio: '',
        skills: ''
    });
    const [matches, setMatches] = useState([]);
    const [isMatching, setIsMatching] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            try {
                const [data, stats] = await Promise.all([
                    ProfileService.getProfile(address),
                    SubgraphService.getUserStats(address)
                ]);
                
                if (data) {
                    setProfile(prev => ({
                        ...prev,
                        name: data.name || '',
                        bio: data.bio || '',
                        skills: Array.isArray(data.skills) ? data.skills.join(', ') : (data.skills || ''),
                        reputationScore: stats?.freelancer?.reputationScore || data.reputationScore || 0,
                        totalEarned: stats?.freelancer?.totalEarned || data.totalEarned || 0,
                        totalJobs: stats?.freelancer?.jobsCompleted || stats?.client?.activeEscrows || 0
                    }));
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
        setIsSaving(true);
        try {
            const skillsArray = profile.skills.split(',').map(s => s.trim()).filter(Boolean);
            await ProfileService.updateProfile(address, {
                ...profile,
                skills: skillsArray
            });

            // Local cache update for instant rendering
            const cacheKey = `POLYLANCE_PROFILE_CACHE_${address.toLowerCase()}`;
            localStorage.setItem(cacheKey, JSON.stringify({
                address: address.toLowerCase(),
                ...profile,
                skills: skillsArray,
                source: 'local-update'
            }));

            setProfile(prev => ({
                ...prev,
                skills: skillsArray.join(', ')
            }));
            hotToast.success('Identity Anchored Successfully');
            window.dispatchEvent(new CustomEvent('IDENTITY_UPDATED', { detail: address }));
        } catch (err) {
            hotToast.error('Identity Propagation Failed');
        } finally {
            setIsSaving(false);
        }
    };

    const runNeuralMatching = async () => {
        setIsMatching(true);
        setActiveSection('matcher');
        try {
            const allJobs = await SubgraphService.getJobs(20);
            const skills = profile.skills.toLowerCase().split(',').map(s => s.trim());
            const scoredMatches = allJobs.map(job => {
                let score = 0;
                const text = (job.ipfsHash + (job.title || '')).toLowerCase();
                skills.forEach(skill => {
                    if (text.includes(skill)) score += 33;
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

            {/* SOVEREIGN HEADER */}
            <motion.header variants={itemVariants} className="identity-header">
                <div>
                    <div className="system-tag">
                        <Fingerprint size={12} className="animate-pulse" /> Protocol v2.5 Online
                    </div>
                    
                    <h1 className="identity-title">
                        Sovereign <br />
                        <span className="accent-text">Identity</span>
                    </h1>
                    <p className="identity-subtitle">
                        Establishing your professional gravity on the Polygon network. Manage your reputation, skills, and autonomous matching parameters.
                    </p>
                </div>

                <div className="nav-capsule">
                    <button 
                        onClick={() => setActiveSection('profile')}
                        className={`nav-btn ${activeSection === 'profile' ? 'active' : ''}`}
                    >
                        <User size={16} /> Profile
                    </button>
                    <button 
                        onClick={() => setActiveSection('matcher')}
                        className={`nav-btn ${activeSection === 'matcher' ? 'active' : ''}`}
                    >
                        <Brain size={16} /> AI Nexus
                    </button>
                </div>
            </motion.header>

            <AnimatePresence mode="wait">
                {activeSection === 'profile' ? (
                    <motion.div 
                        key="profile-section"
                        initial="hidden" animate="visible" exit="hidden"
                        variants={containerVariants}
                        className="identity-grid"
                    >
                        {/* LEFT: FORM PANEL */}
                        <motion.div variants={itemVariants} className="sovereign-card">
                            <div className="bg-pattern-grid" />
                            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                <Hexagon size={300} className="text-white" />
                            </div>
                            
                            <div className="relative z-10">
                                <div className="input-group">
                                    <label className="input-label">Signature Alias</label>
                                    <input 
                                        type="text" 
                                        value={profile.name}
                                        onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Enter Professional Alias..."
                                        className="zenith-input"
                                    />
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
                                    <p style={{ fontSize: '10px', fontWeight: 800, opacity: 0.3, textTransform: 'uppercase', marginTop: '14px', letterSpacing: '0.15em' }}>
                                        Comma separated values for neural resonance matching.
                                    </p>
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
                        </motion.div>

                        {/* RIGHT: PREVIEW & VERIFICATION */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            {/* PREVIEW CARD */}
                            <motion.div variants={itemVariants} className="preview-card">
                                <div className="preview-avatar-wrap">
                                    <div className="preview-avatar">
                                        <div className="avatar-inner">
                                            {profile.name ? profile.name[0].toUpperCase() : <Command size={40} />}
                                        </div>
                                    </div>
                                    <div style={{ position: 'absolute', bottom: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#050505', padding: '6px 16px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', whiteSpace: 'nowrap', color: '#8b5cf6' }}>
                                        Signal Active
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="preview-name">{profile.name || 'Anonymous Node'}</h3>
                                    <div className="skill-pills">
                                        {(profile.skills.split(',') || []).map((skill, i) => skill.trim() && (
                                            <span key={i} className="skill-pill">
                                                {skill.trim()}
                                            </span>
                                        ))}
                                    </div>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', fontStyle: 'italic', maxWidth: '320px', margin: '0 auto 40px', lineHeight: 1.6 }}>
                                        "{profile.bio || 'Initial bio state: Pending identity propagation.'}"
                                    </p>
                                </div>

                                <div className="stats-bar">
                                    <div className="stat-item">
                                        <div className="stat-num">{profile.totalJobs || '0'}</div>
                                        <div className="stat-lab">Activity</div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-num">{profile.reputationScore || '0'}</div>
                                        <div className="stat-lab">Gravity</div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-num">{parseFloat(formatEther(parseProtocolValue(profile.totalEarned))).toFixed(1)}</div>
                                        <div className="stat-lab">Yield</div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* PRIVADO ID VERIFICATION */}
                            <motion.div variants={itemVariants} className="verif-card">
                                <div className="verif-header">
                                    <div className="flex items-center gap-5">
                                        <div style={{ background: '#8b5cf6', color: '#fff', padding: '14px', borderRadius: '18px', boxShadow: '0 10px 20px rgba(139,92,246,0.3)' }}>
                                            <ShieldCheck size={28} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '11px', fontWeight: 900, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '4px' }}>Privado ID</div>
                                            <div className="verif-title">ZK-Personhood</div>
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 14px', borderRadius: '24px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.1)' }}>Unverified</div>
                                </div>
                                
                                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: '32px' }}>
                                    Zero-knowledge proof of personhood ensures your sovereign identity is unique across the mesh without compromising your core data privacy.
                                </p>

                                <div className="flex gap-4">
                                    <button 
                                        className="btn btn-ghost" 
                                        style={{ flex: 1, background: '#fff', color: '#000', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', padding: '20px', borderRadius: '18px' }}
                                        onClick={() => hotToast('Initiating ZK Proof Sequence...')}
                                    >
                                        Initiate Proof
                                    </button>
                                    <button className="btn btn-ghost" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '20px', borderRadius: '18px' }}>
                                        <QrCode size={22} />
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="matcher-section"
                        initial="hidden" animate="visible" exit="hidden"
                        variants={containerVariants}
                        className="space-y-16"
                    >
                        {/* MATCHING ENGINE HERO */}
                        <motion.div variants={itemVariants} className="resonance-hero">
                            <div className="bg-pattern-grid" />
                            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,rgba(217,70,239,0.1),transparent_60%)]" />
                            
                            <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto">
                                <div className={`resonance-icon ${isMatching ? 'animate-pulse' : ''}`}>
                                    <Brain size={60} />
                                </div>
                                <div className="space-y-6 mb-12">
                                    <h2 className="identity-title" style={{ fontSize: '4.5rem' }}>Neural <br /><span style={{ color: '#d946ef' }}>Matching</span></h2>
                                    <p className="identity-subtitle" style={{ margin: '0 auto' }}>
                                        Our autonomous engine scans global mission signatures and cross-references them with your neural profile to identify high-resonance opportunities.
                                    </p>
                                </div>
                                
                                <button 
                                    onClick={runNeuralMatching}
                                    disabled={isMatching}
                                    className="btn-anchor"
                                    style={{ background: 'linear-gradient(135deg, #d946ef, #8b5cf6)', width: 'auto', padding: '24px 60px' }}
                                >
                                    {isMatching ? <Activity className="animate-spin" size={24} /> : <Target size={24} />}
                                    {isMatching ? 'Calculating Resonance...' : 'Initiate Deep Scan'}
                                </button>
                            </div>
                        </motion.div>

                        {/* MATCH RESULTS GRID */}
                        <div className="match-grid">
                            {isMatching ? (
                                [1, 2, 3].map(i => (
                                    <div key={i} style={{ height: '350px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '48px' }} className="animate-pulse" />
                                ))
                            ) : matches.length > 0 ? (
                                matches.map((job, i) => (
                                    <motion.div 
                                        key={i} 
                                        variants={itemVariants}
                                        className="match-card"
                                    >
                                        <div className="match-score-wrap">
                                            <div className="match-label">Resonance</div>
                                            <div className="match-score">{job.matchScore}%</div>
                                        </div>

                                        <div className="system-tag">
                                            <Sparkles size={14} /> Signature Detected
                                        </div>

                                        <h4 style={{ fontFamily: 'Space Grotesk', fontSize: '1.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '32px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                                            {job.title || 'Autonomous Intent'}
                                        </h4>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                            <div className="stat-item">
                                                <div className="stat-lab">Protocol Reward</div>
                                                <div className="stat-num" style={{ fontSize: '1.5rem' }}>
                                                    {formatEther(job.amount || 0n)} <span style={{ fontSize: '11px', opacity: 0.3 }}>POL</span>
                                                </div>
                                            </div>
                                            <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '20px', borderRadius: '20px', cursor: 'pointer', color: '#fff' }}>
                                                <ChevronRight size={24} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            ) : !isMatching && activeSection === 'matcher' ? (
                                <motion.div variants={itemVariants} style={{ gridColumn: '1 / -1', padding: '100px 48px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '60px', border: '2px dashed rgba(255,255,255,0.05)' }}>
                                    <div style={{ width: '100px', height: '100px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%', margin: '0 auto 32px', display: 'flex', alignItems: 'center', justify-content: 'center', color: 'rgba(255,255,255,0.2)' }}>
                                        <ShieldAlert size={48} />
                                    </div>
                                    <div className="space-y-6">
                                        <h4 style={{ fontFamily: 'Space Grotesk', fontSize: '1.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Resonance Null</h4>
                                        <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)', maxWidth: '350px', margin: '0 auto 32px', lineHeight: 1.6 }}>Neural patterns are not yet aligned with active protocol intents in the current mesh segment.</p>
                                        <button 
                                            onClick={() => setActiveSection('profile')}
                                            style={{ background: 'none', border: 'none', color: '#8b5cf6', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', cursor: 'pointer', borderBottom: '2px solid rgba(139,92,246,0.3)', paddingBottom: '6px', transition: 'all 0.3s ease' }}
                                            onMouseOver={(e) => e.target.style.borderColor = '#8b5cf6'}
                                            onMouseOut={(e) => e.target.style.borderColor = 'rgba(139,92,246,0.3)'}
                                        >
                                            Update Neural Profile
                                        </button>
                                    </div>
                                </motion.div>
                            ) : null}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default IdentityManager;

