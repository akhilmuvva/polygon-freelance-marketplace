import React, { useEffect, useRef } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { motion } from 'framer-motion';
import { Award, ExternalLink, ShieldCheck, Cpu } from 'lucide-react';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { CONTRACT_ADDRESS, SCANNER_URL } from '../constants';
import { useAnimeAnimations } from '../hooks/useAnimeAnimations';

const st = {
    header: {
        marginBottom: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: 32, borderRadius: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
        flexWrap: 'wrap', gap: 24
    },
    title: { fontSize: '3rem', fontWeight: 900, marginBottom: 8, letterSpacing: '-0.05em', color: '#fff' },
    subtitle: { color: 'var(--text-secondary)', fontWeight: 500, fontSize: '1rem', opacity: 0.8 },
    badge: {
        padding: '8px 20px', borderRadius: 12, background: 'rgba(124, 92, 252, 0.08)',
        border: '1px solid rgba(124, 92, 252, 0.2)', color: 'var(--accent-light)',
        fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em'
    },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 },
    card: {
        borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
        overflow: 'hidden', transition: 'all 0.3s ease'
    },
    cardContent: { padding: 24 }
};

function NFTGallery() {
    const { address, isConnected } = useAccount();
    const { staggerFadeIn, slideInLeft } = useAnimeAnimations();
    const headerRef = useRef(null);

    const { data: balance } = useReadContract({
        address: CONTRACT_ADDRESS, abi: FreelanceEscrowABI.abi, functionName: 'balanceOf', args: [address],
        query: { enabled: !!address },
    });

    const nftCount = balance ? Number(balance) : 0;

    useEffect(() => {
        if (headerRef.current) slideInLeft(headerRef.current);
        if (nftCount > 0) {
            setTimeout(() => staggerFadeIn('.nft-card-wrapper', 80), 300);
        }
    }, [nftCount]);

    return (
        <div style={{ width: '100%' }}>
            <header ref={headerRef} style={st.header}>
                <div>
                    <h1 style={st.title}>Proof-of-<span style={{ color: 'var(--accent-light)' }}>Work</span></h1>
                    <p style={st.subtitle}>Your verifiable on-chain career achievements and certificates.</p>
                </div>
                <div style={st.badge}>
                    <ShieldCheck size={16} /> Polygon Secure
                </div>
            </header>

            {!isConnected ? (
                <div style={{ ...st.card, padding: '80px 40px', textAlign: 'center', borderStyle: 'dashed' }}>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '1.1rem' }}>Please connect your wallet to view your certificates.</p>
                </div>
            ) : (
                <div style={st.grid}>
                    {nftCount === 0 ? (
                        <div style={{ ...st.card, padding: '80px 40px', textAlign: 'center', gridColumn: '1 / -1', borderStyle: 'dashed' }}>
                            <Cpu size={40} style={{ color: 'var(--text-tertiary)', marginBottom: 16, margin: '0 auto' }} />
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>No Certificates Found</h3>
                            <p style={{ color: 'var(--text-tertiary)' }}>Complete your first job to receive an automated NFT certificate.</p>
                        </div>
                    ) : (
                        Array.from({ length: nftCount }).map((_, i) => (
                            <div key={i} className="nft-card-wrapper">
                                <NFTCard balanceIndex={i} owner={address} />
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

function NFTCard({ balanceIndex, owner }) {
    const { data: tokenId } = useReadContract({
        address: CONTRACT_ADDRESS, abi: FreelanceEscrowABI.abi, functionName: 'tokenOfOwnerByIndex', args: [owner, BigInt(balanceIndex)],
    });

    const image = "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80";

    return (
        <motion.div whileHover={{ y: -6 }} style={st.card}>
            <div style={{ height: 220, position: 'relative', overflow: 'hidden' }}>
                <img src={image} alt="NFT" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.4))' }} />
            </div>
            <div style={st.cardContent}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-light)', marginBottom: 12 }}>
                    <Award size={18} />
                    <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Contribution Proof</span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 6, color: '#fff' }}>Gig #{tokenId?.toString() || '...'}</h3>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginBottom: 20 }}>
                    Successfully completed and verified on-chain.
                </p>
                <button
                    onClick={() => window.open(`${SCANNER_URL}/token/${CONTRACT_ADDRESS}?a=${tokenId}`, '_blank')}
                    className="btn btn-primary"
                    style={{ width: '100%', height: 42, borderRadius: 12, fontSize: '0.8rem', justifyContent: 'center' }}
                >
                    Explorer <ExternalLink size={14} />
                </button>
            </div>
        </motion.div>
    );
}

export default NFTGallery;
