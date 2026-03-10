import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Sparkles, TrendingUp, AlertCircle, Zap } from 'lucide-react';

const AiMatchRating = ({ jobId, freelancerAddress }) => {
    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMatch = async () => {
            try {
                const data = await api.getMatchScore(jobId, freelancerAddress);
                setMatch(data);
            } catch (err) {
                console.error('AI Match Fetch Error:', err);
                setError('AI Match unavailable');
            } finally { setLoading(false); }
        };
        if (jobId && freelancerAddress) fetchMatch();
    }, [jobId, freelancerAddress]);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-tertiary)', opacity: 0.7 }}>
            <Sparkles size={14} style={{ color: 'var(--accent-light)' }} />
            <span>AI Analyzing...</span>
        </div>
    );

    if (error || !match) return null;

    const getScoreStyle = (score) => {
        if (score >= 0.8) return { color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)' };
        if (score >= 0.5) return { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)' };
        return { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' };
    };
    const s = getScoreStyle(match.score);
    const dimLabel = { fontSize: '0.58rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6, marginBottom: 4 };

    return (
        <div style={{
            marginTop: 12, padding: 16, borderRadius: 14, border: `1px solid ${s.border}`,
            background: s.bg, color: s.color, transition: 'all 0.3s ease',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ padding: 6, borderRadius: 8, background: 'rgba(255,255,255,0.1)' }}>
                        <Sparkles size={16} />
                    </div>
                    <div>
                        <span style={{ ...dimLabel, display: 'block' }}>Gemini Strategic Match</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{match.riskLevel} Risk Profile</span>
                    </div>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>
                    {Math.round(match.score * 100)}%
                </div>
            </div>

            <p style={{ fontSize: '0.78rem', marginBottom: 16, lineHeight: 1.6, fontWeight: 500 }}>
                &quot;{match.reason}&quot;
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                {match.strengths?.length > 0 && (
                    <div>
                        <span style={dimLabel}>Strengths</span>
                        <ul style={{ fontSize: '0.72rem', fontWeight: 700, listStyleType: 'disc', paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {match.strengths.slice(0, 2).map((st, i) => <li key={i}>{st}</li>)}
                        </ul>
                    </div>
                )}
                {match.gaps?.length > 0 && (
                    <div>
                        <span style={dimLabel}>Gaps</span>
                        <ul style={{ fontSize: '0.72rem', fontWeight: 700, listStyleType: 'disc', paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 2, opacity: 0.8 }}>
                            {match.gaps.slice(0, 2).map((g, i) => <li key={i}>{g}</li>)}
                        </ul>
                    </div>
                )}
            </div>

            <div style={{ paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.72rem' }}>
                    <Zap size={10} style={{ fill: 'currentColor' }} />
                    <span style={{ fontWeight: 900, textTransform: 'uppercase' }}>Pro-Tip:</span>
                    <span style={{ opacity: 0.9 }}>{match.proTip}</span>
                </div>
                {match.agentNotes && (
                    <div style={{
                        marginTop: 16, padding: 12, borderRadius: 10,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)',
                        fontSize: '0.72rem', fontFamily: 'monospace', fontStyle: 'italic',
                        textTransform: 'uppercase', letterSpacing: '-0.02em', color: 'var(--text-tertiary)',
                    }}>
                        <span style={{ color: 'var(--accent-light)', marginRight: 8 }}>AGENT_LOG:</span>
                        {match.agentNotes}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AiMatchRating;
