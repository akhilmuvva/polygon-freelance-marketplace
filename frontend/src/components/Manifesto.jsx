import React from 'react';
import { Shield, Globe, Award, Github, Linkedin, Briefcase, Zap, Heart, Cpu, Fingerprint, Milestone } from 'lucide-react';
import { motion } from 'framer-motion';
import './Manifesto.css';

const Manifesto = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 1, 
        ease: [0.16, 1, 0.3, 1] 
      } 
    }
  };

  const council = [
    {
      name: "Akhil Muvva",
      role: "Founder & CEO",
      bio: "Lead Architect of the PolyLance protocol. Driven by the mission of decentralized identity and RWA settlement.",
      initials: "AM",
      gradient: "linear-gradient(135deg, #8b5cf6, #6366f1)",
      github: "https://github.com/akhilmuvva",
      linkedin: "https://linkedin.com/in/akhilmuvva",
      specialty: "Protocol Architecture"
    },
    {
      name: "Jhansi Kupireddy",
      role: "Co-Founder",
      bio: "Community & Growth Lead. Building the bridges between Web3 talent and real-world opportunity across the PolyLance ecosystem.",
      initials: "JK",
      gradient: "linear-gradient(135deg, #f472b6, #ec4899)",
      github: "https://github.com/jhansikupireddy-lang",
      linkedin: "https://www.linkedin.com/in/jhansi-kupireddy-54393235a/",
      specialty: "Ecosystem Growth",
      featured: true
    },
    {
      name: "Balram Taddi",
      role: "Co-Founder",
      bio: "Protocol Strategist. Mapping the expansion of PolyLance across the multichain ecosystem.",
      initials: "BT",
      gradient: "linear-gradient(135deg, #6366f1, #a855f7)",
      github: "https://github.com/balramtaddi",
      specialty: "Cross-chain Strategy"
    }
  ];

  return (
    <motion.div 
      className="manifesto-zenith"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="ambient-glow-top"></div>
      
      <motion.header className="manifesto-hero-zenith" variants={itemVariants}>
        <div className="sovereign-badge">Sovereign Identity Protocol</div>
        <h1 className="hero-display-title">
          The <span className="accent-text-glow">PolyLance</span> <br/>
          <span className="italic-title">Zenith</span> Manifesto
        </h1>
        <div className="hero-divider"></div>
        <p className="hero-description">
          Anchoring human capital in the decentralized layer. A new standard for trustless coordination and reputation sovereignty.
        </p>
      </motion.header>

      <div className="manifesto-content-grid">
        <motion.section className="manifesto-card" variants={itemVariants}>
          <div className="card-header">
            <Fingerprint size={32} className="card-icon-accent" />
            <h2 className="card-title">Identity Sovereignty</h2>
          </div>
          <div className="card-body">
            <p>
              In a world of opaque platforms, PolyLance Zenith represents the transition from code sovereignty to identity sovereignty. We believe that every contributor is an architect of their own destiny, with their reputation anchored not in a database, but in the immutable global search index of the web.
            </p>
            <p className="highlight-para">
              The "Sovereign Resume" is not a static PDF; it is a live, verifiable stream of proof-of-work, secured by the Polygon network.
            </p>
          </div>
        </motion.section>

        <motion.section className="manifesto-card" variants={itemVariants}>
          <div className="card-header">
            <Milestone size={32} className="card-icon-accent" />
            <h2 className="card-title">Trustless Settlement</h2>
          </div>
          <div className="card-body">
            <p>
              Our protocol is not just a marketplace; it is a weightless freelance protocol on Polygon, designed to facilitate trustless, gasless, and decentralized exchange of human expertise for the RWA (Real World Asset) talent layer.
            </p>
            <p className="highlight-para">
              Milestone-based escrows and Kleros arbitration ensure that truth remains the only currency that matters in the Zenith ecosystem.
            </p>
          </div>
        </motion.section>
      </div>

      <motion.section className="council-section" variants={itemVariants}>
        <div className="section-header-centered">
          <Cpu size={40} className="section-icon" />
          <h2 className="display-subtitle">The Architect Council</h2>
          <p className="section-intro">The core team steering the evolution of PolyLance.</p>
        </div>
        
        <div className="council-bento">
          {council.map((member, index) => (
            <motion.div 
              key={index}
              className={`architect-dossier ${member.featured ? 'featured-architect' : ''}`}
              variants={itemVariants}
              whileHover={{ y: -10, scale: 1.02 }}
            >
              <div className="dossier-inner">
                <div className="dossier-header">
                  <div 
                    className="dossier-avatar-large"
                    style={{ background: member.gradient }}
                  >
                    {member.initials}
                    {member.featured && <div className="featured-ring"></div>}
                  </div>
                  <div className="dossier-meta">
                    <div className="specialty-tag">{member.specialty}</div>
                    <h3 className="architect-name-display">{member.name}</h3>
                    <div className="architect-role-display">{member.role}</div>
                  </div>
                </div>
                
                <p className="architect-bio-text">{member.bio}</p>
                
                <div className="dossier-footer">
                  <div className="social-cluster">
                    {member.github && (
                      <a href={member.github} target="_blank" rel="noopener noreferrer" className="zenith-social-link">
                        <Github size={18} />
                        <span>Source</span>
                      </a>
                    )}
                    {member.linkedin && (
                      <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="zenith-social-link">
                        <Linkedin size={18} />
                        <span>Identity</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.footer className="manifesto-footer-zenith" variants={itemVariants}>
        <div className="footer-glow"></div>
        <Zap size={64} className="final-seal-icon" />
        <h2 className="final-title">The Future is Verified.</h2>
        <p className="final-subtitle">
          PolyLance Zenith is built by architects who believe in the power of code and the resonance of identity.
        </p>
        <div className="signature-line"></div>
      </motion.footer>
    </motion.div>
  );
};

export default Manifesto;

