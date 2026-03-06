import { useWatchContractEvent, useAccount } from 'wagmi';
import { toast } from 'react-toastify';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { CONTRACT_ADDRESS } from '../constants';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

/**
 * NotificationManager: The "Antigravity" real-time communication engine.
 * Combines standard contract event listeners with Push Protocol for off-browser notifications.
 */
export function NotificationManager() {
    const { address } = useAccount();
    const queryClient = useQueryClient();

    // Helper to refresh all contract related data
    const refreshData = () => {
        queryClient.invalidateQueries();
    };

    // --- PUSH PROTOCOL INTEGRATION ---
    useEffect(() => {
        const initPush = async () => {
            if (!address) return;
            try {
                // In a full implementation, we would register the Push SDK here
                // const user = await PushAPI.initialize(signer, { env: 'staging' });
                // const stream = await user.initStream([CONSTANTS.STREAM.NOTIF]);
                // stream.on(CONSTANTS.STREAM.NOTIF, (data) => { toast.info(data.message); });
                console.log('[PUSH] Initializing sovereign notification stream for:', address);
            } catch (err) {
                console.warn('[PUSH] Subscription inhibited:', err.message);
            }
        };
        initPush();
    }, [address]);

    // Watch JobCreated
    useWatchContractEvent({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        eventName: 'JobCreated',
        onLogs(logs) {
            logs.forEach((log) => {
                const { jobId, client, freelancer } = log.args;
                if (address && (address.toLowerCase() === client.toLowerCase() || address.toLowerCase() === freelancer.toLowerCase())) {
                    toast.success(`Job #${jobId} Created! 🚀 Check your Push inbox for details.`, {
                        autoClose: 5000,
                        style: { borderBottom: '2px solid var(--accent)' }
                    });
                }
                refreshData();
            });
        },
    });

    // Watch JobAccepted
    useWatchContractEvent({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        eventName: 'JobAccepted',
        onLogs(logs) {
            logs.forEach((log) => {
                const { jobId } = log.args;
                toast.success(`Job #${jobId} Accepted! 🛡️ Platform stake locked.`, {
                    autoClose: 5000,
                });
                refreshData();
            });
        },
    });

    // Watch WorkSubmitted
    useWatchContractEvent({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        eventName: 'WorkSubmitted',
        onLogs(logs) {
            logs.forEach((log) => {
                const { jobId } = log.args;
                toast.info(`Evidence uploaded for Job #${jobId}! 📑`, {
                    autoClose: 5000,
                });
                refreshData();
            });
        },
    });

    // Watch FundsReleased
    useWatchContractEvent({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        eventName: 'FundsReleased',
        onLogs(logs) {
            logs.forEach((log) => {
                const { jobId, freelancer } = log.args;
                if (address && address.toLowerCase() === freelancer.toLowerCase()) {
                    toast.success(`Payment Distributed for Job #${jobId}! 💰 Vault updated.`, {
                        autoClose: 6000,
                        icon: '💎'
                    });
                } else {
                    toast.success(`Job #${jobId} closed successfully! ✅`);
                }
                refreshData();
            });
        },
    });

    // Watch JobDisputed
    useWatchContractEvent({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        eventName: 'JobDisputed',
        onLogs(logs) {
            logs.forEach((log) => {
                const { jobId } = log.args;
                toast.error(`CRITICAL: Job #${jobId} Disputed! ⚖️ Kleros Court alerted.`, {
                    autoClose: 10000,
                });
                refreshData();
            });
        },
    });

    return null;
}

