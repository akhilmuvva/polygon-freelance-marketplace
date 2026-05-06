
import './polyfills';
// [SILENCE] Suppress third-party noise before the app boots
if (typeof window !== 'undefined') {
    window.litDisableDevMode = true;
    const _origLog = console.log;
    console.log = (...args) => {
        const msg = String(args[0] ?? '');
        if (msg.includes('Apollo DevTools') || msg.includes('React DevTools') || msg.includes('Download the')) return;
        _origLog.apply(console, args);
    };
    const _origInfo = console.info;
    console.info = (...args) => {
        const msg = String(args[0] ?? '');
        if (msg.includes('React DevTools')) return;
        _origInfo.apply(console, args);
    };
    const _origWarn = console.warn;
    console.warn = (...args) => {
        const msg = String(args[0] ?? '');
        if (
            msg.includes('Lit is in dev mode') ||
            msg.includes('lit.dev/msg/dev-mode') ||
            msg.includes('Not recommended for production')
        ) return;
        _origWarn.apply(console, args);
    };
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './App.css';
import { Web3Provider } from './Web3Provider.jsx';
import { DemoProvider } from './context/DemoContext.jsx';

import { SaasProvider } from '@saas-ui/react';

ReactDOM.createRoot(document.getElementById('root')).render(
  <Web3Provider>
    <SaasProvider>
      <DemoProvider>
        <App />
      </DemoProvider>
    </SaasProvider>
  </Web3Provider>
);
