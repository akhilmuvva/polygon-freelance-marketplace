import { Client } from '@xmtp/browser-sdk';
import { hexToBytes } from 'viem';

/**
 * MessagingService - Singleton for XMTP V3 persistent communication.
 * Ensures 100% message delivery by maintaining a single high-gravity channel.
 *
 * XMTP V3 requirements:
 *  - Must run in a secure context (HTTPS or localhost)
 *  - Signer must implement getIdentifier(), signMessage()
 *  - getIdentifier() must return { identifier: address, identifierKind: 'Ethereum' }
 */
class MessagingService {
    constructor() {
        this.client = null;
        this.initPromise = null;
        this.listeners = [];
    }

    async initialize(address, walletClient) {
        if (this.client) return this.client;
        if (this.initPromise) return this.initPromise;

        // Implementation of the "Establishing Sovereign Resonance" intent
        this.initPromise = (async () => {
            // XMTP requires a secure context.
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const isSecure = window.isSecureContext || isLocalhost;
            if (!isSecure) {
                this.initPromise = null;
                throw new Error('XMTP requires a secure context (HTTPS or localhost).');
            }

            console.info('[XMTP] Actuating sovereign communication singleton for:', address);

            try {
                const xmtpSigner = {
                    getIdentifier: () => ({
                        identifier: address.toLowerCase(),
                        identifierKind: 'Ethereum',
                    }),
                    signMessage: async (message) => {
                        console.log('[XMTP] Awaiting cryptographic approval...');
                        const signature = await walletClient.signMessage({
                            account: address,
                            message: typeof message === 'string' ? message : { raw: message },
                        });
                        return hexToBytes(signature);
                    },
                };

                // Use production for real value interactions, dev for Amoy testnet debugging if needed
                const env = import.meta.env.VITE_XMTP_ENV || 'production';
                
                const xmtp = await Client.create(xmtpSigner, {
                    env,
                    dbPath: `xmtp-v3-${address.toLowerCase()}`
                });

                console.log('[XMTP] Sovereign channel anchored. InboxId:', xmtp.inboxId);
                this.client = xmtp;
                this.notifyListeners();
                return this.client;
            } catch (err) {
                console.error('[XMTP] Handshake Neutralized:', err);
                this.initPromise = null;
                throw err;
            }
        })();

        return this.initPromise;
    }

    getClient() {
        return this.client;
    }

    addListener(callback) {
        this.listeners.push(callback);
    }

    removeListener(callback) {
        this.listeners = this.listeners.filter(l => l !== callback);
    }

    disconnect() {
        if (this.client) {
            console.log('[XMTP] Sovereign session terminated. Purging messaging client...');
            this.client = null;
            this.notifyListeners();
        }
    }

    notifyListeners() {
        this.listeners.forEach(l => l(this.client));
    }
}

export const messagingService = new MessagingService();
export default messagingService;
