import React from 'react';
import { useAccount } from 'wagmi';
// import { parseUnits, formatEther } from 'viem';
import {
  FileText, CheckCircle2, CircleDollarSign, BarChart3,
  ShieldCheck, Clock, TrendingUp, Info, ArrowUpRight,
  Plus, Search, Filter, Shield, Zap, Flame, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimeAnimations } from '../hooks/useAnimeAnimations';

const INVOICE_STATUS = {
  0: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: <Clock size={14} /> },
  1: { label: 'Verified', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', icon: <ShieldCheck size={14} /> },
  2: { label: 'Financed', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', icon: <CircleDollarSign size={14} /> },
  3: { label: 'Paid', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', icon: <CheckCircle2 size={14} /> }
};

export default function ZenithLiquidity() {
  useAccount();
  useAnimeAnimations();

  const invoices = [
    { id: 'ZN-8801', debtor: 'AWS Cloud Services', value: 12500, due: 45, status: 1, rating: 98, yield: 12.5 },
    { id: 'ZN-9214', debtor: 'DeepMind Labs', value: 45000, due: 60, status: 1, rating: 95, yield: 14.2 },
    { id: 'ZN-1102', debtor: 'SpaceX Logistics', value: 8500, due: 15, status: 1, rating: 99, yield: 8.8 }
  ];

  const s = {
    card: { padding: 24, borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', transition: 'all 0.3s ease' },
    label: { fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 },
    badge: (color) => ({ padding: '4px 10px', borderRadius: 8, fontSize: '0.6rem', fontWeight: 800, background: `${color}15`, color: color, textTransform: 'uppercase' })
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 8 }}>
            Zenith <span style={{ color: 'var(--accent-light)' }}>Liquidity</span>
          </h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', fontWeight: 600 }}>INSTANT RWA FINANCING & YIELD OPTIMIZATION</p>
        </div>
        <button className="btn btn-primary" style={{ gap: 8, height: 48, borderRadius: 16 }}>
          <Plus size={18} /> Issue New Liquid NFT
        </button>
      </header>

      {/* Hero Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 40 }}>
        {[
          { label: 'Market Liquidity', value: '$2.4M', icon: <Flame size={16} />, color: 'var(--danger)' },
          { label: 'Active Invoices', value: '142', icon: <FileText size={16} />, color: 'var(--info)' },
          { label: 'Average APR', value: '14.5%', icon: <TrendingUp size={16} />, color: 'var(--success)' },
          { label: 'Default Rate', value: '0.04%', icon: <Shield size={16} />, color: 'var(--secondary)' }
        ].map((stat, i) => (
          <div key={i} style={s.card}>
            <div style={s.label}>{stat.icon} {stat.label}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 32 }}>
        {/* Issuance Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={s.card}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 20 }}>Liquidity Pipeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                <div style={s.label}>Expected Cashflow (30d)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--success)' }}>$12,450.00</div>
              </div>
              <p style={{ fontSize: '0.78rem', opacity: 0.6, lineHeight: 1.5 }}>
                Your verified invoices are ready for discounting. Liquidity providers are offering a **12.4% avg APR** for your profile.
              </p>
              <button className="btn btn-secondary" style={{ width: '100%', borderRadius: 12 }}>View Cashflow Forecast</button>
            </div>
          </div>

          <div style={{ ...s.card, background: 'linear-gradient(135deg, rgba(124,92,252,0.05), transparent)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={18} color="var(--accent-light)" /> Trust Index
            </h3>
            <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--accent-light)', marginBottom: 4 }}>98.2</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5 }}>PLATINUM TIER DEBTOR SCORE</div>
          </div>
        </div>

        {/* Marketplace */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={s.label}>Live Liquid Invoices</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.03)', cursor: 'pointer' }}><Filter size={14} /></div>
              <div style={{ padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.03)', cursor: 'pointer' }}><Search size={14} /></div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {invoices.map((inv) => (
              <motion.div key={inv.id} whileHover={{ y: -4 }} style={{ ...s.card, padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                      <FileText size={20} color="var(--accent-light)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-tertiary)' }}>{inv.id}</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{inv.debtor}</div>
                    </div>
                  </div>
                  <div style={s.badge(INVOICE_STATUS[inv.status].color)}>{INVOICE_STATUS[inv.status].label}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                  <div>
                    <div style={s.label}>Face Value</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>${inv.value.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={s.label}>Due In</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--danger)' }}>{inv.due} Days</div>
                  </div>
                  <div>
                    <div style={s.label}>Debtor Score</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--success)' }}>{inv.rating}/100</div>
                  </div>
                  <div>
                    <div style={s.label}>Net Yield</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-light)' }}>{inv.yield}%</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input className="form-input" type="number" placeholder="Offer (USDC)" style={{ height: 48, borderRadius: 12, paddingRight: 45 }} />
                    <span style={{ position: 'absolute', right: 16, top: 14, fontSize: '0.7rem', fontWeight: 800, opacity: 0.3 }}>USDC</span>
                  </div>
                  <button className="btn btn-primary" style={{ flex: 1, height: 48, borderRadius: 12, gap: 8 }}>
                    <CircleDollarSign size={18} /> Finance Invoice
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
