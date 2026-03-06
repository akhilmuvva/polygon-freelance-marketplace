import axios from 'axios';

/**
 * IPFSResolver: Handles fetching content from IPFS with fallback gateways.
 * We use this to avoid being dependent on a single gateway (like Pinata) 
 * which often hits rate limits or goes down.
 */
class IPFSResolver {
    constructor() {
        this.gateways = [
            { url: 'https://gateway.pinata.cloud/ipfs/', fails: 0 },
            { url: 'https://cloudflare-ipfs.com/ipfs/', fails: 0 },
            { url: 'https://ipfs.io/ipfs/', fails: 0 },
            { url: 'https://dweb.link/ipfs/', fails: 0 }
        ];

        this.cacheKey = 'app_ipfs_cache';
        this.inflightRequests = new Map();
        this.maxRetries = 2;
        this.timeoutLimit = 6000;

        // Load some basic caching from local storage to speed up repeat visits
        try {
            const saved = localStorage.getItem(this.cacheKey);
            this.cache = saved ? JSON.parse(saved) : {};
        } catch (err) {
            console.error('Failed to load IPFS cache from localStorage', err);
            this.cache = {};
        }
    }

    /**
     * Tries to resolve a CID. Checks cache first, then hits gateways.
     */
    async resolve(cid, options = {}) {
        if (!cid) return null;

        // 1. Check if we already have it in memory
        if (this.cache[cid]) {
            return this.cache[cid];
        }

        // 2. Don't start a second request for the same CID if one is already running
        if (this.inflightRequests.has(cid)) {
            return this.inflightRequests.get(cid);
        }

        const fetchPromise = this._executeFetch(cid, options);
        this.inflightRequests.set(cid, fetchPromise);

        try {
            const result = await fetchPromise;
            if (result) {
                this._saveToCache(cid, result);
            }
            return result;
        } finally {
            this.inflightRequests.delete(cid);
        }
    }

    async _executeFetch(cid, options) {
        // Try the best gateways first (the ones with fewer failures)
        const workingGateways = [...this.gateways].sort((a, b) => a.fails - b.fails);

        for (const gateway of workingGateways) {
            for (let i = 0; i <= this.maxRetries; i++) {
                try {
                    // Slight delay if we're retrying the same gateway
                    if (i > 0) await new Promise(resolve => setTimeout(resolve, i * 1000));

                    const targetUrl = `${gateway.url}${cid}`;
                    const response = await axios.get(targetUrl, {
                        timeout: this.timeoutLimit,
                        ...options
                    });

                    // It worked! We can slightly 'forgive' previous failures on this gateway
                    gateway.fails = Math.max(0, gateway.fails - 1);
                    return response.data;
                } catch {
                    console.warn(`Gateway ${gateway.url} failed for ${cid}. Attempt ${i + 1}/${this.maxRetries + 1}`);
                    gateway.fails++;
                }
            }
        }

        console.error(`Total failure: Could not resolve IPFS CID ${cid} via any gateway.`);
        return null;
    }

    /**
     * Internal helper to keep memory and localStorage cache in sync
     */
    _saveToCache(cid, data) {
        this.cache[cid] = data;

        // Push to localStorage asynchronously to avoid blocking the main thread
        setTimeout(() => {
            try {
                // Garbage collect older items if cache gets too big
                const keys = Object.keys(this.cache);
                if (keys.length > 150) {
                    // Simple logic: delete the first key found (not perfect LRU but keeps it small)
                    delete this.cache[keys[0]];
                }
                localStorage.setItem(this.cacheKey, JSON.stringify(this.cache));
            } catch {
                // LocalStorage might be full or private mode might block it
            }
        }, 10);
    }
}

const resolverInstance = new IPFSResolver();
export default resolverInstance;
