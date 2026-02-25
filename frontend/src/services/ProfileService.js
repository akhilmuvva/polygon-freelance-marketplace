import { SubgraphService } from './SubgraphService';
import StorageService from './StorageService';
import resolver from '../utils/IPFSResolver';

/**
 * ProfileService: Manages user profile data.
 * Profiles are stored on IPFS and linked via the blockchain Subgraph.
 */
export const ProfileService = {
    /**
     * Gets a user's profile. We first check the subgraph for a CID,
     * then fetch the actual JSON data from IPFS.
     */
    getProfile: async (address) => {
        if (!address) return null;
        const addr = address.toLowerCase();

        try {
            // 1. Check Subgraph to see if they have recorded a profile CID
            const stats = await SubgraphService.getUserStats(addr);
            const cid = stats?.freelancer?.portfolioCID;

            if (cid) {
                const data = await resolver.resolve(cid);
                if (data) {
                    return {
                        address: addr,
                        ...data,
                        reputationScore: stats.freelancer?.reputationScore || 0,
                        totalEarned: stats.freelancer?.totalEarned || 0,
                        source: 'ipfs'
                    };
                }
            }

            // Fallback for new users who haven't set up a profile yet
            return {
                address: addr,
                name: 'Anonymous User',
                bio: 'This user has not set up their profile yet.',
                reputationScore: stats?.freelancer?.reputationScore || 0,
                totalEarned: stats?.freelancer?.totalEarned || 0,
                source: 'default'
            };
        } catch (err) {
            console.error('Error in ProfileService.getProfile:', err);
            return {
                address: addr,
                name: 'Loading...',
                bio: 'We are having trouble pulling this profile right now.',
                source: 'error'
            };
        }
    },

    /**
     * Prepares a profile for IPFS upload
     */
    uploadToIPFS: async (profileData) => {
        console.log('[ProfileService] Uploading profile to IPFS...');
        const result = await StorageService.uploadMetadata(profileData);
        // Invalidate cache on upload
        if (profileData.address) profileCache.delete(profileData.address.toLowerCase());
        return result.cid;
    }
};

export default ProfileService;
