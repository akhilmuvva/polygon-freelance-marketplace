import React, { useState, useEffect } from 'react';
import { 
    Search, Filter, Shield, Zap, Flame, Target, ChevronRight, 
    ArrowUpRight, ShoppingCart, CreditCard, Sparkles, RefreshCw, 
    Layers, Award, CheckCircle2, Info, X, Wallet, ArrowRight,
    Search as SearchIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAccount, useWalletClient } from 'wagmi';
import MarketplaceService from '../services/MarketplaceService';
import { assertMatic } from '../utils/chainGuard';
import './NFTMarketplace.css';

/**
 * Zenith Artifact Exchange
 * Peer-to-peer sovereign artifact and service marketplace.
 */
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
                // High-fidelity mock data for demonstration
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
                    },
                    {
                        id: '4',
                        listingId: '4',
                        title: 'Quantum-Safe Encryption Module',
                        category: 'Artifact',
                        description: 'State-of-the-art cryptographic primitives for post-quantum environments.',
                        price: '200',
                        currency: 'POL',
                        paymentToken: '0x0000000000000000000000000000000000000000',
                        seller: '0xCypher...a82',
                        image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=2832',
                        rating: 4.9,
                        sales: 5
                    }
                ];
                setListings(mockListings);
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
            assertMatic(chainId);
        } catch (err) {
            toast.error('Switch to Polygon Mainnet (POL) to proceed.');
            return;
        }

        setIsAcquiring(true);
        const tid = toast.loading(`${useSwap ? 'Swapping and ' : ''}Executing Acquisition Protocol...`);

        try {
            let hash;
            const priceInWei = BigInt(selectedNFT.price) * 10n**18n;

            if (useSwap) {
                const params = MarketplaceService.getSwapAcquisitionParams(
                    { ...selectedNFT, price: priceInWei },
                    paymentToken,
                    BigInt(Number(swapAmountIn) * 1e18), 
                    0n, 
                    walletClient
                );
                hash = await walletClient.writeContract(params);
            } else {
                const params = MarketplaceService.getAcquisitionParams(
                    { ...selectedNFT, price: priceInWei }, 
                    walletClient
                );
                hash = await walletClient.writeContract(params);
            }

            toast.success('Acquisition Successful!', { id: tid });
            setSelectedNFT(null);
        } catch (error) {
            toast.error(`Acquisition failure: ${error.shortMessage || 'Error'}`, { id: tid });
        } finally {
            setIsAcquiring(false);
        }
    };

    const filteredListings = listings.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 100, damping: 15 }
        }
    };

    return (
        <div className="marketplace-container">
            {/* Header Section */}
            <motion.header 
                className="marketplace-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <div className="hero-subtitle">
                    <Flame size={18} />
                    <span>Peer-to-Peer Sovereignty</span>
                </div>
                <h1>
                    Zenith <span className="dim">Exchange</span>
                </h1>
                <p className="hero-desc">
                    The decentralized hub for elite sovereign artifacts, technical services, and on-chain blueprints.
                </p>
            </motion.header>

            {/* Filters & Search */}
            <motion.div 
                className="filter-bar"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="search-input-wrapper">
                    <SearchIcon size={20} color="var(--text-tertiary)" />
                    <input 
                        type="text" 
                        placeholder="Identify specific artifacts or services..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-actions">
                    {['All', 'Service', 'Artifact', 'Identity'].map(cat => (
                        <button 
                            key={cat}
                            className={`cat-btn ${filterCategory === cat ? 'active' : ''}`}
                            onClick={() => setFilterCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                    <div className="divider-v" />
                    <button className="icon-btn glass">
                        <Filter size={18} />
                    </button>
                </div>
            </motion.div>

            {/* Grid */}
            <motion.div 
                className="nft-grid"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {filteredListings.map((nft) => (
                    <motion.div 
                        key={nft.id}
                        variants={itemVariants}
                        className="nft-card"
                    >
                        <div className="nft-image-wrapper">
                            <img src={nft.image} alt={nft.title} />
                            <div className="category-tag">
                                <Sparkles size={14} color="#8b5cf6" />
                                <span>{nft.category}</span>
                            </div>
                        </div>

                        <div className="nft-info">
                            <div className="nft-title-row">
                                <h3>{nft.title}</h3>
                                <div className="rating-badge">
                                    <Award size={14} fill="#fbbf24" />
                                    {nft.rating}
                                </div>
                            </div>
                            
                            <p className="nft-description">
                                {nft.description}
                            </p>

                            <div className="nft-price-row">
                                <div>
                                    <span className="price-label">Current Value</span>
                                    <div className="price-value">
                                        {nft.price} <span>{nft.currency}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedNFT(nft)}
                                    className="zenith-btn primary sm"
                                >
                                    Acquire <ChevronRight size={16} />
                                </button>
                            </div>

                            <div className="nft-footer">
                                <div className="seller-info">
                                    <div className="seller-avatar" />
                                    <span className="seller-address">{nft.seller}</span>
                                </div>
                                <span className="sales-count">{nft.sales} ACQUISITIONS</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Acquisition Modal */}
            <AnimatePresence>
                {selectedNFT && (
                    <div className="modal-overlay">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="acquisition-modal"
                        >
                            <button className="modal-close" onClick={() => setSelectedNFT(null)}>
                                <X size={24} />
                            </button>

                            <h2 className="modal-title">Initiate Acquisition</h2>

                            <div className="nft-preview-box">
                                <img src={selectedNFT.image} alt="NFT Preview" />
                                <div>
                                    <h4>{selectedNFT.title}</h4>
                                    <span className="category-label">{selectedNFT.category}</span>
                                    <div className="modal-price">{selectedNFT.price} <span>{selectedNFT.currency}</span></div>
                                </div>
                            </div>

                            <div className="payment-method-selector">
                                <div className="payment-toggle-row">
                                    <span className="label">Auto-Swap Protocol</span>
                                    <div 
                                        className={`zenith-toggle ${useSwap ? 'active' : ''}`}
                                        onClick={() => setUseSwap(!useSwap)}
                                    >
                                        <div className="toggle-handle" />
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    {useSwap ? (
                                        <motion.div 
                                            key="swap"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="swap-input-group"
                                        >
                                            <div className="swap-fields">
                                                <select className="token-select" value={paymentToken} onChange={e => setPaymentToken(e.target.value)}>
                                                    <option value="0x00...0">POL</option>
                                                    <option value="0x3c...59">USDC</option>
                                                    <option value="0x8f...63">DAI</option>
                                                </select>
                                                <input 
                                                    className="amount-input" 
                                                    type="number" 
                                                    placeholder="Amount..." 
                                                    value={swapAmountIn}
                                                    onChange={e => setSwapAmountIn(e.target.value)}
                                                />
                                            </div>
                                            <div className="slippage-info">
                                                <RefreshCw size={12} />
                                                Estimated slippage: <span className="success">&lt; 0.5%</span>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div 
                                            key="direct"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="direct-payment-box glass"
                                        >
                                            <Wallet size={18} />
                                            <div>
                                                <div className="method-title">Direct Payment (Native)</div>
                                                <div className="method-desc">Optimized for minimal gas consumption.</div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <button 
                                onClick={handleAcquisition}
                                disabled={isAcquiring || (useSwap && !swapAmountIn)}
                                className="zenith-btn primary lg full-width"
                            >
                                {isAcquiring ? (
                                    <><RefreshCw className="animate-spin" size={20} /> VERIFYING...</>
                                ) : (
                                    <>{useSwap ? <RefreshCw size={20} /> : <ArrowRight size={20} />} {useSwap ? 'SWAP & ACQUIRE' : 'AUTHORIZE ACQUISITION'}</>
                                )}
                            </button>
                            
                            <p className="modal-disclaimer">
                                Assets are transmitted via sovereign escrow. By authorizing, you agree to the Zenith protocol terms.
                            </p>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NFTMarketplace;
