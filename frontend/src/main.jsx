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
