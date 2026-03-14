import resolver from '../utils/IPFSResolver';

/**
 * JobService: Handles pulling job details from IPFS.
 * We normalize the data here so the rest of the app doesn't have to 
 * worry about different metadata formats (e.g. 'title' vs 'name').
 */
export const JobService = {
    /**
     * Resolves job metadata by hash. Uses our custom resolver for reliability.
     */
    resolveMetadata: async (ipfsHash) => {
        if (!ipfsHash) return null;

        try {
            const data = await resolver.resolve(ipfsHash);
            if (!data) return null;

            // Make sure we have a consistent object structure
            return {
                title: data.title || data.name || 'Untitled Gig',
                description: data.description || data.bio || (data.milestones?.[0]?.description) || 'No description found in IPFS.',
                category: data.category || 'General',
                skills: data.skills || [],
                milestones: data.milestones || [],
                type: data.type || 'Standard',
                version: data.version || '1.0'
            };
        } catch (error) {
            console.warn('[JOB-RESOLVER] IPFS metadata extraction friction:', error.message);
            return null;
        }
    }
};

export default JobService;
