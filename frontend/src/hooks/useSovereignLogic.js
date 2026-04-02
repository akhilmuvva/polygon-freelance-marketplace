import { useState, useCallback } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { messagingService } from '../services/MessagingService';
import ceramicService from '../services/CeramicService';
import { GravityScoreService } from '../services/GravityScoreService';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { CONTRACT_ADDRESS } from '../constants';
import { toast } from 'react-hot-toast';
import { assertMatic } from '../utils/chainGuard';

/**
 * useFreelanceLogic
 * Core hook for job creation and messaging setup.
 * Handles both on-chain escrow creation and off-chain job drafts.
 */
export const useSovereignLogic = () => {
    const { address, chainId } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * createJob: Submits a new job to the FreelanceEscrow contract.
     * If no freelancer is assigned yet, saves the job as a draft to Ceramic.
     */
    const actuateEscrow = useCallback(async (jobData) => {
        if (!address) throw new Error('Wallet not connected.');
        assertMatic(chainId); // must be on Polygon Mainnet
        setIsSubmitting(true);

        try {
            if (jobData.freelancer && jobData.freelancer !== '0x0000000000000000000000000000000000000000') {
                // Submit job on-chain
                const tx = await writeContractAsync({
                    address: CONTRACT_ADDRESS,
                    abi: FreelanceEscrowABI.abi,
                    functionName: 'createJob',
                    args: [{
                        categoryId: BigInt(jobData.categoryId || 0),
                        freelancer: jobData.freelancer,
                        token: jobData.token,
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
                toast.success('Job created on Polygon.');
                return tx;
            } else {
                // Save as draft on Ceramic (no freelancer assigned yet)
                console.info('[Jobs] Saving draft — no freelancer assigned yet.');
                const result = await ceramicService.updateProfile(address, {
                    type: 'JOB_DRAFT',
                    data: jobData,
                    timestamp: Date.now()
                });
                toast.success('Job draft saved.');
                return result;
            }
        } catch (err) {
            console.error('[Jobs] Failed to create job:', err);
            toast.error('Job creation failed. Please try again.');
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    }, [address, chainId, writeContractAsync]);

    /**
     * initMessaging: Sets up the XMTP client for the connected wallet.
     * Signs a message to authenticate with XMTP v3.
     */
    const syncMessaging = useCallback(async (walletClient) => {
        if (!address || !walletClient) return null;
        try {
            toast.loading('Connecting to messaging...', { id: 'xmtp-init' });
            const client = await messagingService.initialize(address, walletClient);
            toast.success('Messaging connected.', { id: 'xmtp-init' });
            return client;
        } catch (err) {
            toast.error('Failed to connect messaging.', { id: 'xmtp-init' });
            throw err;
        }
    }, [address]);

    /**
     * calculateRiskScore: Runs the risk scoring model for a given set of metrics.
     */
    const calculateGravity = useCallback((metrics) => {
        return GravityScoreService.computeFriction(metrics);
    }, []);

    return {
        actuateEscrow,
        syncMessaging,
        calculateGravity,
        isActuating: isSubmitting
    };
};
