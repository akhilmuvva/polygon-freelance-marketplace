import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    User, Briefcase, MapPin, Link as LinkIcon, Award, 
    ExternalLink, Globe, Github, Twitter, Zap, Coins, 
    CreditCard, ShieldCheck, ArrowLeft, Loader2, Star
} from 'lucide-react';
import { useReadContract } from 'wagmi';
import { erc20Abi, erc721Abi, formatEther } from 'viem';
import { POLY_TOKEN_ADDRESS, CONTRACT_ADDRESS, BETA_TESTER_SBT_ADDRESS } from '../constants';
import ProfileService from '../services/ProfileService';
import SubgraphService from '../services/SubgraphService';
import JobService from '../services/JobService';
import Reputation3D from './Reputation3D';
import ProofOfWorkBadge from './ProofOfWorkBadge';
import CrossChainSync from './CrossChainSync';
import UserLink from './UserLink';
import './Portfolio.css';

function Portfolio({ address, onBack, onFiatPay }) {
    const [data, setData] = useState({ profile: null, jobs: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (address) {
            const fetchDecentralizedPortfolio = async () => {
                setLoading(true);
                try {
                    const profile = await ProfileService.getProfile(address);
                    const subgraphData = await SubgraphService.getUserPortfolio(address);
                    const rawJobs = subgraphData?.freelancer?.jobs || [];

                    const jobsWithMeta = await Promise.all(rawJobs.map(async (j) => {
                        const meta = await JobService.resolveMetadata(j.ipfsHash);
                        return { ...j, ...meta };
                    }));

                    setData({
                        profile: profile || { address },
                        jobs: jobsWithMeta
                    });
                } catch (err) {
                    console.error('[Portfolio] Decentralized fetch failed:', err);
                } finally {
                    setLoading(false);
                }
            };
            fetchDecentralizedPortfolio();
        }
    }, [address]);

    const { data: plnBalance } = useReadContract({
        address: POLY_TOKEN_ADDRESS, abi: erc20Abi, functionName: 'balanceOf', args: [address],
    });

    const { data: pioneerBalance } = useReadContract({
        address: BETA_TESTER_SBT_ADDRESS, abi: erc721Abi, functionName: 'balanceOf', args: [address],
    });

    const isPioneer = pioneerBalance && Number(pioneerBalance) > 0;

    const skillSet = React.useMemo(() => {
        const skillsObject = data?.profile?.skills;
        if (!skillsObject) return [];
        if (Array.isArray(skillsObject)) return skillsObject;
        if (typeof skillsObject === 'string') return skillsObject.split(',').map(s => s.trim()).filter(Boolean);
        return [];
    }, [data?.profile?.skills]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-violet-500">
            <Loader2 size={40} className="animate-spin mb-4" />
            <span className="font-mono text-xs uppercase tracking-widest opacity-50">Syncing Sovereign Identity...</span>
        </div>
    );

    if (!data?.profile?.address) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <User size={60} className="text-zinc-800 mb-6" />
            <h3 className="text-2xl font-bold mb-2">Profile Not Anchored</h3>
            <p className="text-zinc-500 mb-8">This identity has not yet been established on the PolyLance network.</p>
            {onBack && (
                <button onClick={onBack} className="btn-secondary">
                    <ArrowLeft size={16} /> Return to Network
                </button>
            )}
        </div>
    );

    const { profile, jobs } = data;
    const activeJobs = jobs.filter(j => j.status === 'Ongoing' || j.status === '2');
    const completedJobs = jobs.filter(j => j.status === 'Completed' || j.status === '5');

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="zenith-portfolio">
            <motion.button 
                onClick={onBack} 
                className="btn-secondary mb-10"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
            >
                <ArrowLeft size={16} /> Mesh Network
            </motion.button>

            <div className="portfolio-grid">
                <motion.aside 
                    className="sovereign-sidebar"
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <div className="identity-card">
                        <div className="avatar-ring">
                            <div className="avatar-inner">
                                <User size={80} className="text-zinc-700" />
                            </div>
                            <div className="reputation-badge">
                                {profile.reputationScore || 0} RP
                            </div>
                        </div>

                        <h2 className="profile-name">
                            {profile.name || 'Anonymous Specialist'}
                            {isPioneer && (
                                <span className="ml-2 inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20" title="PolyLance Beta Pioneer">
                                    <Star size={10} fill="currentColor" /> Pioneer
                                </span>
                            )}
                        </h2>
                        <span className="profile-address">{address.slice(0, 6)}...{address.slice(-4)}</span>

                        <div className="skill-cloud">
                            {skillSet.map((skill, idx) => (
                                <span key={idx} className="skill-tag">{skill}</span>
                            ))}
                        </div>

                        <div className="stats-grid">
                            <div className="stat-box">
                                <div className="stat-value">{profile.completedJobs || 0}</div>
                                <div className="stat-label">Missions</div>
                            </div>
                            <div className="stat-box">
                                <div className="stat-value">{parseFloat(formatEther(BigInt(profile.totalEarned || '0'))).toFixed(1)}</div>
                                <div className="stat-label">MATIC</div>
                            </div>
                        </div>

                        <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                            {profile.bio || "Sovereign creator on the PolyLance protocol. Reputation verified on-chain."}
                        </p>

                        <div className="flex justify-center gap-4">
                            <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors border border-white/5">
                                <Github size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors border border-white/5">
                                <Twitter size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors border border-white/5">
                                <Globe size={18} />
                            </a>
                        </div>
                    </div>
                    
                    <CrossChainSync />
                </motion.aside>

                <motion.main 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.section variants={itemVariants} className="mb-12">
                        <h3 className="section-label">Reputation Geometry</h3>
                        <div className="reputation-3d-wrap">
                            <Reputation3D score={profile.reputationScore || 0} />
                        </div>
                    </motion.section>

                    {activeJobs.length > 0 && (
                        <motion.section variants={itemVariants} className="mb-12">
                            <h3 className="section-label">Active Work Stream</h3>
                            {activeJobs.map(job => (
                                <div key={job.jobId} className="artifact-card">
                                    <div className="artifact-content">
                                        <div className="artifact-tag !text-violet-400 !bg-violet-500/10">In Progress</div>
                                        <h4 className="artifact-title">{job.title}</h4>
                                        <ProofOfWorkBadge ipfsHash={job.ipfsHash} status={job.status} isClient={false} />
                                    </div>
                                </div>
                            ))}
                        </motion.section>
                    )}

                    <motion.section variants={itemVariants}>
                        <h3 className="section-label">Validated Artifacts</h3>
                        {completedJobs.length === 0 ? (
                            <div className="p-20 border border-dashed border-white/5 rounded-3xl text-center">
                                <Briefcase size={40} className="text-zinc-800 mx-auto mb-4" />
                                <p className="text-zinc-500">No mission artifacts found in the ledger.</p>
                            </div>
                        ) : (
                            completedJobs.map(job => (
                                <div key={job.jobId} className="artifact-card">
                                    <div className="artifact-visual">
                                        <img 
                                            src={`https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=300&q=80&sig=${job.jobId}`} 
                                            alt="NFT Proof" 
                                        />
                                        <ShieldCheck size={40} className="absolute text-violet-500 opacity-20" />
                                    </div>
                                    <div className="artifact-content">
                                        <div className="artifact-tag">Completed</div>
                                        <h4 className="artifact-title">{job.title}</h4>
                                        <p className="artifact-desc">{job.description}</p>
                                        <div className="artifact-meta">
                                            <span className="flex items-center gap-2"><Award size={14} className="text-violet-500" /> Soulbound NFT Minted</span>
                                            <a href={`https://amoy.polygonscan.com/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                                                View Ledger <ExternalLink size={12} />
                                            </a>
                                        </div>
                                        {job.review && (
                                            <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border-l-2 border-amber-500">
                                                <div className="flex items-center gap-1 text-amber-500 mb-2">
                                                    {[...Array(Number(job.rating))].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                                                    <span className="text-[10px] font-bold uppercase ml-2">Verified Review</span>
                                                </div>
                                                <p className="text-xs italic text-zinc-400">"{job.review}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </motion.section>
                </motion.main>
            </div>
        </div>
    );
}

export default Portfolio;
