/**
 * IPFSResolver: Handles fetching content from IPFS with fallback gateways.
 * Sovereign Edition: 100% Axios-Free. Absolute Zero Gravity.
 */
class IPFSResolver {
    constructor() {
        this.gateways = [
            { url: 'https://cloudflare-ipfs.com/ipfs/', fails: 0 },
            { url: 'https://ipfs.io/ipfs/', fails: 0 },
            { url: 'https://gateway.pinata.cloud/ipfs/', fails: 0 },
            { url: 'https://dweb.link/ipfs/', fails: 0 }
        ];

        this.cacheKey = 'app_ipfs_cache';
        this.inflightRequests = new Map();
        this.maxRetries = 1;
        this.timeoutLimit = 8000;

        try {
            const saved = localStorage.getItem(this.cacheKey);
            this.cache = saved ? JSON.parse(saved) : {};
        } catch (err) {
            this.cache = {};
        }
    }

    /**
     * Tries to resolve a CID. Checks cache first, then hits gateways.
     */
    async resolve(cid, options = {}) {
        if (!cid) return null;

        if (this.cache[cid]) {
            return this.cache[cid];
        }

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
        const workingGateways = [...this.gateways].sort((a, b) => a.fails - b.fails);

        for (const gateway of workingGateways) {
            for (let i = 0; i <= this.maxRetries; i++) {
                try {
                    const targetUrl = `${gateway.url}${cid}`;
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), this.timeoutLimit);

                    const response = await fetch(targetUrl, {
                        ...options,
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);

                    if (!response.ok) throw new Error('Gateway Error');

                    const data = await response.json().catch(() => response.text());

                    gateway.fails = Math.max(0, gateway.fails - 1);
                    return data;
                } catch (err) {
                    console.warn(`Gateway ${gateway.url} failed. Attempt ${i + 1}`);
                    gateway.fails++;
                }
            }
        }

        return null;
    }

    _saveToCache(cid, data) {
        this.cache[cid] = data;
        setTimeout(() => {
            try {
                const keys = Object.keys(this.cache);
                if (keys.length > 100) delete this.cache[keys[0]];
                localStorage.setItem(this.cacheKey, JSON.stringify(this.cache));
            } catch (e) {}
        }, 0);
    }
}

const resolverInstance = new IPFSResolver();
export default resolverInstance;
