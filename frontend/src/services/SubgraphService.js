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
    }
  }
`;

export const SubgraphService = {
  getJobs: async (first = 20, skip = 0) => {
    try {
      const { data } = await client.query({
        query: GET_JOBS,
        variables: { first, skip },
        fetchPolicy: 'network-only'
      });
      return data.jobs;
    } catch (error) {
      console.error('[SUBGRAPH] Failed to fetch jobs:', error);
      return [];
    }
  },

  getUserStats: async (address) => {
    try {
      const { data } = await client.query({
        query: GET_USER_STATS,
        variables: { address: address.toLowerCase() },
        fetchPolicy: 'network-only'
      });
      return data;
    } catch (error) {
      console.error('[SUBGRAPH] Failed to fetch user stats:', error);
      return null;
    }
  },

  getLeaderboard: async () => {
    try {
      const { data } = await client.query({
        query: GET_LEADERBOARD,
        fetchPolicy: 'network-only'
      });
      return data.freelancers;
    } catch (error) {
      console.error('[SUBGRAPH] Failed to fetch leaderboard:', error);
      return [];
    }
  }
};
