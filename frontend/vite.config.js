import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import basicSsl from '@vitejs/plugin-basic-ssl'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'process', 'util', 'stream', 'zlib', 'string_decoder', 'events'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocol: 'events',
    }),
    process.env.NODE_ENV === 'development' && basicSsl(),
  ].filter(Boolean),
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    'process.env': JSON.stringify({ NODE_ENV: 'production' }),
    'process.browser': true,
    'global': 'globalThis',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
    host: true,
    headers: {
      'Content-Security-Policy': "default-src 'self' * data: blob: 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: *; connect-src 'self' *; style-src 'self' 'unsafe-inline' *; font-src 'self' data: *; frame-src 'self' *; img-src 'self' data: blob: *;"
    }
  },
  optimizeDeps: {
    // Force pre-bundling of common Web3/UI dependencies for stability
    include: [
      'react', 'react-dom', 'ethers', 'viem', 'wagmi', 'siwe',
      'eventemitter3', 'bn.js', 'buffer', 'process',
      '@biconomy/account', 'lucide-react', 'animejs', 'framer-motion'
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      target: 'esnext',
      supported: { 
        'bigint': true 
      },
    },
  },
  build: {
    target: 'esnext',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1200,
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks: undefined, // Let Vite/Rollup decide the most stable chunking strategy
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{js,jsx}',
        '**/*.spec.{js,jsx}',
      ],
    },
  },
})
