import axios from 'axios';

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_API_SECRET = import.meta.env.VITE_PINATA_API_SECRET;
const IPFS_GATEWAY = 'https://cloudflare-ipfs.com/ipfs/';

/**
 * StorageService: Handles direct uploads to IPFS via Pinata.
 * This lets us store larger metadata (like gig descriptions) without 
 * paying high gas fees to store text on the blockchain.
 */
const StorageService = {
    /**
     * Uploads JSON metadata directly to Pinata (IPFS)
     * @param {Object} metadata 
     * @returns {Promise<{cid: string, url: string}>}
     */
    async uploadMetadata(metadata) {
        if (!PINATA_API_KEY || !PINATA_API_SECRET) {
            throw new Error('Pinata credentials missing. Check .env file.');
        }

        const MAX_RETRIES = 2;
        let lastError;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                const response = await axios.post(
                    'https://api.pinata.cloud/pinning/pinJSONToIPFS',
                    metadata,
                    {
                        headers: {
                            'pinata_api_key': PINATA_API_KEY,
                            'pinata_secret_api_key': PINATA_API_SECRET
                        },
                        timeout: 10000
                    }
                );

                console.log(`[StorageService] Metadata anchored to IPFS path: ${response.data.IpfsHash}`);
                return {
                    cid: response.data.IpfsHash,
                    url: `${IPFS_GATEWAY}${response.data.IpfsHash}`
                };
            } catch (error) {
                lastError = error;
                console.warn(`[StorageService] Upload attempt ${attempt + 1} failed:`, error.message);
                if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, 2000));
            }
        }

        console.error('[StorageService] All upload attempts failed.');
        throw lastError;
    },

    /**
     * Uploads a file directly to Pinata (IPFS)
     * @param {File} file 
     * @returns {Promise<{cid: string, url: string}>}
     */
    async uploadFile(file) {
        if (!PINATA_API_KEY || !PINATA_API_SECRET) {
            throw new Error('Pinata credentials missing. Check .env file.');
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(
                'https://api.pinata.cloud/pinning/pinFileToIPFS',
                formData,
                {
                    maxBodyLength: 'Infinity',
                    headers: {
                        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                        'pinata_api_key': PINATA_API_KEY,
                        'pinata_secret_api_key': PINATA_API_SECRET
                    }
                }
            );

            return {
                cid: response.data.IpfsHash,
                url: `${IPFS_GATEWAY}${response.data.IpfsHash}`
            };
        } catch (error) {
            console.error('[StorageService] Direct File upload failed:', error);
            throw error;
        }
    }
};

export default StorageService;
