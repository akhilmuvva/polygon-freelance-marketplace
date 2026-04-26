import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@xmtp/browser-sdk';
import { motion, AnimatePresence } from 'motion/react';
import { useAccount, useWalletClient } from 'wagmi';
import { 
    MessageSquare, Send, User, Loader2, FileText, 
    DollarSign, Clock, CheckCircle2, PlusCircle, 
    Video, Gavel, ShieldCheck, Zap, Activity,
    Globe, Lock, Shield
} from 'lucide-react';
import UserLink from './UserLink';
import { useArbitration } from '../hooks/useArbitration';
import messagingService from '../services/MessagingService';
import './Chat.css';

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
            client.conversations.sync()
                .then(() => client.conversations.list())
                .then(setConversations)
                .catch(err => console.warn('[XMTP] Sync error:', err));
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
            if (xmtpClient) setClient(xmtpClient);
        } catch (err) {
            console.error('[XMTP] Initialization failure:', err);
            setError(err);
        } finally {
            setIsInitializing(false);
        }
    };

    useEffect(() => {
        if (!client) return;
        let isCancelled = false;
        const streamConvs = async () => {
            try {
                const stream = await client.conversations.stream();
                for await (const conv of stream) {
                    if (isCancelled) break;
                    setConversations(prev => prev.some(p => p.id === conv.id) ? prev : [conv, ...prev]);
                }
            } catch (err) {
                if (!isCancelled) console.warn('[XMTP] Conversation stream ended:', err.message);
            }
        };
        streamConvs();
        return () => { isCancelled = true; };
    }, [client]);

    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const needsHttps = typeof window !== 'undefined' && !window.isSecureContext && !isLocal;

    if (!client) {
        return (
            <motion.div 
                className="zenith-onboarding-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div className="onboarding-orb-bg" />
                
                <motion.div 
                    className="onboarding-card"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 20 }}
                >
                    <div className="onboarding-header">
                        <div className="resonance-icon-wrapper">
                            <Activity size={32} className="pulse-icon" />
                        </div>
                        <h2 className="onboarding-title">Sovereign Resonance</h2>
                        <p className="onboarding-pitch">
                            Establish a cryptographically secure frequency. All transmissions are end-to-end encrypted via XMTP V3, ensuring your collaboration remains sovereign and private.
                        </p>
                    </div>

                    <div className="onboarding-features">
                        <div className="feature-pill">
                            <Lock size={14} /> <span>E2E ENCRYPTED</span>
                        </div>
                        <div className="feature-pill">
                            <Shield size={14} /> <span>P2P NETWORK</span>
                        </div>
                        <div className="feature-pill">
                            <Globe size={14} /> <span>CROSS-CHAIN ID</span>
                        </div>
                    </div>

                    {needsHttps && (
                        <div className="security-alert">
                            <Zap size={16} />
                            <span>XMTP requires a secure context (HTTPS). Localhost is exempt.</span>
                        </div>
                    )}

                    <button 
                        onClick={handleInitialize} 
                        className="btn-initiate-resonance"
                        disabled={isInitializing || !walletClient || needsHttps}
                    >
                        {isInitializing ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>SYNCING FREQUENCY...</span>
                            </>
                        ) : (
                            <>
                                <Activity size={18} />
                                <span>{walletClient ? 'INITIALIZE SECURE CHANNEL' : 'CONNECT WALLET TO SYNC'}</span>
                            </>
                        )}
                    </button>

                    {!walletClient && (
                        <p className="wallet-hint">Connect your digital identity to begin resonance.</p>
                    )}
                    
                    {error && (
                        <motion.p 
                            className="error-log"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            [ERROR]: {error.message}
                        </motion.p>
                    )}
                </motion.div>
            </motion.div>
        );
    }

    return (
        <div className="zenith-chat-container">
            {/* Sidebar */}
            <motion.div 
                className="chat-sidebar-sovereign"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
            >
                <div className="sidebar-header">
                    <h3 className="sidebar-title">Frequencies</h3>
                    <div className="active-dot-indicator">
                        <span className="dot pulse" />
                        <span className="dot-label">XMTP ACTIVE</span>
                    </div>
                </div>

                <form className="resonance-connect-form"
                    onSubmit={async (e) => {
                        e.preventDefault();
                        if (peerAddress && client) {
                            try {
                                const canMsg = await Client.canMessage(
                                    [{ identifier: peerAddress.toLowerCase(), identifierKind: 'Ethereum' }],
                                    { env: 'production' }
                                );
                                const canReceive = canMsg.get(peerAddress.toLowerCase());
                                if (!canReceive) {
                                    alert('Address not active on XMTP network.');
                                    return;
                                }
                                const conversation = await client.conversations.newDm(peerAddress);
                                setSelectedConversation(conversation);
                                setPeerAddress('');
                            } catch (err) { alert('Error starting resonance: ' + err.message); }
                        }
                    }}>
                    <div className="input-with-action">
                        <input 
                            type="text" 
                            className="resonance-input" 
                            placeholder="Address (0x...)" 
                            value={peerAddress} 
                            onChange={(e) => setPeerAddress(e.target.value)} 
                        />
                        <button type="submit" className="resonance-add-btn">
                            <PlusCircle size={20} />
                        </button>
                    </div>
                </form>

                <div className="frequency-list">
                    {conversations.length === 0 ? (
                        <div className="empty-frequencies">
                            <MessageSquare size={32} />
                            <p>No active frequencies</p>
                        </div>
                    ) : (
                        conversations.map((conv, i) => {
                            const peerAddr = conv.peerAddress
                                || conv.members?.find(m => m.inboxId !== client?.inboxId)?.addresses?.[0]
                                || 'Unknown';
                            const convId = conv.id || conv.topic;
                            const isActive = selectedConversation?.id === convId;

                            return (
                                <motion.div 
                                    key={convId}
                                    className={`frequency-item ${isActive ? 'active' : ''}`}
                                    initial={{ opacity: 0, y: 10 }} 
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => setSelectedConversation(conv)}
                                >
                                    <div className="freq-avatar">
                                        <div className="avatar-inner">
                                            {peerAddr.slice(2, 4).toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="freq-info">
                                        <div className="freq-addr">
                                            {peerAddr.slice(0, 8)}...{peerAddr.slice(-6)}
                                        </div>
                                        <div className="freq-status">SECURE TRANSMISSION</div>
                                    </div>
                                    {isActive && <motion.div layoutId="active-indicator" className="active-line" />}
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </motion.div>

            {/* Main Chat Area */}
            <motion.div 
                className="chat-workspace-sovereign"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                {selectedConversation ? (
                    <MessageContainer
                        conversation={selectedConversation}
                        address={address}
                        contractContext={contractContext}
                        loadingContext={loadingContext}
                        isSyncing={isSyncing}
                        setIsSyncing={setIsSyncing}
                        client={client}
                    />
                ) : (
                    <div className="no-frequency-selected">
                        <div className="orb-flicker" />
                        <Activity size={48} className="floating-icon" />
                        <p>Select a digital frequency to initiate resonance</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

function MessageContainer({ conversation, address, contractContext, loadingContext, isSyncing, setIsSyncing, client }) {
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

    const getSenderAddress = (msg) => msg.senderAddress || msg.senderInboxId || '';
    const getMsgTime = (msg) => {
        if (msg.sentAtNs) return new Date(Number(msg.sentAtNs) / 1_000_000);
        return msg.sentAt ? new Date(msg.sentAt) : new Date();
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (inputValue.trim()) {
            try { await conversation.send(inputValue); setInputValue(''); }
            catch (err) { alert('Transmission failed: ' + err.message); }
        }
    };

    const handleGenerateAgreementIntent = () => {
        window.dispatchEvent(new CustomEvent('PREFILL_JOB_DATA', { 
            detail: { 
                freelancer: conversation.peerAddress,
                title: 'Project from Chat' 
            } 
        }));
        window.dispatchEvent(new CustomEvent('NAV_TO_CREATE'));
    };

    return (
        <div className="message-container-inner">
            <div className="resonance-header">
                <div className="peer-dossier">
                    <div className="dossier-avatar">
                        <User size={18} />
                        <div className="status-indicator online" />
                    </div>
                    <div className="dossier-info">
                        <h4 className="peer-name">
                            <UserLink address={conversation.peerAddress} />
                        </h4>
                        <div className="connection-status">
                            <Lock size={10} /> <span>ENCRYPTED_CHANNEL_ACTIVE</span>
                        </div>
                    </div>
                </div>
                <div className="resonance-actions">
                    {isSyncing && (
                        <div className="sync-status">
                            <Loader2 size={12} className="animate-spin" />
                            <span>SYNCING...</span>
                        </div>
                    )}
                    <button onClick={handleGenerateAgreementIntent} className="btn-hire-action">
                        <FileText size={14} /> <span>INITIALIZE_CONTRACT</span>
                    </button>
                    <button 
                        onClick={() => window.open(`https://app.huddle01.com/${conversation.topic?.slice(0, 8)}`, '_blank')}
                        className="btn-video-action"
                    >
                        <Video size={14} />
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {contractContext && (
                    <motion.div 
                        className="context-dashboard-widget"
                        initial={{ opacity: 0, y: -20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <div className="widget-grid">
                            <div className="widget-item">
                                <label>ACTIVE_MISSION</label>
                                <div className="val">#{contractContext.jobId}</div>
                            </div>
                            <div className="widget-item">
                                <label>PROTOCOL_ESCROW</label>
                                <div className="val highlight">{(parseFloat(contractContext.amount) / 1e18).toFixed(2)} MATIC</div>
                            </div>
                            <div className="widget-item">
                                <label>DEPLOYMENT_STATUS</label>
                                <div className="val status-tag" data-status={contractContext.status.toLowerCase()}>
                                    {contractContext.status}
                                </div>
                            </div>
                        </div>
                        {contractContext.status === 'Disputed' && (
                            <button onClick={handleExportEvidence} disabled={isExporting} className="btn-dispute-action">
                                {isExporting ? <Loader2 size={12} className="animate-spin" /> : <Gavel size={14} />}
                                <span>{isExporting ? 'UPLOADING...' : 'PUSH EVIDENCE'}</span>
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="resonance-viewport">
                <div className="encryption-banner">
                    <ShieldCheck size={14} />
                    <span>Transmissions are secured via XMTP End-to-End Encryption. Only intended recipients can decrypt.</span>
                </div>
                
                {messages.map((msg, i) => {
                    const sender = getSenderAddress(msg);
                    const isMe = sender?.toLowerCase() === address?.toLowerCase()
                        || (client?.inboxId && sender === client.inboxId);
                    
                    return (
                        <motion.div 
                            key={msg.id}
                            className={`message-row ${isMe ? 'outgoing' : 'incoming'}`}
                            initial={{ opacity: 0, x: isMe ? 20 : -20, scale: 0.9 }} 
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{ delay: i * 0.02, type: 'spring', damping: 20 }}
                        >
                            <div className="bubble-wrapper">
                                <div className="message-bubble-sovereign">
                                    {msg.content}
                                </div>
                                <div className="message-meta">
                                    {getMsgTime(msg).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {isMe && <CheckCircle2 size={10} className="status-check" />}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form className="resonance-input-area" onSubmit={handleSend}>
                <div className="input-glass-container">
                    <input 
                        type="text" 
                        className="broadcast-input" 
                        placeholder="Push message to frequency..."
                        value={inputValue} 
                        onChange={(e) => setInputValue(e.target.value)} 
                    />
                    <button type="submit" className="broadcast-btn" disabled={!inputValue.trim()}>
                        <Send size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
}


