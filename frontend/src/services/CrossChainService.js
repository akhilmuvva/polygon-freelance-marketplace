import { parseEther } from 'viem';
import { readContract, writeContract, waitForTransactionReceipt, estimateGas } from '@wagmi/core';
import { OMNI_REPUTATION_ADDRESS, CROSS_CHAIN_ESCROW_MANAGER_ADDRESS, CCIP_TOKEN_BRIDGE_ADDRESS } from '../constants';

// Basic ABI for OmniReputation interactions
const omniReputationAbi = [
    {
        "inputs": [
            { "internalType": "uint32", "name": "dstEid", "type": "uint32" },
            { "internalType": "bytes", "name": "options", "type": "bytes" }
        ],
        "name": "syncReputationToChain",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint32", "name": "dstEid", "type": "uint32" },
            { "internalType": "bytes", "name": "options", "type": "bytes" }
        ],
        "name": "estimateSyncFee",
        "outputs": [
            { "internalType": "uint256", "name": "nativeFee", "type": "uint256" },
            { "internalType": "uint256", "name": "lzTokenFee", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "user", "type": "address" }
        ],
        "name": "getAggregatedReputation",
        "outputs": [
            { "internalType": "uint256", "name": "totalScore", "type": "uint256" },
            { "internalType": "uint256", "name": "totalJobs", "type": "uint256" },
            { "internalType": "uint256", "name": "totalEarned", "type": "uint256" },
            { "internalType": "uint256", "name": "averageRating", "type": "uint256" },
            { "internalType": "uint32", "name": "activeChainCount", "type": "uint32" }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

class CrossChainService {
    /**
     * Get LayerZero Endpoint IDs for supported chains
     */
    static getSupportedChains() {
        return [
            { name: 'Ethereum Sepolia', eid: 40161, icon: 'eth' },
            { name: 'Arbitrum Sepolia', eid: 40231, icon: 'arb' },
            { name: 'Base Sepolia', eid: 40245, icon: 'base' }
        ];
    }

    /**
     * Estimate the fee required to sync reputation via LayerZero
     */
    static async estimateSyncFee(config, dstEid) {
        if (!OMNI_REPUTATION_ADDRESS || OMNI_REPUTATION_ADDRESS === '0x0000000000000000000000000000000000000000') {
            throw new Error("OmniReputation contract not deployed on this network.");
        }

        try {
            // LayerZero default options for simple execution (gas limit 200000)
            const options = '0x00030100110100000000000000000000000000030d40'; 
            
            const data = await readContract(config, {
                address: OMNI_REPUTATION_ADDRESS,
                abi: omniReputationAbi,
                functionName: 'estimateSyncFee',
                args: [dstEid, options]
            });
            
            return data[0]; // nativeFee
        } catch (error) {
            console.error("Error estimating sync fee:", error);
            // Return a fallback estimate if read fails (e.g. peer not set)
            return parseEther("0.02"); 
        }
    }

    /**
     * Sync reputation to a target chain
     */
    static async syncReputation(config, dstEid) {
        if (!OMNI_REPUTATION_ADDRESS || OMNI_REPUTATION_ADDRESS === '0x0000000000000000000000000000000000000000') {
            throw new Error("OmniReputation contract not deployed on this network.");
        }

        const options = '0x00030100110100000000000000000000000000030d40';
        const estimatedFee = await this.estimateSyncFee(config, dstEid);
        
        // Add a 10% buffer to the fee to handle minor fluctuations
        const valueToSend = estimatedFee * 110n / 100n;

        const hash = await writeContract(config, {
            address: OMNI_REPUTATION_ADDRESS,
            abi: omniReputationAbi,
            functionName: 'syncReputationToChain',
            args: [dstEid, options],
            value: valueToSend
        });

        return await waitForTransactionReceipt(config, { hash });
    }

    /**
     * Get aggregated reputation across all chains
     */
    static async getAggregatedReputation(config, userAddress) {
        if (!OMNI_REPUTATION_ADDRESS || OMNI_REPUTATION_ADDRESS === '0x0000000000000000000000000000000000000000') {
            return null;
        }

        try {
            const data = await readContract(config, {
                address: OMNI_REPUTATION_ADDRESS,
                abi: omniReputationAbi,
                functionName: 'getAggregatedReputation',
                args: [userAddress]
            });

            return {
                totalScore: data[0],
                totalJobs: data[1],
                totalEarned: data[2],
                averageRating: data[3],
                activeChainCount: data[4]
            };
        } catch (error) {
            console.warn("Could not fetch aggregated reputation:", error);
            return null;
        }
    }
}

export default CrossChainService;
