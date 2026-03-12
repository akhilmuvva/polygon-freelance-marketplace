import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';

const AiRecommendations = ({ address, elite }) => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                // In Alpha, we pass the elite flag to the Sovereign API 
                // to prioritize high-yield/high-rep matches.
                const data = await api.getRecommendations(address, { elite });
                setJobs(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Failed to fetch recommendations:', err);
            } finally {
                setLoading(false);
            }
        };
        if (address) fetchRecommendations();
    }, [address, elite]);

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map(i => (
                <div key={i} className="skeleton" style={{ height: 64, borderRadius: 10 }} />
            ))}
        </div>
    );

    if (jobs.length === 0) return (
        <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
            No recommendations yet. Complete your profile to get matched.
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {jobs.map((job, i) => (
                <motion.div
                    key={job.jobId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    style={{
                        padding: 12, borderRadius: 10, cursor: 'pointer',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: 12, transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'rgba(124,92,252,0.25)';
                        e.currentTarget.style.background = 'rgba(124,92,252,0.04)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    }}
                >
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <span style={{
                                fontSize: '0.58rem', fontWeight: 700, padding: '2px 6px',
                                borderRadius: 6, background: 'rgba(124,92,252,0.1)',
                                color: 'var(--accent-light)', textTransform: 'uppercase',
                            }}>
                                Match
                            </span>
                            <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                                #{job.jobId}
                            </span>
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {job.title}
                        </div>
                        {job.description && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                                {job.description}
                            </div>
                        )}
                    </div>
                    <div style={{
                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                        background: 'rgba(124,92,252,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <ArrowRight size={14} style={{ color: 'var(--accent-light)' }} />
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default AiRecommendations;
