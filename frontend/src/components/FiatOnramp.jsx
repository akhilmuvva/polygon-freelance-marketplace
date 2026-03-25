import React, { useState } from 'react';
import api from '../services/api';
import { Loader2, AlertCircle, CreditCard, Zap, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const s = {
    card: {
        background: 'rgba(17, 17, 40, 0.4)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(124, 92, 252, 0.2)',
        borderRadius: 24,
        padding: 32,
        width: '100%',
        maxWidth: 500,
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
    },
    input: {
        width: '100%',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        padding: '12px 16px',
        color: 'white',
        fontSize: '1.2rem',
        fontWeight: 700,
        marginTop: 8,
        outline: 'none',
        transition: 'all 0.2s ease',
    },
    presetBtn: {
        flex: 1,
        padding: '10px',
        background: 'rgba(124, 92, 252, 0.1)',
        border: '1px solid rgba(124, 92, 252, 0.2)',
        borderRadius: 10,
        color: '#a78bfa',
        fontSize: '0.85rem',
        fontWeight: 600,
        cursor: 'pointer',
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20
    },
    mockModal: {
        background: '#1a1a1a',
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid #333'
    }
};

const FiatOnramp = ({ address, recipientAddress: propRecipient }) => {
    const [amount, setAmount] = useState('1000');
    const [recipientAddress, setRecipientAddress] = useState(propRecipient || address || '');
    const [loading, setLoading] = useState(false);
    const [showMockModal, setShowMockModal] = useState(false);
    const [mockOrder, setMockOrder] = useState(null);
    const [verifying, setVerifying] = useState(false);
    const [minting, setMinting] = useState(false);

    React.useEffect(() => {
        if (propRecipient) {
            setRecipientAddress(propRecipient);
        } else if (address && !recipientAddress) {
            setRecipientAddress(address);
        }
    }, [propRecipient, address]);

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) return resolve(true);
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const isDemoMode = !import.meta.env.VITE_RAZORPAY_KEY_ID || import.meta.env.VITE_RAZORPAY_KEY_ID.includes('replace_me');

    const handlePayment = async () => {
        if (!amount || isNaN(amount) || amount <= 0) {
            return toast.error("Please enter a valid amount");
        }

        setLoading(true);
        try {
            // Initiate order creation on backend
            const order = await api.createRazorpayOrder(parseFloat(amount), recipientAddress, {
                phone: "9999999999",
                email: "user@polylance.com"
            });

            if (order.id && order.id.startsWith('mock_')) {
                setMockOrder(order);
                setShowMockModal(true);
                setLoading(false);
                return;
            }

            const res = await loadRazorpay();
            if (!res) throw new Error("Razorpay SDK failed to load");

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "PolyLance Supreme",
                description: "Fiat-to-Crypto Onramp",
                order_id: order.id,
                handler: async (response) => {
                    setLoading(true);
                    try {
                        const verifyRes = await api.verifyRazorpayPayment(response);
                        if (verifyRes.status === 'SUCCESS') {
                            setMinting(true);
                            // Simulating the on-chain minting delay for realism
                            await new Promise(r => setTimeout(r, 2000));
                            
                            const msg = `Success! Assets minted directly to ${recipientAddress.substring(0, 6)}...${recipientAddress.slice(-4)}`;
                            toast.success(msg);
                            if (verifyRes.txHash) {
                                toast.info(`View on Explorer: ${verifyRes.txHash.substring(0, 15)}...`, { autoClose: 3000 });
                            }
                        } else {
                            toast.error("Bridge verification failed");
                        }
                    } catch (err) {
                        toast.error("Minting protocol friction detected");
                    } finally {
                        setLoading(false);
                        setMinting(false);
                    }
                },
                prefill: {
                    contact: "9999999999",
                    email: "user@polylance.com"
                },
                theme: { color: "#7c3aed" },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error("Payment error:", error);
            toast.error(error.message || "Payment failed");
        } finally {
            setLoading(false);
        }
    };

    const handleMockSuccess = async () => {
        setVerifying(true);
        try {
            const mockResponse = {
                razorpay_order_id: mockOrder.id,
                razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(7)}`,
                razorpay_signature: "mock_signature"
            };
            const verifyRes = await api.verifyRazorpayPayment(mockResponse);
            if (verifyRes.status === 'SUCCESS') {
                setShowMockModal(false);
                setLoading(true); // Switch to main loader
                setMinting(true);
                
                // Final minting simulation
                await new Promise(r => setTimeout(r, 2000));
                
                toast.success(`Minted directly to ${recipientAddress.substring(0, 8)}...`);
                if (verifyRes.txHash) {
                    toast.info(`TX Block: ${verifyRes.txHash.substring(0, 15)}...`);
                }
            }
        } catch {
            toast.error("Mock verification failed");
        } finally {
            setVerifying(false);
            setLoading(false);
            setMinting(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%', padding: 20 }}>
            <div style={s.card}>
                <header style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.2)', color: '#34d399', padding: '6px 12px', borderRadius: 8, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <ShieldCheck size={12} />
                        Verified Merchant & Liquidity Node
                    </div>
                    <div style={{ background: 'rgba(124, 92, 252, 0.1)', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid rgba(124, 92, 252, 0.3)' }}>
                        <Zap size={32} style={{ color: '#a78bfa' }} />
                    </div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>Zenith Quick Onramp</h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', fontWeight: 500 }}>Secure Fiat-to-Polygon liquidity bridge via Razorpay</p>
                </header>

                <div style={{ marginBottom: 20 }}>
                    <label htmlFor="onramp-recipient" style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>
                        Asset Recipient (Polygon Address)
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input
                            id="onramp-recipient"
                            name="recipientAddress"
                            style={{ ...s.input, fontSize: '0.85rem', color: '#a78bfa' }}
                            type="text"
                            value={recipientAddress}
                            onChange={(e) => setRecipientAddress(e.target.value)}
                            placeholder="0x..."
                        />
                        {recipientAddress?.toLowerCase() === address?.toLowerCase() && (
                            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-20%)', fontSize: '0.6rem', fontWeight: 800, color: 'var(--success)', background: 'rgba(52,211,153,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                                USER WALLET
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                    <label htmlFor="onramp-amount" style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>
                        Amount (INR)
                    </label>
                    <input
                        id="onramp-amount"
                        name="amount"
                        style={s.input}
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        {['500', '1000', '5000'].map(val => (
                            <button key={val} style={s.presetBtn} onClick={() => setAmount(val)}>₹{val}</button>
                        ))}
                    </div>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={handlePayment}
                    disabled={loading}
                    style={{ width: '100%', padding: '14px', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                >
                    {loading ? (minting ? "Minting Assets..." : "Connecting...") : "Secure Payment"}
                </button>

                <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>
                    <ShieldCheck size={14} />
                    Secure encrypted transaction
                </div>
            </div>

            {/* Simulated Razorpay Modal */}
            {showMockModal && (
                <div style={s.modalOverlay}>
                    <div style={s.mockModal}>
                        <div style={{ background: '#222', padding: '16px 24px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '12px', color: '#888', letterSpacing: '2px' }}>ZENITH SOVEREIGN SETTLEMENT</div>
                                <div style={{ fontSize: '22px', fontWeight: 900, color: 'white', marginTop: 4 }}>₹{amount}</div>
                            </div>
                            <img src="https://razorpay.com/favicon.png" style={{ height: 24 }} alt="RZP" />
                        </div>

                        <div style={{ padding: 32, textAlign: 'center' }}>
                            <div style={{ color: '#a78bfa', marginBottom: 16 }}>
                                <AlertCircle size={48} style={{ margin: '0 auto' }} />
                            </div>
                            <h3 style={{ color: 'white', marginBottom: 8, fontSize: '1.2rem', fontWeight: 800 }}>Confirm Onramp Transfer</h3>
                            <p style={{ color: '#888', fontSize: '14px', marginBottom: 24, lineHeight: '1.5' }}>
                                Your transaction will be settled via <b>PolyLance Sovereign Nodes</b>. Final assets will be sent to your Polygon address.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <button
                                    onClick={handleMockSuccess}
                                    disabled={verifying}
                                    style={{ background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)', color: 'white', border: 'none', padding: '14px', borderRadius: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 15px rgba(58, 123, 213, 0.3)' }}
                                >
                                    {verifying ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                                    Confirm & Authorize Transfer
                                </button>
                                <button
                                    onClick={() => setShowMockModal(false)}
                                    style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                >
                                    <XCircle size={18} />
                                    Cancel Transaction
                                </button>
                            </div>
                        </div>

                        <div style={{ background: '#111', padding: '12px', textAlign: 'center', fontSize: '10px', color: '#555', letterSpacing: '1px' }}>
                            POWRED BY SECURE RAZORPAY BRIDGE
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FiatOnramp;
