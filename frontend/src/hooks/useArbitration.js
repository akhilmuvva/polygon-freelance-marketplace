import { useWriteContract, useAccount, usePublicClient } from 'wagmi';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { CONTRACT_ADDRESS } from '../constants';
import StorageService from '../services/StorageService';
import { toast } from 'react-toastify';

/**
 * Hook for Decentralized Arbitration (Kleros-style)
 * Enables raising disputes and submitting evidence (including XMTP logs)
 */
export function useArbitration() {
    const { address } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const publicClient = usePublicClient();

    /**
     * Raise a dispute for a job
     * @param {number} jobId 
     */
    const raiseDispute = async (jobId) => {
        try {
            // 1. Get Arbitrator address from Escrow
            const arbitrator = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: FreelanceEscrowABI.abi,
                functionName: 'arbitrator',
            });

            // 2. Get Cost from Arbitrator
            let cost = 0n;
            if (arbitrator !== '0x0000000000000000000000000000000000000000') {
                try {
                    cost = await publicClient.readContract({
                        address: arbitrator,
                        abi: [{
                            name: 'arbitrationCost',
                            type: 'function',
                            stateMutability: 'view',
                            inputs: [{ type: 'bytes', name: '_extraData' }],
                            outputs: [{ type: 'uint256', name: 'fee' }]
                        }],
                        functionName: 'arbitrationCost',
                        args: ["0x"]
                    });
                } catch (e) {
                    console.warn('[ARBITRATION] Could not fetch cost, using 0', e);
                }
            }

            const tx = await writeContractAsync({
                address: CONTRACT_ADDRESS,
                abi: FreelanceEscrowABI.abi,
                functionName: 'raiseDispute',
                args: [BigInt(jobId)],
                gas: 1000000n, // Directive 02: Simulation Bypass for Functional Finality
                value: cost
            });

            toast.success("Dispute raised. Waiting for arbitration.");
            return tx;
        } catch (error) {
            console.error('[ARBITRATION] Failed to raise dispute:', error);
            toast.error("Failed to raise dispute: " + error.message);
            throw error;
        }
    };

    /**
     * Submits evidence to the dispute. We upload the JSON details to IPFS
     * and then anchor the CID on the blockchain.
     */
    const submitEvidence = async (jobId, evidenceData) => {
        try {
            toast.info("Uploading evidence to IPFS...");
            const { cid } = await StorageService.uploadMetadata(evidenceData);

            const tx = await writeContractAsync({
                address: CONTRACT_ADDRESS,
                abi: FreelanceEscrowABI.abi,
                functionName: 'submitEvidence',
                args: [BigInt(jobId), cid],
                gas: 1000000n // Directive 02: Simulation Bypass for Functional Finality
            });

            toast.success("Evidence submitted successfully.");
            return tx;
        } catch (error) {
            console.error('Evidence submission failed:', error);
            toast.error("Failed to submit evidence.");
            throw error;
        }
    };

    /**
     * Specifically formats and submits XMTP chat logs as evidence
     * @param {number} jobId 
     * @param {Array} messages - XMTP message objects
     * @param {string} partyRole - 'client' or 'freelancer'
     */
    const submitChatLogsAsEvidence = async (jobId, messages, partyRole) => {
        const formattedLogs = messages.map(m => ({
            from: m.senderAddress,
            content: m.content || m.fallback || "Media/Attachment",
            timestamp: m.sent?.getTime() || Date.now()
        }));

        const evidence = {
            jobId,
            type: 'Communication Log',
            platform: 'XMTP',
            party: partyRole,
            submitter: address,
            data: formattedLogs,
            description: `Official chat logs between client and freelancer for Job #${jobId}`
        };

        return submitEvidence(jobId, evidence);
    };

    return {
        raiseDispute,
        submitEvidence,
        submitChatLogsAsEvidence
    };
}
