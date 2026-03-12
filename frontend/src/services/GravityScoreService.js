/**
 * Sovereign Gravity Service
 * ──────────────────────────
 * Actuates dynamic risk premiums based on on-chain SBT reputation.
 * 
 * Philosophy: Gravity represents economic friction. S-Tier sovereigns
 * exhibit negative gravity, unlocking Elite Intents and near-zero
 * discount rates when monetizing their verified work via RWAs.
 *
 * Authors: Akhil Muvva × Jhansi Kupireddy
 */
import ReasoningProofService from './ReasoningProofService';

/**
 * Senior-engineered risk engine with 1e18 institutional precision logic.
 * @param {number} sbtBalance - On-chain reputation points (Karma).
 * @param {number} epochsActive - Number of periods active in the protocol.
 * @returns {number} The calculated Gravity Factor (1.0 = Neutral).
 */
export const evaluateGravityFactor = (sbtBalance, epochsActive) => {
    // [PROTOCOL.SECURITY] Neutral Gravity Fallback: Bypassing RPC 400 or null data.
    if (!sbtBalance && !epochsActive) return 1.0;

    // SCALING CORE: 1e18 Precision logic for high-fidelity risk indexing.
    const SCALE = 10n ** 18n;
    const karma = BigInt(Math.floor(sbtBalance || 0));
    const lifespan = BigInt(Math.floor(epochsActive || 0));

    // Numerical Philosophy: Base risk is 1.0 (Neutral).
    // S-Tier users achieve < 1.0 (Negative Gravity).
    // Unproven users are penalized with > 1.0.
    
    // Weights (Institutional Grade)
    const KarmaWeight = 7000n; // 0.7
    const VelocityWeight = 3000n; // 0.3

    // Friction Calculation: Higher Karma = Lower Friction
    // Max Karma (1000) results in 0 Friction from this component.
    const karmaFriction = (1000n - (karma > 1000n ? 1000n : karma)) * (SCALE / 1000n);
    
    // Stability Calculation: Higher Lifespan = Lower Friction
    // Scaling lifespan impact (max impact at 100 epochs).
    const lifeFriction = (lifespan > 100n ? 800n : 1200n - (lifespan * 4n)) * (SCALE / 1000n);

    // Weighted Aggragate Logic (Sovereign Dialect)
    const rawResult = (karmaFriction * KarmaWeight + lifeFriction * VelocityWeight) / 10000n;
    
    // Normalizing back to human-readable float for the UI layer (Clamped 0.8 - 1.5)
    const floatResult = Number(rawResult) / Number(SCALE);
    return Math.max(0.8, Math.min(1.5, floatResult));
};

export const GravityScoreService = {
    /**
     * Determines the Sovereign Friction (Risk) metric.
     * Scale: -20 (Negative Gravity / Elite) to 100 (High Friction).
     *
     * @param {Object} sovereignMetrics - { averageRating, totalJobs, karmaBalance }
     * @returns {Object} score, category, and yield equilibrium.
     */
    computeFriction(sovereignMetrics) {
        const { averageRating, totalJobs, karmaBalance } = sovereignMetrics;

        // Base Friction: Assumes unproven actors hold standard economic gravity (50)
        let frictionLevel = 50;

        // 1. SBT Sovereign Record
        // Depth of Karma directly neutralizes friction.
        frictionLevel -= Math.min((karmaBalance || 0) * 2, 20);

        // 2. Verified Outcomes
        // Consistent 5-star delivery builds upward momentum (Negative Gravity).
        const performanceDelta = (3 - (averageRating || 5)) * 5;
        frictionLevel += performanceDelta;

        // 3. Execution Velocity
        // High historic throughput compresses risk.
        frictionLevel -= Math.min((totalJobs || 0) * 1, 20);

        // 4. Actuated Equilibrium
        // Hard clamp at -20 (Elite Limit) and 100 (Max Friction).
        const ActuatedFriction = Math.max(-20, Math.min(100, frictionLevel));

        return {
            frictionLevel: ActuatedFriction,
            isSovereignElite: ActuatedFriction < 0,
            orbitCategory: this.determineOrbitCategory(ActuatedFriction),
            equilibriumAdjustment: (ActuatedFriction / 10).toFixed(2) + '%'
        };
    },

    determineOrbitCategory(frictionLevel) {
        if (frictionLevel < 0) return 'NEGATIVE GRAVITY (S - ELITE)';
        if (frictionLevel < 25) return 'WEIGHTLESS (A+)';
        if (frictionLevel < 50) return 'LOW ORBIT (B)';
        if (frictionLevel < 75) return 'STRATOSPHERIC (C)';
        return 'HIGH FRICTION (D/E)';
    },

    /**
     * Propagates the computed friction horizon directly to the 
     * Sovereign Identity Register (on-chain Smart Contract).
     */
    async actuateFrictionTelemetry(address, sovereignMetrics) {
        const { frictionLevel, orbitCategory, equilibriumAdjustment } = this.computeFriction(sovereignMetrics);
        const frictionBps = Math.floor(frictionLevel * 100); 

        console.info(`[GRAVITY-ENGINE] Actuating friction telemetry (${frictionBps} bps) for Sovereign ${address}. Resonance stabilized.`);

        const intent = {
            status: 'FRICTION_TELEMETRY_ACTUATED',
            onChainFriction: frictionBps,
            orbitCategory,
            equilibriumAdjustment,
            rationale: `Actuating ${frictionBps} bps of friction to maintain dynamic yield equilibrium within the RWA vault.`
        };

        await ReasoningProofService.logDecision('FrictionArchitect', intent, { address, sovereignMetrics });

        return {
            ...intent,
            timestamp: Date.now()
        };
    }
};
