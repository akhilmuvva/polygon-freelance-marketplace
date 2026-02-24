import React, { useState, useEffect } from 'react';
import { useMultiChain } from '../hooks/useMultiChain';
import { useAccount } from 'wagmi';
import { AnimatePresence } from 'framer-motion';
import { Globe, Plus, Wallet, Clock, ArrowRight, RefreshCw, Zap } from 'lucide-react';
import CreateCrossChainJob from './CreateCrossChainJob';

const st = {
  container: { display: 'flex', flexDirection: 'column', gap: 32 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24 },
  title: { fontSize: '2.4rem', fontWeight: 900, marginBottom: 8, letterSpacing: '-0.04em', color: '#fff' },
  subtitle: { color: 'var(--text-secondary)', fontWeight: 500, maxWidth: 480 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 },
  statCard: {
    padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: 16
  },
  iconBox: { width: 44, height: 44, borderRadius: 12, background: 'rgba(124, 92, 252, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-light)' },
  statLabel: { fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  statValue: { fontSize: '1.4rem', fontWeight: 900, color: '#fff', marginTop: 2 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: '1.1rem', fontWeight: 800, marginBottom: 20, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 },
  card: {
    padding: 24, borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
    transition: 'all 0.3s ease'
  },
  badge: (color) => ({
    fontSize: '0.6rem', fontWeight: 900, padding: '3px 8px', borderRadius: 4,
    background: `${color}15`, color, border: `1px solid ${color}30`, textTransform: 'uppercase'
  })
};

const CrossChainDashboard = () => {
  const { address } = useAccount();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const {
    balances,
    getChainInfo,
    fetchBalancesAcrossChains,
    SUPPORTED_CHAINS
  } = useMultiChain();

  const [crossChainJobs, setCrossChainJobs] = useState([]);
  const [aggregatedStats, setAggregatedStats] = useState({
    totalJobs: 0,
    totalEarned: 0,
    activeChains: 0,
    pendingPayments: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedChain, setSelectedChain] = useState('all');

  useEffect(() => {
    if (address) {
      fetchCrossChainData();
      fetchBalancesAcrossChains();
    }
  }, [address]);

  const fetchCrossChainData = async () => {
    setLoading(true);
    try {
      // Mock data for now
      const mockJobs = [
        {
          id: 1, title: 'Build DeFi Dashboard', sourceChain: 137, destinationChain: 80002,
          amount: '500', token: 'USDC', status: 'Ongoing', client: '0x123...456',
          freelancer: address, createdAt: Date.now() - 86400000 * 2
        },
        {
          id: 2, title: 'Smart Contract Audit', sourceChain: 80002, destinationChain: 137,
          amount: '1200', token: 'USDC', status: 'Completed', client: '0xabc...def',
          freelancer: address, createdAt: Date.now() - 86400000 * 5
        }
      ];
      setCrossChainJobs(mockJobs);
      setAggregatedStats({
        totalJobs: mockJobs.length,
        totalEarned: 1700,
        activeChains: 2,
        pendingPayments: 0
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = { 'Ongoing': '#f59e0b', 'Completed': '#22c55e', 'Submitted': '#3b82f6', 'Disputed': '#ef4444' };
    return colors[status] || 'var(--text-tertiary)';
  };

  return (
    <div style={st.container}>
      <header style={st.header}>
        <div>
          <h1 style={st.title}>
            <Globe size={32} style={{ color: 'var(--accent-light)', marginBottom: 8 }} />
            Zenith <span style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>Cross-Chain</span>
          </h1>
          <p style={st.subtitle}>Manage your decentralized workflow across multiple ecosystems with zero friction.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)} style={{ borderRadius: 12, padding: '12px 24px' }}>
          <Plus size={18} /> Post Cross-Chain Job
        </button>
      </header>

      {/* Stats */}
      <div style={st.statsGrid}>
        <div style={st.statCard}>
          <div style={st.iconBox}><Plus size={20} /></div>
          <div>
            <div style={st.statLabel}>Active Gigs</div>
            <div style={st.statValue}>{aggregatedStats.totalJobs}</div>
          </div>
        </div>
        <div style={st.statCard}>
          <div style={st.iconBox}><Zap size={20} /></div>
          <div>
            <div style={st.statLabel}>Total Volume</div>
            <div style={st.statValue}>${aggregatedStats.totalEarned.toLocaleString()}</div>
          </div>
        </div>
        <div style={st.statCard}>
          <div style={st.iconBox}><Globe size={20} /></div>
          <div>
            <div style={st.statLabel}>Active Chains</div>
            <div style={st.statValue}>{aggregatedStats.activeChains}</div>
          </div>
        </div>
        <div style={st.statCard}>
          <div style={st.iconBox}><Clock size={20} /></div>
          <div>
            <div style={st.statLabel}>Pending</div>
            <div style={st.statValue}>{aggregatedStats.pendingPayments}</div>
          </div>
        </div>
      </div>

      {/* Balances */}
      <div style={st.section}>
        <h2 style={st.sectionTitle}><Wallet size={20} /> Unified Balances</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {Object.entries(balances).map(([chainId, data]) => {
            if (!data?.chainInfo) return null;
            return (
            <div key={chainId} style={st.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: '1.2rem' }}>{data.chainInfo.icon}</span>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>{data.chainInfo.name}</span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>
                {data.error ? '---' : parseFloat(data.native || 0).toFixed(4)}
                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginLeft: 6, fontWeight: 500 }}>Native</span>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* Job Feed */}
      <div style={st.section}>
        <div style={{ ...st.header, marginBottom: 20 }}>
          <h2 style={{ ...st.sectionTitle, marginBottom: 0 }}><RefreshCw size={20} /> Cross-Chain Activity</h2>
          <select style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: '#fff', fontSize: '0.8rem' }}
            value={selectedChain} onChange={(e) => setSelectedChain(e.target.value)}>
            <option value="all">All Ecosystems</option>
            {Object.entries(SUPPORTED_CHAINS).map(([id, info]) => <option key={id} value={id}>{info.name}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? (
            [1, 2].map(i => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 16 }} />)
          ) : crossChainJobs.length === 0 ? (
            <div style={{ ...st.card, textAlign: 'center', padding: '60px 20px', background: 'transparent', borderStyle: 'dashed' }}>
              <p style={{ color: 'var(--text-tertiary)' }}>No cross-chain jobs found</p>
            </div>
          ) : (
            crossChainJobs.map(job => (
              <div key={job.id} style={st.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{job.title}</h3>
                  <span style={st.badge(getStatusColor(job.status))}>{job.status}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 20 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Source Chain</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <span>{getChainInfo(job.sourceChain)?.icon}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{getChainInfo(job.sourceChain)?.name}</span>
                    </div>
                  </div>
                  <ArrowRight size={18} style={{ color: 'var(--accent-light)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Destination</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <span>{getChainInfo(job.destinationChain)?.icon}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{getChainInfo(job.destinationChain)?.name}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>
                    {job.amount} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>{job.token}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: '0.75rem' }}>View Proof</button>
                    <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.75rem' }}>Action</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {isCreateModalOpen && (
          <CreateCrossChainJob
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={() => { setIsCreateModalOpen(false); fetchCrossChainData(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CrossChainDashboard;
