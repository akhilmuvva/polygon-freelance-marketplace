/**
 * Juror Service - Decentralized Arbitration Logic
 * 
 * Manages juror enrollment, staking, and case assignments.
 * In a production environment, this would interact with a Court Contract.
 */
import { ZENITH_JUDGES } from '../constants';

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
        // Any account in ZENITH_JUDGES holds Judicial Supremacy by default.
        const isMagistrate = address && ZENITH_JUDGES.some(j => j.toLowerCase() === address.toLowerCase());
        
        return {
            totalCases: isMagistrate ? 12 : 0, 
            correctVotes: isMagistrate ? 12 : 0,
            rewardsEarned: isMagistrate ? 450 : 0,
            activeStake: 0, // Default juror without any stake as requested
            rank: isMagistrate ? 'Supreme Justice' : 'Novice'
        };
    }
};

export default JurorService;
