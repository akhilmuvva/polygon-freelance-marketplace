import React, { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Briefcase, PlusCircle, LayoutDashboard, Ticket, MessageSquare, Trophy, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Dashboard from './components/Dashboard';
import CreateJob from './components/CreateJob';
import JobsList from './components/JobsList';
import NFTGallery from './components/NFTGallery';
import Chat from './components/Chat';
import Leaderboard from './components/Leaderboard';
import Portfolio from './components/Portfolio';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import { NotificationManager } from './components/NotificationManager';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAccount, useBalance } from 'wagmi';

function App() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [portfolioAddress, setPortfolioAddress] = useState(null);
  const [chatPeerAddress, setChatPeerAddress] = useState(null);

  const onSelectChat = (peer) => {
    setChatPeerAddress(peer);
    setActiveTab('chat');
  };

  const renderContent = () => {
    if (portfolioAddress) {
      return <Portfolio address={portfolioAddress} onBack={() => setPortfolioAddress(null)} />;
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'jobs': return <JobsList onUserClick={(addr) => setPortfolioAddress(addr)} onSelectChat={onSelectChat} />;
      case 'create': return <CreateJob onJobCreated={() => setActiveTab('jobs')} />;
      case 'nfts': return <NFTGallery />;
      case 'chat': return <Chat initialPeerAddress={chatPeerAddress} onClearedAddress={() => setChatPeerAddress(null)} />;
      case 'leaderboard': return <Leaderboard />;
      case 'tos': return <TermsOfService onBack={() => setActiveTab('dashboard')} />;
      case 'privacy': return <PrivacyPolicy onBack={() => setActiveTab('dashboard')} />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen">
      <ToastContainer position="top-right" autoClose={5000} theme="dark" />
      <NotificationManager />
      <ConnectionBanner />
      <nav style={{ padding: '0 60px', height: '80px' }}>
        <div className="logo" style={{ fontSize: '1.8rem', letterSpacing: '-1px' }}>PolyLance</div>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`btn-nav ${activeTab === 'dashboard' ? 'active' : ''}`}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`btn-nav ${activeTab === 'jobs' ? 'active' : ''}`}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}
          >
            <Briefcase size={18} /> Markets
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`btn-nav ${activeTab === 'create' ? 'active' : ''}`}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}
          >
            <PlusCircle size={18} /> Post Job
          </button>
          <button
            onClick={() => setActiveTab('nfts')}
            className={`btn-nav ${activeTab === 'nfts' ? 'active' : ''}`}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}
          >
            <Ticket size={18} /> Gallery
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`btn-nav ${activeTab === 'leaderboard' ? 'active' : ''}`}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}
          >
            <Trophy size={18} /> Leaders
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`btn-nav ${activeTab === 'chat' ? 'active' : ''}`}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}
          >
            <MessageSquare size={18} /> Messenger
          </button>
          <div style={{ marginLeft: '10px', borderLeft: '1px solid var(--glass-border)', paddingLeft: '24px' }}>
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
              }) => {
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                  ready &&
                  account &&
                  chain &&
                  (!authenticationStatus ||
                    authenticationStatus === 'authenticated');

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      'style': {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button onClick={openConnectModal} className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>
                            Connect Wallet
                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button onClick={openChainModal} className="btn-secondary" style={{ borderColor: '#ef4444', color: '#ef4444' }}>
                            Wrong Network
                          </button>
                        );
                      }

                      return (
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary)' }}>
                              {account.displayBalance ? account.displayBalance : ''}
                            </span>
                            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                              {account.displayName}
                            </span>
                          </div>
                          <button
                            onClick={openAccountModal}
                            type="button"
                            style={{
                              background: 'var(--glass-bg)',
                              border: '1px solid var(--glass-border)',
                              borderRadius: '12px',
                              padding: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <img
                              src={`https://api.dicebear.com/7.x/identicon/svg?seed=${account.address}`}
                              alt="avatar"
                              style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                            />
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      </nav>

      <main className="container" style={{ paddingTop: '60px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer style={{ marginTop: 'auto', padding: '40px 60px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ opacity: 0.5, fontSize: '0.9rem' }}>© 2026 PolyLance Protocol. Built on Polygon.</div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <button onClick={() => setActiveTab('tos')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>Terms</button>
          <button onClick={() => setActiveTab('privacy')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>Privacy</button>
          <a href="https://polygon.technology" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>Polygon</a>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{
        __html: `
        .btn-nav {
          font-weight: 600;
          opacity: 0.6;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }
        .btn-nav:hover {
          opacity: 1;
          transform: translateY(-1px);
        }
        .btn-nav.active {
          opacity: 1;
          color: var(--primary);
        }
        .btn-nav.active::after {
          content: '';
          position: absolute;
          bottom: -31px;
          left: 0;
          width: 100%;
          height: 2px;
          background: var(--primary);
          box-shadow: 0 -2px 10px var(--primary);
        }
      `}} />
    </div>
  );
}

function ConnectionBanner() {
  const { isConnected, chain } = useAccount();
  const isWrongChain = isConnected && chain?.id !== 80002; // Polygon Amoy ID is 80002

  if (!isConnected) {
    return (
      <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '10px 60px', textAlign: 'center', fontSize: '0.9rem', borderBottom: '1px solid rgba(59, 130, 246, 0.2)' }}>
        👋 Welcome! Please <strong>connect your wallet</strong> to start exploring opportunities.
      </div>
    );
  }

  if (isWrongChain) {
    return (
      <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px 60px', textAlign: 'center', fontSize: '0.9rem', borderBottom: '1px solid rgba(239, 68, 68, 0.2)' }}>
        ⚠️ You are on the wrong network. Please switch to <strong>Polygon Amoy</strong>.
      </div>
    );
  }

  return null;
}

export default App;
