import SubgraphService from './SubgraphService';
import StorageService from './StorageService';
import resolver from '../utils/IPFSResolver';
import CeramicService from './CeramicService';

/**
 * ProfileService: Manages user profile data.
 * Updated for the "Antigravity" architecture: Prefers ComposeDB (Ceramic) for dApp-agnostic reputation.
 */
export const ProfileService = {
    /**
     * Gets a user's profile.
     * Hierarchy: 
     * 1. Ceramic (ComposeDB) - the sovereign "Weightless" source.
     * 2. Subgraph/IPFS - the legacy "on-chain link" source.
     * 3. Default fallback.
     */
    getProfile: async (address) => {
        if (!address) return null;
        const addr = address.toLowerCase();

        try {
            // 1. Check weightless Ceramic stream first
            const ceramicProfile = await CeramicService.getProfile(addr);
            if (ceramicProfile) {
                console.info('[PROFILE] Sovereign weightless source verified for:', addr);
                return {
                    address: addr,
                    ...ceramicProfile,
                    source: 'ceramic'
                };
            }

            // 2. Legacy fallback: Check Subgraph for CID
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

            // 3. Fallback for new users
            return {
                address: addr,
                name: 'Sovereign Explorer',
                bio: 'This user has not initialized their weightless profile yet.',
                reputationScore: stats?.freelancer?.reputationScore || 0,
                totalEarned: stats?.freelancer?.totalEarned || 0,
                source: 'default'
            };
        } catch (err) {
            console.warn('[PROFILE] Identity resolution friction:', err.message);
            return {
                address: addr,
                name: 'Identity Loading...',
                bio: 'The weightless layer is currently synchronizing.',
                source: 'error'
            };
        }
    },

    /**
     * Prepares a profile for weightless upload
     */
    updateSovereignProfile: async (address, profileData) => {
        console.info('[PROFILE] Propagating intent to Ceramic mesh for:', address);
        return await CeramicService.updateProfile(address, profileData);
    },

    /**
     * Legacy IPFS upload (kept for backward compatibility during migration)
     */
    uploadToIPFS: async (profileData) => {
        console.info('[PROFILE] Anchoring legacy metadata to IPFS...');
        const result = await StorageService.uploadMetadata(profileData);
        return result.cid;
    },

    /**
     * Shadow-Banning (Ghost Moderator): Invisibility for malicious actors.
     * Updates Ceramic profile visibility to "Hidden".
     */
    shadowBan: async (address, reason) => {
        console.warn(`[GHOST MODERATOR] Shadow-banning ${address} for ${reason}`);
        return await CeramicService.updateProfileVisibility(address.toLowerCase(), 'Hidden');
    }
};

export default ProfileService;

