import React, { useEffect, useRef, useState } from 'react';
import { loadStripeOnramp } from '@stripe/crypto';
import { api } from '../services/api';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

const FiatOnramp = ({ address }) => {
    const onrampElementRef = useRef(null);
    const [status, setStatus] = useState('idle');
    const [onrampInstance, setOnrampInstance] = useState(null);
    const [clientSecret, setClientSecret] = useState('');
    const [stripeError, setStripeError] = useState(null);

    useEffect(() => {
        const initStripe = async () => {
            if (onrampInstance) return;
            try {
                const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
                if (!publishableKey) {
                    throw new Error("Stripe Publishable Key not found in environment variables (VITE_STRIPE_PUBLISHABLE_KEY).");
                }
                const onramp = await loadStripeOnramp(publishableKey);
                if (!onramp) throw new Error("Failed to load Stripe Onramp SDK. Check your internet connection.");
                setOnrampInstance(onramp);
            } catch (err) {
                console.error("[ONRAMP] Init failed:", err);
                setStatus('error');
                setStripeError(err.message);
            }
        };
        initStripe();
    }, [onrampInstance]);

    useEffect(() => {
        const createSessionAndMount = async () => {
            if (!onrampInstance || !address || clientSecret) return;
            setStatus('loading');
            try {
                const response = await api.createStripeOnrampSession(address);
                if (response.error) throw new Error(response.error);
                const { client_secret } = response;
                setClientSecret(client_secret);
                const session = onrampInstance.createSession({ clientSecret: client_secret, appearance: { theme: 'dark' } });
                if (onrampElementRef.current) {
                    session.mount(onrampElementRef.current);
                    setStatus('ready');
                } else {
                    console.error("[ONRAMP] Ref not found");
                }
            } catch (err) {
                console.error("[ONRAMP] Session creation failed:", err);
                setStatus('error');
                setStripeError(err.message || "Failed to start onramp session.");
                toast.error("Fiat Onramp unreachable: " + err.message);
            }
        };
        createSessionAndMount();
    }, [onrampInstance, address, clientSecret]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', padding: 28 }}>
            <header style={{ marginBottom: 36 }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>
                    <span style={{
                        background: 'linear-gradient(135deg, #34d399, #059669)',
                        WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>Fiat</span> To Crypto
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.92rem', maxWidth: 600 }}>
                    Seamlessly convert your fiat currency into Polygon assets using Stripe's secure onramp.
                    Power up your wallet instantly.
                </p>
            </header>

            <div style={{ flex: 1, minHeight: 500, display: 'flex', justifyContent: 'center' }}>
                <div style={{
                    width: '100%', maxWidth: 480,
                    background: '#1a1b26', border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 24, overflow: 'hidden',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', position: 'relative',
                }}>
                    {/* Loading */}
                    {status === 'loading' && (
                        <div style={{
                            position: 'absolute', inset: 0, zIndex: 20,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
                        }}>
                            <Loader2 size={40} style={{ color: 'var(--accent-light)', animation: 'spin 1s linear infinite', marginBottom: 16 }} />
                            <span style={{ color: 'white', fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                Initializing Secure Link...
                            </span>
                        </div>
                    )}

                    {/* Error */}
                    {status === 'error' && (
                        <div style={{
                            position: 'absolute', inset: 0, zIndex: 20,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(0,0,0,0.9)', padding: 32, textAlign: 'center',
                        }}>
                            <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: 16 }} />
                            <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>Connection Failed</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 24 }}>{stripeError}</p>
                            <button onClick={() => window.location.reload()}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 24px',
                                    background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 20,
                                    color: 'white', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                                    transition: 'background 0.2s ease',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                                <RefreshCw size={14} /> Retry
                            </button>
                        </div>
                    )}

                    {/* Stripe element */}
                    <div id="onramp-element" ref={onrampElementRef} style={{ width: '100%', height: '100%', minHeight: 600 }} />
                </div>
            </div>
        </div>
    );
};

export default FiatOnramp;
