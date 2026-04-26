/**
 * IPFSResolver: Handles fetching content from IPFS with fallback gateways.
 * Ported to Zenith Next.js Environment.
 */

interface Gateway {
  url: string;
  fails: number;
}

class IPFSResolver {
  private gateways: Gateway[];
  private cacheKey: string;
  private cache: Record<string, any>;
  private inflightRequests: Map<string, Promise<any>>;
  private maxRetries: number;
  private timeoutLimit: number;

  constructor() {
    this.gateways = [
      { url: 'https://cloudflare-ipfs.com/ipfs/', fails: 0 },
      { url: 'https://ipfs.io/ipfs/', fails: 0 },
      { url: 'https://gateway.pinata.cloud/ipfs/', fails: 0 },
      { url: 'https://dweb.link/ipfs/', fails: 0 }
    ];

    this.cacheKey = 'zenith_ipfs_cache';
    this.inflightRequests = new Map();
    this.maxRetries = 1;
    this.timeoutLimit = 8000;
    this.cache = {};

    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(this.cacheKey);
        this.cache = saved ? JSON.parse(saved) : {};
      } catch (err) {
        this.cache = {};
      }
    }
  }

  async resolve(cid: string, options: any = {}) {
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

  private async _executeFetch(cid: string, options: any) {
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

  private _saveToCache(cid: string, data: any) {
    this.cache[cid] = data;
    if (typeof window === 'undefined') return;
    
    setTimeout(() => {
      try {
        const keys = Object.keys(this.cache);
        if (keys.length > 100) delete this.cache[keys[0]];
        localStorage.setItem(this.cacheKey, JSON.stringify(this.cache));
      } catch (e) {
        // Silently skip cache write
      }
    }, 0);
  }
}

export const ipfsResolver = new IPFSResolver();

export const resolveJobMetadata = async (ipfsHash: string) => {
  if (!ipfsHash) return null;
  
  try {
    const data = await ipfsResolver.resolve(ipfsHash);
    if (!data) return null;

    return {
      title: data.title || data.name || 'Untitled Mission',
      description: data.description || data.bio || (data.milestones?.[0]?.description) || 'No description found.',
      category: data.category || 'General',
      skills: data.skills || [],
      milestones: data.milestones || [],
      type: data.type || 'Standard',
      version: data.version || '1.0'
    };
  } catch (error) {
    return null;
  }
};
