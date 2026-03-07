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
      'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: *; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: *; style-src 'self' 'unsafe-inline' *; font-src 'self' data: *; connect-src 'self' 'unsafe-inline' 'unsafe-eval' *; frame-src 'self' *; img-src 'self' data: blob: *;"
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
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@biconomy') || id.includes('viem') || id.includes('wagmi') || id.includes('ethers') || id.includes('siwe')) {
              return 'vendor-web3';
            }
            if (id.includes('three') || id.includes('@react-three')) {
              return 'vendor-graphics';
            }
            if (id.includes('@xmtp')) {
              return 'vendor-messaging';
            }
            if (id.includes('framer-motion') || id.includes('lucide-react') || id.includes('animejs')) {
              return 'vendor-ui';
            }
            if (id.includes('@rainbow-me/rainbowkit')) {
              return 'vendor-rainbow';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('@apollo/client') || id.includes('graphql')) {
              return 'vendor-data';
            }
            return 'vendor';
          }
        }
      }
    }
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
