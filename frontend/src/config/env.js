/**
 * env.js: The Central Nervous System for Sovereign Environment Config.
 * All environment variables should be accessed through this object.
 */

const env = {
  // ── Web3 Protocols ────────────────────────────────────────────────
  // Fallback ID ensured for production stability if .env is missing.
  WALLET_CONNECT_PROJECT_ID: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || '65a5f1dd3b7df21cef34448cac019cd5',
  ALCHEMY_ID: import.meta.env.VITE_ALCHEMY_ID || '',
  
  // ── Subgraph & Data ──────────────────────────────────────────────
  SUBGRAPH_URL: import.meta.env.VITE_SUBGRAPH_URL || 'https://api.studio.thegraph.com/query/95536/freelance-marketplace/version/latest',
  
  // ── Storage (IPFS) ──────────────────────────────────────────────
  PINATA_API_KEY: import.meta.env.VITE_PINATA_API_KEY || '',
  PINATA_API_SECRET: import.meta.env.VITE_PINATA_API_SECRET || '',
  IPFS_GATEWAY: import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/',

  // ── Particle Auth (Social Login) ──────────────────────────────────
  PARTICLE_PROJECT_ID: import.meta.env.VITE_PARTICLE_PROJECT_ID || '',
  PARTICLE_CLIENT_KEY: import.meta.env.VITE_PARTICLE_CLIENT_KEY || '',
  PARTICLE_APP_ID: import.meta.env.VITE_PARTICLE_APP_ID || '',

  // ── Biconomy (Gasless Account Abstraction) ────────────────────────
  BICONOMY_PAYMASTER_URL: import.meta.env.VITE_BICONOMY_PAYMASTER_URL || '',
  BICONOMY_BUNDLER_URL: import.meta.env.VITE_BICONOMY_BUNDLER_URL || '',

  // ── Huddle01 (Web3 Communication) ────────────────────────────────
  HUDDLE_PROJECT_ID: import.meta.env.VITE_HUDDLE_PROJECT_ID || '',

  // ── Node Environment ─────────────────────────────────────────────
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
};

export default env;
