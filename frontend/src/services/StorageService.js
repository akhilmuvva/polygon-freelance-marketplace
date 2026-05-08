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
        if (!PINATA_API_KEY || !PINATA_API_SECRET) {
            throw new Error('[Storage] Pinata credentials not configured. Metadata upload disabled.');
        }

        console.info('[STORAGE] Uploading metadata to Pinata IPFS...');
        try {
            const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'pinata_api_key': PINATA_API_KEY,
                    'pinata_secret_api_key': PINATA_API_SECRET,
                },
                body: JSON.stringify({
                    pinataContent: metadata,
                    pinataMetadata: {
                        name: `polylance-job-${Date.now()}`,
                        keyvalues: { app: 'polylance', type: 'job-metadata' }
                    }
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error?.reason || data.error || 'Pinata Upload Failed');
            if (!data.IpfsHash) throw new Error('Pinata returned no CID');

            console.info('[STORAGE] Pinned to IPFS:', data.IpfsHash);
            return {
                cid: data.IpfsHash,
                url: `${IPFS_GATEWAY}${data.IpfsHash}`
            };
        } catch (error) {
            console.error('[STORAGE] Metadata upload failure:', error.message);
            throw error;
        }
    },

    /**
     * Uploads a file directly.
     * @param {File} file 
     * @returns {Promise<{cid: string, url: string}>}
     */
    async uploadFile(file) {
        if (!PINATA_API_KEY || !PINATA_API_SECRET) {
            throw new Error('[Storage] Pinata credentials not configured. File upload disabled.');
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
            console.error('[STORAGE] File upload failure:', error.message);
            throw error;
        }
    }

};

export default StorageService;
