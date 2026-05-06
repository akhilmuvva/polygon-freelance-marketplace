// [SOVEREIGN TELEMETRY] Restored Icon Resonance - Absolute Zero Reference Stability Actuated.

import React, { useState, Suspense, lazy, useEffect, useRef, useContext, useMemo } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion, AnimatePresence } from 'framer-motion';
import CommandPalette from './components/CommandPalette';
import { 
  Home, Briefcase, User, Trophy, Layout, Shield, Search, Terminal, Zap, 
  Menu, X, Bell, LogOut, ChevronRight, Fuel, Globe, Cpu, CreditCard, PieChart,
  LayoutDashboard, Flame, PlusCircle, Gavel, Brain, Landmark, BarChart3,
  Activity, MessageSquare, ShieldCheck, Mail, Loader2
} from 'lucide-react';
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
import { polygon } from 'viem/chains';
import { ZENITH_JUDGES } from './constants';
import { useDemo } from './context/DemoContext';
import DemoWallet from './components/DemoWallet';

const styles = {
  shell: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    background: '#080b0e',
    color: '#fff',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  // ── Horizontal Top Navbar ──
  topbar: {
    height: 56,
    background: 'rgba(8,11,14,0.97)',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    display: 'flex',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    width: '100%',
    gap: 0,
    paddingRight: 16,
  },
  topbarLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0 20px',
    borderRight: '1px solid rgba(255,255,255,0.07)',
    height: '100%',
    flexShrink: 0,
    minWidth: 180,
  },
  logoIcon: {
    width: 30,
    height: 30,
    borderRadius: 7,
    background: '#00c896',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 14px rgba(0,200,150,0.35)',
    color: '#000',
    flexShrink: 0,
  },
  logoText: {
    fontSize: '0.92rem',
    fontWeight: 900,
    letterSpacing: '-0.03em',
    color: '#fff',
  },
  logoAccent: {
    color: '#00c896',
    fontWeight: 900,
  },
  logoSub: {
    fontSize: '0.48rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.18em',
    color: 'rgba(255,255,255,0.28)',
    display: 'block',
    marginTop: -1,
  },
  // Nav items in the top bar (scrollable)
  topNav: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    overflowX: 'auto',
    padding: '0 24px',
    height: '100%',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    maskImage: 'linear-gradient(to right, transparent, black 40px, black calc(100% - 40px), transparent)',
    WebkitMaskImage: 'linear-gradient(to right, transparent, black 40px, black calc(100% - 40px), transparent)',
  },
  navDivider: {
    width: 1,
    height: 20,
    background: 'rgba(255,255,255,0.07)',
    margin: '0 6px',
    flexShrink: 0,
  },
  navItem: (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '6px 12px',
    borderRadius: 8,
    background: active ? 'rgba(0,200,150,0.1)' : 'transparent',
    color: active ? '#fff' : 'rgba(255,255,255,0.4)',
    fontSize: '0.74rem',
    fontWeight: active ? 700 : 500,
    border: active ? '1px solid rgba(0,200,150,0.2)' : '1px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.18s ease',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    letterSpacing: '-0.01em',
  }),
  // Right side controls
  topbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
    paddingLeft: 12,
    borderLeft: '1px solid rgba(255,255,255,0.07)',
  },
  gasBtn: (on) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 8,
    background: on ? 'rgba(0,200,150,0.08)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${on ? 'rgba(0,200,150,0.2)' : 'rgba(255,255,255,0.07)'}`,
    color: on ? '#00c896' : 'rgba(255,255,255,0.4)',
    fontSize: '0.62rem',
    fontWeight: 800,
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
  }),
  socialBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 8,
    background: 'transparent',
    border: '1px solid rgba(0,200,150,0.3)',
    color: '#00c896',
    fontSize: '0.62rem',
    fontWeight: 800,
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    whiteSpace: 'nowrap',
    transition: 'all 0.18s ease',
  },
  logoutBtn: {
    padding: '6px 8px',
    borderRadius: 7,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    color: 'rgba(255,255,255,0.35)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s ease',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: '#00c896',
    boxShadow: '0 0 6px rgba(0,200,150,0.8)',
    animation: 'pulse 2s infinite ease-in-out',
  },
  // Secondary sub-header (page title + status)
  subHeader: {
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    background: 'rgba(255,255,255,0.01)',
  },
  subHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  subHeaderTitle: {
    fontSize: '0.72rem',
    fontWeight: 900,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
  },
  subHeaderStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: '0.58rem',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.22)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  // Gasless toggle (sidebar bottom)
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: '0.6rem',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  toggle: (on) => ({
    width: 32,
    height: 18,
    borderRadius: 9,
    position: 'relative',
    background: on ? '#00c896' : 'rgba(255,255,255,0.1)',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.22s ease',
    boxShadow: on ? '0 0 10px rgba(0,200,150,0.4)' : 'none',
    flexShrink: 0,
  }),
  toggleDot: (on) => ({
    position: 'absolute',
    top: 3,
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: on ? '#000' : '#fff',
    transition: 'left 0.22s ease',
    left: on ? 17 : 3,
    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
  }),
  // Main content
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  content: {
    flex: 1,
    padding: '28px 32px 56px',
    maxWidth: 1800,
    width: '100%',
    margin: '0 auto',
  },
  footer: {
    padding: '10px 32px',
    borderTop: '1px solid rgba(255,255,255,0.04)',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    background: 'transparent',
  },
  footerLinks: { display: 'flex', gap: 14 },
  footerLink: {
    background: 'none',
    border: 'none',
    fontSize: '0.62rem',
    color: 'rgba(255,255,255,0.18)',
    cursor: 'pointer',
    transition: 'color 0.15s ease',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  // Mobile bottom nav (kept for mobile)
  mobileNav: {
    display: 'none',
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 68,
    background: 'rgba(8,11,14,0.97)',
    backdropFilter: 'blur(20px)',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 2000,
    paddingBottom: 'env(safe-area-inset-bottom)',
  },
  mobileItem: (active) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    color: active ? '#00c896' : 'rgba(255,255,255,0.3)',
    fontSize: '0.5rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 10px',
    borderRadius: 8,
    transition: 'all 0.18s ease',
  }),
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    zIndex: 900, cursor: 'pointer',
  },
  menuBtn: {
    display: 'none',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 7,
    padding: 7,
    color: 'rgba(255,255,255,0.5)',
    cursor: 'pointer',
  },
  versionAvatar: {
    width: 28, height: 28, borderRadius: '50%',
    background: '#00c896',
    boxShadow: '0 0 10px rgba(0,200,150,0.3)',
  },
  versionText: {
    fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)',
  },
  versionNum: {
    fontSize: '0.72rem', fontWeight: 800, color: '#fff',
  },

};

// Hook to periodically check if our decentralised infrastructure is working
const useNetworkHealth = () => {
  const [status, setStatus] = useState({ indexing: 'Loading', storage: 'Loading' });

  useEffect(() => {
    const checkStatus = async () => {
      let indexing = 'Healthy';
      let storage = 'Healthy';
      try {
        const subgraphUrl = import.meta.env.VITE_SUBGRAPH_URL || 'https://api.studio.thegraph.com/query/poly-lance-studio/poly-lance/v0.0.1';
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
  const { isDemoMode, demoWalletAddress } = useDemo();
  const { authStatus = 'loading', setAuthStatus = () => {} } = useContext(AuthContext) || {};
  const { address, isConnected: isWalletConnected, isReconnecting } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { disconnect } = useDisconnect();
  const { data: blockNumber } = useBlockNumber({ watch: true });
  const { staggerFadeIn } = useAnimeAnimations();
  
  const health = useNetworkHealth();

  const [isHydrated, setIsHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeTabParams, setActiveTabParams] = useState({});
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

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
      if (walletClient.chain.id !== 137) {
        hotToast.error('Gasless Mode requires Polygon Mainnet. Please switch network.');
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
        chain: polygon, 
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


  // Directive 10: Sovereign Address Resolution
  // If a smart account is active, it becomes the primary identity for on-chain interactions.
  // We normalize to lowercase to prevent 'Identity Bifurcation' in query keys and access control.
  const effectiveAddress = isDemoMode ? demoWalletAddress : (smartAccount?.accountAddress || address)?.toLowerCase();
  
  // Robust Admin check: allow access if EITHER the EOA or the Smart Account is whitelisted.
  const isAdmin = useMemo(() => {
    if (!address && !smartAccount?.accountAddress) return false;
    const judges = ZENITH_JUDGES.map(j => j.toLowerCase());
    return (address && judges.includes(address.toLowerCase())) || 
           (smartAccount?.accountAddress && judges.includes(smartAccount.accountAddress.toLowerCase()));
  }, [address, smartAccount]);
  
  // Directive 10: Session Continuity Guard
  // A session is active if we have a Smart Account (Social/Bypass) OR a fully connected wallet with an address.
  // We use isHydrated to prevent SSR/Hydration mismatch flicker.
  const isSessionActive = isHydrated && (isDemoMode || smartAccount !== null || (isWalletConnected && !!address));

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
          <ZenithCourt address={effectiveAddress} isAdmin={isAdmin} />
        </CourtErrorBoundary>
      );
      case 'control': return isAdmin ? <ZenithControl isAdmin={isAdmin} address={effectiveAddress} /> : <Dashboard address={effectiveAddress} />;
      case 'strata': return <ZenithStrata address={effectiveAddress} />;
      case 'liquidity': return <ZenithLiquidity />;
      case 'cross-chain': return <CrossChainDashboard address={effectiveAddress} />;
      case 'analytics': return isAdmin ? <AnalyticsDashboard isAdmin={isAdmin} address={effectiveAddress} /> : <Dashboard address={effectiveAddress} />;
      case 'sbt-gallery': return <SBTGallery address={effectiveAddress} />;
      case 'terms': return <TermsOfService />;
      case 'privacy': return <PrivacyCenter address={effectiveAddress} />;
      case 'onramp': return <FiatOnramp address={effectiveAddress} recipientAddress={activeTabParams.recipient} />;
      case 'identity': return <IdentityManager address={effectiveAddress} gaslessEnabled={isGasless} isAdmin={isAdmin} />;
      case 'portfolio': return <Portfolio address={effectiveAddress} onFiatPay={navigateToOnramp} />;
      case 'specialists': return <SpecialistMarketplace onRegister={() => setActiveTab('identity')} />;
      case 'insurance': return <InsuranceDashboard />;
      case 'ai-oracle': return <AICommandCenter isAdmin={isAdmin} address={effectiveAddress} />;
      case 'protocol': return <ProtocolDashboard isAdmin={isAdmin} address={effectiveAddress} />;
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
      <DemoWallet />
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
          {/* ── Horizontal Top Navbar ── */}
          <nav style={styles.topbar}>
            {/* Logo */}
            <div style={styles.topbarLogo}>
              <div style={styles.logoIcon}><Zap size={16} fill="currentColor" /></div>
              <div>
                <div style={styles.logoText}>POLY<span style={styles.logoAccent}>LANCE</span></div>
                <span style={styles.logoSub}>Zenith Protocol</span>
              </div>
            </div>

            {/* Scrollable Nav Items */}
            <div style={styles.topNav} className="topnav-scroll">
              {/* Main */}
              {[
                { id: 'dashboard',   icon: LayoutDashboard, label: 'Command Center' },
                { id: 'marketplace', icon: Flame,           label: 'Zenith Exchange' },
                { id: 'jobs',        icon: Briefcase,       label: 'Find a Job' },
                { id: 'specialists', icon: User,            label: 'Expert Network' },
                { id: 'create-job',  icon: PlusCircle,      label: 'New Contract' },
                { id: 'leaderboard', icon: Trophy,          label: 'Leaderboard' },
                { id: 'identity',    icon: User,            label: 'Profile' },
                { id: 'portfolio',   icon: User,            label: 'Reputation' },
              ].map(item => (
                <button key={item.id} className="anime-nav-item" onClick={() => navigate(item.id)} style={styles.navItem(activeTab === item.id)}>
                  <item.icon size={14} color={activeTab === item.id ? '#00c896' : 'rgba(255,255,255,0.35)'} />
                  {item.label}
                </button>
              ))}

              <div style={styles.navDivider} />

              {/* Finance */}
              {[
                { id: 'governance', icon: Globe,       label: 'DAO' },
                { id: 'court',      icon: Gavel,       label: 'Court' },
                { id: 'insurance',  icon: ShieldCheck, label: 'Shield' },
                { id: 'liquidity',  icon: Flame,       label: 'Liquidity' },
              ].map(item => (
                <button key={item.id} className="anime-nav-item" onClick={() => navigate(item.id)} style={styles.navItem(activeTab === item.id)}>
                  <item.icon size={14} color={activeTab === item.id ? '#00c896' : 'rgba(255,255,255,0.35)'} />
                  {item.label}
                </button>
              ))}

              <div style={styles.navDivider} />

              {/* System */}
              {[
                { id: 'chat',        icon: MessageSquare, label: 'Comms' },
                { id: 'sbt-gallery', icon: ShieldCheck,   label: 'SBT' },
                { id: 'privacy',     icon: Shield,        label: 'Privacy' },
              ].map(item => (
                <button key={item.id} className="anime-nav-item" onClick={() => navigate(item.id)} style={styles.navItem(activeTab === item.id)}>
                  <item.icon size={14} color={activeTab === item.id ? '#00c896' : 'rgba(255,255,255,0.35)'} />
                  {item.label}
                </button>
              ))}

              {isAdmin && (
                <>
                  <div style={styles.navDivider} />
                  {[
                    { id: 'control',   icon: Activity,  label: 'Watcher' },
                    { id: 'ai-oracle', icon: Brain,     label: 'AI Oracle' },
                    { id: 'protocol',  icon: Landmark,  label: 'Protocol' },
                    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
                  ].map(item => (
                    <button key={item.id} className="anime-nav-item" onClick={() => navigate(item.id)} style={styles.navItem(activeTab === item.id)}>
                      <item.icon size={14} color={activeTab === item.id ? '#00c896' : 'rgba(255,255,255,0.35)'} />
                      {item.label}
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* Right controls */}
            <div style={styles.topbarRight}>
              {/* Telemetry Display */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginRight: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                   <div style={{ fontSize: '0.42rem', fontWeight: 900, color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>INDEX_MESH</div>
                   <div style={{ fontSize: '0.58rem', fontWeight: 900, color: health.indexing === 'Healthy' ? '#00c896' : '#ff4d4d', letterSpacing: '0.02em' }}>{health.indexing.toUpperCase()}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                   <div style={{ fontSize: '0.42rem', fontWeight: 900, color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>STORAGE_VAULT</div>
                   <div style={{ fontSize: '0.58rem', fontWeight: 900, color: health.storage === 'Healthy' ? '#00c896' : '#ff4d4d', letterSpacing: '0.02em' }}>{health.storage.toUpperCase()}</div>
                </div>
              </div>

              {/* Status dot */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', borderLeft: '1px solid rgba(255,255,255,0.07)', paddingLeft: 12 }}>
                <div style={styles.statusDot} /> PoS On-Chain
              </div>

              {/* Gasless toggle pill */}
              <button style={styles.gasBtn(isGasless)} onClick={actuateGaslessToggleIntent} disabled={isInitializingGasless}>
                {isInitializingGasless ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                <span>{isInitializingGasless ? 'Initializing' : 'Shield'}</span>
                <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
                <div style={styles.toggle(isGasless)}>
                  <div style={styles.toggleDot(isGasless)} />
                </div>
              </button>

              {!isWalletConnected && !smartAccount && (
                <button style={styles.socialBtn} onClick={actuateSocialLoginIntent} disabled={isLoggingIn}>
                  <Mail size={12} />{isLoggingIn ? 'Syncing...' : 'Social Login'}
                </button>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
                {(isWalletConnected || smartAccount) && (
                  <button style={styles.logoutBtn} onClick={actuateLogoutIntent} title="Sign Out"><LogOut size={14} /></button>
                )}
              </div>
            </div>
          </nav>

          {/* Sub-header: current page label */}
          <div style={styles.subHeader}>
            <div style={styles.subHeaderLeft}>
              <span style={styles.subHeaderTitle}>
                {activeTab === 'dashboard' ? 'Command Center' : (activeTab || '').replace(/-/g, ' ')}
              </span>
            </div>
            <div style={styles.subHeaderStatus}>
              <div style={styles.statusDot} /> Polygon PoS On-Chain · v2.5.0-Zenith
            </div>
          </div>
          <main className="app-main" style={styles.main}>
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
            </footer>
          </main>
          <nav className="app-mobile-nav" style={styles.mobileNav}>
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
              { id: 'marketplace', icon: Flame, label: 'Zenith' },
              { id: 'jobs', icon: Briefcase, label: 'Jobs' },
              { id: 'identity', icon: User, label: 'Profile' },
            ].map(item => (
              <button 
                key={item.id} 
                className="anime-nav-item"
                style={styles.mobileItem(activeTab === item.id)} 
                onClick={() => setActiveTab(item.id)}
              >
                <item.icon size={22} color={activeTab === item.id ? '#00f5d4' : 'rgba(255,255,255,0.4)'} />
                <span style={{ marginTop: 2 }}>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}

export default App;
