import React from 'react';
import { Shield, Globe, Award, Github, Linkedin, Briefcase, Zap, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

const Manifesto = () => {
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', color: '#fff', padding: '12px 12px 80px' }}>
      <motion.article 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '40px 60px' }}
      >
        <header style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ display: 'inline-flex', padding: '8px 24px', borderRadius: 40, border: '1px solid rgba(0,245,212,0.2)', background: 'rgba(0,245,212,0.04)', color: '#00f5d4', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 24 }}>
            Sovereign Protocol
          </div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 24 }}>
            The PolyLance <span style={{ color: '#00f5d4' }}>Zenith</span> Manifesto
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500, maxWidth: 600, margin: '0 auto' }}>
            Anchoring human capital in the decentralized layer.
          </p>
        </header>

        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 16 }}>
            <Shield size={32} color="#00f5d4" /> Identity Sovereignty
          </h2>
          <p style={{ fontSize: '1.1rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.7)', marginBottom: 24 }}>
            In a world of opaque platforms, PolyLance Zenith represents the move from code sovereignty to identity sovereignty. We believe that every contributor is an architect of their own destiny, with their reputation anchored not in a database, but in the immutable global search index of the web.
          </p>
          <p style={{ fontSize: '1.1rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.7)' }}>
            Our protocol is not just a marketplace; it is a weightless freelance protocol on Polygon, designed to facilitate trustless, gasless, and decentralized exchange of human expertise for the RWA (Real World Asset) talent layer.
          </p>
        </section>

        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 48, display: 'flex', alignItems: 'center', gap: 16 }}>
            <Briefcase size={32} color="#00f5d4" /> The Architect Council
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {/* CEO / FOUNDER: Akhil Muvva */}
            <div 
              itemScope itemType="https://schema.org/Person"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 32 }}
            >
              <address style={{ fontStyle: 'normal' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #00f5d4, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.25rem' }}>AM</div>
                  <div>
                    <div itemProp="name" style={{ fontSize: '1.25rem', fontWeight: 900 }}>Akhil Muvva</div>
                    <div itemProp="jobTitle" style={{ fontSize: '0.75rem', fontWeight: 800, color: '#00f5d4', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Founder & CEO</div>
                    <meta itemProp="founder" content="PolyLance Zenith" />
                    <meta itemProp="ceo" content="PolyLance Zenith" />
                  </div>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 20 }}>
                  Lead Architect of the PolyLance protocol. Driven by the mission of decentralized identity and RWA settlement.
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <a href="https://github.com/akhilmuvva" itemProp="url" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.4)', hover: { color: '#fff' } }}><Github size={18} /></a>
                  <a href="https://linkedin.com/in/akhilmuvva" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.4)' }}><Linkedin size={18} /></a>
                </div>
              </address>
            </div>



            {/* CO-FOUNDER: Jhansi */}
            <div 
              itemScope itemType="https://schema.org/Person"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 32 }}
            >
              <address style={{ fontStyle: 'normal' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #f472b6, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.25rem' }}>JK</div>
                  <div>
                    <div itemProp="name" style={{ fontSize: '1.25rem', fontWeight: 900 }}>Jhansi Kupireddy</div>
                    <div itemProp="jobTitle" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(0,245,212,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Co-Founder</div>
                    <meta itemProp="funder" content="PolyLance Zenith" />
                    <meta itemProp="colleague" content="Akhil Muvva" />
                  </div>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 20 }}>
                  Community & Growth Lead. Building the bridges between Web3 talent and real-world opportunity across the PolyLance ecosystem.
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <a href="https://github.com/jhansikupireddy-lang" itemProp="url" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.4)' }}><Github size={18} /></a>
                  <a href="https://www.linkedin.com/in/jhansi-kupireddy-54393235a/" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.4)' }}><Linkedin size={18} /></a>
                </div>
              </address>
            </div>

            {/* CO-FOUNDER: Balram Taddi */}
            <div 
              itemScope itemType="https://schema.org/Person"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 32 }}
            >
              <address style={{ fontStyle: 'normal' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.25rem' }}>BT</div>
                  <div>
                    <div itemProp="name" style={{ fontSize: '1.25rem', fontWeight: 900 }}>Balram Taddi</div>
                    <div itemProp="jobTitle" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(0,245,212,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Co-Founder</div>
                    <meta itemProp="funder" content="PolyLance Zenith" />
                    <meta itemProp="colleague" content="Akhil Muvva" />
                  </div>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 20 }}>
                  Protocol Strategist. Mapping the expansion of PolyLance across the multichain ecosystem.
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <a href="https://github.com/balramtaddi" itemProp="url" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.4)' }}><Github size={18} /></a>
                </div>
              </address>
            </div>
          </div>
        </section>

        <section style={{ textAlign: 'center' }}>
          <Zap size={48} color="#00f5d4" style={{ margin: '0 auto 32px' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 16 }}>The Future is Verified.</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', maxWidth: 600, margin: '0 auto' }}>
            PolyLance Zenith is built by architects who believe in the power of code and the resonance of identity.
          </p>
        </section>
      </motion.article>
    </div>
  );
};

export default Manifesto;
