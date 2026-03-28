// [SOVEREIGN TELEMETRY] Restored Icon Resonance - Absolute Zero Reference Stability Actuated.

import React, { useState, Suspense, lazy, useEffect, useRef, useContext } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  Briefcase, PlusCircle, LayoutDashboard, MessageSquare,
  Trophy, Gavel, Activity, Globe, BarChart3, Menu, X,
  Award, Zap, CreditCard, Shield, ShieldCheck, Mail, User,
  LogOut, Cpu, Ticket, ChevronDown, Loader2, Flame, Brain, Landmark, ShoppingBag
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAnimeAnimations } from './hooks/useAnimeAnimations';
import { AuthContext } from './Web3Provider';

// Lazy load heavy components
const Dashboard = lazy(() => import('./components/Dashboard.jsx'));
const SpecialistMarketplace = lazy(() => import('./components/SpecialistMarketplace.jsx'));
const CreateJob = lazy(() => import('./components/CreateJob'));
const JobsList = lazy(() => import('./components/JobsList'));
const NFTGallery = lazy(() => import('./components/NFTGallery'));
const Chat = lazy(() => import('./components/Chat'));
const Leaderboard = lazy(() => import('./components/Leaderboard'));
const Portfolio = lazy(() => import('./components/Portfolio'));
const ZenithGovernance = lazy(() => import('./components/DaoDashboard'));
const TermsOfService = lazy(() => import('./components/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const ZenithCourt = lazy(() => import('./components/ArbitrationDashboard'));
const ZenithControl = lazy(() => import('./components/ManagerDashboard'));
const ZenithStrata = lazy(() => import('./components/YieldManagerDashboard'));
const ZenithLiquidity = lazy(() => import('./components/InvoiceMarketplace'));
const CrossChainDashboard = lazy(() => import('./components/CrossChainDashboard'));
const PrivacyCenter = lazy(() => import('./components/PrivacyCenter'));
const SBTGallery = lazy(() => import('./components/SBTGallery'));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'));
const AnimationShowcase = lazy(() => import('./components/AnimationShowcase'));
const FiatOnramp = lazy(() => import('./components/FiatOnramp'));
const LandingPage = lazy(() => import('./components/LandingPage'));
const IdentityManager = lazy(() => import('./components/IdentityManager'));
const Manifesto = lazy(() => import('./components/Manifesto.jsx'));
const InsuranceDashboard = lazy(() => import('./components/InsuranceDashboard'));
const AICommandCenter = lazy(() => import('./components/AICommandCenter'));
const ProtocolDashboard = lazy(() => import('./components/ProtocolDashboard'));
const NFTMarketplace = lazy(() => import('./components/NFTMarketplace'));

import { NotificationManager } from './components/NotificationManager';
import CourtErrorBoundary from './components/CourtErrorBoundary';
import { Toaster, toast as hotToast } from 'react-hot-toast';
import { useAccount, useWalletClient, useDisconnect, useBlockNumber } from 'wagmi';
import env from './config/env';
import { initSocialLogin, createBiconomySmartAccount } from './utils/biconomy';
import { createWalletClient, custom } from 'viem';
import { polygonAmoy } from 'viem/chains';
import { ZENITH_JUDGES } from './constants';

/* ── Inline styles for the shell — 8PM AUTHENTIC ── */
const styles = {
  shell: {
    display: 'flex', minHeight: '100vh', width: '100%',
    background: 'var(--bg-base)',
  },
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
    fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.04em', color: '#fff',
    textTransform: 'uppercase'
  },
  logoAccent: { color: '#00f5d4', textShadow: '0 0 20px rgba(0,245,212,0.4)' },
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
    display: 'flex', alignItems: 'center', gap: 12, width: '100%',
    padding: '12px 18px', borderRadius: 12, border: '1px solid transparent',
    background: active ? 'rgba(0, 245, 212, 0.04)' : 'transparent',
    borderColor: active ? 'rgba(0, 245, 212, 0.15)' : 'transparent',
    color: active ? '#00f5d4' : 'rgba(255,255,255,0.4)',
    fontSize: '0.88rem', fontWeight: active ? 800 : 700,
    cursor: 'pointer', transition: 'all 0.2s ease',
    textAlign: 'left', marginBottom: 4,
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
  logoutBtn: {
    padding: 6, borderRadius: 8, background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border)', color: 'var(--text-secondary)',
    cursor: 'pointer', display: 'flex', alignItems: 'center',
  },
  content: {
    flex: 1, padding: '28px 32px 48px', maxWidth: 1800, width: '100%', margin: '0 auto',
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

// Hook to periodically check if our decentralised infrastructure is working
const useNetworkHealth = () => {
  const [status, setStatus] = useState({ indexing: 'Loading', storage: 'Loading' });

  useEffect(() => {
    const checkStatus = async () => {
      let indexing = 'Healthy';
      let storage = 'Healthy';
      try {
        const subgraphUrl = import.meta.env.VITE_SUBGRAPH_URL || 'https://api.studio.thegraph.com/query/49625/polylance-zenith-amoy/v0.0.1';
        const res = await fetch(subgraphUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: '{ _meta { block { number } } }' })
        });
        if (!res.ok) indexing = 'Degraded';
      } catch {
        indexing = 'Down';
      }
      setStatus({ indexing, storage });
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);
  return status;
};

function App() {
  const { authStatus = 'loading', setAuthStatus = () => {} } = useContext(AuthContext) || {};
  const { address, isConnected: isWalletConnected, isReconnecting } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { disconnect } = useDisconnect();
  const { data: blockNumber } = useBlockNumber({ watch: true });
  const { staggerFadeIn } = useAnimeAnimations();
  
  useNetworkHealth(); // Runs background health checks; result used only in future telemetry

  const [isHydrated, setIsHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeTabParams, setActiveTabParams] = useState({});

  useEffect(() => {
    setIsHydrated(true);

    // Sync activeTab with URL path for SEO/Direct deep linking
    const path = window.location.pathname.replace('/', '');
    const validTabs = ['manifesto', 'jobs', 'specialists', 'leaderboard', 'dashboard', 'identity', 'portfolio'];
    if (validTabs.includes(path)) {
      setActiveTab(path);
    }

    // Task 1: Session Resurrection Restoration
    const session = localStorage.getItem('zenith_active_session');
    if (session) {
      try {
        const { address: savedAddr, authenticated } = JSON.parse(session);
        if (authenticated && savedAddr) {
          setAuthStatus('authenticated');
          console.info('[SECURITY] Zenith session resurrected from identity anchor.');
        }
      } catch (e) { localStorage.removeItem('zenith_active_session'); }
    }
  }, [setAuthStatus]);

  // Directive 16: Global State Resurrection
  // If the user is connected, we proactively hydrate their view from the local-first mesh.
  useEffect(() => {
    if (isWalletConnected && address) {
        console.info('[SYSTEM] Resurrecting Sovereign State for:', address);
        // This triggers a refresh of all components listening to REFRESH_DASHBOARD event
        window.dispatchEvent(new CustomEvent('REFRESH_DASHBOARD'));
    }
  }, [isWalletConnected, address]);

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
      window.dispatchEvent(new CustomEvent('REFRESH_DASHBOARD'));
    }
    const handleNavToCreate = (e) => {
      if (e.detail) setActiveTabParams(e.detail);
      setActiveTab('create-job');
    };
    window.addEventListener('NAV_TO_CREATE', handleNavToCreate);
    return () => window.removeEventListener('NAV_TO_CREATE', handleNavToCreate);
  }, [blockNumber]);

  const sidebarRef = useRef(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (!hasAnimatedRef.current && window.innerWidth > 1024 && sidebarRef.current) {
      hasAnimatedRef.current = true;
      import('animejs').then(({ animate }) => {
        animate(sidebarRef.current, {
          opacity: [0, 1],
          easing: 'easeOutExpo',
          duration: 1000,
        });
      });
      setTimeout(() => staggerFadeIn('.anime-nav-item', 60), 300);
    }
    
    // Directive 05: Navigation Event Resonance
    const handleNavToCreate = () => setActiveTab('create-job');
    window.addEventListener('NAV_TO_CREATE', handleNavToCreate);
    return () => window.removeEventListener('NAV_TO_CREATE', handleNavToCreate);
  }, [staggerFadeIn]);

  const actuateGaslessToggleIntent = async () => {
    if (isGasless) {
      setIsGasless(false);
      hotToast.success('Gasless mode disabled');
      return;
    }
    if (!isWalletConnected || !walletClient) {
      hotToast.error('Connect your wallet first');
      return;
    }
    if (smartAccount) {
      setIsGasless(true);
      hotToast.success('Gasless mode enabled');
      return;
    }
    setIsInitializingGasless(true);
    try {
      if (walletClient.chain.id !== 80002) {
        hotToast.error('Gasless Mode requires Polygon Amoy. Please switch network.');
        setIsInitializingGasless(false);
        return;
      }
      const sa = await createBiconomySmartAccount(walletClient);
      if (sa) {
        setSmartAccount(sa);
        setIsGasless(true);
        hotToast.success('Gas relay active');
      } else {
        hotToast.error('Failed to initialize gasless mode.');
      }
    } catch (e) {
      hotToast.error('Gasless init failed');
    } finally {
      setIsInitializingGasless(false);
    }
  };

  const actuateSocialLoginIntent = async () => {
    setIsLoggingIn(true);
    try {
      const particle = await initSocialLogin();
      if (!particle) throw new Error("Failed");
      await particle.auth.login();
      const { ParticleProvider } = await import("@biconomy/particle-auth");
      const provider = new ParticleProvider(particle.auth);
      
      // Directive 08: Identity Anchoring
      // Viem requires an explicit account to be consumed by the Biconomy Smart Account client.
      const [address] = await provider.request({ method: 'eth_accounts' });
      
      const wc = createWalletClient({ 
        account: address,
        chain: polygonAmoy, 
        transport: custom(provider) 
      });
      
      if (particle.isMock) wc.isMock = true;
      const sa = await createBiconomySmartAccount(wc);
      if (!sa) throw new Error('Smart account creation failed');
      setSmartAccount(sa);
      setSocialProvider(particle);
      hotToast.success('🎉 Welcome back!');
    } catch (err) {
      hotToast.error("Login failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const actuateBypassIntent = async () => {
    console.info('[SECURITY] Actuating Sovereign developer bypass.');
    const mockSA = {
      accountAddress: '0x25F6C8ed995C811E6c0ADb1D66A60830E8115e9A',
      isMock: true,
      sendTransaction: async () => ({
        waitForTxHash: async () => ({ transactionHash: '0xmock_bypass_' + Date.now() })
      })
    };
    setSmartAccount(mockSA);
    setIsGasless(true);
    hotToast.success('Sovereign Bypass Active');
  };

  const actuateLogoutIntent = async () => {
    setSmartAccount(null);
    setSocialProvider(null);
    setIsGasless(false);
    try {
      if (socialProvider) await socialProvider.auth.logout();
      disconnect();
      hotToast.success("Connection severed.");
    } catch (e) { console.warn('[AUTH] Logout had minor issue:', e?.message); }
  };

  useEffect(() => {
    // Directive 06: Identity Persistence. 
    // Circuit Breaker: Only reset if BOTH resonance pathways collapse.
    if (!isWalletConnected && !socialProvider && authStatus !== 'loading') {
      setIsGasless(false);
      setSmartAccount(null);
    }
  }, [isWalletConnected, socialProvider, authStatus]);


  const effectiveAddress = smartAccount?.accountAddress || address;
  const isAdmin = effectiveAddress && ZENITH_JUDGES.some(j => j.toLowerCase() === effectiveAddress.toLowerCase());
  
  // Directive 10: Session Continuity Guard
  // A session is active if we have a Smart Account (Social/Bypass) OR a fully connected wallet with an address.
  // We use isHydrated to prevent SSR/Hydration mismatch flicker.
  const isSessionActive = isHydrated && (smartAccount !== null || (isWalletConnected && !!address));

  const navigate = (tab) => { setActiveTab(tab); setIsSidebarOpen(false); };
  const onSelectChat = (addr) => { setChatPeerAddress(addr); setActiveTab('chat'); };

  const renderContent = () => {
    if (portfolioAddress) return <Portfolio address={portfolioAddress} onFiatPay={navigateToOnramp} onBack={() => setPortfolioAddress(null)} />;
    switch (activeTab) {
      case 'dashboard': return <Dashboard address={effectiveAddress} />;
      case 'jobs': return <JobsList address={effectiveAddress} onUserClick={setPortfolioAddress} onSelectChat={onSelectChat} onFiatPay={navigateToOnramp} gasless={isGasless} smartAccount={smartAccount} />;
      case 'create-job': return <CreateJob {...activeTabParams} smartAccount={smartAccount} gasless={isGasless} address={effectiveAddress} onJobCreated={() => { setActiveTab('jobs'); setActiveTabParams({}); }} />;
      case 'nfts': return <NFTGallery address={effectiveAddress} />;
      case 'chat': return <Chat initialPeerAddress={chatPeerAddress} address={effectiveAddress} />;
      case 'leaderboard': return <Leaderboard onUserClick={setPortfolioAddress} />;
      case 'governance': return <ZenithGovernance address={effectiveAddress} />;
      case 'court': return (
        <CourtErrorBoundary>
          <ZenithCourt address={effectiveAddress} />
        </CourtErrorBoundary>
      );
      case 'control': return isAdmin ? <ZenithControl address={effectiveAddress} /> : <Dashboard address={effectiveAddress} />;
      case 'strata': return <ZenithStrata address={effectiveAddress} />;
      case 'liquidity': return <ZenithLiquidity />;
      case 'cross-chain': return <CrossChainDashboard address={effectiveAddress} />;
      case 'analytics': return isAdmin ? <AnalyticsDashboard /> : <Dashboard address={effectiveAddress} />;
      case 'sbt-gallery': return <SBTGallery address={effectiveAddress} />;
      case 'terms': return <TermsOfService />;
      case 'privacy': return <PrivacyCenter address={effectiveAddress} />;
      case 'onramp': return <FiatOnramp address={effectiveAddress} recipientAddress={activeTabParams.recipient} />;
      case 'identity': return <IdentityManager address={effectiveAddress} />;
      case 'portfolio': return <Portfolio address={effectiveAddress} onFiatPay={navigateToOnramp} />;
      case 'specialists': return <SpecialistMarketplace onRegister={() => setActiveTab('identity')} />;
      case 'insurance': return <InsuranceDashboard />;
      case 'ai-oracle': return <AICommandCenter />;
      case 'protocol': return <ProtocolDashboard />;
      case 'marketplace': return <NFTMarketplace />;
      case 'manifesto': return <Manifesto />;
      default: return <Dashboard address={effectiveAddress} />;
    }
  };

  if (!isHydrated) return (
    <div style={{ height: '100vh', width: '100vw', background: '#050608', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
      <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', inset: '-20px', background: 'radial-gradient(circle, rgba(0,245,212,0.1) 0%, transparent 70%)', filter: 'blur(10px)' }} />
          <Loader2 size={48} className="animate-spin" color="#00f5d4" />
      </div>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em' }}>Core System Initializing</div>
    </div>
  );

  return (
    <>
      <Toaster position="top-right" />
      {(!isSessionActive || isReconnecting) && activeTab !== 'terms' && activeTab !== 'privacy' && activeTab !== 'manifesto' ? (
        <Suspense fallback={null}>
          <LandingPage 
            onSocialLogin={actuateSocialLoginIntent} 
            onBypass={actuateBypassIntent}
            isLoggingIn={isLoggingIn} 
          />
        </Suspense>
      ) : (
        <div style={styles.shell}>
          <NotificationManager />
          <aside ref={sidebarRef} className="app-sidebar" style={styles.sidebar(isSidebarOpen)}>
            <div style={styles.sidebarLogo}>
              <div style={styles.logoText}>POLY<span style={styles.logoAccent}>LANCE</span></div>
              <button className="close-toggle" style={styles.closeBtn} onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
            </div>
            <nav style={styles.sidebarNav} className="custom-scrollbar">
              <div style={styles.sectionLabel}>Main Modules</div>
              {[
                { id: 'dashboard', icon: LayoutDashboard, label: 'Command Center' },
                { id: 'jobs', icon: Briefcase, label: 'Find a Job' },
                { id: 'specialists', icon: User, label: 'Expert Network' },
                { id: 'marketplace', icon: ShoppingBag, label: 'NFT Marketplace' },
                { id: 'create-job', icon: PlusCircle, label: 'Initialize Contract' },
                { id: 'leaderboard', icon: Trophy, label: 'Elite Leaderboard' },
                { id: 'identity', icon: User, label: 'Profile Updater' },
                { id: 'portfolio', icon: User, label: 'Zenith Reputation' },
              ].map(item => (
                <div key={item.id} className="anime-nav-item" onClick={() => navigate(item.id)} style={styles.navItem(activeTab === item.id)}>
                  <item.icon size={16} color={activeTab === item.id ? '#00f5d4' : 'rgba(255,255,255,0.4)'} /> {item.label}
                </div>
              ))}
              
              <div style={styles.sectionLabel}>Finance & Zenith</div>
              {[
                  { id: 'governance', icon: Globe, label: 'DAO Governance' },
                  { id: 'court', icon: Gavel, label: 'Zenith Court' },
                  { id: 'insurance', icon: ShieldCheck, label: 'Zenith Shield' },
                  { id: 'liquidity', icon: Flame, label: 'Zenith Liquidity' },
              ].map(item => (
                <div key={item.id} className="anime-nav-item" onClick={() => navigate(item.id)} style={styles.navItem(activeTab === item.id)}>
                  <item.icon size={16} color={activeTab === item.id ? '#00f5d4' : 'rgba(255,255,255,0.4)'} /> {item.label}
                </div>
              ))}

              {isAdmin && (
                <>
                  <div style={styles.sectionLabel}>Sovereign Oversight</div>
                  {[
                    { id: 'control', icon: Activity, label: 'Zenith Watcher' },
                    { id: 'ai-oracle', icon: Brain, label: 'AI Oracle' },
                    { id: 'protocol', icon: Landmark, label: 'Zenith Protocol' },
                    { id: 'analytics', icon: BarChart3, label: 'Network Analytics' },
                  ].map(item => (
                    <div key={item.id} className="anime-nav-item" onClick={() => navigate(item.id)} style={styles.navItem(activeTab === item.id)}>
                      <item.icon size={16} /> {item.label}
                    </div>
                  ))}
                </>
              )}
              <div style={styles.sectionLabel}>System</div>
              {[
                { id: 'chat', icon: MessageSquare, label: 'Encrypted Comms' },
                { id: 'sbt-gallery', icon: ShieldCheck, label: 'Soulbound Tokens' },
                { id: 'privacy', icon: Shield, label: 'Privacy Center' },
              ].map(item => (
                <div key={item.id} className="anime-nav-item" onClick={() => navigate(item.id)} style={styles.navItem(activeTab === item.id)}>
                  <item.icon size={16} color={activeTab === item.id ? '#00f5d4' : 'rgba(255,255,255,0.4)'} /> {item.label}
                </div>
              ))}
            </nav>
            <div style={styles.sidebarBottom}>
              <div style={styles.networkBox}>
                <div style={styles.networkRow}>
                  <span style={styles.networkLabel}>Network Stats</span>
                  <div style={styles.liveDot} />
                </div>
                <div style={styles.versionRow}>
                  <div style={{ ...styles.versionAvatar, background: 'linear-gradient(135deg, #00f5d4, #6366f1)', boxShadow: '0 0 15px rgba(0,245,212,0.3)' }} />
                  <div>
                    <div style={styles.versionText}>Protocol</div>
                    <div style={styles.versionNum}>v1.5.1-Z</div>
                  </div>
                </div>
                <div style={styles.toggleRow}>
                  <span style={styles.toggleLabel}>Gasless Mode</span>
                  <button style={styles.toggle(isGasless)} onClick={actuateGaslessToggleIntent} disabled={isInitializingGasless}>
                    <div style={styles.toggleDot(isGasless)} />
                  </button>
                </div>
              </div>
            </div>
          </aside>
          <main className="app-main" style={styles.main}>
            <header className="app-header" style={styles.header}>
              <div style={styles.headerLeft}>
                <button className="menu-toggle" style={styles.menuBtn} onClick={() => setIsSidebarOpen(true)}><Menu size={18} /></button>
                <div>
                  <div style={{ ...styles.headerTitle, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{activeTab === 'dashboard' ? 'Command Center' : (activeTab || '').replace('-', ' ')}</div>
                  <div style={styles.headerStatus}><div style={styles.statusDot} />Polygon PoS On-Chain</div>
                </div>
              </div>
              <div style={styles.headerRight}>
                <button className="desktop-only" 
                  style={{ 
                    ...styles.gasBtn(isGasless), 
                    background: 'rgba(255,255,255,0.03)', 
                    color: isGasless ? '#00f5d4' : 'rgba(255,255,255,0.4)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '8px 16px',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                  }} 
                  onClick={actuateGaslessToggleIntent} 
                  disabled={isInitializingGasless}
                >
                  {isInitializingGasless ? <Shield size={14} className="animate-spin" /> : <ShieldCheck size={14} style={{ color: isGasless ? '#00f5d4' : 'inherit' }} />}
                  {isInitializingGasless ? 'Initializing...' : 'Sovereign Shield'}
                </button>
                {/* SOCIAL LOGIN - Only shown if NO wallet is connected AND NO smart account exists */}
                {!isWalletConnected && !smartAccount && (
                  <button className="desktop-only" 
                    style={{ 
                        ...styles.socialBtn, 
                        background: 'linear-gradient(135deg, #00f5d4, #06b6d4)', 
                        color: '#000',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '8px 16px',
                        fontSize: '11px',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }} 
                    onClick={actuateSocialLoginIntent} 
                    disabled={isLoggingIn}
                  >
                    <Mail size={14} /> {isLoggingIn ? 'Syncing...' : 'Social Login'}
                  </button>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
                  {(isWalletConnected || smartAccount) && (
                    <button style={styles.logoutBtn} onClick={actuateLogoutIntent} title="Sign Out"><LogOut size={16} /></button>
                  )}
                </div>
              </div>
            </header>
            <div className="app-content" style={styles.content}>
              <AnimatePresence mode="wait">
                <motion.div key={activeTab + (portfolioAddress || '')} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
                  <Suspense fallback={<div className="module-loader-container"><Loader2 size={42} className="animate-spin" /></div>}>
                    {renderContent()}
                  </Suspense>
                </motion.div>
              </AnimatePresence>
            </div>
            <footer className="app-footer" style={styles.footer}>
              <div style={styles.footerLinks}>
                <button style={styles.footerLink} onClick={() => setActiveTab('terms')}>Terms</button>
                <button style={styles.footerLink} onClick={() => setActiveTab('privacy')}>Privacy</button>
                <button style={styles.footerLink} onClick={() => setActiveTab('manifesto')}>Manifesto</button>
              </div>
              <p style={styles.footerCopy}>© 2026 PolyLance. All rights reserved.</p>
            </footer>
          </main>
        </div>
      )}
    </>
  );
}

export default App;
