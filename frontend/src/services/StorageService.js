import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:3001/api';
const IPFS_GATEWAY = 'https://cloudflare-ipfs.com/ipfs/';

/**
 * StorageService: Handles uploads to IPFS via the Backend.
 * This prevents Pinata API keys from being leaked in the frontend.
 */
const StorageService = {
    /**
     * Uploads JSON metadata via the backend proxy
     * @param {Object} metadata 
     * @returns {Promise<{cid: string, url: string}>}
     */
    async uploadMetadata(metadata) {
        try {
            const response = await axios.post(`${API_BASE_URL}/storage/upload-json`, metadata);
            const cid = response.data.cid;
            
            return {
                cid: cid,
                url: `${IPFS_GATEWAY}${cid}`
            };
        } catch (error) {
            console.error('[StorageService] Metadata upload failed:', error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Uploads a file via the backend proxy
     * @param {File} file 
     * @returns {Promise<{cid: string, url: string}>}
     */
    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`${API_BASE_URL}/storage/upload-file`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const cid = response.data.cid;

            return {
                cid: cid,
                url: `${IPFS_GATEWAY}${cid}`
            };
        } catch (error) {
            console.error('[StorageService] File upload failed:', error.response?.data || error.message);
            throw error;
        }
    }
};

export default StorageService;
