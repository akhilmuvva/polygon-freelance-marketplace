import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

/**
 * Uploads JSON object to IPFS via Pinata
 * @param {Object} jsonData 
 * @returns {Promise<string>} IPFS Hash
 */
export const uploadJSONToIPFS = async (jsonData) => {
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
        throw new Error('Pinata keys not configured');
    }

    try {
        const response = await axios.post(
            'https://api.pinata.cloud/pinning/pinJSONToIPFS',
            jsonData,
            {
                headers: {
                    pinata_api_key: PINATA_API_KEY,
                    pinata_secret_api_key: PINATA_SECRET_KEY,
                },
            }
        );
        return response.data.IpfsHash;
    } catch (error) {
        console.error('Error uploading JSON to IPFS:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Uploads a file buffer to IPFS via Pinata
 * @param {Buffer} fileBuffer 
 * @param {string} fileName 
 * @returns {Promise<string>} IPFS Hash
 */
export const uploadFileToIPFS = async (fileBuffer, fileName) => {
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
        throw new Error('Pinata keys not configured');
    }

    const formData = new FormData();
    formData.append('file', fileBuffer, { filename: fileName });

    try {
        const response = await axios.post(
            'https://api.pinata.cloud/pinning/pinFileToIPFS',
            formData,
            {
                maxBodyLength: Infinity,
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                    pinata_api_key: PINATA_API_KEY,
                    pinata_secret_api_key: PINATA_SECRET_KEY,
                },
            }
        );
        return response.data.IpfsHash;
    } catch (error) {
        console.error('Error uploading file to IPFS:', error.response?.data || error.message);
        throw error;
    }
};
/**
 * Fetches JSON from IPFS
 * @param {string} hash 
 * @returns {Promise<Object>}
 */
export const getJSONFromIPFS = async (hash) => {
    if (!hash) return null;
    try {
        const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${hash}`, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.warn(`[IPFS] Failed to fetch ${hash}:`, error.message);
        return null; // Fallback
    }
};
