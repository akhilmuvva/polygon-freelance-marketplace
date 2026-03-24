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
     * Directive 13: Local-First Identity Resolution
     * Prioritizes localStorage for immediate UI hydration to eliminate 'Data Amnesia'.
     */
    getProfile: async (address) => {
        if (!address) return null;
        const addr = address.toLowerCase();
        const cacheKey = `polylance_profile_v3_${addr}`;

        // 1. Instant Retrieval: Check local cache first
        const localCache = localStorage.getItem(cacheKey);
        if (localCache) {
            try {
                const data = JSON.parse(localCache);
                // Background update: Non-blocking fetch to refresh Ceramic/Subgraph data
                ProfileService._refreshProfileCache(addr, cacheKey).catch(() => {});
                return data;
            } catch (e) { console.error('Cache corruption:', e); }
        }

        return await ProfileService._refreshProfileCache(addr, cacheKey);
    },

    /**
     * Internal: Fetches profile from decentralized sources and updates cache
     */
    _refreshProfileCache: async (address, cacheKey) => {
        const addr = address.toLowerCase();
        try {
            // Check Ceramic first
            const ceramicProfile = await CeramicService.getProfile(addr);
            if (ceramicProfile) {
                const updated = { address: addr, ...ceramicProfile, source: 'ceramic' };
                localStorage.setItem(cacheKey, JSON.stringify(updated));
                return updated;
            }

            // Subgraph/IPFS Fallback
            const stats = await SubgraphService.getUserStats(addr);
            const cid = stats?.freelancer?.portfolioCID;
            if (cid) {
                const data = await resolver.resolve(cid);
                if (data) {
                    const updated = {
                        address: addr,
                        ...data,
                        reputationScore: stats.freelancer?.reputationScore || 0,
                        totalEarned: stats.freelancer?.totalEarned || 0,
                        source: 'ipfs'
                    };
                    localStorage.setItem(cacheKey, JSON.stringify(updated));
                    return updated;
                }
            }

            const defaultProfile = {
                address: addr,
                name: 'Sovereign Explorer',
                bio: 'This user has not initialized their weightless profile yet.',
                reputationScore: stats?.freelancer?.reputationScore || 0,
                totalEarned: stats?.freelancer?.totalEarned || 0,
                source: 'default'
            };
            localStorage.setItem(cacheKey, JSON.stringify(defaultProfile));
            return defaultProfile;

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
        const result = await CeramicService.updateProfile(address, profileData);
        // Instant Cache Invalidation: Update local view immediately
        const cacheKey = `polylance_profile_v3_${address.toLowerCase()}`;
        localStorage.setItem(cacheKey, JSON.stringify({ address, ...profileData, source: 'local-update' }));
        return result;
    },

    /**
     * Legacy IPFS upload
     */
    uploadToIPFS: async (profileData) => {
        console.info('[PROFILE] Anchoring legacy metadata to IPFS...');
        const result = await StorageService.uploadMetadata(profileData);
        return result.cid;
    },

    /**
     * Shadow-Banning
     */
    shadowBan: async (address, reason) => {
        console.warn(`[GHOST MODERATOR] Shadow-banning ${address} for ${reason}`);
        return await CeramicService.updateProfileVisibility(address.toLowerCase(), 'Hidden');
    }
};

export default ProfileService;
