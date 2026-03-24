import { ApolloClient, InMemoryCache, HttpLink, gql } from '@apollo/client';

import env from '../config/env';

const SUBGRAPH_URL = env.SUBGRAPH_URL;

// Robust initialization with explicit HttpLink and CORS mode enabled for production resilience.
const client = new ApolloClient({
  link: new HttpLink({
    uri: SUBGRAPH_URL,
    fetchOptions: {
      mode: 'cors',
    },
  }),
  cache: new InMemoryCache(),
});

const WEIGHTLESS_FALLBACK = {
  freelancer: { jobs: [], totalEarned: '0', reputationScore: '0', jobsCompleted: '0', activeJobs: '0' },
  client: { totalSpent: '0', activeEscrows: [] },
  jobs: [],
  freelancers: [],
  globalStat: { totalJobs: '0', totalVolume: '0', activeUsers: '0' },
  protocolStats: { totalYieldGenerated: '0', totalValueLocked: '0', totalOriginatorFees: '0', totalSovereignSurplus: '0', totalEliteIntents: '0' }
};

const CACHE_KEY_PREFIX = 'polylance_cache_';
const saveToCache = (key, data) => {
    try {
        localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(data));
    } catch (e) {
        console.warn('[CACHE] Write failure:', e.message);
    }
};
const getFromCache = (key) => {
    try {
        const cached = localStorage.getItem(CACHE_KEY_PREFIX + key);
        return cached ? JSON.parse(cached) : null;
    } catch (e) {
        return null;
    }
};

export const GET_JOBS = gql`
  query GetJobs($first: Int, $skip: Int) {
    jobs(first: $first, skip: $skip, orderBy: createdAt, orderDirection: desc) {
      id
      jobId
      client
      freelancer
      amount
      token
      status
      deadline
      ipfsHash
      categoryId
      milestoneCount
      totalPaidOut
      createdAt
    }
  }
`;

export const GET_USER_STATS = gql`
  query GetUserStats($address: String!) {
    freelancer(id: $address) {
      id
      totalEarned
      reputationScore
      jobsCompleted
      activeJobs
      portfolioCID
    }
    client(id: $address) {
      id
      totalSpent
      activeEscrows
    }
  }
`;

export const GET_LEADERBOARD = gql`
  query GetLeaderboard {
    freelancers(first: 20, orderBy: reputationScore, orderDirection: desc) {
      id
      reputationScore
      totalEarned
      jobsCompleted
    }
  }
`;

export const GET_ECOSYSTEM_STATS = gql`
  query GetEcosystemStats {
    globalStat(id: "1") {
      id
      totalJobs
      totalVolume
      activeUsers
    }
  }
`;

export const GET_USER_PORTFOLIO = gql`
  query GetUserPortfolio($address: String!) {
    freelancer(id: $address) {
      id
      totalEarned
      reputationScore
      jobsCompleted
      activeJobs
      portfolioCID
      jobs(orderBy: createdAt, orderDirection: desc) {
        id
        jobId
        amount
        status
        deadline
        ipfsHash
        createdAt
        rating
      }
    }
    client(id: $address) {
      id
      totalSpent
      activeEscrows
    }
  }
`;

export const GET_DISPUTES = gql`
  query GetDisputes {
    jobs(where: { status: Disputed }, orderBy: createdAt, orderDirection: desc) {
      id
      jobId
      client
      freelancer
      amount
      token
      status
      deadline
      ipfsHash
      createdAt
    }
  }
`;

export const GET_PROTOCOL_STATS = gql`
  query GetProtocolStats {
    protocolStats(id: "1") {
      id
      totalYieldGenerated
      totalValueLocked
      totalOriginatorFees
      totalSovereignSurplus
      totalEliteIntents
    }
  }
`;

export const SubgraphService = {
  /**
   * Fetches a list of recent jobs
   */
  getJobs: async (first = 20, skip = 0) => {
    const cacheKey = `jobs_${first}_${skip}`;
    try {
      const { data } = await client.query({
        query: GET_JOBS,
        variables: { first, skip },
        fetchPolicy: 'network-only',
        errorPolicy: 'ignore',
        context: { fetchOptions: { timeout: 10000 } }
      });
      const result = data?.jobs || WEIGHTLESS_FALLBACK.jobs;
      saveToCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('[AGA_DATA_GRAVITY] Subgraph query collapsed:', error.message);
      // Resilience Strategy: If server response is malformed or connection timed out, 
      // return strictly from localStorage to maintain UI continuity.
      return getFromCache(cacheKey) || WEIGHTLESS_FALLBACK.jobs;
    }
  },

  /**
   * Gets stats for a specific user address
   */
  getUserStats: async (address) => {
    if (!address) return WEIGHTLESS_FALLBACK;
    const cacheKey = `stats_${address.toLowerCase()}`;
    try {
      const { data } = await client.query({
        query: GET_USER_STATS,
        variables: { address: address.toLowerCase() },
        fetchPolicy: 'network-only',
        errorPolicy: 'ignore',
        context: { fetchOptions: { timeout: 10000 } }
      });
      const result = data || WEIGHTLESS_FALLBACK;
      saveToCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('[AGA_DATA_GRAVITY] User stats telemetery failure:', error.message);
      return getFromCache(cacheKey) || WEIGHTLESS_FALLBACK;
    }
  },

  /**
   * Gets the full portfolio and job history for a user
   */
  getUserPortfolio: async (address) => {
    if (!address) return WEIGHTLESS_FALLBACK;
    const cacheKey = `portfolio_${address.toLowerCase()}`;
    try {
      const { data } = await client.query({
        query: GET_USER_PORTFOLIO,
        variables: { address: address.toLowerCase() },
        fetchPolicy: 'network-only',
        errorPolicy: 'ignore',
        context: { fetchOptions: { timeout: 10000 } }
      });
      const result = data || WEIGHTLESS_FALLBACK;
      saveToCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('[AGA_DATA_GRAVITY] Portfolio reconstruction failure:', error.message);
      return getFromCache(cacheKey) || WEIGHTLESS_FALLBACK;
    }
  },

  /**
   * Gets the top freelancers by reputation
   */
  getLeaderboard: async () => {
    const cacheKey = 'leaderboard';
    try {
      const { data } = await client.query({
        query: GET_LEADERBOARD,
        fetchPolicy: 'network-only',
        errorPolicy: 'ignore',
        context: { fetchOptions: { timeout: 10000 } }
      });
      const result = data?.freelancers || WEIGHTLESS_FALLBACK.freelancers;
      saveToCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('[AGA_DATA_GRAVITY] Leaderboard failure:', error.message);
      return getFromCache(cacheKey) || WEIGHTLESS_FALLBACK.freelancers;
    }
  },

  /**
   * Gets global platform statistics
   */
  getEcosystemStats: async () => {
    const cacheKey = 'ecosystem_stats';
    try {
      const { data } = await client.query({
        query: GET_ECOSYSTEM_STATS,
        fetchPolicy: 'no-cache',
        context: { fetchOptions: { timeout: 10000 } }
      });
      const result = data?.globalStat || WEIGHTLESS_FALLBACK.globalStat;
      saveToCache(cacheKey, result);
      return result;
    } catch (error) {
      // Use silent fallback - subgraph availability is not critical for global stats
      return getFromCache(cacheKey) || WEIGHTLESS_FALLBACK.globalStat;
    }
  },

  /**
   * Gets protocol-wide financial stats (Treasury, Fees, Surplus)
   */
  getProtocolStats: async () => {
    const cacheKey = 'protocol_stats';
    try {
      const { data } = await client.query({
        query: GET_PROTOCOL_STATS,
        fetchPolicy: 'network-only',
        errorPolicy: 'ignore',
        context: { fetchOptions: { timeout: 10000 } }
      });
      const result = data?.protocolStats || WEIGHTLESS_FALLBACK.protocolStats;
      saveToCache(cacheKey, result);
      return result;
    } catch (error) {
      // Use silent fallback
      return getFromCache(cacheKey) || WEIGHTLESS_FALLBACK.protocolStats;
    }
  },

  /**
   * Gets a list of jobs that are currently in dispute
   */
  getDisputes: async () => {
    const cacheKey = 'disputes';
    try {
      const { data } = await client.query({
        query: GET_DISPUTES,
        fetchPolicy: 'network-only',
        errorPolicy: 'ignore',
        context: { fetchOptions: { timeout: 10000 } }
      });
      const result = data?.jobs || WEIGHTLESS_FALLBACK.jobs;
      saveToCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('[AGA_DATA_GRAVITY] Disputes failure:', error.message);
      return getFromCache(cacheKey) || WEIGHTLESS_FALLBACK.jobs;
    }
  }
};

export default SubgraphService;
