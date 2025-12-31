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
import { NotificationManager } from './components/NotificationManager';
import { Toaster } from 'react-hot-toast';

import { XMTPProvider } from '@xmtp/react-sdk';
import FreelanceEscrowABI from './contracts/FreelanceEscrow.json'; // Added FreelanceEscrowABI import
import { useAccount } from 'wagmi'; // Assuming useAccount is needed for the address

function App() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [portfolioAddress, setPortfolioAddress] = useState(null);

  const renderContent = () => {
    if (portfolioAddress) {
      return <Portfolio address={portfolioAddress} onBack={() => setPortfolioAddress(null)} />;
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'jobs': return <JobsList onUserClick={(addr) => setPortfolioAddress(addr)} />;
      case 'create': return <CreateJob />;
      case 'nfts': return <NFTGallery />;
      case 'chat': return <Chat />;
      case 'leaderboard': return <Leaderboard />;
      default: return <Dashboard />;
    }
  };

  return (
    <XMTPProvider>
      <div className="min-h-screen">
        <Toaster position="top-right" />
        <NotificationManager />
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
              <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
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
    </XMTPProvider>
  );
}

export default App;
