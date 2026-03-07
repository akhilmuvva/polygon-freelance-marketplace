import { createPublicClient, http, getContract, parseAbi } from 'viem';
import { polygonAmoy } from 'viem/chains';
import IPFSResolver from '../utils/IPFSResolver';
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

/**
 * SovereignService: The Peer-to-Peer alternative to the centralized backend.
 * Uses Direct-to-Chain, Direct-to-Storage, and Direct-to-Indexer pathways.
 */

const SUBGRAPH_URL = import.meta.env.VITE_SUBGRAPH_URL || 'https://api.studio.thegraph.com/query/poly-lance-studio/poly-lance/v0.0.1';
const ESCROW_ADDRESS = import.meta.env.VITE_FREELANCE_ESCROW_ADDRESS || '0x5Ff3E1223B5c37f1C18CC279dfC9C181bF22BEf9';
const REPUTATION_ADDRESS = import.meta.env.VITE_FREELANCER_REPUTATION_ADDRESS || '0x6976ED34702D29e8605C4b57752a61FeAaC14eeF';

// Minimal Viem Client for Public Data
const publicClient = createPublicClient({
  chain: polygonAmoy,
  transport: http(import.meta.env.VITE_POLYGON_AMOY_RPC || 'https://rpc-amoy.polygon.technology')
});

// Apollo Client for Subgraph Indexing
const apolloClient = new ApolloClient({
  uri: SUBGRAPH_URL,
  cache: new InMemoryCache(),
});

const SovereignService = {
  /**
   * Fetch Profile directly from Blockchain & IPFS
   */
  async getProfile(address) {
    try {
      if (!address) return null;
      console.log(`[SOVEREIGN] Resolving profile for ${address}...`);
      
      const portfolioCID = await publicClient.readContract({
        address: REPUTATION_ADDRESS,
        abi: parseAbi(['function portfolioCID(address) view returns (string)']),
        functionName: 'portfolioCID',
        args: [address]
      });

      if (portfolioCID) {
        const metadata = await IPFSResolver.resolve(portfolioCID);
        return { ...metadata, address, isSovereign: true };
      }
      return { address, isPlaceholder: true };
    } catch (err) {
      console.warn('[SOVEREIGN] Profile resolution fallback:', err.message);
      return { address, isPlaceholder: true };
    }
  },

  /**
   * Fetch Jobs directly from The Graph (Subgraph)
   */
  async getJobsMetadata() {
    try {
      const { data } = await apolloClient.query({
        query: gql`
          query GetJobs {
            jobs(first: 20, orderBy: createdAt, orderDirection: desc) {
              id
              jobId
              client
              freelancer
              amount
              status
              ipfsHash
              createdAt
            }
          }
        `,
        fetchPolicy: 'network-only'
      });

      // Hydrate with IPFS descriptions if possible
      const hydratedJobs = await Promise.all(data.jobs.map(async (job) => {
        if (job.ipfsHash) {
          const metadata = await IPFSResolver.resolve(job.ipfsHash);
          return { ...job, ...metadata, isSovereign: true };
        }
        return job;
      }));

      return hydratedJobs;
    } catch (err) {
      console.error('[SOVEREIGN] Subgraph query failed:', err.message);
      return [];
    }
  },

  /**
   * Fetch a single job from the Subgraph/Chain
   */
  async getJobMetadata(jobId) {
    try {
      const { data } = await apolloClient.query({
        query: gql`
          query GetJob($id: ID!) {
            job(id: $id) {
              id
              jobId
              client
              freelancer
              amount
              status
              ipfsHash
              createdAt
            }
          }
        `,
        variables: { id: jobId.toString() },
      });

      const job = data.job;
      if (job && job.ipfsHash) {
        const metadata = await IPFSResolver.resolve(job.ipfsHash);
        return { ...job, ...metadata, isSovereign: true };
      }
      return job;
    } catch (err) {
      console.warn('[SOVEREIGN] Single job fallback check...');
      // Direct chain read if Indexer is slow
      return null;
    }
  },

  /**
   * Generate Leaderboard from Subgraph reputation data
   */
  async getLeaderboard() {
    try {
      const { data } = await apolloClient.query({
        query: gql`
          query GetLeaderboard {
            freelancers(first: 10, orderBy: reputationScore, orderDirection: desc) {
              id
              address
              reputationScore
              completedJobs
              totalEarned
            }
          }
        `
      });

      // Hydrate profiles asynchronously
      const hydratedLeaders = await Promise.all(data.freelancers.map(async (f) => {
        const profile = await this.getProfile(f.address);
        return { ...f, ...profile };
      }));

      return hydratedLeaders;
    } catch (err) {
      return [];
    }
  },

  /**
   * Basic SIWE Auth without Backend (Pure Client-Side Auth)
   */
  async checkHealth() {
    return { status: 'sovereign', gateway: 'enabled' };
  }
};

export default SovereignService;
