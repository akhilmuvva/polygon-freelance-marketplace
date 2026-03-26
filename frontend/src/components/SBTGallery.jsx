import React, { useState, useEffect } from 'react';
import { Award, Shield, CheckCircle, ExternalLink, Cpu, Zap, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import SubgraphService from '../services/SubgraphService';
import SovereignService from '../services/SovereignService';

const SBT_ABI = [
    { inputs: [{ internalType: "address", name: "owner", type: "address" }], name: "balanceOf", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
    { inputs: [{ internalType: "address", name: "owner", type: "address" }, { internalType: "uint256", name: "index", type: "uint256" }], name: "tokenOfOwnerByIndex", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
    { inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }], name: "tokenURI", outputs: [{ internalType: "string", name: "", type: "string" }], stateMutability: "view", type: "function" },
];

const cardBg = { padding: 24, borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' };
const dimLabel = { fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-tertiary)', marginBottom: 4, display: 'block' };

function SBTGallery({ address: propAddress }) {
    const { address: wagmiAddress } = useAccount();
    const address = propAddress || wagmiAddress;
    const [tokens, setTokens] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { if (address) fetchTokens(); }, [address]);

    const fetchTokens = async () => {
        if (!address) return;
        setLoading(true);
        try {
            const stats = await SubgraphService.getUserStats(address);
            const completedJobs = [
                ...(stats?.freelancer?.jobs || []),
                ...(stats?.client?.activeEscrows?.filter(e => e.status === 'COMPLETED') || [])
            ];
            
            const realTokens = await Promise.all(completedJobs.map(async (job) => {
                try {
                    const [onChainMetadata, tbaAddress] = await Promise.all([
                        SovereignService.getNFTMetadata(job.id),
                        SovereignService.getTBAAddress(job.id)
                    ]);
                    return {
                        id: job.id,
                        type: 'Completion',
                        title: onChainMetadata?.name || `Project ${job.id.slice(0, 8)}`,
                        category: onChainMetadata?.description || 'Technical Service',
                        image: onChainMetadata?.image, // This is the base64 SVG
                        tba: tbaAddress,
                        rating: Number(job.rating || 5),
                        date: new Date(Number(job.createdAt || 0) * 1000).toISOString().split('T')[0],
                        txHash: job.id
                    };
                } catch {
                    return {
                        id: job.id,
                        type: 'Completion',
                        title: job.ipfsHash ? `Project ${job.id.slice(0, 8)}` : 'Sovereign Contribution',
                        category: Number(job.categoryId) === 0 ? 'Fullstack' : 'Technical Service',
                        rating: Number(job.rating || 5),
                        date: new Date(Number(job.createdAt || 0) * 1000).toISOString().split('T')[0],
                        txHash: job.id
                    };
                }
            }));
            
            setTokens(realTokens);
        } catch (error) { 
            console.error("Failed to fetch SBTs:", error); 
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>
                        Soulbound <span style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>Vault</span>
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                        Your non-transferable proof of excellence on the Zenith Protocol.
                    </p>
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)',
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={dimLabel}>Verified Credentials</span>
                        <span style={{ fontSize: '1.3rem', fontWeight: 900 }}>{tokens.length}</span>
                    </div>
                    <div style={{
                        width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(124,92,252,0.12)', border: '1px solid rgba(124,92,252,0.2)', color: 'var(--accent-light)',
                    }}>
                        <Award size={20} />
                    </div>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton" style={{ height: 260, borderRadius: 14 }} />
                    ))}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
                    <AnimatePresence>
                        {tokens.map((token, index) => {
                            const isComplete = token.type === 'Completion';
                            const accentColor = isComplete ? '#34d399' : 'var(--accent-light)';
                            const accentBg = isComplete ? 'rgba(52,211,153,0.08)' : 'rgba(124,92,252,0.08)';
                            return (
                                <motion.div key={`${token.type}-${token.id}`}
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    style={{ ...cardBg, cursor: 'pointer', display: 'flex', flexDirection: 'column', transition: 'border-color 0.3s ease' }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,92,252,0.4)'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                                    {/* Type badge */}
                                    <div style={{ position: 'absolute', top: 16, right: 16 }}>
                                        <div style={{
                                            padding: 8, borderRadius: 12, background: accentBg, color: accentColor,
                                            border: '1px solid rgba(255,255,255,0.04)',
                                        }}>
                                            {isComplete ? <CheckCircle size={16} /> : <Zap size={16} />}
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: 20, borderRadius: 10, overflow: 'hidden', background: '#000', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                                        {token.image ? (
                                            <img src={token.image} alt={token.title} style={{ width: '100%', display: 'block' }} />
                                        ) : (
                                            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                                                <Award size={48} style={{ color: 'rgba(255,255,255,0.05)', marginBottom: 16 }} />
                                                <span style={dimLabel}>On-Chain Certificate</span>
                                            </div>
                                        )}
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
                                            <span style={{ ...dimLabel, margin: 0, color: '#fff' }}>#{token.id.slice(0, 6)}</span>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: 16 }}>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{token.title}</h3>
                                        <span style={{ ...dimLabel, color: accentColor }}>{token.category}</span>
                                    </div>

                                    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={12}
                                                        style={{
                                                            color: i < token.rating ? '#fbbf24' : 'rgba(255,255,255,0.08)',
                                                            fill: i < token.rating ? '#fbbf24' : 'none',
                                                        }} />
                                                ))}
                                            </div>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)' }}>{token.date}</span>
                                        </div>

                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.04)',
                                        }}>
                                            <div style={{
                                                width: 24, height: 24, borderRadius: '50%', background: 'rgba(52,211,153,0.1)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(52,211,153,0.2)'
                                            }}>
                                                <Shield size={12} style={{ color: '#34d399' }} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                <span style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bound Account (TBA)</span>
                                                <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#34d399', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {token.tba || 'Initializing...'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* Empty Slot */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{
                            ...cardBg, borderStyle: 'dashed', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 32,
                            transition: 'border-color 0.3s ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,92,252,0.25)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                        <div style={{
                            width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.04)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                        }}>
                            <Star size={24} style={{ color: 'var(--text-tertiary)' }} />
                        </div>
                        <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: 8 }}>Build Your Legacy</h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
                            Complete jobs with high ratings to earn Soulbound contribution certificates.
                        </p>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

export default SBTGallery;
