/**
 * MockDataService: High-fidelity simulated data for the PolyLance Zenith ecosystem.
 * Activated when the Sovereign Indexer (The Graph) or Auth Providers are unreachable.
 */
export const MockDataService = {
    getJobs: () => [
        {
            id: 'mock-1',
            jobId: '101',
            title: 'Sovereign UI Architect',
            description: 'Redesign the Zenith Command Center for absolute zero gravity.',
            amount: '500000000000000000000', // 500 MATIC in Wei
            token: 'MATIC',
            status: '0', // Using numeric status matches the filter Number(j.status) < 5
            client: '0x25F6C8ed995C811E6c0ADb1D66A60830E8115e9A',
            freelancer: '0x0000000000000000000000000000000000000000',
            createdAt: Math.floor(Date.now() / 1000) - 86400,
            isMock: true
        },
        {
            id: 'mock-2',
            jobId: '102',
            title: 'ZK-Proof Engineer',
            description: 'Implement DKIM verification for the global Reputation Mesh.',
            amount: '2000000000', // 2000 USDC in 6 decimals
            token: 'USDC',
            status: '2', // Ongoing
            client: '0x1234567890123456789012345678901234567890',
            freelancer: '0xDE4DbEef88888888888888888888888888888888',
            createdAt: Math.floor(Date.now() / 1000) - 172800,
            isMock: true
        }
    ],

    getStats: () => ({
        totalJobs: 154,
        totalVolume: '24500000000000000000000', // 24,500 MATIC in Wei
        activeUsers: ['0x1...', '0x2...', '0x3...'],
        totalYieldGenerated: '120500000000000000000', // 120.5 MATIC in Wei
        totalSovereignSurplus: '45200000000000000000', // 45.2 MATIC in Wei
        isMock: true
    }),

    getProfile: (address) => ({
        address: address,
        name: 'Sovereign Pioneer',
        bio: 'Resonance Protocol Alpha Testing Identity.',
        reputationScore: 85,
        totalEarned: 1250,
        source: 'resonance-mock',
        isMock: true,
        jobs: [
            {
                id: 'mock-1',
                jobId: '101',
                title: 'Sovereign UI Architect',
                amount: '500000000000000000000',
                status: '2', // Ongoing
                deadline: Math.floor(Date.now() / 1000) + 86400 * 7,
                createdAt: Math.floor(Date.now() / 1000) - 86400,
            },
            {
                id: 'mock-2',
                jobId: '102',
                title: 'ZK-Proof Engineer',
                amount: '2000000000',
                status: '0', // Created
                deadline: Math.floor(Date.now() / 1000) + 86400 * 14,
                createdAt: Math.floor(Date.now() / 1000) - 172800,
            }
        ]
    }),

    getLeaderboard: () => [
        {
            id: 'mock-1',
            address: '0xDE4DbEef88888888888888888888888888888888',
            reputationScore: 95,
            completedJobs: 42,
            totalEarned: '12500000000000000000000',
            name: 'Alpha Sovereign',
            isMock: true
        },
        {
            id: 'mock-2',
            address: '0x25F6C8ed995C811E6c0ADb1D66A60830E8115e9A',
            reputationScore: 88,
            completedJobs: 15,
            totalEarned: '4500000000000000000000',
            name: 'Beta Architect',
            isMock: true
        }
    ]
};

export default MockDataService;
