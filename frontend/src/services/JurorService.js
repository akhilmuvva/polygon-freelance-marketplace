/**
 * Juror Service - Decentralized Arbitration Logic
 * 
 * Manages juror enrollment, staking, and case assignments.
 * In a production environment, this would interact with a Court Contract.
 */
import { GravityScoreService } from './GravityScoreService';

const JUROR_STAKE_REQUIREMENT = 500; // POL

export const JurorService = {
    /**
     * Check if a user is eligible to be a juror
     */
    async checkEligibility(address, karmaBalance) {
        const stats = GravityScoreService.computeFriction({
            averageRating: 5.0, // Placeholder
            totalJobs: 10, // Placeholder
            karmaBalance: karmaBalance || 0
        });
        
        return {
            isEligible: stats.frictionLevel < 50, // Higher friction = less eligibility
            requiredFriction: 50,
            currentFriction: stats.frictionLevel,
            missing: stats.frictionLevel > 50 ? stats.frictionLevel - 50 : 0
        };
    },

    /**
     * Mock Stake logic
     */
    async stake(address, amount) {
        console.log(`[JUROR] Staking ${amount} POL for ${address}`);
        // Simulate contract call
        return { status: 'STAKED', txHash: '0x' + Math.random().toString(16).slice(2) };
    },

    /**
     * Get Juror Stats
     */
    async getJurorStats(address) {
        // The Architect (0x25F6C8ed995C811E6c0ADb1D66A60830E8115e9A) holds Judicial Supremacy by default.
        const isArchitect = address?.toLowerCase() === '0x25F6C8ed995C811E6c0ADb1D66A60830E8115e9A'.toLowerCase();
        
        return {
            totalCases: isArchitect ? 12 : 0, 
            correctVotes: isArchitect ? 12 : 0,
            rewardsEarned: isArchitect ? 450 : 0,
            activeStake: 0, // Default juror without any stake as requested
            rank: isArchitect ? 'Supreme Justice' : 'Novice'
        };
    }
};

export default JurorService;
