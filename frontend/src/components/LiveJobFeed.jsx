import React, { useState } from 'react';
import { useWatchContractEvent } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, DollarSign, User, ExternalLink } from 'lucide-react';
import { formatEther } from 'viem';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { CONTRACT_ADDRESS } from '../constants';

export default function LiveJobFeed() {
    const [jobs, setJobs] = useState([]);

    useWatchContractEvent({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        eventName: 'JobCreated',
        onLogs(logs) {
            const newJobs = logs.map(log => {
                const { jobId, client, freelancer, amount, deadline } = log.args;
                return {
                    id: jobId.toString(), client, freelancer,
                    amount: formatEther(amount),
                    deadline: deadline.toString(),
                    timestamp: Date.now(),
                    txHash: log.transactionHash
                };
            });
            setJobs(prev => [...newJobs, ...prev].slice(0, 10));
        },
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <AnimatePresence initial={false}>
                {jobs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--text-tertiary)' }}>
                        <Clock size={24} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                        <p style={{ fontSize: '0.8rem' }}>Waiting for new jobs...</p>
                    </div>
                ) : (
                    jobs.map((job) => (
                        <motion.div
                            key={`${job.txHash}-${job.id}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            style={{
                                padding: 12, borderRadius: 10,
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid var(--border)',
                                borderLeft: '3px solid var(--accent)',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>Job #{job.id}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--success)', fontSize: '0.8rem', fontWeight: 600 }}>
                                    <DollarSign size={13} />
                                    {parseFloat(job.amount).toFixed(2)} MATIC
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                <User size={12} />
                                <span>{job.client?.slice(0, 6)}...{job.client?.slice(-4)}</span>
                            </div>
                            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                                <a
                                    href={`https://amoy.polygonscan.com/tx/${job.txHash}`}
                                    target="_blank" rel="noopener noreferrer"
                                    style={{ fontSize: '0.7rem', color: 'var(--accent-light)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                                >
                                    View Tx <ExternalLink size={10} />
                                </a>
                            </div>
                        </motion.div>
                    ))
                )}
            </AnimatePresence>
        </div>
    );
}
