import axios from 'axios';

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_API_SECRET = import.meta.env.VITE_PINATA_API_SECRET;

/**
 * Uploads a JSON object directly to IPFS via Pinata (Sovereign).
 * @param {Object} data - The JSON data to upload.
 * @returns {Promise<string>} - The IPFS hash (CID).
 */
export const uploadJSONToIPFS = async (data) => {
    try {
        const response = await axios.post(
            'https://api.pinata.cloud/pinning/pinJSONToIPFS',
            data,
            {
                headers: {
                    'pinata_api_key': PINATA_API_KEY,
                    'pinata_secret_api_key': PINATA_API_SECRET
                }
            }
        );
        return response.data.IpfsHash;
    } catch (error) {
        console.error('Error uploading JSON to IPFS (Sovereign):', error);
        throw error;
    }
};

/**
 * Uploads a file directly to IPFS via Pinata (Sovereign).
 * @param {File} file - The file to upload.
 * @returns {Promise<string>} - The IPFS hash (CID).
 */
export const uploadFileToIPFS = async (file) => {
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
        return response.data.IpfsHash;
    } catch (error) {
        console.error('Error uploading file to IPFS (Sovereign):', error);
        throw error;
    }
};

/**
 * Generates a public gateway URL for an IPFS hash.
 * @param {string} hash 
 * @returns {string}
 */
export const getIPFSUrl = (hash) => {
    if (!hash) return '';
    // Prefer public gateways like Cloudflare or Pinata
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
};
