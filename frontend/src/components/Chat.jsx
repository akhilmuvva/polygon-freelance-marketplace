import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@xmtp/browser-sdk';
import { motion, AnimatePresence } from 'framer-motion';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useAccount } from 'wagmi';
import { MessageSquare, Send, User, Loader2, FileText, DollarSign, Clock, CheckCircle2 } from 'lucide-react';

export default function Chat({ initialPeerAddress, onClearedAddress }) {
    const { address } = useAccount();
    const signer = useEthersSigner();

    const [client, setClient] = useState(null);
    const [isInitializing, setIsInitializing] = useState(false);
    const [error, setError] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [peerAddress, setPeerAddress] = useState(initialPeerAddress || '');
    const [contractContext, setContractContext] = useState(null);
    const [loadingContext, setLoadingContext] = useState(false);

    useEffect(() => {
        if (initialPeerAddress) {
            setPeerAddress(initialPeerAddress);
            // Optionally auto-select if already in list or auto-start
        }
    }, [initialPeerAddress]);

    // Fetch contract context from subgraph when peer address changes
    useEffect(() => {
        if (selectedConversation?.peerAddress && address) {
            fetchContractContext(selectedConversation.peerAddress, address);
        }
    }, [selectedConversation, address]);

    const fetchContractContext = async (peerAddr, myAddr) => {
        setLoadingContext(true);
        try {
            const SUBGRAPH_URL = import.meta.env.VITE_SUBGRAPH_URL || 'http://20.30.75.78:8000/subgraphs/name/polylance';

            const query = `
                query GetJobContext($client: String!, $freelancer: String!) {
                    jobs(
                        where: {
                            or: [
                                { client: $client, freelancer: $freelancer },
                                { client: $freelancer, freelancer: $client }
                            ]
                        }
                        orderBy: createdAt
                        orderDirection: desc
                        first: 1
                    ) {
                        id
                        jobId
                        amount
                        status
                        deadline
                        category
                        client
                        freelancer
                    }
                }
            `;

            const response = await fetch(SUBGRAPH_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query,
                    variables: {
                        client: myAddr.toLowerCase(),
                        freelancer: peerAddr.toLowerCase()
                    }
                })
            });

            const { data } = await response.json();
            if (data?.jobs?.length > 0) {
                setContractContext(data.jobs[0]);
            } else {
                setContractContext(null);
            }
        } catch (err) {
            console.error('[CONTEXT] Failed to fetch contract context:', err);
            setContractContext(null);
        } finally {
            setLoadingContext(false);
        }
    };

    const handleInitialize = async () => {
        if (!signer) return;
        setIsInitializing(true);
        setError(null);
        try {
            console.log('[XMTP] Initializing client...');
            // In V3, we use Client.create. By default it uses MLS.
            const xmtp = await Client.create(signer, { env: 'production' });
            console.log('[XMTP] Client initialized:', xmtp.address);
            setClient(xmtp);

            // Initial fetch of conversations
            const convs = await xmtp.conversations.list();
            setConversations(convs);
        } catch (err) {
            console.error('[XMTP] Initialization error:', err);
            setError(err);
        } finally {
            setIsInitializing(false);
        }
    };

    // Stream new conversations
    useEffect(() => {
        if (!client) return;

        let isCancelled = false;
        const streamConvs = async () => {
            const stream = await client.conversations.stream();
            for await (const conv of stream) {
                if (isCancelled) break;
                setConversations(prev => {
                    const exists = prev.some(p => p.id === conv.id);
                    if (exists) return prev;
                    return [conv, ...prev];
                });
            }
        };

        streamConvs();
        return () => { isCancelled = true; };
    }, [client]);

    if (!client) {
        return (
            <div className="glass-card" style={{ textAlign: 'center', padding: '50px' }}>
                <MessageSquare size={48} style={{ marginBottom: '20px', color: 'var(--primary)' }} />
                <h3>Enable Decentralized Messaging (XMTP V3)</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
                    PolyLance uses XMTP V3 for secure, end-to-end encrypted messaging.
                </p>
                <button
                    onClick={handleInitialize}
                    className="btn-primary"
                    disabled={isInitializing || !signer}
                >
                    {isInitializing ? <Loader2 className="animate-spin" /> : signer ? 'Connect to XMTP V3' : 'Connect Wallet First'}
                </button>
                {!signer && (
                    <p style={{ color: '#f59e0b', marginTop: '10px', fontSize: '0.9rem' }}>
                        Please connect your wallet in the dashboard to enable messaging.
                    </p>
                )}
                {error && <p style={{ color: '#ef4444', marginTop: '10px' }}>{error.message}</p>}
            </div>
        );
    }

    return (
        <div className="grid" style={{ gridTemplateColumns: '300px 1fr', height: '70vh', gap: '20px' }}>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3>Conversations</h3>
                <form
                    style={{ display: 'flex', gap: '5px' }}
                    onSubmit={async (e) => {
                        e.preventDefault();
                        if (peerAddress && client) {
                            try {
                                // In V3, creating a peer-to-peer conversation
                                const conversation = await client.conversations.newConversation(peerAddress);
                                setSelectedConversation(conversation);
                                setPeerAddress('');
                            } catch (err) {
                                console.error('[XMTP] Error starting conversation:', err);
                                alert('Error starting conversation: ' + err.message);
                            }
                        }
                    }}
                >
                    <input
                        type="text"
                        placeholder="Wallet Address"
                        value={peerAddress}
                        onChange={(e) => setPeerAddress(e.target.value)}
                        style={{ flex: 1, padding: '8px' }}
                    />
                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ padding: '8px 12px' }}
                    >
                        +
                    </button>
                </form>
                <div style={{ overflowY: 'auto', flex: 1, paddingRight: '5px' }}>
                    {conversations.map((conv, i) => (
                        <motion.div
                            key={conv.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => setSelectedConversation(conv)}
                            style={{
                                padding: '12px 16px',
                                marginBottom: '8px',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                background: selectedConversation?.id === conv.id ? 'rgba(138, 43, 226, 0.15)' : 'rgba(255,255,255,0.03)',
                                border: '1px solid',
                                borderColor: selectedConversation?.id === conv.id ? 'var(--primary)' : 'transparent',
                                color: selectedConversation?.id === conv.id ? 'var(--primary)' : 'inherit',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                                {conv.peerAddress?.slice(0, 8) || 'Group'}...{conv.peerAddress?.slice(-6) || ''}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                {selectedConversation ? (
                    <MessageContainer
                        conversation={selectedConversation}
                        address={address}
                        contractContext={contractContext}
                        loadingContext={loadingContext}
                    />
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <MessageSquare size={48} style={{ opacity: 0.1, marginBottom: '20px' }} />
                        <p>Select a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function MessageContainer({ conversation, address, contractContext, loadingContext }) {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const getStatusColor = (status) => {
        const colors = {
            'Created': '#6366f1',
            'Accepted': '#8b5cf6',
            'Ongoing': '#f59e0b',
            'Completed': '#10b981',
            'Disputed': '#ef4444',
            'Cancelled': '#6b7280'
        };
        return colors[status] || '#6b72 80';
    };

    const formatDeadline = (timestamp) => {
        if (!timestamp) return 'No deadline';
        const date = new Date(parseInt(timestamp) * 1000);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Fetch initial messages
    useEffect(() => {
        const fetchMessages = async () => {
            setIsLoading(true);
            try {
                const msgs = await conversation.messages();
                setMessages(msgs);
            } catch (err) {
                console.error('[XMTP] Error fetching messages:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMessages();
    }, [conversation]);

    // Stream new messages
    useEffect(() => {
        let isCancelled = false;
        const streamMessages = async () => {
            const stream = await conversation.streamMessages();
            for await (const msg of stream) {
                if (isCancelled) break;
                setMessages(prev => {
                    const exists = prev.some(p => p.id === msg.id);
                    if (exists) return prev;
                    return [...prev, msg];
                });
            }
        };
        streamMessages();
        return () => { isCancelled = true; };
    }, [conversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (inputValue.trim()) {
            try {
                await conversation.send(inputValue);
                setInputValue('');
            } catch (err) {
                console.error('[XMTP] Send error:', err);
                alert('Failed to send message: ' + err.message);
            }
        }
    };

    return (
        <>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="activity-icon" style={{ width: '32px', height: '32px' }}>
                        <User size={16} />
                    </div>
                    <strong>{conversation.peerAddress?.slice(0, 8) || 'Group Chat'}...{conversation.peerAddress?.slice(-6) || ''}</strong>
                </div>
            </div>

            {/* Contract Context Bar - Subgraph Integration */}
            <AnimatePresence>
                {contractContext && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{
                            padding: '16px 20px',
                            background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.1), rgba(75, 0, 130, 0.1))',
                            borderBottom: '1px solid var(--glass-border)',
                            display: 'flex',
                            gap: '20px',
                            alignItems: 'center',
                            fontSize: '0.9rem'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={16} style={{ color: 'var(--primary)' }} />
                            <span style={{ color: 'var(--text-muted)' }}>Job #{contractContext.jobId}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <DollarSign size={16} style={{ color: '#10b981' }} />
                            <span>{(parseFloat(contractContext.amount) / 1e18).toFixed(2)} MATIC</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle2 size={16} style={{ color: getStatusColor(contractContext.status) }} />
                            <span style={{ color: getStatusColor(contractContext.status), fontWeight: '600' }}>
                                {contractContext.status}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={16} style={{ color: '#f59e0b' }} />
                            <span style={{ color: 'var(--text-muted)' }}>{formatDeadline(contractContext.deadline)}</span>
                        </div>
                    </motion.div>
                )}
                {loadingContext && (
                    <div style={{ padding: '12px 20px', textAlign: 'center', borderBottom: '1px solid var(--glass-border)' }}>
                        <Loader2 size={16} className="animate-spin" style={{ display: 'inline-block' }} />
                        <span style={{ marginLeft: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Loading contract context...
                        </span>
                    </div>
                )}
            </AnimatePresence>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {isLoading && <div style={{ textAlign: 'center' }}><Loader2 className="animate-spin" /></div>}
                {messages.map((msg, i) => {
                    const isMe = msg.senderAddress.toLowerCase() === address.toLowerCase();
                    return (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            style={{
                                alignSelf: isMe ? 'flex-end' : 'flex-start',
                                background: isMe ? 'linear-gradient(135deg, var(--primary), #4d0099)' : 'var(--glass-bg)',
                                padding: '12px 18px',
                                borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                border: isMe ? 'none' : '1px solid var(--glass-border)',
                                maxWidth: '75%',
                                fontSize: '0.95rem',
                                boxShadow: isMe ? '0 4px 15px rgba(138, 43, 226, 0.2)' : 'none'
                            }}
                        >
                            {msg.content}
                        </motion.div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} style={{ padding: '15px', display: 'flex', gap: '10px' }}>
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    style={{ flex: 1, padding: '10px 15px', borderRadius: '20px' }}
                />
                <button
                    type="submit"
                    className="btn-primary"
                    style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <Send size={18} />
                </button>
            </form>
        </>
    );
}
