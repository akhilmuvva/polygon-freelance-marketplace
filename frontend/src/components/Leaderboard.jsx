import { api } from '../services/api';
import { Trophy, Medal, Award, ExternalLink, User, Star, TrendingUp, Loader2 } from 'lucide-react';
import { formatEther } from 'viem';
import { useAnimeAnimations } from '../hooks/useAnimeAnimations';

function Leaderboard() {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);
    const headerRef = useRef(null);
    const tableRef = useRef(null);
    const { scaleIn, slideInLeft, staggerFadeIn } = useAnimeAnimations();

    useEffect(() => {
        api.getLeaderboard().then(data => {
            setLeaders(data);
            setLoading(false);
        });
    }, []);

    // Animate on data load
    useEffect(() => {
        if (!loading && leaders.length > 0) {
            if (headerRef.current) scaleIn(headerRef.current);
            if (tableRef.current) slideInLeft(tableRef.current, 30);
            setTimeout(() => staggerFadeIn('.leaderboard-row', 60), 300);
        }
    }, [loading, leaders.length]);

    const thStyle = {
        padding: 20, textAlign: 'left', fontSize: '0.7rem', fontWeight: 800,
        textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)',
    };

    if (loading) return (
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
                <div className="skeleton" style={{ width: 400, height: 50, margin: '0 auto' }} />
                <div className="skeleton" style={{ width: 500, height: 18, margin: '16px auto' }} />
            </div>
            <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)' }}>
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 60, marginBottom: 2 }} />
                ))}
            </div>
        </div>
    );

    return (
        <div>
            <header ref={headerRef} style={{ marginBottom: 48, textAlign: 'center', opacity: 0 }}>
                <div>
                    <h1 style={{
                        fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 14,
                        background: 'linear-gradient(135deg, #fff, rgba(255,255,255,0.6))',
                        WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>The Elite</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: 550, margin: '0 auto', lineHeight: 1.6 }}>
                        Celebrating the world's most trusted decentralized creators and their mission-critical contributions.
                    </p>
                </div>
            </header>

            <div ref={tableRef} style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)', opacity: 0 }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <th style={thStyle}>Ranking</th>
                                <th style={thStyle}>Creator</th>
                                <th style={thStyle}>Expertise</th>
                                <th style={thStyle}>Rating</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>Rep Score</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>Total Volume</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaders.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: 80, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                        The leaderboard is awaiting its first legends.
                                    </td>
                                </tr>
                            ) : (
                                leaders.map((leader, index) => (
                                    <tr key={leader.address}
                                        className="leaderboard-row"
                                        style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.3s', opacity: 0, transform: 'translateY(20px)' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: 20 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {index === 0 && <Trophy size={24} style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.4))' }} />}
                                                    {index === 1 && <Medal size={24} style={{ color: '#cbd5e1' }} />}
                                                    {index === 2 && <Award size={24} style={{ color: '#b45309' }} />}
                                                    {index > 2 && <span style={{ fontWeight: 800, color: 'var(--text-tertiary)', opacity: 0.5 }}>{index + 1}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: 20 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(45deg, var(--accent), var(--accent-light))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <User size={22} color="white" />
                                                </div>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{leader.name || 'Elite Member'}</span>
                                                        {leader.reputationScore >= 10 && (
                                                            <span style={{
                                                                fontSize: '0.55rem', fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                                                                background: 'linear-gradient(90deg, #fbbf24, #f97316)', color: '#000',
                                                            }}>SUPREME</span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                                                        {leader.address.slice(0, 10)}...{leader.address.slice(-6)}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: 20 }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                {leader.skills?.split(',').slice(0, 2).map((s, i) => (
                                                    <span key={i} style={{
                                                        fontSize: '0.65rem', fontWeight: 700, padding: '3px 8px', borderRadius: 5,
                                                        background: 'rgba(124,92,252,0.08)', color: 'var(--accent-light)',
                                                        border: '1px solid rgba(124,92,252,0.15)', textTransform: 'uppercase',
                                                    }}>{s.trim()}</span>
                                                )) || (
                                                        <span style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: 5, background: 'rgba(255,255,255,0.04)', color: 'var(--text-tertiary)' }}>CREATOR</span>
                                                    )}
                                            </div>
                                        </td>
                                        <td style={{ padding: 20 }}>
                                            {leader.avgRating > 0 ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <Star size={14} style={{ fill: '#fbbf24', color: '#fbbf24' }} />
                                                    <span style={{ fontWeight: 700 }}>{leader.avgRating.toFixed(1)}</span>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>—</span>
                                            )}
                                        </td>
                                        <td style={{ padding: 20, textAlign: 'right' }}>
                                            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                                                <TrendingUp size={16} />
                                                {leader.reputationScore || 0}
                                            </div>
                                        </td>
                                        <td style={{ padding: 20, textAlign: 'right' }}>
                                            <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                                                {parseFloat(formatEther(BigInt(leader.totalEarned || '0'))).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                                <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 500, marginLeft: 4 }}>MATIC</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Leaderboard;
