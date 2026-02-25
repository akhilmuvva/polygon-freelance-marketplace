import axios from 'axios';

const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

const metadataCache = new Map();

/**
 * JobService resolves job metadata from IPFS.
 */
export const JobService = {
    /**
     * Resolves a job's metadata from its IPFS hash
     */
    resolveMetadata: async (ipfsHash) => {
        if (!ipfsHash) return null;
        if (metadataCache.has(ipfsHash)) return metadataCache.get(ipfsHash);

        try {
            const url = `${IPFS_GATEWAY}${ipfsHash}`;
            const response = await axios.get(url, { timeout: 5000 });
            const data = response.data;

            // Normalize data (handling field name variations)
            const resolved = {
                title: data.title || data.name || 'Untitled Job',
                description: data.description || data.bio || (data.milestones?.[0]?.description) || 'No description provided.',
                category: data.category || 'General',
                skills: data.skills || []
            };

            metadataCache.set(ipfsHash, resolved);
            return resolved;
        } catch (error) {
            console.warn(`[JobService] Failed to resolve IPFS hash ${ipfsHash}:`, error.message);
            return null;
        }
    }
};

export default JobService;
