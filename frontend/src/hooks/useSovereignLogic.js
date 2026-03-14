import { useState, useCallback } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { messagingService } from '../services/MessagingService';
import ceramicService from '../services/CeramicService';
import { GravityScoreService } from '../services/GravityScoreService';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { CONTRACT_ADDRESS } from '../constants';
import { toast as hotToast } from 'react-hot-toast';

/**
 * useSovereignLogic: The mission-critical logic orchestrator for PolyLance Zenith.
 * Enforces Absolute Zero Gravity by bypassing centralized state managers.
 */
export const useSovereignLogic = () => {
    const { address } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const [isActuating, setIsActuating] = useState(false);

    /**
     * actuateEscrow: Finalizes the transition of capital into the yield-bearing mesh.
     * If no freelancer is assigned, the "Intent" is safely anchored on Ceramic.
     */
    const actuateEscrow = useCallback(async (jobData) => {
        if (!address) throw new Error("Identity required for actuation.");
        setIsActuating(true);
        
        try {
            if (jobData.freelancer && jobData.freelancer !== '0x0000000000000000000000000000000000000000') {
                // 100% On-chain Execution via Wagmi
                const tx = await writeContractAsync({
                    address: CONTRACT_ADDRESS,
                    abi: FreelanceEscrowABI.abi,
                    functionName: 'createJob',
                    args: [{
                        categoryId: BigInt(jobData.categoryId || 0),
                        freelancer: jobData.freelancer,
                        token: jobData.token, // Must be whitelisted asset
                        amount: BigInt(jobData.amount),
                        ipfsHash: jobData.ipfsHash,
                        deadline: BigInt(jobData.deadline),
                        mAmounts: jobData.mAmounts?.map(m => BigInt(m)) || [],
                        mHashes: jobData.mHashes || [],
                        mIsUpfront: jobData.mIsUpfront || [],
                        yieldStrategy: jobData.yieldStrategy || 0,
                        paymentToken: jobData.token,
                        paymentAmount: BigInt(jobData.amount),
                        minAmountOut: 0n
                    }],
                    value: jobData.token === '0x0000000000000000000000000000000000000000' ? BigInt(jobData.amount) : 0n
                });
                hotToast.success('Capital Actuated on Polygon.');
                return tx;
            } else {
                // "Job Intent" storage on Ceramic (Weightless fallback)
                console.info('[SOVEREIGN] Freelancer unassigned. Anchoring Job Intent on Ceramic...');
                const result = await ceramicService.updateProfile(address, {
                    type: 'JOB_INTENT',
                    data: jobData,
                    timestamp: Date.now()
                });
                hotToast.success('Job Intent anchored in the Weightless Data Layer.');
                return result;
            }
        } catch (err) {
            console.error('[GRAVITY] Actuation Friction:', err);
            hotToast.error('Actuation failed. Check RPC resonance.');
            throw err;
        } finally {
            setIsActuating(false);
        }
    }, [address, writeContractAsync]);

    /**
     * syncMessaging: Initializes the XMTP V3 singleton.
     * Ensures the SovereignHandshake (signature) is verified before clearing state.
     */
    const syncMessaging = useCallback(async (walletClient) => {
        if (!address || !walletClient) return null;
        try {
            hotToast.loading('Actuating Sovereign Handshake...', { id: 'xmtp-init' });
            const client = await messagingService.initialize(address, walletClient);
            hotToast.success('Sovereign Channel Synchronized.', { id: 'xmtp-init' });
            return client;
        } catch (err) {
            hotToast.error('Handshake Neutralized.', { id: 'xmtp-init' });
            throw err;
        }
    }, [address]);

    /**
     * calculateGravity: Computes the risk-weighted friction for RWA liquidity.
     */
    const calculateGravity = useCallback((metrics) => {
        return GravityScoreService.computeFriction(metrics);
    }, []);

    return {
        actuateEscrow,
        syncMessaging,
        calculateGravity,
        isActuating
    };
};
