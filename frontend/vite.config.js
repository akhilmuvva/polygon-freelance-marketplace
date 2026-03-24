import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import basicSsl from '@vitejs/plugin-basic-ssl'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ─── Particle SDK Shim Plugin ───────────────────────────────────────────────
// @biconomy/particle-auth calls chrome.storage.sync at module-evaluation time
// inside a Web Worker context. That context has no window.chrome shim, so it
// always crashes with "Cannot read properties of undefined (reading 'sync')".
//
// Solution: intercept every import of @biconomy/particle-auth at BUILD time
// and replace it with a tiny virtual module that exports the same API surface
// as no-ops. The credential guard in biconomy.js already prevents this code
// path when env vars are absent — this plugin is the build-level enforcement.
//
// When you add real Particle credentials to Vercel env vars, remove this plugin
// and uncomment the dynamic import in biconomy.js / App.jsx.
const PARTICLE_MODULE_ID  = '@biconomy/particle-auth';
const PARTICLE_VIRTUAL_ID = '\0virtual:particle-auth-shim';
const KVS_MODULE_ID       = '@walletconnect/keyvaluestorage';
const KVS_VIRTUAL_ID      = '\0virtual:kvs-shim';

const particleShimPlugin = () => ({
  name: 'particle-auth-shim',

  // ── 1. Virtual shims: replace broken SDK modules entirely ────────────────
  resolveId(id) {
    if (id === PARTICLE_MODULE_ID) return PARTICLE_VIRTUAL_ID;
    if (id === KVS_MODULE_ID)      return KVS_VIRTUAL_ID;
  },
  load(id) {
    if (id === PARTICLE_VIRTUAL_ID) {
      return `
        export const ParticleAuthModule = { ParticleAuth: null, ParticleNetwork: null };
        export class ParticleProvider {
          constructor() {}
          request() { return Promise.resolve([]); }
        }
        export default { ParticleAuthModule, ParticleProvider };
      `;
    }
    if (id === KVS_VIRTUAL_ID) {
      // Full KeyValueStorage implementation using localStorage only.
      // The real @walletconnect/keyvaluestorage tries to use chrome.storage.sync
      // at module-evaluation time — that crashes in any non-extension browser tab.
      // This shim implements the identical interface using localStorage so
      // WalletConnect session persistence works without any chrome dependency.
      return `
        const PREFIX = 'wc_kvs:';
        function key(k) { return PREFIX + k; }
        export class KeyValueStorage {
          async getKeys() {
            return Object.keys(localStorage)
              .filter(k => k.startsWith(PREFIX))
              .map(k => k.slice(PREFIX.length));
          }
          async getEntries() {
            const keys = await this.getKeys();
            return keys.map(k => [k, this.getItem(k)]);
          }
          async getItem(k) {
            try { const v = localStorage.getItem(key(k)); return v ? JSON.parse(v) : undefined; } catch { return undefined; }
          }
          async setItem(k, v) {
            try { localStorage.setItem(key(k), JSON.stringify(v)); } catch {}
          }
          async removeItem(k) {
            localStorage.removeItem(key(k));
          }
        }
        export default KeyValueStorage;
      `;
    }
  },
});

// https://vite.dev/config/
// NOTE: localhost is a 'potentially trustworthy origin' per W3C spec,
// so window.isSecureContext === true even on plain HTTP — XMTP works fine.
export default defineConfig({
  base: '/',
  // Sovereign Redirection: Map problematic Chrome APIs to our safe globalThis.__SovereignStorage identifiers.
  // These identifiers are initialized at the absolute start of index.html for 100% stability.
  define: {
    'chrome.storage.sync':  'globalThis.__SovereignStorageSync',
    'chrome.storage.local': 'globalThis.__SovereignStorageLocal',
    'chrome.storage':        'globalThis.__SovereignStorage'
  },
  plugins: [
    react(),
    basicSsl(),
    nodePolyfills({
      globals: { Buffer: true, global: true, process: true },
    }),
    particleShimPlugin(),
  ],
  optimizeDeps: {
    include: ['@xmtp/browser-sdk'],
    exclude: ['@biconomy/particle-auth', '@walletconnect/keyvaluestorage'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    strictPort: true,
    hmr: {
      protocol: 'wss',
      host: 'localhost',
    }
  },
  build: {
    target: 'esnext',
    sourcemap: false,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-graphics': ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor-web3': ['ethers', 'viem', 'wagmi', 'siwe'],
          'vendor-ui': ['@rainbow-me/rainbowkit', '@tanstack/react-query', 'framer-motion', 'animejs'],
          'vendor-xmtp': ['@xmtp/browser-sdk'],
        }
      }
    }
  },
});
