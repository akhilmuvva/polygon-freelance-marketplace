import { ApolloClient, InMemoryCache, HttpLink, gql } from '@apollo/client';

const SUBGRAPH_URL = import.meta.env.VITE_SUBGRAPH_URL || 'https://api.studio.thegraph.com/query/STUDIO_ID/poly-lance/v0.0.1';

// Robust initialization with explicit HttpLink to avoid "link property" errors
const client = new ApolloClient({
  link: new HttpLink({
    uri: SUBGRAPH_URL,
  }),
  cache: new InMemoryCache(),
});

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
      portfolioCID
    }
  }
`;

export const GET_ECOSYSTEM_STATS = gql`
  query GetEcosystemStats {
    globalStat(id: "1") {
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
    jobs(where: { status: "3" }, orderBy: createdAt, orderDirection: desc) {
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

export const SubgraphService = {
  /**
   * Fetches a list of recent jobs
   */
  getJobs: async (first = 20, skip = 0) => {
    try {
      const { data } = await client.query({
        query: GET_JOBS,
        variables: { first, skip },
        fetchPolicy: 'network-only'
      });
      return data.jobs;
    } catch (error) {
      console.error('Failed to fetch jobs from subgraph:', error);
      return [];
    }
  },

  /**
   * Gets stats for a specific user address
   */
  getUserStats: async (address) => {
    try {
      const { data } = await client.query({
        query: GET_USER_STATS,
        variables: { address: address.toLowerCase() },
        fetchPolicy: 'network-only'
      });
      return data;
    } catch (error) {
      console.error('Failed to fetch user stats from subgraph:', error);
      return null;
    }
  },

  /**
   * Gets the full portfolio and job history for a user
   */
  getUserPortfolio: async (address) => {
    try {
      const { data } = await client.query({
        query: GET_USER_PORTFOLIO,
        variables: { address: address.toLowerCase() },
        fetchPolicy: 'network-only'
      });
      return data;
    } catch (error) {
      console.error('Failed to fetch user portfolio from subgraph:', error);
      return null;
    }
  },

  /**
   * Gets the top freelancers by reputation
   */
  getLeaderboard: async () => {
    try {
      const { data } = await client.query({
        query: GET_LEADERBOARD,
        fetchPolicy: 'network-only'
      });
      return data.freelancers;
    } catch (error) {
      console.error('Failed to fetch leaderboard from subgraph:', error);
      return [];
    }
  },

  /**
   * Gets global platform statistics
   */
  getEcosystemStats: async () => {
    try {
      const { data } = await client.query({
        query: GET_ECOSYSTEM_STATS,
        fetchPolicy: 'network-only'
      });
      return data.globalStat;
    } catch (error) {
      console.error('Failed to fetch ecosystem stats from subgraph:', error);
      return null;
    }
  },

  /**
   * Gets a list of jobs that are currently in dispute
   */
  getDisputes: async () => {
    try {
      const { data } = await client.query({
        query: GET_DISPUTES,
        fetchPolicy: 'network-only'
      });
      return data.jobs;
    } catch (error) {
      console.error('Failed to fetch disputes from subgraph:', error);
      return [];
    }
  }
};

export default SubgraphService;
