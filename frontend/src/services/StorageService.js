/**
 * StorageService: Handles uploads to IPFS via Pinata Directly.
 * Sovereign Mode: No backend dependency.
 */
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_API_SECRET = import.meta.env.VITE_PINATA_API_SECRET;
const IPFS_GATEWAY = import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';

const StorageService = {
    /**
     * Uploads JSON metadata directly to Pinata
     * @param {Object} metadata 
     * @returns {Promise<{cid: string, url: string}>}
     */
    async uploadMetadata(metadata) {
        if (!PINATA_API_KEY || !PINATA_API_SECRET) {
            throw new Error('Sovereign Storage: Pinata keys missing. Check .env');
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
            console.warn('[NETWORK] Metadata telemetry failure:', error.message);
            throw error;
        }
    },

    /**
     * Uploads a file directly to Pinata
     * @param {File} file 
     * @returns {Promise<{cid: string, url: string}>}
     */
    async uploadFile(file) {
        if (!PINATA_API_KEY || !PINATA_API_SECRET) {
            throw new Error('Sovereign Storage: Pinata keys missing. Check .env');
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
            console.warn('[NETWORK] File telemetry failure:', error.message);
            throw error;
        }
    }
};

export default StorageService;
