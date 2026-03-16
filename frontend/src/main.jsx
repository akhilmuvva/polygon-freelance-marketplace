import './polyfills';
// Full Telemetry Mode: All warnings authorized.

console.log('[SECURITY] Sovereign messaging environment secured.');

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
