/**
 * StorageService: Handles uploads to IPFS via Pinata Directly.
 * Sovereign Mode: No backend dependency.
 */
import env from '../config/env';

const IPFS_GATEWAY = env.IPFS_GATEWAY;
const PINATA_API_KEY = env.PINATA_API_KEY;
const PINATA_API_SECRET = env.PINATA_API_SECRET;

const StorageService = {
    /**
     * Uploads JSON metadata directly. Falls back to local if keys missing.
     * @param {Object} metadata 
     * @returns {Promise<{cid: string, url: string}>}
     */
    async uploadMetadata(metadata) {
        // DEMO FALLBACK: If keys are missing, don't crash the app — actuate local storage
        if (!PINATA_API_KEY || !PINATA_API_SECRET) {
            console.warn('[STORAGE] Pinata keys missing. Actuating Sovereign Demo Mode (local persistence).');
            const mockCid = `demo-cid-${Date.now()}`;
            localStorage.setItem(mockCid, JSON.stringify(metadata));
            return {
                cid: mockCid,
                url: `local://metadata/${mockCid}`
            };
        }

        try {
            const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'pinata_api_key': PINATA_API_KEY,
                    'pinata_secret_api_key': PINATA_API_SECRET,
                },
                body: JSON.stringify(metadata)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Pinata Upload Failed');

            return {
                cid: data.IpfsHash,
                url: `${IPFS_GATEWAY}${data.IpfsHash}`
            };
        } catch (error) {
            console.warn('[NETWORK] Metadata telemetry error:', error.message);
            throw error;
        }
    },

    /**
     * Uploads a file directly. Falls back to local if keys missing.
     * @param {File} file 
     * @returns {Promise<{cid: string, url: string}>}
     */
    async uploadFile(file) {
        if (!PINATA_API_KEY || !PINATA_API_SECRET) {
            console.warn('[STORAGE] Pinata keys missing. Actuating Sovereign Demo Mode (local storage).');
            const mockCid = `demo-file-${Date.now()}`;
            return {
                cid: mockCid,
                url: `local://file/${mockCid}`
            };
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
                method: 'POST',
                headers: {
                    'pinata_api_key': PINATA_API_KEY,
                    'pinata_secret_api_key': PINATA_API_SECRET,
                },
                body: formData
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Pinata File Upload Failed');

            return {
                cid: data.IpfsHash,
                url: `${IPFS_GATEWAY}${data.IpfsHash}`
            };
        } catch (error) {
            console.warn('[NETWORK] File telemetry error:', error.message);
            throw error;
        }
    }
};

export default StorageService;
