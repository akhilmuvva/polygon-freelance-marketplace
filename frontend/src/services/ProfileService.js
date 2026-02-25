import axios from 'axios';
import { SubgraphService } from './SubgraphService';
import StorageService from './StorageService';

/**
 * ProfileService manages the transition from MongoDB to IPFS (Sovereign Storage).
 * It uses the Subgraph to find IPFS CIDs and fetches JSON metadata for profiles.
 */
export const ProfileService = {
    /**
     * Fetches a profile by address using the decentralized path:
     * 1. Query Subgraph for portfolioCID
     * 2. If present, fetch JSON from IPFS
     * 3. Fallback to API if Subgraph returns no CID
     */
    getProfile: async (address, apiFallback = true) => {
        try {
            // 1. Try Decentralized Path (Subgraph)
            const stats = await SubgraphService.getUserStats(address);
            const portfolioCID = stats?.freelancer?.portfolioCID;

            if (portfolioCID) {
                console.log(`[ProfileService] Found decentralized profile CID: ${portfolioCID}`);
                const url = `https://gateway.pinata.cloud/ipfs/${portfolioCID}`;
                const response = await axios.get(url);

                // Merge Subgraph stats with IPFS metadata
                return {
                    address,
                    ...response.data,
                    reputationScore: stats.freelancer?.reputationScore || 0,
                    totalEarned: stats.freelancer?.totalEarned || 0,
                    source: 'ipfs'
                };
            }
        } catch (error) {
            console.warn('[ProfileService] IPFS fetch failed, falling back to API:', error.message);
        }

        // 2. Fallback to Centralized API (MongoDB)
        if (apiFallback) {
            try {
                // We import api dynamically to avoid circular dependencies
                const { api } = await import('./api');
                const profile = await api.getProfile(address);
                return { ...profile, source: 'mongodb' };
            } catch (error) {
                console.error('[ProfileService] API fallback failed:', error);
            }
        }

        return null;
    },

    /**
     * Prepares a profile for IPFS upload
     */
    uploadToIPFS: async (profileData) => {
        console.log('[ProfileService] Uploading profile to IPFS...');
        const result = await StorageService.uploadMetadata(profileData);
        return result.cid;
    }
};

export default ProfileService;
