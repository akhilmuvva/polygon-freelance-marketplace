import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Globe, Mail, Wallet, Zap, ShieldCheck, Sparkles } from 'lucide-react';
import { useConnectModal } from '@rainbow-me/rainbowkit';

const LandingPage = ({ onSocialLogin, onBypass, isLoggingIn }) => {
  const { openConnectModal } = useConnectModal();

  const teal = "#2dd4bf";
  const purple = "#8b5cf6";
  const grey = "#52525b";
  const black = "#010204";
  const cardBg = "#0c0d12";

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: black,
      color: 'white',
      fontFamily: "'Outfit', sans-serif",
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden'
    }}>
      
      {/* ═══ HEADER ═══ */}
      <nav style={{
        padding: '30px 60px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 900, margin: 0, letterSpacing: '-0.05em' }}>PolyLance</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 10px #10b981' }} />
            <span style={{ fontSize: '10px', fontWeight: 900, color: grey, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Polygon POS On-Chain</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button 
            onClick={onBypass}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', 
              padding: '10px 20px', borderRadius: '12px', border: `1px solid ${teal}33`,
              background: 'rgba(255,255,255,0.02)', color: teal, fontSize: '10px', fontWeight: 900,
              textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer'
            }}
          >
            <ShieldCheck size={14} /> Sovereign Shield
          </button>
          <button 
            onClick={onSocialLogin}
            disabled={isLoggingIn}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', 
              padding: '10px 24px', borderRadius: '12px', border: `1px solid ${teal}33`,
              background: `${teal}1a`, color: teal, fontSize: '10px', fontWeight: 900,
              textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer',
              boxShadow: `0 0 20px ${teal}1a`,
              opacity: isLoggingIn ? 0.6 : 1
            }}
          >
            <Mail size={14} /> {isLoggingIn ? 'Redirecting...' : 'Social Login'}
          </button>
          <button 
            onClick={openConnectModal}
            style={{
              padding: '10px 32px', borderRadius: '12px', border: 'none',
              background: purple, color: 'white', fontSize: '10px', fontWeight: 900,
              textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer',
              boxShadow: `0 8px 25px ${purple}4d`
            }}
          >
            Connect Wallet
          </button>
        </div>
      </nav>

      {/* ═══ MAIN ═══ */}
      <main style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        alignItems: 'center',
        padding: '0 120px',
        maxWidth: '1600px',
        margin: '0 auto',
        width: '100%',
        gap: '60px'
      }}>
        
        {/* HERO */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start',
            padding: '8px 16px', borderRadius: '99px', border: `1px solid ${teal}33`,
            background: `${teal}0d`, color: teal, fontSize: '10px', fontWeight: 900,
            textTransform: 'uppercase', letterSpacing: '0.2em'
          }}>
            <Sparkles size={14} fill="currentColor" /> Decentralized Freelancing
          </div>
          
          <div>
            <h2 style={{ fontSize: '100px', fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.06em', margin: 0 }}>
              Your Work,<br />
              <span style={{ color: teal }}>Your Income</span><br />
              Your Rules.
            </h2>
            <p style={{ color: '#a1a1aa', fontSize: '20px', fontWeight: 500, lineHeight: 1.6, marginTop: '24px', maxWidth: '500px' }}>
              Join a trustless marketplace for developers and designers.<br />
              Secure contracts, fast payments, and on-chain verification.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '60px', marginTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '16px', borderRadius: '16px', background: cardBg, border: '1px solid rgba(255,255,255,0.05)', display: 'flex' }}>
                <Shield size={28} color={teal} />
              </div>
              <div>
                <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.3em', color: grey, fontWeight: 900, margin: '0 0 4px 0' }}>Security</p>
                <p style={{ fontSize: '20px', fontWeight: 900, color: 'white', margin: 0 }}>On-chain Escrow</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '16px', borderRadius: '16px', background: cardBg, border: '1px solid rgba(255,255,255,0.05)', display: 'flex' }}>
                <Globe size={28} color="#10b981" />
              </div>
              <div>
                <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.3em', color: grey, fontWeight: 900, margin: '0 0 4px 0' }}>Network</p>
                <p style={{ fontSize: '20px', fontWeight: 900, color: 'white', margin: 0 }}>Multi-Chain</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CARD */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ display: 'flex', justifyContent: 'flex-end' }}
        >
          <div style={{
            width: '100%', maxWidth: '540px', padding: '64px', borderRadius: '64px',
            background: cardBg, border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 40px 100px rgba(0,0,0,0.8)', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '250px', height: '250px', background: `${teal}0d`, filter: 'blur(80px)', borderRadius: '50%', transform: 'translate(40%, -40%)' }} />
            
            <div style={{ position: 'relative', zIndex: 10 }}>
              <div style={{ marginBottom: '56px' }}>
                <h3 style={{ fontSize: '36px', fontWeight: 900, margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Seamless Access</h3>
                <p style={{ color: grey, fontSize: '16px', fontWeight: 500, margin: 0 }}>Secure, decentralized access to the workspace.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <button 
                  onClick={onSocialLogin}
                  disabled={isLoggingIn}
                  style={{
                    width: '100%', padding: '28px', borderRadius: '40px', background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '24px',
                    textAlign: 'left', transition: 'all 0.2s ease', position: 'relative'
                  }}
                >
                  <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mail size={24} color={grey} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Google / Email / X</span>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#10b981', color: black, fontSize: '8px', fontWeight: 900, textTransform: 'uppercase' }}>Recommended</span>
                    </div>
                    <span style={{ fontSize: '10px', color: grey, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Instant Smart Wallet · Zero Gas Fees</span>
                  </div>
                </button>

                <button 
                  onClick={openConnectModal}
                  style={{
                    width: '100%', padding: '28px', borderRadius: '40px', background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '24px',
                    textAlign: 'left', transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Wallet size={24} color={grey} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Web3 Foundation</div>
                    <span style={{ fontSize: '10px', color: grey, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>MetaMask · WalletConnect · Ledger</span>
                  </div>
                </button>
              </div>

              <div style={{ marginTop: '56px', display: 'flex', flexDirection: 'column', gap: '48px' }}>
                <div style={{ padding: '24px', borderRadius: '32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <Zap size={18} color="#f59e0b" fill="#f59e0b" style={{ flexShrink: 0 }} />
                  <p style={{ fontSize: '10px', fontWeight: 900, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.15em', lineHeight: 1.5, margin: 0 }}>
                    Gasless Mode: <span style={{ color: grey }}>New users get 10 free transactions upon account activation.</span>
                  </p>
                </div>

                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                    <span style={{ fontSize: '10px', fontWeight: 900, color: grey, textTransform: 'uppercase', letterSpacing: '0.3em' }}>Network: Polygon Mainnet</span>
                  </div>
                  <span style={{ fontSize: '9px', fontWeight: 900, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.4em' }}>Secured by Chainlink & Biconomy</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default LandingPage;
