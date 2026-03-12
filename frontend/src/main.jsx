// Directive 03: Sovereign Console Cleanse
if (window.location.hostname === 'localhost') {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' && (args[0].includes('SES') || args[0].includes('[SECURITY]') || args[0].includes('[NETWORK]'))) {
      originalWarn(...args);
    }
  };
}

// XMTP V3 security environment initialization
if (typeof window !== 'undefined') {
  try {
    if (!Object.isFrozen(Object.prototype)) {
      import('@xmtp/browser-sdk').then(() => {
        console.log('[SECURITY] Sovereign messaging environment secured.');
      });
    }
  } catch (e) {
    console.warn('[SECURITY] Lockdown managed by SDK:', e);
  }
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './App.css';
import { Web3Provider } from './Web3Provider.jsx';



ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Web3Provider>
      <App />
    </Web3Provider>
  </React.StrictMode>
);
