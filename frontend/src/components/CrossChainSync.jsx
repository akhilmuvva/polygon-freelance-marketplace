import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ArrowRight, Loader2, CheckCircle, RefreshCw } from 'lucide-react';
import { useConfig, useAccount } from 'wagmi';
import CrossChainService from '../services/CrossChainService';
import useTransaction from '../hooks/useTransaction';

const CrossChainSync = () => {
    const { address } = useAccount();
    const config = useConfig();
    const { executeTx, isPending } = useTransaction();
    const [aggregatedData, setAggregatedData] = useState(null);
    const [selectedChain, setSelectedChain] = useState(null);
    const [isFetching, setIsFetching] = useState(true);

    const chains = CrossChainService.getSupportedChains();

    useEffect(() => {
        if (!address) return;
        const fetchReputation = async () => {
            setIsFetching(true);
            try {
                const data = await CrossChainService.getAggregatedReputation(config, address);
                setAggregatedData(data);
            } catch (error) {
                console.error("Failed to fetch cross-chain data", error);
            }
            setIsFetching(false);
        };
        fetchReputation();
    }, [address, config]);

    const handleSync = async () => {
        if (!selectedChain) return;
        
        try {
            await executeTx(async () => {
                return await CrossChainService.syncReputation(config, selectedChain.eid);
            }, {
                pending: `Initiating LayerZero transfer to ${selectedChain.name}...`,
                success: `Reputation synced successfully to ${selectedChain.name}!`,
                error: `Failed to sync cross-chain`
            });
        } catch (error) {
            console.error("Sync error:", error);
        }
    };

    return (
        <div className="mt-8 p-6 rounded-2xl bg-zinc-900/50 border border-white/5 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400">
                    <Globe size={20} />
                </div>
                <div>
                    <h3 className="text-white font-medium">Omni-Chain Reputation</h3>
                    <p className="text-sm text-zinc-400">Powered by LayerZero v2</p>
                </div>
            </div>

            {isFetching ? (
                <div className="flex items-center justify-center p-4">
                    <Loader2 size={20} className="text-zinc-500 animate-spin" />
                </div>
            ) : aggregatedData ? (
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                        <div className="text-zinc-400 text-xs mb-1 uppercase tracking-wider">Aggregated Score</div>
                        <div className="text-2xl text-white font-light">{aggregatedData.totalScore?.toString() || '0'}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                        <div className="text-zinc-400 text-xs mb-1 uppercase tracking-wider">Active Chains</div>
                        <div className="text-2xl text-white font-light">{aggregatedData.activeChainCount?.toString() || '1'}</div>
                    </div>
                </div>
            ) : (
                <div className="text-sm text-amber-500/80 mb-6 bg-amber-500/10 p-3 rounded-lg">
                    OmniReputation contract not detected on this network.
                </div>
            )}

            <div className="space-y-3">
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Sync to Remote Chain</div>
                {chains.map((chain) => (
                    <button
                        key={chain.eid}
                        onClick={() => setSelectedChain(chain)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                            selectedChain?.eid === chain.eid 
                            ? 'bg-violet-500/10 border-violet-500/30 text-white' 
                            : 'bg-black/20 border-white/5 text-zinc-400 hover:border-white/10 hover:bg-white/[0.02]'
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            {chain.name}
                        </span>
                        {selectedChain?.eid === chain.eid && <CheckCircle size={16} className="text-violet-400" />}
                    </button>
                ))}

                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSync}
                    disabled={!selectedChain || isPending}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-200 transition-colors"
                >
                    {isPending ? (
                        <><Loader2 size={16} className="animate-spin" /> Bridging via LayerZero...</>
                    ) : (
                        <><RefreshCw size={16} /> Broadcast Reputation</>
                    )}
                </motion.button>
            </div>
        </div>
    );
};

export default CrossChainSync;
