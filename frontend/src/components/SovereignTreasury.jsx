import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, PieChart, ShieldCheck, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import SubgraphService from '../services/SubgraphService';

const s = {
    container: {
        background: 'var(--bg-card)',
        borderRadius: 24,
        padding: 24,
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    statBox: {
        padding: 16,
        borderRadius: 16,
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
    },
    label: {
        fontSize: '0.65rem',
        fontWeight: 700,
        color: 'var(--text-tertiary)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: 4,
    },
    value: {
        fontSize: '1.2rem',
        fontWeight: 900,
        color: '#fff',
    }
};

const SovereignTreasury = () => {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['protocolStats'],
        queryFn: () => SubgraphService.getProtocolStats(),
        refetchInterval: 30000,
    });

    // Formatting with 1e18 precision for Ether-like values
    const formatWeight = (val) => {
        if (!val) return '0.00';
        const num = parseFloat(val) / 1e18;
        return num.toFixed(4);
    };

    const treasuryData = {
        totalSurplus: `${formatWeight(stats?.totalSovereignSurplus)} MATIC`,
        safetyReserve: `${formatWeight(stats?.totalYieldGenerated ? (BigInt(stats.totalYieldGenerated) * 5n / 100n).toString() : '0')} MATIC`,
        originatorFees: `${formatWeight(stats?.totalOriginatorFees)} MATIC`,
        yieldDistributed: `${formatWeight(stats?.totalYieldGenerated)} MATIC`,
        growthRate: stats?.totalVolume && BigInt(stats.totalVolume) > 0n 
            ? `${(Number(BigInt(stats.totalYieldGenerated || 0) * 10000n / BigInt(stats.totalVolume)) / 100).toFixed(2)}% Yield` 
            : 'STABLE'
    };

    if (isLoading) {
        return (
            <div style={s.container}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 100 }}>
                    <Zap size={24} className="animate-pulse" color="var(--accent)" />
                </div>
            </div>
        );
    }

    return (
        <div style={s.container}>
            <div style={s.header}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Sovereign Treasury</h3>
                <TrendingUp size={16} color="var(--success)" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={s.statBox}>
                    <div style={s.label}>Total Surplus</div>
                    <div style={s.value}>{treasuryData.totalSurplus}</div>
                </div>
                <div style={s.statBox}>
                    <div style={s.label}>Safety Reserve</div>
                    <div style={s.value}>{treasuryData.safetyReserve}</div>
                </div>
                <div style={s.statBox}>
                    <div style={s.label}>Originator Fees</div>
                    <div style={s.value}>{treasuryData.originatorFees}</div>
                </div>
                <div style={s.statBox}>
                    <div style={s.label}>Elite Intents</div>
                    <div style={{ ...s.value, color: 'var(--accent-light)' }}>{stats?.totalEliteIntents || 0}</div>
                </div>
            </div>

            <div style={{ marginTop: 8, padding: 12, borderRadius: 12, background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>
                    <ShieldCheck size={14} /> Protocol is currently Net-Positive
                </div>
            </div>
        </div>
    );
};

export default SovereignTreasury;
