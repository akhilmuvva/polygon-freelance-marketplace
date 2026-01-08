import React, { useEffect } from 'react';
import { useAccount, useReadContract, useSignMessage } from 'wagmi';
import { Wallet, Briefcase, CheckCircle, Clock, Save, User, Award, PlusCircle } from 'lucide-react';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { CONTRACT_ADDRESS } from '../constants';
import { api } from '../services/api';
import LiveJobFeed from './LiveJobFeed';

function Dashboard() {
    const { address, isConnected } = useAccount();

    useEffect(() => {
        console.log('[DASHBOARD] Account State:', { address, isConnected });
    }, [address, isConnected]);
    const [profile, setProfile] = React.useState({ name: '', bio: '', skills: '', category: 'Development' });
    const [analytics, setAnalytics] = React.useState({ totalJobs: 0, totalVolume: 0, totalUsers: 0 });
    const [isSaving, setIsSaving] = React.useState(false);
    const { signMessageAsync } = useSignMessage();

    const { data: jobCount } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        functionName: 'jobCount',
    });

    React.useEffect(() => {
        if (isConnected && address) {
            api.getProfile(address).then(data => {
                if (data.address) setProfile(data);
            });
            api.getAnalytics().then(data => {
                if (data && data.totalJobs !== undefined) setAnalytics(data);
            });
        }
    }, [isConnected, address]);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const { nonce } = await api.getNonce(address);
            if (!nonce) throw new Error('Could not get nonce');
            const message = `Login to PolyLance: ${nonce}`;
            const signature = await signMessageAsync({ message });
            await api.updateProfile({ address, ...profile, signature, message });
            alert('Profile updated securely!');
        } catch (err) {
            console.error(err);
            alert('Failed to update profile: ' + (err.shortMessage || err.message));
        } finally {
            setIsSaving(false);
        }
    };

    if (!isConnected) {
        return (
            <div className="glass-card" style={{ textAlign: 'center', marginTop: '100px' }}>
                <Wallet size={48} style={{ marginBottom: '20px', color: 'var(--primary)' }} />
                <h2>Connect your wallet to get started</h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>
                    Manage your freelance jobs on Polygon with low fees and NFT proof-of-work.
                </p>
            </div>
        );
    }

    return (
        <div>
            <section className="hero">
                <h1>Workspace for <span className="gradient-text">Creators</span></h1>
                <p>
                    {profile.name ? `Welcome back, ${profile.name}. ` : 'Welcome to PolyLance. '}
                    Manage your decentralized career, track earnings, and explore new opportunities on Polygon.
                </p>
                <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                    <div className="badge" style={{ borderColor: 'var(--primary)', color: 'var(--primary)', border: '1px solid' }}>
                        {profile.skills ? 'Freelancer' : 'Client'}
                    </div>
                    {profile.reputationScore > 100 && (
                        <div className="badge" style={{ borderColor: '#8b5cf6', color: '#8b5cf6', border: '1px solid' }}>
                            ✨ ZK-Verified Reputation
                        </div>
                    )}
                    <div className="badge">Verified Account</div>
                </div>
            </section>

            <div className="grid">
                <div className="glass-card stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>TOTAL CONTRACTS</p>
                            <div className="stat-value">{jobCount?.toString() || '0'}</div>
                            <p style={{ color: '#10b981', fontSize: '0.8rem' }}>On-chain Active</p>
                        </div>
                        <Briefcase size={24} color="var(--primary)" />
                    </div>
                </div>

                <div className="glass-card stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>REPUTATION SCORE</p>
                            <div className="stat-value">{profile.reputationScore || 0}</div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Top {profile.reputationScore > 500 ? '1%' : '10%'} of talent</p>
                        </div>
                        <Award size={24} color="#f59e0b" />
                    </div>
                </div>

                <div className="glass-card stat-card" style={{ borderLeft: '4px solid #10b981' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>TOTAL EARNED</p>
                            <div className="stat-value">{profile.totalEarned?.toFixed(2) || '0.00'} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>MATIC</span></div>
                            <p style={{ color: '#10b981', fontSize: '0.8rem' }}>Securely held in escrow</p>
                        </div>
                        <CheckCircle size={24} color="#10b981" />
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '24px', marginBottom: '40px' }}>
                <h3 style={{ marginBottom: '16px', opacity: 0.8 }}>Marketplace Insights (Global)</h3>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                    <div className="glass-card" style={{ padding: '15px', background: 'rgba(255,255,255,0.03)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Global Volume</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{(analytics.totalVolume || 0).toFixed(2)} MATIC</div>
                    </div>
                    <div className="glass-card" style={{ padding: '15px', background: 'rgba(255,255,255,0.03)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Jobs</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{analytics.totalJobs || 0}</div>
                    </div>
                    <div className="glass-card" style={{ padding: '15px', background: 'rgba(255,255,255,0.03)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Global Users</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{analytics.totalUsers || 0}</div>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
                <div className="glass-card" style={{ flex: 1, padding: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Award size={20} color="var(--primary)" />
                    <div>
                        <div style={{ fontWeight: 600 }}>{profile.completedJobs || 0} Jobs Completed</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Proven track record on-chain</div>
                    </div>
                </div>
                <div className="glass-card" style={{ flex: 1, padding: '15px', border: '1px solid var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => window.location.hash = `portfolio`}>
                    <User size={20} color="var(--primary)" />
                    <div>
                        <div style={{ fontWeight: 600 }}>Public Portfolio</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>View your Proof-of-Work gallery →</div>
                    </div>
                </div>
            </div>

            <div className="grid" style={{ marginTop: '40px', gridTemplateColumns: '1.5fr 1fr' }}>
                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
                        <User size={20} color="var(--primary)" />
                        <h3 style={{ margin: 0 }}>Professional Profile</h3>
                    </div>
                    <form onSubmit={handleSaveProfile}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>DISPLAY NAME</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={profile.name}
                                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                                    placeholder="e.g. Satoshi Nakamoto"
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>BASE CATEGORY</label>
                                <select
                                    className="input-field"
                                    value={profile.category}
                                    onChange={e => setProfile({ ...profile, category: e.target.value })}
                                >
                                    <option>Development</option>
                                    <option>Design</option>
                                    <option>Marketing</option>
                                    <option>Writing</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>SKILLS (comma separated)</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={profile.skills}
                                    onChange={e => setProfile({ ...profile, skills: e.target.value })}
                                    placeholder="React, Solidity, UX"
                                />
                            </div>
                        </div>
                        <div style={{ marginBottom: '30px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>BIO</label>
                            <textarea
                                className="input-field"
                                style={{ minHeight: '120px' }}
                                value={profile.bio}
                                onChange={e => setProfile({ ...profile, bio: e.target.value })}
                                placeholder="Describe your background and professional experience..."
                            />
                        </div>
                        <button type="submit" className="btn-primary" disabled={isSaving} style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Save size={18} /> {isSaving ? 'Syncing Profile...' : 'Sync to Database'}
                        </button>
                    </form>
                </div>

                <div style={{ alignSelf: 'start' }}>
                    <LiveJobFeed />
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
