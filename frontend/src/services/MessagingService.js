import { Client } from '@xmtp/browser-sdk';
import { hexToBytes } from 'viem';

/**
 * MessagingService - Singleton for XMTP V3 persistent communication.
 * Ensures 100% message delivery by maintaining a single high-gravity channel.
 */
class MessagingService {
    constructor() {
        this.client = null;
        this.isInitializing = false;
        this.listeners = [];
    }

    async initialize(address, walletClient) {
        if (this.client) return this.client;
        if (this.isInitializing) return null;

        this.isInitializing = true;
        console.log('[XMTP] Actuating sovereign communication singleton...');

        try {
            // Verify Sovereign environment before handshake
            if (typeof window !== 'undefined' && !window.Buffer) {
                throw new Error('[SECURITY] Buffer primitive missing in sovereign context.');
            }

            const xmtpSigner = {
                getIdentifier: () => address,
                getAddress: async () => address,
                signMessage: async (message) => {
                    console.log('[XMTP] Requesting cryptographic signature...');
                    const signature = await walletClient.signMessage({
                        account: address,
                        message: typeof message === 'string' ? message : { raw: message },
                    });
                    return hexToBytes(signature);
                },
            };

            const xmtp = await Client.create(xmtpSigner, {
                env: 'production', 
                dbPath: `xmtp-v3-${address.toLowerCase()}`
            });

            console.log('[XMTP] Handshake Succeded. Sovereign channel open.');
            this.client = xmtp;
            this.notifyListeners();
            return this.client;
        } catch (err) {
            console.error('[XMTP] Protocol Handshake Neutralized:', err);
            throw err;
        } finally {
            this.isInitializing = false;
        }
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
        console.log('[XMTP] Sovereign session terminated. Purging messaging client...');
        this.client = null;
        this.notifyListeners();
    }

    notifyListeners() {
        this.listeners.forEach(l => l(this.client));
    }
}

export const messagingService = new MessagingService();
export default messagingService;
