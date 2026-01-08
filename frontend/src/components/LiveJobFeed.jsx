import React, { useState, useEffect } from 'react';
import { useWatchContractEvent, useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Clock, DollarSign, User, ExternalLink } from 'lucide-react';
import { formatEther } from 'viem';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { CONTRACT_ADDRESS } from '../constants';

/**
 * Real-time Job Feed Component
 * Listen for JobCreated events on the Polygon network and displays them live.
 */
export default function LiveJobFeed() {
    const { address } = useAccount();
    const [jobs, setJobs] = useState([]);
    const [isListening, setIsListening] = useState(true);

    // Watch for JobCreated events in real-time
    useWatchContractEvent({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        eventName: 'JobCreated',
        onLogs(logs) {
            console.log('[FEED] New Job Logs:', logs);
            const newJobs = logs.map(log => {
                const { jobId, client, freelancer, amount, deadline } = log.args;
                return {
                    id: jobId.toString(),
                    client,
                    freelancer,
                    amount: formatEther(amount),
                    deadline: deadline.toString(),
                    timestamp: Date.now(),
                    txHash: log.transactionHash
                };
            });

            // Add new jobs to the start of the list
            setJobs(prev => {
                const combined = [...newJobs, ...prev];
                // Limit to last 10 jobs for performance
                return combined.slice(0, 10);
            });
        },
    });

    return (
        <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Briefcase className="text-primary" /> Real-time Job Feed
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`pulse-dot ${isListening ? 'active' : ''}`} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {isListening ? 'Live on Polygon' : 'Paused'}
                    </span>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <AnimatePresence initial={false}>
                    {jobs.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}
                        >
                            <Clock size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                            <p>Waiting for new jobs on the network...</p>
                        </motion.div>
                    ) : (
                        jobs.map((job) => (
                            <motion.div
                                key={`${job.txHash}-${job.id}`}
                                initial={{ opacity: 0, x: -20, height: 0 }}
                                animate={{ opacity: 1, x: 0, height: 'auto' }}
                                exit={{ opacity: 0, x: 20 }}
                                className="glass-card"
                                style={{
                                    padding: '16px',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderLeft: '4px solid var(--primary)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: 'bold' }}>Job #{job.id}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
                                        <DollarSign size={14} />
                                        <span>{parseFloat(job.amount).toFixed(2)} MATIC</span>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                                        <User size={14} />
                                        <span>Client: {job.client.slice(0, 6)}...{job.client.slice(-4)}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                                        <Clock size={14} />
                                        <span>New Discovery</span>
                                    </div>
                                </div>

                                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                                    <a
                                        href={`https://amoy.polygonscan.com/tx/${job.txHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ fontSize: '0.75rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                                    >
                                        View Transaction <ExternalLink size={12} />
                                    </a>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .pulse-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #6b7280;
                }
                .pulse-dot.active {
                    background: #10b981;
                    box-shadow: 0 0 0 rgba(16, 185, 129, 0.4);
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                }
            `}} />
        </div>
    );
}
