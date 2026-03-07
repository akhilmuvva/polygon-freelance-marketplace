import SovereignService from './SovereignService';

const IS_PROD = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_URL = import.meta.env.VITE_API_BASE_URL;

const handleResponse = async (response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }
    const contentType = response.headers.get('content-type');
    if (response.status === 204 || !contentType || !contentType.includes('application/json')) {
        return {};
    }
    return response.json();
};

const safeFetch = async (url, options, fallbackMethod) => {
    try {
        if (!API_URL || API_URL.includes('your-backend-api')) {
             throw new Error('Sovereign Mode Only');
        }
        const response = await fetch(url, { ...options, credentials: 'include' });
        return await handleResponse(response);
    } catch (error) {
        if (fallbackMethod) {
            console.log(`[SOVEREIGN] Switching to Peer-to-Peer pathway for: ${url}`);
            return await fallbackMethod();
        }
        throw error;
    }
};

export const api = {
    getProfile: (address) => safeFetch(`${API_URL}/profiles/${address}`, {}, () => SovereignService.getProfile(address)),

    getNonce: (address) => safeFetch(`${API_URL}/auth/nonce/${address}`, {}, () => ({ nonce: `SOVEREIGN_${address}_${Date.now()}` })),

    updateProfile: (data) => safeFetch(`${API_URL}/profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }),

    getLeaderboard: () => safeFetch(`${API_URL}/leaderboard`, {}, () => SovereignService.getLeaderboard()),

    getPortfolio: (address) => safeFetch(`${API_URL}/portfolios/${address}`, {}, () => SovereignService.getProfile(address)),

    getJobsMetadata: () => safeFetch(`${API_URL}/jobs`, {}, () => SovereignService.getJobsMetadata()),

    getJobMetadata: (jobId) => safeFetch(`${API_URL}/jobs/${jobId}`, {}, () => SovereignService.getJobMetadata(jobId)),

    saveJobMetadata: (jobMetadata) => safeFetch(`${API_URL}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobMetadata),
    }),

    getAnalytics: () => safeFetch(`${API_URL}/analytics`, {}, () => ({ totalJobs: 0, totalVolume: 0, activeFreelancers: 0 })),

    getMatchScore: (jobId, address) => safeFetch(`${API_URL}/match/${jobId}/${address}`, {}, () => ({ score: 75, reason: 'Sovereign Match (Profile logic)' })),

    getJobMatches: (jobId) => safeFetch(`${API_URL}/jobs/match/${jobId}`, {}, () => []),

    getRecommendations: (address) => safeFetch(`${API_URL}/recommendations/${address}`, {}, () => []),

    checkHealth: () => SovereignService.checkHealth(),
};

export default api;
