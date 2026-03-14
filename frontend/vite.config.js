import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import basicSsl from '@vitejs/plugin-basic-ssl'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const isVercel = process.env.VERCEL === '1';

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    basicSsl(),
    nodePolyfills({
      globals: { Buffer: true, global: true, process: true },
    }),
  ],
  optimizeDeps: {
    include: ['@xmtp/browser-sdk'],
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    'global': 'globalThis',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5176,
    strictPort: false,
    host: true,
  },
  build: {
    target: 'esnext',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          web3: ['ethers', 'wagmi', 'viem', '@biconomy/account'],
          graphics: ['three', '@react-three/fiber', '@react-three/drei']
        }
      }
    }
  }
})
