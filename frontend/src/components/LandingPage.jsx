import React from 'react';
import {
  Shield, Globe, Mail, Wallet, Zap, ChevronRight,
  Hash, Users, TrendingUp, Award, Activity, Lock, GitBranch, Layers
} from 'lucide-react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';
import './LandingPage.css';
import { useDemo } from '../context/DemoContext';

/* ─── Each slide = independent snapshot of the hero ─── */
const slides = [
  {
    badge: 'Decentralized Freelancing',
    lines: ['Your Work,', 'Your Income', 'Your Rules.'],
    accentLine: 1,   // 0-indexed line that gets teal colour
    desc: 'Join a trustless marketplace for developers and designers.\nSecure contracts, fast payments, and on-chain verification.',
    features: [
      { cat: 'Security',  name: 'On-chain Escrow',   icon: Shield,  color: '#00c896' },
      { cat: 'Network',   name: 'Multi-Chain',        icon: Globe,   color: '#7c3aed' },
    ],
  },
  {
    badge: 'Sovereign Identity',
    lines: ['Build Your', 'Reputation.', 'On-Chain.'],
    accentLine: 1,
    desc: 'Every completed job grows your Gravity Rank — a\nnon-transferable soulbound identity recognised globally.',
    features: [
      { cat: 'Identity',  name: 'Gravity Rank',       icon: Award,   color: '#00c896' },
      { cat: 'Privacy',   name: 'ZK Proofs',           icon: Lock,    color: '#7c3aed' },
    ],
  },
  {
    badge: 'AI Oracle Matchmaking',
    lines: ['Zero', 'Friction', 'Hiring.'],
    accentLine: 2,
    desc: 'Our AI oracle indexes real on-chain performance data\nto match specialists to bounties in under 4 hours.',
    features: [
      { cat: 'Speed',     name: '< 4 hr Match',       icon: Zap,     color: '#00c896' },
      { cat: 'Accuracy',  name: '94.7% Precision',    icon: Activity, color: '#7c3aed' },
    ],
  },
  {
    badge: 'DAO Governance',
    lines: ['The Protocol', 'You', 'Control.'],
    accentLine: 2,
    desc: 'Vote on fee tiers, dispute rules, and protocol upgrades.\nEvery specialist has a voice in the Zenith mesh.',
    features: [
      { cat: 'Governance', name: 'Token Voting',      icon: GitBranch, color: '#00c896' },
      { cat: 'Chains',     name: 'Cross-Chain',       icon: Layers,    color: '#7c3aed' },
    ],
  },
];

const stats = [
  { value: '$4.2M+',   label: 'Volume Secured' },
  { value: '12,400+',  label: 'Active Specialists' },
  { value: '38,200+',  label: 'Jobs Completed' },
  { value: '99.98%',   label: 'Protocol Uptime' },
];

const featureCards = [
  { icon: Shield,    title: 'On-Chain Escrow',    desc: 'Funds locked in audited smart contracts. Released only on milestone proof.', color: '#00c896' },
  { icon: Globe,     title: 'Multi-Chain',         desc: 'Bridge assets across EVM chains. Work on Polygon, settle anywhere.',         color: '#7c3aed' },
  { icon: Award,     title: 'Gravity Rank',        desc: 'Non-transferable soulbound reputation built from every verified job.',        color: '#00c896' },
  { icon: Zap,       title: 'AI Matching',         desc: 'Oracle indexes on-chain history to pair the right talent to every bounty.',  color: '#f59e0b' },
  { icon: Lock,      title: 'ZK Privacy',          desc: 'Control exactly what your work history reveals with zero-knowledge proofs.', color: '#00c896' },
  { icon: GitBranch, title: 'DAO Governance',      desc: 'Token holders vote on fees, disputes, and every protocol parameter.',        color: '#7c3aed' },
];

const LandingPage = ({ onSocialLogin, onBypass, isLoggingIn }) => {
  const { openConnectModal } = useConnectModal();
  const { activateDemoMode } = useDemo();

  return (
    <div className="lp-root">

      {/* ── NAV ── */}
      <nav className="lp-nav">
        <div className="lp-nav-logo">
          <div className="lp-nav-logo-name">PolyLance</div>
          <div className="lp-nav-logo-sub">
            <span className="lp-nav-logo-dot" />
            Polygon POS On-Chain
          </div>
        </div>

        <div className="lp-nav-actions">
          <button className="lp-btn-social" onClick={activateDemoMode}>
            <Wallet size={14} /> Try Demo
          </button>
          <button className="lp-btn-shield" onClick={onBypass}>
            <Shield size={14} /> Sovereign Shield
          </button>
          <button className="lp-btn-social" onClick={onSocialLogin} disabled={isLoggingIn}>
            <Mail size={14} /> {isLoggingIn ? 'Connecting…' : 'Social Login'}
          </button>
          <button className="lp-btn-wallet" onClick={openConnectModal}>
            Connect Wallet
          </button>
        </div>
      </nav>

      {/* ── HERO SWIPER ── */}
      <section className="lp-hero-section">
        <Swiper
          modules={[Autoplay, EffectFade, Pagination]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          autoplay={{ delay: 5500, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          loop
          speed={900}
          className="lp-hero-swiper"
        >
          {slides.map((slide, si) => (
            <SwiperSlide key={si}>
              <div className="lp-slide">

                {/* LEFT */}
                <div className="lp-slide-left">
                  <div className="lp-slide-badge">
                    <Hash size={11} />
                    {slide.badge.toUpperCase()}
                  </div>

                  <h1 className="lp-slide-h1">
                    {slide.lines.map((line, li) =>
                      li === slide.accentLine
                        ? <span key={li} className="accent">{line}</span>
                        : <span key={li} style={{ display: 'block' }}>{line}</span>
                    )}
                  </h1>

                  <p className="lp-slide-desc">
                    {slide.desc.split('\n').map((l, i) => (
                      <React.Fragment key={i}>{l}{i < slide.desc.split('\n').length - 1 && <br />}</React.Fragment>
                    ))}
                  </p>

                  <div className="lp-slide-features">
                    {slide.features.map((f, fi) => (
                      <div key={fi} className="lp-feat-card">
                        <div className="lp-feat-icon" style={{ background: `${f.color}14` }}>
                          <f.icon size={20} color={f.color} />
                        </div>
                        <div className="lp-feat-cat">{f.cat}</div>
                        <div className="lp-feat-name">{f.name}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RIGHT — Auth Card */}
                <div className="lp-auth-card">
                  <h2 className="lp-auth-title">Seamless Access</h2>
                  <p className="lp-auth-sub">Secure, decentralised access to the workspace.</p>

                  <div className="lp-auth-methods">
                    {/* Social Auth */}
                    <button
                      className="lp-auth-method active"
                      onClick={onSocialLogin}
                      disabled={isLoggingIn}
                    >
                      <div className="lp-auth-method-icon">
                        <Mail size={20} />
                      </div>
                      <div className="lp-auth-method-info">
                        <div className="lp-auth-method-name">
                          Google / Email / X
                          <span className="lp-auth-badge-rec">Recommended</span>
                        </div>
                        <div className="lp-auth-method-desc">
                          Instant Smart Wallet · Zero Gas Fees
                        </div>
                      </div>
                      <ChevronRight size={14} color="rgba(255,255,255,0.3)" />
                    </button>

                    {/* Web3 */}
                    <button className="lp-auth-method" onClick={openConnectModal}>
                      <div className="lp-auth-method-icon">
                        <Wallet size={20} />
                      </div>
                      <div className="lp-auth-method-info">
                        <div className="lp-auth-method-name">Web3 Foundation</div>
                        <div className="lp-auth-method-desc">
                          MetaMask · WalletConnect · Ledger
                        </div>
                      </div>
                      <ChevronRight size={14} color="rgba(255,255,255,0.3)" />
                    </button>
                  </div>

                  {/* Gasless notice */}
                  <div className="lp-auth-gasless">
                    <Zap size={14} className="lp-auth-gasless-icon" />
                    <span>
                      <strong>Gasless Mode:</strong> New users get 10 free transactions upon account activation.
                    </span>
                  </div>

                  {/* Network row */}
                  <div className="lp-auth-network-row">
                    <span>
                      <span className="lp-auth-net-dot" />
                      Network: Polygon Mainnet
                    </span>
                    <span>v2.5.0-Zenith</span>
                  </div>
                </div>

              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* ── STATS ── */}
      <div className="lp-stats-section">
        {stats.map((s, i) => (
          <div key={i} className="lp-stat-block">
            <div className="lp-stat-value">{s.value}</div>
            <div className="lp-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── FEATURES ── */}
      <section className="lp-features-section">
        <h2 className="lp-features-title">
          Everything you need to<br />
          <span className="lp-features-accent">go sovereign.</span>
        </h2>
        <p className="lp-features-sub">Protocol-grade infrastructure for the decentralised workforce.</p>
        <div className="lp-features-grid">
          {featureCards.map((fc, i) => (
            <div key={i} className="lp-fcard">
              <div className="lp-fcard-icon" style={{ background: `${fc.color}14` }}>
                <fc.icon size={22} color={fc.color} />
              </div>
              <div className="lp-fcard-title">{fc.title}</div>
              <div className="lp-fcard-desc">{fc.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <span className="lp-footer-brand">
          POLY<span className="lp-footer-accent">LANCE</span>
        </span>
        <span>© 2025 PolyLance · Built on Polygon · Akhil Muvva</span>
        <span>Terms · Privacy · Manifesto</span>
      </footer>

    </div>
  );
};

export default LandingPage;
