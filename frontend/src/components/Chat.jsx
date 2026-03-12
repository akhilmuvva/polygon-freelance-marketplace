import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@xmtp/browser-sdk';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useWalletClient } from 'wagmi';
import { MessageSquare, Send, User, Loader2, FileText, DollarSign, Clock, CheckCircle2, PlusCircle, Video, Gavel } from 'lucide-react';
import UserLink from './UserLink';
import { hexToBytes } from 'viem';
import { useArbitration } from '../hooks/useArbitration';
import messagingService from '../services/MessagingService';

export default function Chat({ initialPeerAddress }) {
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();

    const [client, setClient] = useState(messagingService.getClient());
    const [isInitializing, setIsInitializing] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [peerAddress, setPeerAddress] = useState(initialPeerAddress || '');
    const [contractContext, setContractContext] = useState(null);
    const [loadingContext, setLoadingContext] = useState(false);

    useEffect(() => {
        const checkClient = (newClient) => setClient(newClient);
        messagingService.addListener(checkClient);
        return () => messagingService.removeListener(checkClient);
    }, []);

    useEffect(() => {
        if (client) {
            client.conversations.list().then(setConversations);
        }
    }, [client]);

    useEffect(() => {
        if (initialPeerAddress) setPeerAddress(initialPeerAddress);
    }, [initialPeerAddress]);

    useEffect(() => {
        if (selectedConversation?.peerAddress && address)
            fetchContractContext(selectedConversation.peerAddress, address);
    }, [selectedConversation, address]);

    const fetchContractContext = async (peerAddr, myAddr) => {
        setLoadingContext(true);
        try {
            const SUBGRAPH_URL = import.meta.env.VITE_SUBGRAPH_URL || 'http://localhost:8000/subgraphs/name/polylance';
            const query = `
                query GetJobContext($client: String!, $freelancer: String!) {
                    jobs(
                        where: { or: [
                            { client: $client, freelancer: $freelancer },
                            { client: $freelancer, freelancer: $client }
                        ] }
                        orderBy: createdAt orderDirection: desc first: 1
                    ) { id jobId amount status deadline category client freelancer }
                }
            `;
            const response = await fetch(SUBGRAPH_URL, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, variables: { client: myAddr.toLowerCase(), freelancer: peerAddr.toLowerCase() } })
            });
            const { data } = await response.json();
            setContractContext(data?.jobs?.length > 0 ? data.jobs[0] : null);
        } catch (err) {
            console.error('[CONTEXT] Failed to fetch contract context:', err);
            setContractContext(null);
        } finally { setLoadingContext(false); }
    };

    const handleInitialize = async () => {
        if (!walletClient || !address) return;
        setIsInitializing(true);
        setError(null);
        try {
            const xmtpClient = await messagingService.initialize(address, walletClient);
            setClient(xmtpClient);
        } catch (err) {
            console.error('[XMTP] Singleton Initialization error:', err);
            setError(err);
        } finally {
            setIsInitializing(false);
        }
    };

    useEffect(() => {
        if (!client) return;
        let isCancelled = false;
        const streamConvs = async () => {
            const stream = await client.conversations.stream();
            for await (const conv of stream) {
                if (isCancelled) break;
                setConversations(prev => prev.some(p => p.topic === conv.topic) ? prev : [conv, ...prev]);
            }
        };
        streamConvs();
        return () => { isCancelled = true; };
    }, [client]);

    if (!client) {
        return (
            <div style={{
                textAlign: 'center', padding: '80px 20px', maxWidth: 520, margin: '0 auto',
                borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
            }}>
                <div style={{
                    width: 72, height: 72, borderRadius: 20,
                    background: 'rgba(124,92,252,0.08)', border: '1px solid rgba(124,92,252,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 28px',
                }}>
                    <MessageSquare size={32} style={{ color: 'var(--accent-light)' }} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 12 }}>Enable Decentralized Messaging</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: 400, margin: '0 auto 32px', lineHeight: 1.6 }}>
                    PolyLance uses XMTP V3 for secure, end-to-end encrypted messaging between partners.
                </p>
                <button onClick={handleInitialize} className="btn btn-primary"
                    disabled={isInitializing || !walletClient}
                    style={{ padding: '14px 36px', borderRadius: 12, fontSize: '0.95rem' }}>
                    {isInitializing
                        ? <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Loader2 size={16} className="animate-spin" /> 
                            <span>Establishing Sovereign Resonance...</span>
                          </div>
                        : walletClient ? 'Initialize Secure Channel' : 'Connect Wallet First'
                    }
                </button>
                {!walletClient && (
                    <p style={{ color: 'var(--warning)', marginTop: 20, fontWeight: 700, fontSize: '0.82rem' }}>
                        Please connect your wallet in the dashboard to enable messaging.
                    </p>
                )}
                {error && <p style={{ color: 'var(--danger)', marginTop: 20, fontSize: '0.82rem' }}>{error.message}</p>}
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 20, height: '75vh' }}>
            {/* Conversations sidebar */}
            <div style={{
                display: 'flex', flexDirection: 'column', gap: 16, padding: 20,
                borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                overflow: 'hidden',
            }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Conversations</h3>
                <form style={{ display: 'flex', gap: 8 }}
                    onSubmit={async (e) => {
                        e.preventDefault();
                        if (peerAddress && client) {
                            try {
                                const conversation = await client.conversations.newConversation(peerAddress);
                                setSelectedConversation(conversation);
                                setPeerAddress('');
                            } catch (err) { alert('Error starting conversation: ' + err.message); }
                        }
                    }}>
                    <input type="text" className="form-input" placeholder="0x..." style={{ fontSize: '0.85rem' }}
                        value={peerAddress} onChange={(e) => setPeerAddress(e.target.value)} />
                    <button type="submit" className="btn btn-primary" style={{ borderRadius: 10, padding: '8px 12px' }}>
                        <PlusCircle size={18} />
                    </button>
                </form>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {conversations.length === 0 ? (
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', textAlign: 'center', padding: '40px 0', fontStyle: 'italic' }}>
                            No message history.
                        </p>
                    ) : (
                        conversations.map((conv, i) => (
                            <motion.div key={conv.topic}
                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => setSelectedConversation(conv)}
                                style={{
                                    padding: 14, borderRadius: 12, cursor: 'pointer',
                                    border: '1px solid',
                                    borderColor: selectedConversation?.topic === conv.topic ? 'var(--accent-light)' : 'transparent',
                                    background: selectedConversation?.topic === conv.topic ? 'rgba(124,92,252,0.06)' : 'rgba(255,255,255,0.03)',
                                    transition: 'all 0.2s ease',
                                }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 800 }}>
                                    {conv.peerAddress?.slice(0, 8)}...{conv.peerAddress?.slice(-6)}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Message Area */}
            <div style={{
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
            }}>
                {selectedConversation ? (
                    <MessageContainer
                        conversation={selectedConversation}
                        address={address}
                        contractContext={contractContext}
                        loadingContext={loadingContext}
                        isSyncing={isSyncing}
                        setIsSyncing={setIsSyncing}
                    />
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                        <MessageSquare size={48} style={{ opacity: 0.08, marginBottom: 20 }} />
                        <p>Select a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function MessageContainer({ conversation, address, contractContext, loadingContext, isSyncing, setIsSyncing }) {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const messagesEndRef = useRef(null);
    const { submitChatLogsAsEvidence } = useArbitration();

    const handleExportEvidence = async () => {
        if (!contractContext || messages.length === 0) return;
        setIsExporting(true);
        try {
            const role = address.toLowerCase() === contractContext.client.toLowerCase() ? 'client' : 'freelancer';
            await submitChatLogsAsEvidence(contractContext.jobId, messages, role);
        } catch (err) { console.error('[ARBITRATION] Export failed:', err); }
        finally { setIsExporting(false); }
    };

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    const getStatusColor = (status) => {
        const colors = { 'Created': '#6366f1', 'Accepted': '#8b5cf6', 'Ongoing': '#f59e0b', 'Completed': '#10b981', 'Disputed': '#ef4444', 'Cancelled': '#6b7280' };
        return colors[status] || '#6b7280';
    };

    const formatDeadline = (timestamp) => {
        if (!timestamp) return 'No deadline';
        return new Date(parseInt(timestamp) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    useEffect(() => {
        const fetchMessages = async () => {
            setIsSyncing(true);
            try { const msgs = await conversation.messages(); setMessages(msgs); }
            catch (err) { console.error('[XMTP] Error fetching messages:', err); }
            finally { setIsSyncing(false); }
        };
        fetchMessages();
    }, [conversation]);

    useEffect(() => {
        let isCancelled = false;
        const streamMessages = async () => {
            const stream = await conversation.streamMessages();
            for await (const msg of stream) {
                if (isCancelled) break;
                setMessages(prev => prev.some(p => p.id === msg.id) ? prev : [...prev, msg]);
            }
        };
        streamMessages();
        return () => { isCancelled = true; };
    }, [conversation]);

    useEffect(() => { scrollToBottom(); }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (inputValue.trim()) {
            try { await conversation.send(inputValue); setInputValue(''); }
            catch (err) { alert('Failed to send message: ' + err.message); }
        }
    };

    const ctxItem = { display: 'flex', alignItems: 'center', gap: 10 };
    const ctxIcon = (bg) => ({ padding: 8, borderRadius: 10, background: bg });
    const ctxLabel = { fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' };

    const handleGenerateAgreementIntent = () => {
        // Step 2: Extract recipient address and pre-fill form
        window.dispatchEvent(new CustomEvent('PREFILL_JOB_DATA', { 
            detail: { 
                freelancer: conversation.peerAddress,
                title: 'Project from Chat' 
            } 
        }));
        window.dispatchEvent(new CustomEvent('NAV_TO_CREATE'));
    };

    return (
        <>
            {/* Header */}
            <div style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(45deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={14} color="white" />
                    </div>
                    <strong><UserLink address={conversation.peerAddress} /></strong>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {isSyncing && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.65rem', color: 'var(--accent-light)', marginRight: 12 }}>
                            <Loader2 size={12} className="animate-spin" /> Syncing with Peer...
                        </div>
                    )}
                    <button onClick={handleGenerateAgreementIntent}
                        className="btn btn-primary btn-sm" style={{
                            borderRadius: 10, gap: 6, fontSize: '0.75rem', fontWeight: 800
                        }}>
                        <FileText size={14} /> Hire This Freelancer
                    </button>
                    <button onClick={() => window.open(`https://app.huddle01.com/${conversation.topic?.slice(0, 8)}`, '_blank')}
                        className="btn btn-ghost btn-sm" style={{
                            borderRadius: 10, gap: 6, color: 'var(--accent-light)',
                            background: 'rgba(124,92,252,0.06)', borderColor: 'rgba(124,92,252,0.15)',
                        }}>
                        <Video size={14} /> Video Interview
                    </button>
                </div>
            </div>

            {/* Contract Context */}
            <AnimatePresence>
                {contractContext && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        style={{
                            margin: '12px 16px', padding: '14px 20px', borderRadius: 14,
                            background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                            display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap',
                        }}>
                        <div style={ctxItem}>
                            <div style={ctxIcon('rgba(124,92,252,0.08)')}><FileText size={16} style={{ color: 'var(--accent-light)' }} /></div>
                            <div><div style={ctxLabel}>Active Project</div><div style={{ fontWeight: 700, fontSize: '0.88rem' }}>#{contractContext.jobId}</div></div>
                        </div>
                        <div style={ctxItem}>
                            <div style={ctxIcon('rgba(16,185,129,0.08)')}><DollarSign size={16} style={{ color: '#10b981' }} /></div>
                            <div><div style={ctxLabel}>Budget</div><div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{(parseFloat(contractContext.amount) / 1e18).toFixed(2)} MATIC</div></div>
                        </div>
                        <div style={ctxItem}>
                            <div style={ctxIcon(`${getStatusColor(contractContext.status)}15`)}><CheckCircle2 size={16} style={{ color: getStatusColor(contractContext.status) }} /></div>
                            <div><div style={ctxLabel}>Status</div><div style={{ fontWeight: 700, color: getStatusColor(contractContext.status), fontSize: '0.88rem' }}>{contractContext.status}</div></div>
                        </div>
                        {contractContext.status === 'Disputed' && (
                            <button onClick={handleExportEvidence} disabled={isExporting}
                                className="btn btn-ghost btn-sm" style={{
                                    borderRadius: 10, background: 'rgba(239,68,68,0.06)',
                                    color: '#ef4444', borderColor: 'rgba(239,68,68,0.15)', gap: 6,
                                }}>
                                {isExporting ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Gavel size={12} />}
                                {isExporting ? 'UPLOADING...' : 'SUBMIT CHAT AS EVIDENCE'}
                            </button>
                        )}
                        <div style={{ ...ctxItem, marginLeft: 'auto' }}>
                            <div style={ctxIcon('rgba(245,158,11,0.08)')}><Clock size={16} style={{ color: '#f59e0b' }} /></div>
                            <div><div style={ctxLabel}>Deadline</div><div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{formatDeadline(contractContext.deadline)}</div></div>
                        </div>
                    </motion.div>
                )}
                {loadingContext && (
                    <div style={{ padding: '10px 20px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
                        <Loader2 size={14} style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }} />
                        <span style={{ marginLeft: 8, fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>Loading contract context...</span>
                    </div>
                )}
            </AnimatePresence>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {messages.map((msg) => {
                    const isMe = msg.senderAddress?.toLowerCase() === address?.toLowerCase();
                    return (
                        <motion.div key={msg.id}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            style={{
                                alignSelf: isMe ? 'flex-end' : 'flex-start',
                                background: isMe ? 'linear-gradient(135deg, var(--accent), var(--accent-light))' : 'rgba(255,255,255,0.03)',
                                padding: '12px 18px', maxWidth: '70%', fontSize: '0.92rem',
                                borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                border: isMe ? 'none' : '1px solid var(--border)',
                                color: isMe ? 'white' : 'var(--text-primary)',
                                boxShadow: isMe ? '0 8px 20px -5px rgba(124,92,252,0.3)' : 'none',
                            }}>
                            <div style={{ wordBreak: 'break-word', lineHeight: 1.5, fontWeight: 500 }}>{msg.content}</div>
                            <div style={{ fontSize: '0.62rem', opacity: 0.6, marginTop: 5, textAlign: isMe ? 'right' : 'left', fontWeight: 700 }}>
                                {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {isMe && ' · Sent'}
                            </div>
                        </motion.div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} style={{ padding: 14, display: 'flex', gap: 10, borderTop: '1px solid var(--border)' }}>
                <input type="text" className="form-input" placeholder="Type a message..."
                    style={{ flex: 1, borderRadius: 20 }}
                    value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
                <button type="submit" className="btn btn-primary"
                    style={{ borderRadius: '50%', width: 42, height: 42, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Send size={16} />
                </button>
            </form>
        </>
    );
}
