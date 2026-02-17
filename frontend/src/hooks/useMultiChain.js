import { useState, useEffect } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { ethers } from 'ethers';

// Chain configurations
const SUPPORTED_CHAINS = {
    137: { // Polygon
        name: 'Polygon',
        ccipSelector: '4051577828743386545',
        lzEid: 30109,
        icon: '🟣',
        color: '#8247E5',
        explorer: 'https://polygonscan.com'
    },
    1: { // Ethereum
        name: 'Ethereum',
        ccipSelector: '5009297550715157269',
        lzEid: 30101,
        icon: '⟠',
        color: '#627EEA',
        explorer: 'https://etherscan.io'
    },
    8453: { // Base
        name: 'Base',
        ccipSelector: '15971525489660198786',
        lzEid: 30184,
        icon: '🔵',
        color: '#0052FF',
        explorer: 'https://basescan.org'
    },
    42161: { // Arbitrum
        name: 'Arbitrum',
        ccipSelector: '4949039107694359620',
        lzEid: 30110,
        icon: '🔷',
        color: '#28A0F0',
        explorer: 'https://arbiscan.io'
    },
    // Testnets
    80002: { // Polygon Amoy
        name: 'Polygon Amoy',
        ccipSelector: '16281711391670634445',
        lzEid: 40267,
        icon: '🟣',
        color: '#8247E5',
        explorer: 'https://amoy.polygonscan.com'
    },
    11155111: { // Sepolia
        name: 'Sepolia',
        ccipSelector: '16015286601757825753',
        lzEid: 40161,
        icon: '⟠',
        color: '#627EEA',
        explorer: 'https://sepolia.etherscan.io'
    },
    84532: { // Base Sepolia
        name: 'Base Sepolia',
        ccipSelector: '10344971235874465080',
        lzEid: 40245,
        icon: '🔵',
        color: '#0052FF',
        explorer: 'https://sepolia.basescan.org'
    },
    421614: { // Arbitrum Sepolia
        name: 'Arbitrum Sepolia',
        ccipSelector: '3478487238524512106',
        lzEid: 40231,
        icon: '🔷',
        color: '#28A0F0',
        explorer: 'https://sepolia.arbiscan.io'
    },
    'solana': { // Solana Mainnet
        name: 'Solana',
        wormholeId: 1,
        lzEid: 30168,
        icon: '☀️',
        color: '#14F195',
        explorer: 'https://explorer.solana.com'
    },
    'solana-devnet': { // Solana Devnet
        name: 'Solana Devnet',
        wormholeId: 1,
        lzEid: 40168,
        icon: '☀️',
        color: '#14F195',
        explorer: 'https://explorer.solana.com?cluster=devnet'
    }
};

export const useMultiChain = () => {
    const { address, chain } = useAccount();
    const { switchChain } = useSwitchChain();
    const signer = useEthersSigner();

    const [balances, setBalances] = useState({});
    const [loading, setLoading] = useState(false);

    const currentChain = chain?.id ? SUPPORTED_CHAINS[chain.id] : null;

    // Get chain info by chain ID
    const getChainInfo = (chainId) => {
        return SUPPORTED_CHAINS[chainId] || null;
    };

    // Get all supported chain IDs
    const getSupportedChainIds = () => {
        return Object.keys(SUPPORTED_CHAINS).map(Number);
    };

    // Get mainnet chains only
    const getMainnetChains = () => {
        return Object.entries(SUPPORTED_CHAINS)
            .filter(([id]) => [137, 1, 8453, 42161, 'solana'].includes(id))
            .map(([id, info]) => ({ id, ...info }));
    };

    // Get testnet chains only
    const getTestnetChains = () => {
        return Object.entries(SUPPORTED_CHAINS)
            .filter(([id]) => [80002, 11155111, 84532, 421614, 'solana-devnet'].includes(id))
            .map(([id, info]) => ({ id, ...info }));
    };

    // Switch to a specific chain
    const switchToChain = async (chainId) => {
        if (!switchChain) {
            console.error('Switch chain not available');
            return false;
        }

        try {
            await switchChain({ chainId });
            return true;
        } catch (error) {
            console.error('Failed to switch network:', error);
            return false;
        }
    };

    // Fetch balances across all chains
    const fetchBalancesAcrossChains = async () => {
        if (!address) return;

        setLoading(true);
        const newBalances = {};

        try {
            for (const [chainId, chainInfo] of Object.entries(SUPPORTED_CHAINS)) {
                try {
                    // Create provider for each chain
                    const provider = new ethers.JsonRpcProvider(getRpcUrl(Number(chainId)));
                    const balance = await provider.getBalance(address);
                    newBalances[chainId] = {
                        native: ethers.formatEther(balance),
                        chainInfo
                    };
                } catch (error) {
                    console.error(`Failed to fetch balance for chain ${chainId}:`, error);
                    newBalances[chainId] = {
                        native: '0',
                        chainInfo,
                        error: true
                    };
                }
            }

            setBalances(newBalances);
        } catch (error) {
            console.error('Failed to fetch balances:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get RPC URL for a chain
    const getRpcUrl = (chainId) => {
        const rpcUrls = {
            137: 'https://polygon-rpc.com',
            1: 'https://eth.llamarpc.com',
            8453: 'https://mainnet.base.org',
            42161: 'https://arb1.arbitrum.io/rpc',
            80002: 'https://rpc.ankr.com/polygon_amoy',
            11155111: 'https://rpc.sepolia.org',
            84532: 'https://sepolia.base.org',
            421614: 'https://sepolia-rollup.arbitrum.io/rpc',
            'solana': 'https://api.mainnet-beta.solana.com',
            'solana-devnet': 'https://api.devnet.solana.com'
        };
        return rpcUrls[chainId] || '';
    };

    // Estimate cross-chain fee
    const estimateCrossChainFee = async (
        destinationChainId,
        messageType,
        contractAddress
    ) => {
        if (!signer) return null;

        try {
            // This would call the actual contract method
            // For now, return estimated fees based on chain
            const baseFee = {
                137: 0.5,  // Polygon
                1: 15,     // Ethereum
                8453: 0.3, // Base
                42161: 0.4 // Arbitrum
            };

            const destinationFee = baseFee[destinationChainId] || 1;
            return {
                nativeFee: destinationFee,
                usdFee: destinationFee * 2000, // Rough estimate
                currency: currentChain?.name || 'ETH'
            };
        } catch (error) {
            console.error('Failed to estimate fee:', error);
            return null;
        }
    };

    // Check if chain is supported
    const isChainSupported = (chainId) => {
        return chainId in SUPPORTED_CHAINS;
    };

    // Get CCIP selector for current chain
    const getCurrentCCIPSelector = () => {
        return currentChain?.ccipSelector || null;
    };

    // Get LayerZero EID for current chain
    const getCurrentLzEid = () => {
        return currentChain?.lzEid || null;
    };

    useEffect(() => {
        if (address) {
            fetchBalancesAcrossChains();
        }
    }, [address]);

    return {
        currentChain,
        balances,
        loading,
        getChainInfo,
        getSupportedChainIds,
        getMainnetChains,
        getTestnetChains,
        switchToChain,
        fetchBalancesAcrossChains,
        estimateCrossChainFee,
        isChainSupported,
        getCurrentCCIPSelector,
        getCurrentLzEid,
        SUPPORTED_CHAINS
    };
};
