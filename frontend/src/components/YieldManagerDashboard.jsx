import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import {
  TrendingUp, Shield, Zap, ArrowUpRight, Globe, Layers,
  PieChart, Activity, Lock, RefreshCw, ChevronRight, BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function ZenithStrata() {
  useAccount();
  const [activeStrategy, setActiveStrategy] = useState('BALANCED');

  const protocols = [
    { name: 'Morpho Blue', chain: 'Polygon', apy: '0', risk: 'Low', tvl: '$0', icon: '💎' },
    { name: 'Aave V3', chain: 'Base', apy: '0', risk: 'Min', tvl: '$0', icon: '👻' },
    { name: 'Aerodrome', chain: 'Base', apy: '0', risk: 'Med', tvl: '$0', icon: '🦋' },
    { name: 'Lido stMATIC', chain: 'Polygon', apy: '0', risk: 'Low', tvl: '$0', icon: '💧' }
  ];

  const s = {
    card: { padding: 24, borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', height: '100%', position: 'relative', overflow: 'hidden' },
    label: { fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 },
    badge: (color) => ({ padding: '3px 8px', borderRadius: 6, fontSize: '0.55rem', fontWeight: 900, background: `${color}15`, color: color, textTransform: 'uppercase' })
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 8 }}>
            Zenith <span style={{ color: 'var(--success)' }}>Strata</span>
          </h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em' }}>
            CROSS-CHAIN ESCROW REBALANCING & YIELD HARVESTING
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
                <div style={s.label}>Treasury Health</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--success)' }}>OPTIMAL</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={20} color="var(--success)" />
            </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 40 }}>
        {/* Yield Heatmap */}
        <div style={{ ...s.card, gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Global Yield Heatmap</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                    <span style={s.badge('var(--info)')}>Polygon</span>
                    <span style={s.badge('var(--secondary)')}>Base</span>
                    <span style={s.badge('var(--accent)')}>Arbitrum</span>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                    { label: 'Stable', val: '0%', trend: '0%' },
                    { label: 'LRTs', val: '0%', trend: '0%' },
                    { label: 'Safety Divergence', val: '0%', trend: 'ACTIVE' },
                    { label: 'Vaults', val: '0%', trend: '0%' }
                ].map((item, i) => (
                    <div key={i} style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                        <div style={s.label}>{item.label}</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: item.label === 'Safety Divergence' ? 'var(--cyan)' : '#fff' }}>{item.val}</div>
                        <div style={{ fontSize: '0.62rem', fontWeight: 800, color: item.trend === 'ACTIVE' ? 'var(--cyan)' : (item.trend.startsWith('+') ? 'var(--success)' : 'var(--danger)'), marginTop: 4 }}>{item.trend} {item.trend === 'ACTIVE' ? 'Failsafe' : '24h'}</div>
                    </div>
                ))}
            </div>
        </div>

        {/* Strategy Control */}
        <div style={s.card}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 20 }}>Auto-Rebalancer</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['PEACEFUL', 'BALANCED', 'DEGEN'].map(strat => (
                    <button key={strat} onClick={() => setActiveStrategy(strat)}
                        style={{
                            width: '100%', padding: 14, borderRadius: 12, border: '1px solid var(--border)', textAlign: 'left',
                            background: activeStrategy === strat ? 'rgba(124,92,252,0.1)' : 'transparent',
                            borderColor: activeStrategy === strat ? 'var(--accent-light)' : 'var(--border)',
                            color: activeStrategy === strat ? '#fff' : 'var(--text-tertiary)',
                            cursor: 'pointer', transition: 'all 0.2s ease', fontWeight: 700, fontSize: '0.82rem'
                        }}>
                        {strat} {activeStrategy === strat && <Zap size={14} style={{ float: 'right', color: 'var(--accent-light)' }} />}
                    </button>
                ))}
            </div>
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                <div style={s.label}>Projected Annual Gain</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--accent-light)' }}>+ $0.00 USDC</div>
            </div>
        </div>
      </div>

      <h3 style={{ ...s.label, marginBottom: 16 }}>Available Yield Strata</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {protocols.map((p, i) => (
            <motion.div key={i} whileHover={{ y: -5 }} style={s.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                        {p.icon}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={s.badge(p.risk === 'Low' || p.risk === 'Min' ? 'var(--success)' : 'var(--danger)')}>{p.risk} Risk</div>
                        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-tertiary)', marginTop: 4 }}>{p.chain}</div>
                    </div>
                </div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 2 }}>{p.name}</h4>
                <p style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: 20 }}>TVL: {p.tvl}</p>

                <div style={{ padding: 16, borderRadius: 16, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={s.label}>NET APY</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--success)' }}>{p.apy}%</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '0 12px', borderRadius: 8 }}>Details</button>
                </div>
            </motion.div>
        ))}
      </div>
    </div>
  );
}
