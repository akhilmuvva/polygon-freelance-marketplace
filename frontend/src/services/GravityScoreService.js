/**
 * Antigravity "Gravity Score" & RWA Risk Engine
 * Calculates risk-adjusted yields based on on-chain SBT reputation.
 */
import ReasoningProofService from './ReasoningProofService';

export const GravityScoreService = {
    /**
     * Calculate the "Gravity Score" (Risk) for an invoice.
     * Scale: 0 (Weightless/Safe) to 100 (Heavy/High-Risk).
     * @param {Object} freelancerStats - { averageRating, totalJobs, karmaBalance }
     */
    calculateScore(freelancerStats) {
        const { averageRating, totalJobs, karmaBalance } = freelancerStats;

        // Base Gravity: Start at 50 (neutral)
        let gravity = 50;

        // 1. Reputation Weight (SBT Balance)
        // High Karma decreases gravity
        gravity -= Math.min(karmaBalance * 2, 20);

        // 2. Performance Weight (Rating)
        // 5 stars = -15 gravity, 1 star = +15 gravity
        const ratingEffect = (3 - averageRating) * 5;
        gravity += ratingEffect;

        // 3. Experience Weight (Total Jobs)
        // More jobs = lower risk
        gravity -= Math.min(totalJobs * 1, 15);

        // Clamping between 0 and 100
        const finalScore = Math.max(0, Math.min(100, gravity));

        return {
            score: finalScore,
            category: this.getRiskCategory(finalScore),
            suggestedYieldAdjustment: (finalScore / 10).toFixed(2) + '%' // e.g., 50 score = +5% yield
        };
    },

    getRiskCategory(score) {
        if (score < 25) return 'WEIGHTLESS (A+)';
        if (score < 50) return 'LOW ORBIT (B)';
        if (score < 75) return 'STRATOSPHERIC (C)';
        return 'HIGH GRAVITY (D/E)';
    },

    /**
     * Propagate the Gravity Score to the on-chain Reputation contract.
     * This makes risk metrics available for the RWA (InvoiceNFT) discount calculations.
     */
    async syncToChain(address, freelancerStats) {
        const { score, category, suggestedYieldAdjustment } = this.calculateScore(freelancerStats);
        const scaledScore = Math.floor(score * 100); // Scale to basis points
        console.log(`[GRAVITY] Propagating risk metric (${scaledScore} bps) for ${address} to Antigravity Node.`);

        const decision = {
            status: 'ZENITH_PROPAGATED',
            onChainScore: scaledScore,
            category,
            suggestedYieldAdjustment
        };

        await ReasoningProofService.logDecision('RiskArchitect', decision, { address, freelancerStats });

        return {
            ...decision,
            timestamp: Date.now()
        };
    }
};
