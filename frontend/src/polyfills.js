import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
    window.Buffer = Buffer;
    window.global = window;
    window.process = window.process || { env: {} };
    if (!window.process.env) window.process.env = {};

    // ─── matchMedia Hardening ──────────────────────────────────────────────────
    // WalletConnect / RainbowKit / Lit components call matchMedia().addListener().
    // The `.addListener` method is deprecated and absent from some browsers/envs.
    // We patch it at the prototype level so *all* MediaQueryList instances
    // automatically have the method, regardless of when the polyfill runs.
    try {
        if (window.MediaQueryList && !window.MediaQueryList.prototype.addListener) {
            window.MediaQueryList.prototype.addListener = function(cb) {
                this.addEventListener('change', cb);
            };
            window.MediaQueryList.prototype.removeListener = function(cb) {
                this.removeEventListener('change', cb);
            };
        }
    } catch(e) { /* no-op */ }

    // Fallback: wrap window.matchMedia for environments where MediaQueryList is unavailable.
    const _origMatchMedia = window.matchMedia;
    window.matchMedia = (query) => {
        try {
            const mql = _origMatchMedia ? _origMatchMedia.call(window, query) : null;
            if (mql) {
                if (!mql.addListener) mql.addListener = () => {};
                if (!mql.removeListener) mql.removeListener = () => {};
                return mql;
            }
        } catch(e) { /* fall through */ }
        // Full fallback object
        return {
            matches: false, media: query, onchange: null,
            addListener: () => {}, removeListener: () => {},
            addEventListener: () => {}, removeEventListener: () => {},
            dispatchEvent: () => false,
        };
    };

    // ─── Chrome Extension Shims ────────────────────────────────────────────────
    // MetaMask's inpage.js calls chrome.runtime.connect(), sendMessage(), etc.
    // We provide safe no-op stubs only where the real methods are absent,
    // so environments *with* MetaMask continue to work normally.
    if (!window.chrome) window.chrome = {};

    if (!window.chrome.runtime) window.chrome.runtime = {};

    const rt = window.chrome.runtime;

    if (!rt.connect)       rt.connect       = () => ({ onMessage: { addListener: () => {}, removeListener: () => {} }, onDisconnect: { addListener: () => {}, removeListener: () => {} }, postMessage: () => {}, disconnect: () => {} });
    if (!rt.sendMessage)   rt.sendMessage   = (_ext, _msg, _opts, cb) => { if (typeof cb === 'function') cb(undefined); };
    if (!rt.getURL)        rt.getURL        = (path) => path;
    if (!rt.id)            rt.id            = undefined;

    if (!rt.onMessage) {
        rt.onMessage = { addListener: () => {}, removeListener: () => {}, hasListener: () => false };
    }
    if (!rt.onConnect) {
        rt.onConnect = { addListener: () => {}, removeListener: () => {}, hasListener: () => false };
    }

    if (!window.chrome.storage) {
        const noopStorage = {
            get:    (_, cb) => cb && cb({}),
            set:    (_, cb) => cb && cb(),
            remove: (_, cb) => cb && cb(),
            clear:  (cb)   => cb && cb(),
        };
        window.chrome.storage = {
            local: noopStorage, sync: noopStorage, managed: noopStorage,
            onChanged: { addListener: () => {} },
        };
    }
}

console.log('[POLYFILL] Sovereign intrinsics stabilized.');
