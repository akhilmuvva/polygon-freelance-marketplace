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
    process.env.NODE_ENV === 'development' && basicSsl(),
  ].filter(Boolean),
  define: {
    'process.env': {},
    'global': 'globalThis',
  },
  resolve: {
    alias: {
      process: 'process/browser',
      stream: 'stream-browserify',
      zlib: 'browserify-zlib',
      util: 'util',
      buffer: 'buffer',
      string_decoder: 'string_decoder',
    },
  },
  server: {
    host: true,
  },
  build: {
    chunkSizeWarningLimit: 1200,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@biconomy') || id.includes('viem') || id.includes('wagmi') || id.includes('ethers')) {
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
        },
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
