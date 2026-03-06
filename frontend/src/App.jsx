import React, { useState, Suspense, lazy, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  Briefcase, PlusCircle, LayoutDashboard, MessageSquare,
  Trophy, Gavel, Activity, Globe, BarChart3, Menu, X,
  Award, Zap, CreditCard, Shield, ShieldCheck, Mail, User,
  LogOut, Cpu, Ticket, ChevronDown, Loader2
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAnimeAnimations } from './hooks/useAnimeAnimations';

// Lazy load heavy components
const Dashboard = lazy(() => import('./components/Dashboard'));
const CreateJob = lazy(() => import('./components/CreateJob'));
const JobsList = lazy(() => import('./components/JobsList'));
const NFTGallery = lazy(() => import('./components/NFTGallery'));
const Chat = lazy(() => import('./components/Chat'));
const Leaderboard = lazy(() => import('./components/Leaderboard'));
const Portfolio = lazy(() => import('./components/Portfolio'));
const DaoDashboard = lazy(() => import('./components/DaoDashboard'));
const TermsOfService = lazy(() => import('./components/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const ArbitrationDashboard = lazy(() => import('./components/ArbitrationDashboard'));
const ManagerDashboard = lazy(() => import('./components/ManagerDashboard'));
const CrossChainDashboard = lazy(() => import('./components/CrossChainDashboard'));
const PrivacyCenter = lazy(() => import('./components/PrivacyCenter'));
const SBTGallery = lazy(() => import('./components/SBTGallery'));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'));
const AnimationShowcase = lazy(() => import('./components/AnimationShowcase'));
const FiatOnramp = lazy(() => import('./components/FiatOnramp'));

import { NotificationManager } from './components/NotificationManager';
import AuthPortal from './components/AuthPortal';
import { Toaster, toast as hotToast } from 'react-hot-toast';
import { useAccount, useWalletClient, useDisconnect, useBlockNumber } from 'wagmi';
import { initSocialLogin, createBiconomySmartAccount } from './utils/biconomy';
import { createWalletClient, custom } from 'viem';
import { polygonAmoy } from 'viem/chains';

/* ── Inline styles for the shell — zero Tailwind dependency ── */
const styles = {
  shell: {
    display: 'flex', minHeight: '100vh', width: '100%',
    background: 'var(--bg-base)',
  },
  /* ── Sidebar ── */
  sidebar: (open) => ({
    width: 260, height: '100vh', position: 'fixed', left: 0, top: 0,
    background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', zIndex: 3000,
    overflowY: 'auto', overflowX: 'hidden',
    transition: 'transform 0.25s ease',
    ...(typeof window !== 'undefined' && window.innerWidth <= 1024
      ? { transform: open ? 'translateX(0)' : 'translateX(-100%)', width: 280 }
      : {}),
  }),
  sidebarLogo: {
    padding: '20px 18px 16px', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  logoText: {
    fontSize: '1.15rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff',
  },
  logoAccent: { color: 'var(--accent-light)' },
  logoSub: {
    fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.12em', color: 'var(--text-tertiary)', marginTop: 1,
  },
  closeBtn: {
    display: 'none', background: 'none', border: 'none',
    color: 'var(--text-secondary)', cursor: 'pointer', padding: 4,
  },
  sidebarNav: { flex: 1, padding: '12px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column' },
  sectionLabel: {
    padding: '6px 14px', fontSize: '0.6rem', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.1em',
    color: 'var(--text-tertiary)', opacity: 0.6, marginTop: 12, marginBottom: 4,
  },
  navItem: (active) => ({
    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
    padding: '9px 14px', borderRadius: 10, border: '1px solid transparent',
    background: active ? 'rgba(124, 92, 252, 0.08)' : 'transparent',
    borderColor: active ? 'rgba(124, 92, 252, 0.18)' : 'transparent',
    color: active ? 'var(--accent-light)' : 'var(--text-secondary)',
    fontSize: '0.82rem', fontWeight: active ? 700 : 600,
    cursor: 'pointer', transition: 'all 0.15s ease',
    textAlign: 'left', marginBottom: 2,
  }),
  sidebarBottom: {
    padding: '12px 14px 16px', borderTop: '1px solid var(--border)',
    marginTop: 'auto',
  },
  networkBox: {
    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
    borderRadius: 14, padding: 14,
  },
  networkRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10,
  },
  networkLabel: {
    fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.08em', color: 'var(--text-tertiary)',
  },
  liveDot: {
    width: 6, height: 6, borderRadius: '50%', background: 'var(--success)',
    boxShadow: '0 0 8px rgba(52,211,153,0.4)',
    animation: 'pulse 2s infinite ease-in-out',
  },
  versionRow: {
    display: 'flex', alignItems: 'center', gap: 8,
  },
  versionAvatar: {
    width: 28, height: 28, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--accent), var(--secondary))',
  },
  versionText: {
    fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-tertiary)',
  },
  versionNum: {
    fontSize: '0.72rem', fontWeight: 800, color: '#fff',
  },
  toggleRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 10,
  },
  toggleLabel: {
    fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-tertiary)',
  },
  toggle: (on) => ({
    width: 34, height: 18, borderRadius: 10, position: 'relative',
    background: on ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
    border: 'none', cursor: 'pointer', transition: 'background 0.2s ease',
  }),
  toggleDot: (on) => ({
    position: 'absolute', top: 3, width: 12, height: 12, borderRadius: '50%',
    background: '#fff', transition: 'left 0.2s ease',
    left: on ? 19 : 3,
  }),
  /* ── Main ── */
  main: {
    flex: 1, marginLeft: 260, display: 'flex', flexDirection: 'column',
    minHeight: '100vh', width: 'calc(100% - 260px)',
    background: 'var(--bg-base)',
  },
  header: {
    height: 64, borderBottom: '1px solid var(--border)',
    background: 'rgba(1,2,4,0.85)', backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 28px', position: 'sticky', top: 0, zIndex: 500,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  menuBtn: {
    display: 'none', background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border)', borderRadius: 10, padding: 8,
    color: 'var(--text-secondary)', cursor: 'pointer',
  },
  headerTitle: {
    fontSize: '0.95rem', fontWeight: 800, color: '#fff',
    letterSpacing: '-0.02em', textTransform: 'capitalize',
  },
  headerStatus: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-tertiary)',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2,
  },
  statusDot: {
    width: 5, height: 5, borderRadius: '50%', background: '#34d399',
  },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  gasBtn: (on) => ({
    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
    borderRadius: 10, background: on ? 'rgba(124,92,252,0.08)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${on ? 'rgba(124,92,252,0.2)' : 'var(--border)'}`,
    color: on ? 'var(--accent-light)' : 'var(--text-tertiary)',
    fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer',
    textTransform: 'uppercase', letterSpacing: '0.04em',
    transition: 'all 0.15s ease',
  }),
  socialBtn: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
    borderRadius: 10, background: 'linear-gradient(135deg, var(--accent), var(--secondary))',
    color: 'var(--text-inverse)', fontSize: '0.75rem', fontWeight: 700, border: 'none',
    cursor: 'pointer', boxShadow: '0 4px 16px var(--accent-glow)',
    transition: 'all 0.2s ease',
  },
  smartWallet: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '4px 4px 4px 14px',
    borderRadius: 12, background: 'rgba(124,92,252,0.06)',
    border: '1px solid rgba(124,92,252,0.15)',
  },
  saLabel: {
    fontSize: '0.55rem', fontWeight: 700, color: 'var(--accent-light)',
    textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  saAddr: {
    fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-tertiary)',
    fontFamily: "'SF Mono', 'Fira Code', monospace",
  },
  logoutBtn: {
    padding: 6, borderRadius: 8, background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border)', color: 'var(--text-secondary)',
    cursor: 'pointer', display: 'flex', alignItems: 'center',
  },
  content: {
    flex: 1, padding: '28px 32px 48px', maxWidth: 1280, width: '100%',
  },
  footer: {
    padding: '14px 32px', borderTop: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  footerLinks: { display: 'flex', gap: 16 },
  footerLink: {
    background: 'none', border: 'none', fontSize: '0.72rem',
    color: 'var(--text-tertiary)', cursor: 'pointer',
    transition: 'color 0.15s ease',
  },
  footerCopy: {
    fontSize: '0.72rem', color: 'var(--text-tertiary)',
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(4px)', zIndex: 2500, cursor: 'pointer',
  },
  mobileNav: {
    display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0,
    height: 64, background: 'var(--bg-sidebar)',
    borderTop: '1px solid var(--border)',
    justifyContent: 'space-around', alignItems: 'center', zIndex: 2000,
  },
  mobileItem: (active) => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    color: active ? 'var(--accent-light)' : 'var(--text-tertiary)',
    fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.04em', background: 'none', border: 'none',
    cursor: 'pointer', padding: '6px 10px',
  }),
};

/* ── responsive override via CSS class since we can't do media queries inline ── */
const responsiveCSS = `
@media (max-width: 1024px) {
    .app-main { margin-left: 0 !important; width: 100% !important; padding-bottom: 72px; }
    .app-header .menu-toggle { display: flex !important; }
    .app-header .desktop-only { display: none !important; }
    .app-sidebar .close-toggle { display: flex !important; }
    .app-mobile-nav { display: flex !important; }
    .app-footer { display: none !important; }
    .app-content { padding: 20px 16px 80px !important; }
}
@keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.2); opacity: 0.7; }
    100% { transform: scale(1); opacity: 1; }
}
`;

const NAV_CORE = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'analytics', icon: BarChart3, label: 'Analytics' },
  { id: 'jobs', icon: Briefcase, label: 'Browse Jobs' },
  { id: 'create', icon: PlusCircle, label: 'Post a Job' },
];

const NAV_SOCIAL = [
  { id: 'chat', icon: MessageSquare, label: 'Messages' },
  { id: 'leaderboard', icon: Trophy, label: 'Leaderboard' },
  { id: 'governance', icon: Cpu, label: 'Governance' },
  { id: 'manager', icon: Activity, label: 'Escrow Manager' },
  { id: 'justice', icon: Gavel, label: 'Disputes' },
  { id: 'cross-chain', icon: Globe, label: 'Cross-Chain' },
];

const NAV_VAULT = [
  { id: 'nfts', icon: Ticket, label: 'NFT Gallery' },
  { id: 'sbt', icon: Award, label: 'SBT Badges' },
  { id: 'privacy', icon: Shield, label: 'Privacy' },
  { id: 'onramp', icon: CreditCard, label: 'Buy Crypto' },
];

// Hook to periodically check if our decentralised infrastructure is working
const useNetworkHealth = () => {
  const [status, setStatus] = useState({ indexing: 'Loading', storage: 'Loading' });

  useEffect(() => {
    const checkStatus = async () => {
      let indexing = 'Healthy';
      let storage = 'Healthy';

      try {
        // Check if the subgraph is responding
        const res = await fetch(import.meta.env.VITE_SUBGRAPH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: '{ _meta { block { number } } }' })
        });
        if (!res.ok) indexing = 'Degraded';
      } catch {
        indexing = 'Down';
      }

      try {
        // Ping a gateway to see if IPFS is reachable
        await fetch('https://gateway.pinata.cloud/ipfs/QmUNLLsP2chJvph9ESr8z6idWV5hYS7qUvf88vkyQp374f', { method: 'HEAD' });
      } catch {
        storage = 'Fallback'; // Might be hitting other gateways
      }

      setStatus({ indexing, storage });
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return status;
};

function App() {
  const { indexing, storage } = useNetworkHealth();
  const { address, isConnected: isWalletConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { disconnect } = useDisconnect();
  const { data: blockNumber } = useBlockNumber({ watch: true });

  // Core Shell State
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [activeTabParams, setActiveTabParams] = React.useState({});

  const navigateToOnramp = (recipient = null) => {
    setActiveTabParams({ recipient });
    setActiveTab('onramp');
  };
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGasless, setIsGasless] = useState(false);
  const [smartAccount, setSmartAccount] = useState(null);
  const [isInitializingGasless, setIsInitializingGasless] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [socialProvider, setSocialProvider] = useState(null);
  const [chatPeerAddress, setChatPeerAddress] = useState('');
  const [portfolioAddress, setPortfolioAddress] = useState(null);

  useEffect(() => {
    if (blockNumber) {
      // Global trigger for dashboard refresh on new block
      window.dispatchEvent(new CustomEvent('REFRESH_DASHBOARD'));
    }
  }, [blockNumber]);

  // Anime.js hooks
  const sidebarRef = React.useRef(null);
  const { slideInLeft, staggerFadeIn } = useAnimeAnimations();

  const hasAnimatedRef = React.useRef(false);
  React.useEffect(() => {
    // Only animate once on initial mount for desktop
    if (!hasAnimatedRef.current && window.innerWidth > 1024 && sidebarRef.current) {
      hasAnimatedRef.current = true;
      slideInLeft(sidebarRef.current, 100);
      setTimeout(() => staggerFadeIn('.anime-nav-item', 60), 300);
    }
  }, [slideInLeft, staggerFadeIn]);

  // Gasless toggle handler — only inits Biconomy when user manually enables
  const handleToggleGasless = async () => {
    if (isGasless) {
      // Turning OFF — just flip the flag, keep smartAccount cached
      setIsGasless(false);
      hotToast.success('Gasless mode disabled');
      return;
    }
    // Turning ON
    if (!isWalletConnected || !walletClient) {
      hotToast.error('Connect your wallet first');
      return;
    }
    if (smartAccount) {
      // Already initialized from a previous toggle, just re-enable
      setIsGasless(true);
      hotToast.success('Gasless mode enabled');
      return;
    }
    // First-time init
    setIsInitializingGasless(true);
    try {
      const sa = await createBiconomySmartAccount(walletClient);
      if (sa) {
        setSmartAccount(sa);
        setIsGasless(true);
        hotToast.success('Gas relay active');
      } else {
        hotToast.error('Failed to initialize gasless mode');
      }
    } catch (e) {
      console.error('[Gasless]', e);
      hotToast.error('Gasless init failed: ' + (e.message || 'Unknown error'));
    } finally {
      setIsInitializingGasless(false);
    }
  };

  const handleSocialLogin = async () => {
    setIsLoggingIn(true);
    try {
      const particle = await initSocialLogin();
      if (!particle) throw new Error("Failed");
      await particle.auth.login();
      const { ParticleProvider } = await import("@biconomy/particle-auth");
      const provider = new ParticleProvider(particle.auth);
      const wc = createWalletClient({
        chain: polygonAmoy,
        transport: custom(provider)
      });
      if (particle.isMock) wc.isMock = true;

      const sa = await createBiconomySmartAccount(wc);
      if (!sa) throw new Error('Smart account creation failed');
      setSmartAccount(sa);
      setSocialProvider(particle);
      hotToast.success('🎉 Welcome back!', {
        duration: 4000
      });
    } catch (err) { console.error(err); hotToast.error("Login failed"); }
    finally { setIsLoggingIn(false); }
  };

  const handleLogout = async () => {
    if (socialProvider) await socialProvider.auth.logout();
    disconnect(); // Universal disconnect
    setSmartAccount(null);
    setSocialProvider(null);
    setIsGasless(false);
    hotToast.success("Logged out");
  };

  // Reset gasless when wallet disconnects
  React.useEffect(() => {
    if (!isWalletConnected) {
      setIsGasless(false);
      setSmartAccount(null);
    }
  }, [isWalletConnected]);

  const effectiveAddress = smartAccount?.accountAddress || address;

  const navigate = (tab) => { setActiveTab(tab); setIsSidebarOpen(false); };

  const onSelectChat = (addr) => { setChatPeerAddress(addr); setActiveTab('chat'); };

  const renderContent = () => {
    if (portfolioAddress) return <Portfolio address={portfolioAddress} onFiatPay={navigateToOnramp} onBack={() => setPortfolioAddress(null)} />;

    switch (activeTab) {
      case 'dashboard': return <Dashboard address={effectiveAddress} />;
      case 'jobs': return <JobsList onUserClick={setPortfolioAddress} onSelectChat={onSelectChat} onFiatPay={navigateToOnramp} gasless={isGasless} smartAccount={smartAccount} />;
      case 'create':
      case 'create-job': return <CreateJob smartAccount={smartAccount} gasless={isGasless} address={effectiveAddress} onJobCreated={() => setActiveTab('jobs')} />;
      case 'nfts':
      case 'nft-gallery': return <NFTGallery address={effectiveAddress} />;
      case 'chat':
      case 'messages': return <Chat initialPeerAddress={chatPeerAddress} address={effectiveAddress} />;
      case 'leaderboard': return <Leaderboard onUserClick={setPortfolioAddress} />;
      case 'governance':
      case 'dao': return <DaoDashboard address={effectiveAddress} />;
      case 'justice':
      case 'arbitration': return <ArbitrationDashboard address={effectiveAddress} />;
      case 'manager':
      case 'yield': return <ManagerDashboard address={effectiveAddress} />;
      case 'cross-chain': return <CrossChainDashboard address={effectiveAddress} />;
      case 'analytics': return <AnalyticsDashboard />;
      case 'sbt':
      case 'sbt-gallery': return <SBTGallery address={effectiveAddress} />;
      case 'terms': return <TermsOfService />;
      case 'privacy': return <PrivacyCenter address={effectiveAddress} />;
      case 'showcase': return <AnimationShowcase />;
      case 'onramp':
      case 'fiat-onramp': return <FiatOnramp address={effectiveAddress} recipientAddress={activeTabParams.recipient} />;
      case 'portfolio': return <Portfolio address={effectiveAddress} onFiatPay={navigateToOnramp} />;
      default: return <Dashboard address={effectiveAddress} />;
    }
  };

  const NavButton = ({ item }) => (
    <button
      style={styles.navItem(activeTab === item.id)}
      onClick={() => navigate(item.id)}
      onMouseEnter={e => {
        if (activeTab !== item.id) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={e => {
        if (activeTab !== item.id) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }
      }}
    >
      <item.icon size={18} /> {item.label}
    </button>
  );

  return (
    <>
      <style>{responsiveCSS}</style>
      <div style={styles.shell}>
        <NotificationManager />

        {/* ═══ SIDEBAR ═══ */}
        <aside ref={sidebarRef} className="app-sidebar" style={styles.sidebar(isSidebarOpen)}>
          <div style={styles.sidebarLogo}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'linear-gradient(135deg, var(--accent), var(--secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 16px var(--accent-glow)',
                overflow: 'hidden'
              }}>
                <img src="/logo.png" alt="PolyLance" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <div style={styles.logoText}>POLY<span style={styles.logoAccent}>LANCE</span></div>
                <div style={styles.logoSub}>Decentralized Work Force</div>
              </div>
            </div>
            <button className="close-toggle" style={styles.closeBtn} onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
          </div>

          <nav style={styles.sidebarNav} className="custom-scrollbar">
            <div style={styles.sectionLabel}>Main Modules</div>
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Command Center' },
              { id: 'jobs', icon: Briefcase, label: 'Job Market' },
              { id: 'create-job', icon: PlusCircle, label: 'Initialize Contract' },
              { id: 'leaderboard', icon: Trophy, label: 'Elite Leaderboard' },
              { id: 'portfolio', icon: User, label: 'Identity & Reputation' },
            ].map(item => (
              <div key={item.id} className="anime-nav-item"
                onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                style={styles.navItem(activeTab === item.id)}>
                <item.icon size={16} /> {item.label}
              </div>
            ))}

            <div style={styles.sectionLabel}>Finance & DAO</div>
            {[
              { id: 'dao', icon: Globe, label: 'DAO Governance' },
              { id: 'arbitration', icon: Gavel, label: 'Justice Protocol' },
              { id: 'yield', icon: Activity, label: 'Yield Manager' },
              { id: 'cross-chain', icon: Zap, label: 'Cross-Chain Bridge' },
              { id: 'fiat-onramp', icon: CreditCard, label: 'Fiat Gateway' },
            ].map(item => (
              <div key={item.id} className="anime-nav-item"
                onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                style={styles.navItem(activeTab === item.id)}>
                <item.icon size={16} /> {item.label}
              </div>
            ))}

            <div style={styles.sectionLabel}>System</div>
            {[
              { id: 'analytics', icon: BarChart3, label: 'Network Analytics' },
              { id: 'messages', icon: MessageSquare, label: 'Encrypted Comms' },
              { id: 'nft-gallery', icon: Award, label: 'NFT Showcase' },
              { id: 'sbt-gallery', icon: ShieldCheck, label: 'Soulbound Tokens' },
              { id: 'privacy', icon: Shield, label: 'Privacy Center' },
            ].map(item => (
              <div key={item.id} className="anime-nav-item"
                onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                style={styles.navItem(activeTab === item.id)}>
                <item.icon size={16} /> {item.label}
              </div>
            ))}
          </nav>

          <div style={styles.sidebarBottom}>
            <div style={styles.networkBox}>
              <div style={styles.networkRow}>
                <span style={styles.networkLabel}>Network</span>
                <div style={styles.liveDot} />
              </div>
              <div style={styles.versionRow}>
                <div style={styles.versionAvatar} />
                <div>
                  <div style={styles.versionText}>Protocol</div>
                  <div style={styles.versionNum}>v1.5.0</div>
                </div>
              </div>
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.55rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Indexing</span>
                  <span style={{ fontSize: '0.55rem', fontWeight: 800, color: indexing === 'Healthy' ? '#10b981' : '#f59e0b' }}>{indexing}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.55rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Storage</span>
                  <span style={{ fontSize: '0.55rem', fontWeight: 800, color: storage === 'Healthy' ? '#10b981' : '#3b82f6' }}>{storage}</span>
                </div>
              </div>
              <div style={styles.toggleRow}>
                <span style={styles.toggleLabel}>Gasless Mode</span>
                <button style={styles.toggle(isGasless)} onClick={handleToggleGasless} disabled={isInitializingGasless}>
                  <div style={styles.toggleDot(isGasless)} />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* ═══ MAIN ═══ */}
        <main className="app-main" style={styles.main}>
          <header className="app-header" style={styles.header}>
            <div style={styles.headerLeft}>
              <button className="menu-toggle" aria-label="Open navigation menu" style={styles.menuBtn} onClick={() => setIsSidebarOpen(true)}>
                <Menu size={18} />
              </button>
              <div>
                <div style={styles.headerTitle}>{(activeTab || '').replace('-', ' ')}</div>
                <div style={styles.headerStatus}>
                  <div style={{ ...styles.statusDot, background: '#10b981' }} />
                  Polygon PoS On-chain
                </div>
              </div>
            </div>

            <div style={styles.headerRight}>
              <Toaster />
              <button
                className="desktop-only"
                style={styles.gasBtn(isGasless)}
                onClick={handleToggleGasless}
                disabled={isInitializingGasless}
                aria-label={`Toggle Gasless mode, currently ${isGasless ? 'on' : 'off'}`}
              >
                {isInitializingGasless ? <Shield size={14} className="spin" /> : isGasless ? <ShieldCheck size={14} /> : <Shield size={14} />}
                {isInitializingGasless ? 'Initializing...' : isGasless ? 'Gasless' : 'Standard'}
              </button>

              {!smartAccount && (
                <button className="desktop-only" style={styles.socialBtn} onClick={handleSocialLogin} disabled={isLoggingIn}>
                  <Mail size={14} />
                  {isLoggingIn ? 'Loading...' : 'Social Login'}
                </button>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
                {(isWalletConnected || smartAccount) && (
                  <button
                    style={{ ...styles.logoutBtn, height: 40, width: 40, justifyContent: 'center' }}
                    onClick={handleLogout}
                    title="Sign Out"
                    aria-label="Logout"
                  >
                    <LogOut size={16} />
                  </button>
                )}
              </div>
            </div>
          </header>

          <div className="app-content" style={styles.content}>
            <AnimatePresence mode="wait">
              {!effectiveAddress && activeTab !== 'terms' && activeTab !== 'privacy' ? (
                <motion.div key="auth" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                  <AuthPortal onSocialLogin={handleSocialLogin} isLoggingIn={isLoggingIn} />
                </motion.div>
              ) : (
                <motion.div key={activeTab + (portfolioAddress || '')} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
                  <Suspense fallback={
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: 16 }}>
                      <Loader2 size={40} className="animate-spin" style={{ color: 'var(--accent-light)', opacity: 0.8 }} />
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Loading Module...</div>
                    </div>
                  }>
                    {renderContent()}
                  </Suspense>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <footer className="app-footer" style={styles.footer}>
            <div style={styles.footerLinks}>
              <button style={styles.footerLink} onClick={() => setActiveTab('terms')}>Terms</button>
              <button style={styles.footerLink} onClick={() => setActiveTab('privacy')}>Privacy</button>
            </div>
            <p style={styles.footerCopy}>© 2026 PolyLance. All rights reserved.</p>
          </footer>
        </main>

        {/* ═══ MOBILE OVERLAY ═══ */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={styles.overlay} onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* ═══ MOBILE NAV ═══ */}
        <div className="app-mobile-nav" style={styles.mobileNav}>
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
            { id: 'jobs', icon: Briefcase, label: 'Jobs' },
            { id: 'create', icon: PlusCircle, label: 'Post' },
            { id: 'chat', icon: MessageSquare, label: 'Chat' },
          ].map(item => (
            <button key={item.id} style={styles.mobileItem(activeTab === item.id)} onClick={() => navigate(item.id)}>
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
          <button style={styles.mobileItem(false)} onClick={() => setIsSidebarOpen(true)}>
            <Menu size={20} />
            <span>More</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default App;
