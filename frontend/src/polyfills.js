import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
    window.Buffer = Buffer;
    window.global = window;
    window.process = window.process || { env: {} };
    // Some XMTP internals look for 'process.env' specifically
    if (!window.process.env) window.process.env = {};
}

console.log('[POLYFILL] Sovereign intrinsics stabilized.');
