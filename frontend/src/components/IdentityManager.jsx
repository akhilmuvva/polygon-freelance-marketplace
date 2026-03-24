import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, Brain, Sparkles, Save, Shield, 
    Cpu, Zap, CheckCircle2, AlertCircle, 
    ChevronRight, Search, Target, Award
} from 'lucide-react';
import hotToast from 'react-hot-toast';
import ProfileService from '../services/ProfileService';
import SubgraphService from '../services/SubgraphService';
import { useAnimeAnimations } from '../hooks/useAnimeAnimations';
import { formatEther } from 'viem';
import { parseProtocolValue } from '../utils/protocolUtils';

const IdentityManager = ({ address }) => {
    const [activeSection, setActiveSection] = useState('profile'); 
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [profile, setProfile] = useState({
        name: '',
        bio: '',
        skills: ''
    });

    const s = {
        card: {
            background: 'rgba(10, 11, 14, 0.4)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 32,
            padding: 32,
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        },
        input: {
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            padding: '14px 18px',
            color: '#fff',
            fontSize: '0.9rem',
            transition: 'all 0.3s ease',
            outline: 'none',
        },
        label: {
            fontSize: '0.62rem',
            fontWeight: 900,
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            marginBottom: 8,
            display: 'block'
        }
    };
    const [matches, setMatches] = useState([]);
    const [isMatching, setIsMatching] = useState(false);
    const { staggerFadeIn } = useAnimeAnimations();

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
            await ProfileService.updateSovereignProfile(address, {
                ...profile,
                skills: skillsArray
            });
            // Update local state immediately to reflect changes in UI (e.g. preview card)
            setProfile(prev => ({
                ...prev,
                skills: skillsArray.join(', ')
            }));
            hotToast.success('Sovereign Identity Propagated');
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
            // 1. Fetch live jobs
            const allJobs = await SubgraphService.getJobs(20);
            
            // 2. Mock AI Logic: Match skills in bio/description
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
                hotToast.success('AGA Neural Matrix Synchronized');
                setIsMatching(false);
            }, 1500);
        } catch (err) {
            hotToast.error('Neural Sync Failed');
            setIsMatching(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto pt-4 pb-20">
            {/* Header Identity Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 20, background: 'rgba(45, 212, 191, 0.1)', border: '1px solid rgba(45, 212, 191, 0.2)', color: 'var(--accent-light)', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>
                        <Shield size={12} /> Sovereign Identity Engine
                    </div>
                    <h1 style={{ fontSize: '3.2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>
                        Identity <span className="zenith-gradient">Updater</span>
                    </h1>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.95rem', fontWeight: 500, marginTop: 8 }}>Actuate your professional resonance on the decentralized mesh.</p>
                </div>
                
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 16, border: '1px solid var(--border)' }}>
                    <button 
                        onClick={() => setActiveSection('profile')}
                        style={{
                            padding: '10px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
                            fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
                            background: activeSection === 'profile' ? 'var(--accent)' : 'transparent',
                            color: activeSection === 'profile' ? '#000' : 'var(--text-tertiary)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                    >
                        <User size={14} style={{ marginBottom: -2, marginRight: 4 }} /> Profile
                    </button>
                    <button 
                        onClick={() => setActiveSection('matcher')}
                        style={{
                            padding: '10px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
                            fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
                            background: activeSection === 'matcher' ? 'var(--accent)' : 'transparent',
                            color: activeSection === 'matcher' ? '#000' : 'var(--text-tertiary)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                    >
                        <Brain size={14} style={{ marginBottom: -2, marginRight: 4 }} /> AI Matcher
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Panel: Form or Matching Status */}
                <div className="lg:col-span-12">
                    <AnimatePresence mode="wait">
                        {activeSection === 'profile' ? (
                            <motion.div 
                                key="profile"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-8"
                            >
                                {/* Form */}
                                <div style={s.card}>
                                    <div style={{ marginBottom: 24 }}>
                                        <label htmlFor="profile-name" style={s.label}>Legal Persona</label>
                                        <input 
                                            id="profile-name"
                                            name="name"
                                            type="text" 
                                            value={profile.name}
                                            onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Display Name"
                                            style={s.input}
                                            className="w-full focus:shadow-[0_0_20px_rgba(45,212,191,0.1)]"
                                        />
                                    </div>
                                    <div style={{ marginBottom: 24 }}>
                                        <label htmlFor="profile-bio" style={s.label}>Sovereign Manifesto (Bio)</label>
                                        <textarea 
                                            id="profile-bio"
                                            name="bio"
                                            value={profile.bio}
                                            onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                                            placeholder="Describe your expertise..."
                                            rows={3}
                                            style={{ ...s.input, resize: 'none' }}
                                            className="w-full focus:shadow-[0_0_20px_rgba(45,212,191,0.1)]"
                                        />
                                    </div>
                                    <div style={{ marginBottom: 32 }}>
                                        <label htmlFor="profile-skills" style={s.label}>Neural Nodes (Skills)</label>
                                        <input 
                                            id="profile-skills"
                                            name="skills"
                                            type="text" 
                                            value={profile.skills}
                                            onChange={(e) => setProfile(prev => ({ ...prev, skills: e.target.value }))}
                                            placeholder="React, Solidity, UX..."
                                            style={s.input}
                                            className="w-full focus:shadow-[0_0_20px_rgba(45,212,191,0.1)]"
                                        />
                                    </div>
                                    <button 
                                        onClick={handleSaveProfile}
                                        disabled={isSaving}
                                        style={{
                                            width: '100%', padding: '16px', borderRadius: 20,
                                            background: 'linear-gradient(135deg, var(--accent), var(--secondary))',
                                            color: '#000', fontWeight: 900, fontSize: '0.85rem', textTransform: 'uppercase',
                                            letterSpacing: '0.1em', cursor: 'pointer', border: 'none',
                                            boxShadow: '0 10px 30px var(--accent-glow)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                                        }}
                                    >
                                        {isSaving ? <Cpu className="animate-spin" size={18} /> : <Save size={18} />}
                                        Propagate to Ceramic
                                    </button>
                                </div>

                                {/* Preview Card */}
                                <div style={{ position: 'relative' }}>
                                    <div className="absolute inset-0 bg-accent/10 blur-[100px] pointer-events-none" />
                                    <div style={{ ...s.card, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', height: '100%', border: '1px solid rgba(45,212,191,0.1)' }}>
                                        <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: '0 0 40px rgba(0,0,0,0.4)', position: 'relative' }}>
                                            <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid var(--accent)', opacity: 0.2 }} />
                                            <User size={48} color="var(--accent-light)" />
                                        </div>
                                        <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginBottom: 8, letterSpacing: '-0.02em' }}>{profile.name || 'Sovereign Explorer'}</h3>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
                                            {(profile.skills.split(',') || []).map((skill, i) => skill.trim() && (
                                                <span key={i} style={{ padding: '4px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                                                    {skill.trim()}
                                                </span>
                                            ))}
                                        </div>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, fontStyle: 'italic', marginBottom: 20, maxWidth: 300 }}>
                                            "{profile.bio || 'Initialization required. Propagate your profile to activate this identity node.'}"
                                        </p>
                                        
                                        {/* Privado ID (Polygon ID) Verification Badge */}
                                        <div style={{ width: '100%', padding: '12px 16px', borderRadius: 16, background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Award size={18} />
                                                </div>
                                                <div style={{ textAlign: 'left' }}>
                                                    <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Privado ID</div>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>ZK-Personhood</div>
                                                </div>
                                            </div>
                                            <button 
                                                className="btn btn-ghost btn-xs"
                                                style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 6 }}
                                                onClick={() => hotToast('Redirecting to Privado ID Mobile App...')}
                                            >
                                                Verify
                                            </button>
                                        </div>
                                        
                                        <div style={{ marginTop: 'auto', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                                            {[
                                                { label: 'Activity', value: profile.totalJobs || '0' },
                                                { label: 'Reputation', value: profile.reputationScore || '0' },
                                                { label: 'Earned', value: parseFloat(formatEther(parseProtocolValue(profile.totalEarned))).toFixed(1) }
                                            ].map((stat, i) => (
                                                <div key={i}>
                                                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>{stat.value}</div>
                                                    <div style={s.label}>{stat.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="matcher"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-8"
                            >
                                <div className="bg-bg-raised p-8 rounded-[2rem] border border-border overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 blur-[100px] -mr-48 -mt-48" />
                                    <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto py-12">
                                        <div className={`w-20 h-20 rounded-full bg-secondary-subtle border border-secondary/20 flex items-center justify-center mb-8 ${isMatching ? 'animate-pulse' : ''}`}>
                                            <Brain size={40} className="text-secondary" />
                                        </div>
                                        <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tight">AGA Neural Intent Matcher</h2>
                                        <p className="text-text-secondary mb-8 leading-relaxed">
                                            Our Anti-Gravity Agent (AGA) will now scan the job mesh and cross-reference your sovereign competencies with open intents.
                                        </p>
                                        <button 
                                            onClick={runNeuralMatching}
                                            disabled={isMatching}
                                            className="px-10 py-4 rounded-xl bg-secondary text-bg-base font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3"
                                        >
                                            {isMatching ? <Sparkles className="animate-spin" size={20} /> : <Target size={20} />}
                                            {isMatching ? 'Calculating Resonance...' : 'Actuate Job Matching'}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {isMatching ? (
                                        [1, 2, 3].map(i => (
                                            <div key={i} className="h-64 rounded-[2rem] bg-white/[0.02] border border-white/5 animate-pulse" />
                                        ))
                                    ) : matches.length > 0 ? (
                                        matches.map((job, i) => (
                                            <motion.div 
                                                key={i} 
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="group p-8 rounded-[2rem] bg-bg-card border border-border hover:border-accent/20 transition-all relative overflow-hidden"
                                            >
                                                <div className="absolute top-0 right-0 p-6 flex flex-col items-end">
                                                    <div className="text-accent text-[10px] font-black uppercase tracking-widest mb-1">Match</div>
                                                    <div className="text-2xl font-black text-white">{job.matchScore}%</div>
                                                </div>

                                                <div className="flex items-center gap-3 mb-8">
                                                    <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                                                        <Sparkles size={18} />
                                                    </div>
                                                    <div className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Resonance OK</div>
                                                </div>

                                                <h4 className="text-lg font-bold text-white mb-6 group-hover:text-accent transition-colors truncate">
                                                    {job.ipfsHash?.slice(0, 20) || 'Autonomous Intent'}...
                                                </h4>
                                                
                                                <div className="flex justify-between items-center mt-auto">
                                                    <div className="text-xl font-black text-white">
                                                        {formatEther(job.amount || 0n)} <span className="text-[10px] text-text-tertiary">POL</span>
                                                    </div>
                                                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-raised border border-border hover:bg-accent hover:text-bg-base text-xs font-black uppercase tracking-widest transition-all">
                                                        View <ChevronRight size={14} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : !isMatching && activeSection === 'matcher' ? (
                                        <div className="col-span-full py-20 text-center bg-bg-surface rounded-[2rem] border border-dashed border-white/10">
                                            <AlertCircle size={40} className="mx-auto text-text-tertiary mb-4" />
                                            <p className="text-text-tertiary font-bold uppercase tracking-[0.2em]">No high-resonance matches found.</p>
                                            <button onClick={() => setActiveSection('profile')} className="mt-4 text-accent text-xs font-black uppercase underline">Update your skills</button>
                                        </div>
                                    ) : null}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default IdentityManager;
