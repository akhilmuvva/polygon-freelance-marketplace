'use client';

import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  Gavel, 
  Clock, 
  ShieldCheck, 
  User, 
  Zap, 
  ArrowRight,
  TrendingUp,
  Activity,
  History,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import './ArbitrationDashboard.css';

// Mock Data for initial render - matches legacy Heritage
const MOCK_DISPUTES = [
  {
    id: "1024",
    title: "Smart Contract Vulnerability Assessment",
    client: "0x71...3c92",
    freelancer: "0x44...8e11",
    amount: "2500 MATIC",
    status: "Active",
    deadline: "14h 22m remaining",
    category: "Security",
    votesClient: 2,
    votesFreelancer: 1,
    description: "The freelancer claims to have identified critical vulnerabilities, but the client argues that the findings are standard gas optimizations and not security-related."
  },
  {
    id: "1025",
    title: "NFT Marketplace UI Implementation",
    client: "0x12...a9b2",
    freelancer: "0x99...ff34",
    amount: "1200 MATIC",
    status: "Pending",
    deadline: "2d 04h remaining",
    category: "Frontend",
    votesClient: 0,
    votesFreelancer: 0,
    description: "Milestone payment dispute. Client claims the responsiveness on mobile devices doesn't meet the specified technical requirements."
  }
];

export default function DisputesPage() {
  const [disputes, setDisputes] = useState(MOCK_DISPUTES);
  const [selectedDispute, setSelectedDispute] = useState(MOCK_DISPUTES[0]);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'portal'
  const [loading, setLoading] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('');
  
  // Juror Stats - matches legacy
  const [jurorStats] = useState({
    staked: "5,000",
    rewards: "420",
    reputation: "98.4%",
    cases: "12",
    consistency: "92%"
  });

  const handleCastVote = (side: string) => {
    setLoading(true);
    // Logic from legacy ArbitrationDashboard.jsx
    setTimeout(() => {
      setLoading(false);
      alert(`Vote cast for ${side}. Transaction submitted to Polygon.`);
    }, 1500);
  };

  const handleStake = () => {
    if (!stakeAmount) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStakeAmount('');
      alert(`${stakeAmount} ZENITH tokens staked for Judicial Rights.`);
    }, 1500);
  };

  return (
    <div className="court-container">
      {/* Neural Background Elements */}
      <div className="neural-grid" />
      <div className="neural-mesh" />

      <header className="court-header">
        <div className="justice-title-area">
          <div className="justice-subtitle">ZENITH ARBITRATION COURT</div>
          <div className="justice-title">
            <div className="justice-icon">
              <Scale size={32} strokeWidth={2.5} />
            </div>
            <h1>Judicial Supremacy</h1>
          </div>
          <p className="text-zinc-500 font-medium max-w-md">
            Decentralized conflict resolution powered by algorithmic fairness and human intelligence.
          </p>
        </div>

        <div className="view-switcher">
          <button 
            className={`view-tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            <Gavel size={16} className="inline mr-2" /> Active Cases
          </button>
          <button 
            className={`view-tab ${activeTab === 'portal' ? 'active' : ''}`}
            onClick={() => setActiveTab('portal')}
          >
            <ShieldCheck size={16} className="inline mr-2" /> Juror Portal
          </button>
        </div>
      </header>

      {activeTab === 'active' ? (
        <div className="court-layout">
          {/* Dispute Navigation */}
          <div className="dispute-list">
            <div className="flex items-center gap-2 mb-4 px-2">
              <Activity size={14} className="text-red-500" />
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Ongoing Arbitrations</span>
            </div>
            {disputes.map(case_ => (
              <div 
                key={case_.id}
                className={`dispute-card ${selectedDispute?.id === case_.id ? 'selected' : ''}`}
                onClick={() => setSelectedDispute(case_)}
              >
                <div className="dispute-id">CASE #{case_.id}</div>
                <h4>{case_.title}</h4>
                <div className="flex items-center gap-2 text-xs text-zinc-500 mb-4 font-medium">
                  <span className="px-2 py-0.5 bg-zinc-800/50 rounded-full text-zinc-300">{case_.category}</span>
                  <span>•</span>
                  <span>{case_.amount}</span>
                </div>
                <div className="dispute-meta">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-bold">
                    <Clock size={12} />
                    {case_.deadline}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`h-1.5 w-1.5 rounded-full ${case_.status === 'Active' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className="text-[10px] uppercase tracking-tighter font-black text-zinc-400">{case_.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Case Detail Area */}
          <div className="court-detail-view">
            {selectedDispute ? (
              <div className="court-detail-panel">
                <div className="case-header">
                  <div className="case-title-area">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2 block">Resolution Dashboard</span>
                    <h2>{selectedDispute.title}</h2>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                        <User size={14} className="text-zinc-600" />
                        Client: <span className="text-zinc-200">{selectedDispute.client}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                        <User size={14} className="text-zinc-600" />
                        Freelancer: <span className="text-zinc-200">{selectedDispute.freelancer}</span>
                      </div>
                    </div>
                  </div>
                  <div className="case-amount-area">
                    <div className="amount-label">DISPUTED VALUE</div>
                    <div className="amount-value">{selectedDispute.amount}</div>
                  </div>
                </div>

                <div className="case-body mt-8">
                  <div className="case-description mb-8">
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <AlertCircle size={14} className="text-red-500" />
                      Incident Report
                    </h4>
                    <p className="text-zinc-300 leading-relaxed text-sm bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800/50">
                      {selectedDispute.description}
                    </p>
                  </div>

                  <div className="case-grid">
                    <div className="case-info-box">
                      <h4><Zap size={14} className="text-purple-500" /> Current Consensus</h4>
                      <div className="neural-box">
                        <div className="flex justify-between items-end mb-4">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase">Voting Ratio</span>
                          <span className="text-xs font-mono text-purple-400">
                            {selectedDispute.votesClient} : {selectedDispute.votesFreelancer}
                          </span>
                        </div>
                        <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                          <div 
                            className="h-full bg-red-500/80 transition-all duration-1000" 
                            style={{ width: `${(selectedDispute.votesClient / (selectedDispute.votesClient + selectedDispute.votesFreelancer || 1)) * 100}%` }} 
                          />
                          <div className="h-full bg-emerald-500/80" style={{ flex: 1 }} />
                        </div>
                      </div>
                    </div>

                    <div className="case-info-box">
                      <h4><TrendingUp size={14} className="text-cyan-500" /> Potential Slashing</h4>
                      <div className="neural-box bg-cyan-500/5 border-cyan-500/10">
                        <p className="text-xs text-zinc-400 mb-2 font-medium">Reputation impact upon resolution:</p>
                        <div className="text-lg font-bold text-cyan-400">-12.5% REP</div>
                      </div>
                    </div>
                  </div>

                  <div className="ruling-area">
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Final Arbitration Action</h4>
                    <div className="ruling-actions">
                      <button 
                        className="ruling-btn client group"
                        disabled={loading}
                        onClick={() => handleCastVote('client')}
                      >
                        <div className="text-[10px] uppercase mb-1 opacity-50 group-hover:opacity-100 transition-opacity">Rule for</div>
                        CLIENT
                      </button>
                      <button 
                        className="ruling-btn freelancer group"
                        disabled={loading}
                        onClick={() => handleCastVote('freelancer')}
                      >
                        <div className="text-[10px] uppercase mb-1 opacity-50 group-hover:opacity-100 transition-opacity">Rule for</div>
                        FREELANCER
                      </button>
                      <button 
                        className="ruling-btn group"
                        disabled={loading}
                        onClick={() => handleCastVote('split')}
                      >
                        <div className="text-[10px] uppercase mb-1 opacity-50 group-hover:opacity-100 transition-opacity">Mutual</div>
                        SPLIT 50/50
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-court">
                <Gavel size={64} className="text-zinc-800 mb-4" />
                <p className="text-zinc-500 font-medium">Select a case from the terminal to begin arbitration</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Juror Portal View */
        <div className="juror-portal-area">
          <div className="stat-grid">
            <div className="stat-item">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black text-zinc-500 uppercase">Staked ZENITH</span>
                <Lock size={14} className="text-purple-500" />
              </div>
              <div className="text-2xl font-bold font-mono">{jurorStats.staked}</div>
            </div>
            <div className="stat-item">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black text-zinc-500 uppercase">Judicial Rewards</span>
                <TrendingUp size={14} className="text-emerald-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">+{jurorStats.rewards} MATIC</div>
            </div>
            <div className="stat-item">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black text-zinc-500 uppercase">Consistency Score</span>
                <ShieldCheck size={14} className="text-cyan-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-cyan-400">{jurorStats.consistency}</div>
            </div>
          </div>

          <div className="juror-portal-grid">
            <div className="staking-panel col-span-2">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Scale size={20} className="text-purple-500" />
                Judicial Staking
              </h3>
              <p className="text-sm text-zinc-400 mb-8 max-w-md leading-relaxed">
                Stake ZENITH tokens to receive voting rights in the Arbitration Court. Jurors earn rewards from case fees based on their consistency with the consensus.
              </p>
              
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <input 
                    type="number" 
                    placeholder="Enter amount to stake..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-6 py-4 font-mono text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-600 uppercase">ZENITH</div>
                </div>
                <button 
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 py-4 rounded-xl transition-all active:scale-95"
                  onClick={handleStake}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Secure Rights'}
                </button>
              </div>
            </div>

            <div className="juror-card">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6">Court History</h4>
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                    <div>
                      <div className="text-xs font-bold">Case #89{i}</div>
                      <div className="text-[10px] text-zinc-500">Resolved 4d ago</div>
                    </div>
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-3 text-[10px] font-black text-zinc-500 hover:text-zinc-300 uppercase tracking-widest transition-colors flex items-center justify-center gap-2 border border-zinc-800 rounded-xl">
                View Full Log <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
