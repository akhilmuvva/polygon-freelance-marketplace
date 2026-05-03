import SubgraphService from './SubgraphService';
import StorageService from './StorageService';
import resolver from '../utils/IPFSResolver';
import CeramicService from './CeramicService';

/**
 * ProfileService: Manages user profile data.
 * Adheres to decentralized identity standards using local-first resolution.
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
        const cacheKey = `POLYLANCE_PROFILE_CACHE_${addr}`;

        // Migration step: Recover data from legacy keys (Sovereign/v3)
        // We migrate if NO data exists OR if the existing data is just the 'default' placeholder
        const legacyKeys = [`SOVEREIGN_PROFILE_${addr}`, `polylance_profile_v3_${addr}`];
        const currentData = localStorage.getItem(cacheKey);
        const isDefault = currentData ? JSON.parse(currentData).source === 'default' : true;

        if (isDefault) {
            for (const key of legacyKeys) {
                const legacyData = localStorage.getItem(key);
                if (legacyData) {
                    console.info(`[PROFILE-MIGRATION] Restoring profile from legacy storage: ${key}`);
                    localStorage.setItem(cacheKey, legacyData);
                    localStorage.removeItem(key);
                    break; // Use the first legacy source found
                }
            }
        }

        // 1. Instant Retrieval: Check local cache first
        const localCache = localStorage.getItem(cacheKey);
        if (localCache) {
            try {
                const data = JSON.parse(localCache);
                // Background update: Refresh decentralized data in the background
                ProfileService._refreshProfileCache(addr, cacheKey).catch(() => {});
                return data;
            } catch (e) { 
                console.error('[PROFILE] Cache corruption:', e); 
            }
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
            
            // Check if we already have a local-update that we should preserve
            const existing = localStorage.getItem(cacheKey);
            if (existing) {
                const parsed = JSON.parse(existing);
                // If we have a local-update and the network data is identical or hasn't updated yet, keep local
                if (parsed.source === 'local-update' && ceramicProfile) {
                    const isIdentical = JSON.stringify(parsed.name) === JSON.stringify(ceramicProfile.name) && 
                                      JSON.stringify(parsed.bio) === JSON.stringify(ceramicProfile.bio);
                    if (!isIdentical) {
                        console.info('[PROFILE] Network data diverged from local-update. Reconciling...');
                    } else {
                        return parsed;
                    }
                }
            }

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
                        source: 'decentralized-storage'
                    };
                    localStorage.setItem(cacheKey, JSON.stringify(updated));
                    return updated;
                }
            }

            // Check if we already have a local-update that we should preserve (already fetched at top of try)
            if (existing) {
                const parsed = JSON.parse(existing);
                if (parsed.source === 'local-update') {
                    console.info('[PROFILE] Preserving local-update state as network resolution is null.');
                    return parsed;
                }
            }

            const defaultProfile = {
                address: addr,
                name: 'Professional Pioneer',
                bio: 'This profile has not been configured yet.',
                reputationScore: stats?.freelancer?.reputationScore || 0,
                totalEarned: stats?.freelancer?.totalEarned || 0,
                source: 'default'
            };
            localStorage.setItem(cacheKey, JSON.stringify(defaultProfile));
            return defaultProfile;

        } catch (err) {
            console.warn('[PROFILE] Identity resolution friction:', err.message);
            
            // On error, try to return existing cache if available
            const existing = localStorage.getItem(cacheKey);
            if (existing) return JSON.parse(existing);

            return {
                address: addr,
                name: 'Loading Profile...',
                bio: 'Synchronizing with the decentralized network.',
                source: 'error'
            };
        }
    },

    /**
     * Updates the user's profile on the decentralized network
     */
    updateProfile: async (address, profileData) => {
        console.info('[PROFILE] Saving profile to decentralized network for:', address);
        const result = await CeramicService.updateProfile(address, profileData);
        // Instant local update for responsive UI
        const cacheKey = `POLYLANCE_PROFILE_CACHE_${address.toLowerCase()}`;
        localStorage.setItem(cacheKey, JSON.stringify({
            address, 
            ...profileData, 
            source: 'local-update' 
        }));
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
