const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:3001/api';

const handleResponse = async (response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};

const safeFetch = async (url, options) => {
    try {
        const response = await fetch(url, options);
        return await handleResponse(response);
    } catch (error) {
        console.error(`API Call failed: ${url}`, error.message);

        // Context-aware error message
        const isProd = window.location.hostname.includes('render.com') || window.location.hostname.includes('vercel.app') || window.location.hostname.includes('polylance.codes');

        if (error.message.includes('Failed to fetch')) {
            const message = isProd
                ? 'Network error: The backend service might be asleep or unreachable. Please try again in 30 seconds.'
                : 'Backend server is unreachable. Please ensure the backend is running locally on port 3001.';
            throw new Error(message);
        }
        throw error;
    }
};

export const api = {
    getProfile: (address) => safeFetch(`${API_URL}/profiles/${address}`),

    getNonce: (address) => safeFetch(`${API_URL}/auth/nonce/${address}`),

    updateProfile: (data) => safeFetch(`${API_URL}/profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }),

    getLeaderboard: () => safeFetch(`${API_URL}/leaderboard`),

    getPortfolio: (address) => safeFetch(`${API_URL}/portfolios/${address}`),

    getJobsMetadata: () => safeFetch(`${API_URL}/jobs`),

    getJobMetadata: (jobId) => safeFetch(`${API_URL}/jobs/${jobId}`),

    saveJobMetadata: (jobMetadata) => safeFetch(`${API_URL}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobMetadata),
    }),

    getAnalytics: () => safeFetch(`${API_URL}/analytics`),

    getMatchScore: (jobId, address) => safeFetch(`${API_URL}/match/${jobId}/${address}`),

    getJobMatches: (jobId) => safeFetch(`${API_URL}/jobs/match/${jobId}`),


    createRazorpayOrder: (amount, address, customer_details) => safeFetch(`${API_URL}/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, address, customer_details })
    }),

    verifyRazorpayPayment: (data) => safeFetch(`${API_URL}/payments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }),


    polishBio: (data) => safeFetch(`${API_URL}/profiles/polish-bio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }),

    getDisputes: () => safeFetch(`${API_URL}/disputes`),
    analyzeDispute: (jobId) => safeFetch(`${API_URL}/disputes/${jobId}/analyze`, { method: 'POST' }),
    resolveDispute: (jobId, data) => safeFetch(`${API_URL}/disputes/${jobId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }),

    // Auth helpers for Smart Accounts and SIWE
    verifySIWE: (message, signature) => safeFetch(`${API_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature })
    }),
    checkHealth: () => safeFetch(`${API_URL}/health`),
};
