import React, { useState, useEffect } from 'react';
import { 
    Search, Filter, Shield, Zap, Flame, Target, ChevronRight, 
    ArrowUpRight, ShoppingCart, CreditCard, Sparkles, RefreshCw, 
    Layers, Award, CheckCircle2, Info, X, Wallet, ArrowRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAccount, useWalletClient } from 'wagmi';
import MarketplaceService from '../services/MarketplaceService';
import { assertMatic } from '../utils/chainGuard';

const NFTMarketplace = () => {
    const { address, isConnected, chainId } = useAccount();
    const { data: walletClient } = useWalletClient();
    
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    
    // Acquisition Modal State
    const [selectedNFT, setSelectedNFT] = useState(null);
    const [isAcquiring, setIsAcquiring] = useState(false);
    const [useSwap, setUseSwap] = useState(false);
    const [paymentToken, setPaymentToken] = useState('0x0000000000000000000000000000000000000000'); // Default MATIC
    const [swapAmountIn, setSwapAmountIn] = useState('');

    useEffect(() => {
        const fetchMarketData = async () => {
            setLoading(true);
            try {
                // In a production environment, we'd fetch from Subgraph or MarketplaceService.getAllActiveListings()
                // For this demonstration, we'll continue with the high-fidelity mock data but structure it for real interaction
                const mockListings = [
                    {
                        id: '1',
                        listingId: '1',
                        title: 'Elite Smart Contract Audit NFT',
                        category: 'Service',
                        description: 'A sovereign verification proof for high-security DeFi protocols.',
                        price: '50',
                        currency: 'POL',
                        paymentToken: '0x0000000000000000000000000000000000000000',
                        seller: '0xSovereign...1a2',
                        image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=2832',
                        rating: 4.9,
                        sales: 12
                    },
                    {
                        id: '2',
                        listingId: '2',
                        title: 'Genesis Architecture Blueprint',
                        category: 'Artifact',
                        description: 'Foundational design patterns for the Zenith hyper-structure.',
                        price: '120',
                        currency: 'POL',
                        paymentToken: '0x0000000000000000000000000000000000000000',
                        seller: '0xArchitect...9f4',
                        image: 'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?auto=format&fit=crop&q=80&w=2832',
                        rating: 4.8,
                        sales: 8
                    },
                    {
                        id: '3',
                        listingId: '3',
                        title: 'Zero-Knowledge Proof Badge',
                        category: 'Identity',
                        description: 'Verified proof of identity without compromising sovereign privacy.',
                        price: '25',
                        currency: 'POL',
                        paymentToken: '0x0000000000000000000000000000000000000000',
                        seller: '0xPrivacy...3d1',
                        image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=2832',
                        rating: 5.0,
                        sales: 45
                    }
                ];
                setListings(mockListings);
                
                // Real data attempt
                // const realListings = await MarketplaceService.getAllActiveListings();
                // if (realListings.length > 0) setListings(realListings);
            } catch (err) {
                console.error('Marketplace sync error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchMarketData();
    }, []);

    const handleAcquisition = async () => {
        if (!selectedNFT || !walletClient) {
            toast.error('Identity not verified. Connect wallet to proceed.');
            return;
        }

        try {
            assertMatic(chainId); // 🔒 Hard-stop: all acquisitions must be on Polygon Mainnet
        } catch (err) {
            toast.error('Wrong Network: Switch to Polygon Mainnet (MATIC) to proceed.', { icon: '🛎️', duration: 6000 });
            return;
        }

        setIsAcquiring(true);
        const tid = toast.loading(`${useSwap ? 'Swapping and ' : ''}Executing Acquisition Protocol...`, { 
            style: { background: '#0a0a0f', color: '#fff', border: '1px solid rgba(124, 92, 252, 0.2)' } 
        });

        try {
            let hash;
            const priceInWei = BigInt(selectedNFT.price) * 10n**18n; // Assuming POL/MATIC 18 decimals

            if (useSwap) {
                // Execute Swap & Buy logic
                const params = MarketplaceService.getSwapAcquisitionParams(
                    { ...selectedNFT, price: priceInWei },
                    paymentToken,
                    BigInt(Number(swapAmountIn) * 1e18), 
                    0n, // slippage protection (can be refined)
                    walletClient
                );
                hash = await walletClient.writeContract(params);
            } else {
                // Direct Purchase
                const params = MarketplaceService.getAcquisitionParams(
                    { ...selectedNFT, price: priceInWei }, 
                    walletClient
                );
                hash = await walletClient.writeContract(params);
            }

            toast.update(tid, {
                render: `Acquisition Successful! Hash: ${hash.slice(0, 10)}...`,
                type: 'success',
                isLoading: false,
                autoClose: 5000
            });
            setSelectedNFT(null);
        } catch (error) {
            console.error('Acquisition failure:', error);
            toast.update(tid, {
                render: `Acquisition friction: ${error.shortMessage || error.message || 'Verification Error'}`,
                type: 'error',
                isLoading: false,
                autoClose: 5000
            });
        } finally {
            setIsAcquiring(false);
        }
    };

    const filteredListings = listings.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 100 }}>
            {/* Header Section */}
            <header style={{ marginBottom: 60 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#00f5d4', marginBottom: 12 }}>
                            <Flame size={18} />
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em' }}>Peer-to-Peer Sovereignty</span>
                        </div>
                        <h1 style={{ fontSize: '3.5rem', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 0.9, marginBottom: 16 }}>
                            Zenith <span style={{ color: 'rgba(255, 255, 255, 0.1)', letterSpacing: '-0.02em' }}>Exchange</span>
                        </h1>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '1.1rem', fontWeight: 500, maxWidth: 600 }}>
                            The decentralized hub for elite sovereign artifacts, technical services, and on-chain blueprints.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ padding: '8px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Target size={16} color="#00f5d4" />
                            <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>{listings.length} ACTIVE ARTIFACTS</span>
                        </div>
                    </div>
                </div>

                {/* Filters & Search */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 12px 12px 24px', borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', backdropFilter: 'blur(10px)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1 }}>
                        <Search size={20} color="var(--text-tertiary)" />
                        <input 
                            type="text" 
                            placeholder="Identify specific artifacts or services..." 
                            style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1rem', width: '100%', outline: 'none', fontWeight: 500 }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {['All', 'Service', 'Artifact', 'Identity'].map(cat => (
                            <button 
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                style={{ 
                                    padding: '8px 20px', 
                                    borderRadius: 12, 
                                    border: 'none', 
                                    background: filterCategory === cat ? 'var(--accent)' : 'transparent',
                                    color: filterCategory === cat ? '#fff' : 'var(--text-tertiary)',
                                    fontSize: '0.8rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 8px' }} />
                        <button style={{ padding: 10, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.03)', color: '#fff', cursor: 'pointer' }}>
                            <Filter size={18} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
                {filteredListings.map((nft, i) => (
                    <motion.div 
                        key={nft.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ y: -8 }}
                        className="card"
                        style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)', background: 'rgba(13, 13, 31, 0.4)' }}
                    >
                        <div style={{ position: 'relative', aspectRatio: '16/10', overflow: 'hidden' }}>
                            <img src={nft.image} alt={nft.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', top: 16, right: 16, padding: '6px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Sparkles size={14} color="#00f5d4" />
                                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#fff' }}>{nft.category.toUpperCase()}</span>
                            </div>
                        </div>

                        <div style={{ padding: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                <h3 style={{ fontSize: '1.3rem', fontWeight: 900, letterSpacing: '-0.02em', flex: 1 }}>{nft.title}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fbbf24', fontSize: '0.85rem', fontWeight: 800 }}>
                                    <Award size={14} fill="#fbbf24" />
                                    {nft.rating}
                                </div>
                            </div>
                            
                            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 24, height: 42, overflow: 'hidden' }}>
                                {nft.description}
                            </p>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                                <div>
                                    <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-tertiary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Current Bid/Price</div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 900, fontStyle: 'italic', display: 'flex', alignItems: 'baseline', gap: 4 }}>
                                        {nft.price} <span style={{ fontSize: '0.7rem', color: '#00f5d4', fontStyle: 'normal' }}>{nft.currency}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedNFT(nft)}
                                    className="btn-primary" 
                                    style={{ padding: '10px 18px', borderRadius: 12, gap: 8, fontSize: '0.75rem', fontWeight: 900 }}
                                >
                                    Acquire <ChevronRight size={16} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #00f5d4)' }} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{nft.seller}</span>
                                </div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-tertiary)' }}>{nft.sales} ACQUISITIONS</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Acquisition Modal with SWAP Support */}
            <AnimatePresence>
                {selectedNFT && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="card"
                            style={{ width: '100%', maxWidth: 500, padding: 32, border: '1px solid var(--accent-light)' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Initiate Acquisition</h2>
                                <button onClick={() => setSelectedNFT(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}><X size={24} /></button>
                            </div>

                            <div style={{ padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', marginBottom: 24 }}>
                                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                                    <img src={selectedNFT.image} style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover' }} />
                                    <div>
                                        <h4 style={{ fontWeight: 800, color: '#fff' }}>{selectedNFT.title}</h4>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{selectedNFT.category}</span>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 900, marginTop: 4 }}>{selectedNFT.price} <span style={{ fontSize: '0.65rem', color: '#00f5d4' }}>{selectedNFT.currency}</span></div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(124, 92, 252, 0.05)', borderRadius: 10, border: '1px solid rgba(124, 92, 252, 0.1)' }}>
                                    <Shield size={14} color="var(--accent-light)" />
                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>ESCROWED SMART CONTRACT TRANSACTION</span>
                                </div>
                            </div>

                            {/* Swap Toggle */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Payment Method</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: !useSwap ? 'var(--accent-light)' : 'var(--text-tertiary)' }}>Direct</span>
                                        <div 
                                            onClick={() => setUseSwap(!useSwap)}
                                            style={{ 
                                                width: 44, height: 24, borderRadius: 12, background: useSwap ? 'var(--accent)' : 'rgba(255,255,255,0.1)', 
                                                position: 'relative', cursor: 'pointer', transition: 'background 0.3s' 
                                            }}
                                        >
                                            <motion.div 
                                                animate={{ x: useSwap ? 22 : 2 }}
                                                style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2 }}
                                            />
                                        </div>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: useSwap ? 'var(--accent-light)' : 'var(--text-tertiary)' }}>Auto-Swap</span>
                                    </div>
                                </div>

                                {useSwap ? (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                         <div className="input-group-glass">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                <label className="form-label" style={{ margin: 0 }}>Pay with Token</label>
                                                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent-light)' }}><RefreshCw size={10} style={{ marginRight: 4 }} /> UNISWAP V3 ROUTE</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <select className="form-input" style={{ flex: 1 }} value={paymentToken} onChange={e => setPaymentToken(e.target.value)}>
                                                    <option value="0x0000000000000000000000000000000000000000">MATIC</option>
                                                    <option value="0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359">USDC</option>
                                                    <option value="0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063">DAI</option>
                                                </select>
                                                <input 
                                                    className="form-input" 
                                                    style={{ flex: 1.5 }} 
                                                    type="number" 
                                                    placeholder="Amt to swap..." 
                                                    value={swapAmountIn}
                                                    onChange={e => setSwapAmountIn(e.target.value)}
                                                />
                                            </div>
                                            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-tertiary)', fontSize: '0.65rem' }}>
                                                <RefreshCw size={12} />
                                                Estimated slippage: <span style={{ color: 'var(--success)' }}>&lt; 0.5%</span>
                                            </div>
                                         </div>
                                    </motion.div>
                                ) : (
                                    <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <Wallet size={18} color="var(--accent-light)" />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Direct Payment (Native)</div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Lower gas costs. No routing fee.</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={handleAcquisition}
                                disabled={isAcquiring || (useSwap && !swapAmountIn)}
                                className="btn-primary" 
                                style={{ width: '100%', height: 54, borderRadius: 16, fontSize: '1rem', fontWeight: 900, background: 'linear-gradient(135deg, var(--accent), var(--accent-light))' }}
                            >
                                {isAcquiring ? (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><RefreshCw className="animate-spin" size={20} /> VERIFYING STATUS...</span>
                                ) : (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{useSwap ? <RefreshCw size={20} /> : <ArrowRight size={20} />} {useSwap ? 'SWAP & ACQUIRE' : 'AUTHORIZE ACQUISITION'}</span>
                                )}
                            </button>
                            
                            <p style={{ marginTop: 20, textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                                By initiating this transaction, you are interacting with the sovereign Zenith Protocol. Assets are immediately transmitted to your wallet upon confirmation.
                            </p>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NFTMarketplace;
