/**
 * TreasuryButlerService
 * ─────────────────────
 * Autonomous yield-gap detection and gravity-factor deflation engine.
 *
 * Philosophy: The protocol must never extract value from freelancers to sustain itself.
 * Instead, the Butler harvests the "interest delta" — the spread between idle cash
 * APY and the best available DeFi vault yield. That delta is the self-sustaining
 * revenue source. Fee compression follows volume velocity, creating a flywheel:
 * high volume → lower gravity factor → more freelancers → more volume.
 *
 * Authors: Akhil Muvva × Jhansi Kupireddy
 */
import ReasoningProofService from './ReasoningProofService';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Basis points for the gravity factor thresholds at each volume tier. */
const GRAVITY_FACTOR_TABLE = [
  { threshold: 1_000_000, bps: 50   }, // >$1M/day  → 0.5% (near-weightless)
  { threshold:   500_000, bps: 100  }, // >$500k/day → 1.0%
  { threshold:   100_000, bps: 150  }, // >$100k/day → 1.5%
];
const GRAVITY_FACTOR_DEFAULT_BPS = 200; // 2.0% — baseline before velocity unlocks

/** Minimum APY spread (%) warranting a sovereign vault migration. */
const REBALANCE_FRICTION_THRESHOLD = 1.0;

// Live DeFi Vault APY feed (in production: replaced by Chainlink Functions calls).
const VAULT_APY_SNAPSHOT = {
  AAVE_V3:    4.5,
  MORPHO_BLUE: 6.2,
  COMPOUND_V3: 3.8,
};

// ─── Butler ───────────────────────────────────────────────────────────────────

export const TreasuryButlerService = {

  /**
   * Computes the sovereign gravity factor for the current 24h protocol velocity.
   *
   * The gravity factor is the only fee the protocol collects from transaction volume.
   * To maintain the 0% freelancer-tax equilibrium: as volume grows, the butler
   * deflates the gravity factor, ensuring early-adopter fee compression is automatic
   * and not gate-kept by governance votes.
   *
   * @param   {number} velocity24hUSD  Rolling 24h protocol volume in USD.
   * @returns {object} gravityFactor (bps), deflationDelta, action string.
   */
  async computeGravityFactor(velocity24hUSD) {
    const tier = GRAVITY_FACTOR_TABLE.find(t => velocity24hUSD > t.threshold);
    const bps  = tier?.bps ?? GRAVITY_FACTOR_DEFAULT_BPS;
    const deflationDelta = GRAVITY_FACTOR_DEFAULT_BPS - bps;

    return {
      gravityFactor : `${(bps / 100).toFixed(2)}%`,
      bps,
      deflationDelta: `${(deflationDelta / 100).toFixed(2)}% compressed`,
      intent        : deflationDelta > 0 ? 'GRAVITY_DEFLATION_TRIGGER' : 'GRAVITY_STABLE',
    };
  },

  /**
   * Scans active DeFi vault APYs for a yield gap exceeding the friction threshold.
   *
   * If idle escrow capital is sitting in Aave at 4.5% while Morpho offers 6.2%,
   * the 1.7% gap represents "protocol gravity" — unnecessary yield friction that
   * penalizes users. The Butler's mandate is to eliminate this gap by actuating
   * a cross-vault sovereign migration before the next epoch.
   *
   * @param   {number} idleBalanceUSD  Escrow capital currently in the lowest-APY vault.
   * @returns {object} Migration intent or YIELD_STABLE status.
   */
  async detectYieldFriction(idleBalanceUSD) {
    const entries    = Object.entries(VAULT_APY_SNAPSHOT);
    const current    = entries.find(([k]) => k === 'AAVE_V3');
    const [bestKey, bestAPY] = entries.reduce((a, b) => b[1] > a[1] ? b : a);
    const frictionGap = bestAPY - current[1];

    if (frictionGap > REBALANCE_FRICTION_THRESHOLD) {
      const intent = {
        action         : 'SOVEREIGN_VAULT_MIGRATION',
        from           : 'AAVE_V3',
        to             : bestKey,
        frictionGap    : `${frictionGap.toFixed(2)}%`,
        projectedSurplus: `${(idleBalanceUSD * frictionGap / 100).toFixed(2)} USD/year`,
        rationale      : `To eliminate ${frictionGap.toFixed(2)}% yield friction from idle escrow capital and route the surplus to the Sovereign Safety Module.`,
      };

      await ReasoningProofService.logDecision('TreasuryButler.detectYieldFriction', intent, { idleBalanceUSD });
      return intent;
    }

    return { action: 'NONE', status: 'YIELD_HORIZON_STABLE' };
  },

  /**
   * Actuates an autonomous cross-vault migration for idle sovereign escrow capital.
   *
   * This is the execution layer. The Butler has already detected friction via
   * detectYieldFriction(). This method constructs the rebalance intent and commits
   * it to the ReasoningProof ledger for Governance auditability.
   *
   * @param   {string} token        ERC-20 asset address.
   * @param   {number} amount       Units of token to migrate.
   * @param   {string} fromStrategy Current vault (e.g., 'AAVE_V3').
   * @param   {string} toStrategy   Target vault (e.g., 'MORPHO_BLUE').
   */
  async actuateRebalance(token, amount, fromStrategy, toStrategy) {
    const intent = {
      status  : 'SOVEREIGN_REBALANCE_ACTUATED',
      from    : fromStrategy,
      to      : toStrategy,
      amount,
      token,
      rationale: `Migrating ${amount} units from ${fromStrategy} to ${toStrategy} to neutralize yield friction and maximise Sovereign Surplus capture.`,
    };

    await ReasoningProofService.logDecision('TreasuryButler.actuateRebalance', intent, { token, amount, fromStrategy, toStrategy });

    return { ...intent, timestamp: Date.now() };
  },

  /**
   * Propagates the computed gravity factor to the on-chain FreelanceEscrow via AGENT_ROLE.
   *
   * In Phase 2 (Autonomous Intelligence), this is triggered automatically when
   * volume crosses a tier boundary. The Escrow contract's `setFee()` call is
   * signed by the AGA's session key — zero user friction, full on-chain auditability.
   *
   * @param   {number} velocity24hUSD  Rolling 24h volume to compute the gravity factor from.
   */
  async propagateGravityFactor(velocity24hUSD) {
    const { gravityFactor, bps, deflationDelta, intent } = await this.computeGravityFactor(velocity24hUSD);

    const proof = {
      status       : 'GRAVITY_FACTOR_SYNCHRONIZED',
      bps,
      gravityFactor,
      deflationDelta,
      intent,
      rationale    : `Gravity factor compressed to ${gravityFactor} (${bps} bps). ${deflationDelta} of extractive surface eliminated from the protocol.`,
    };

    await ReasoningProofService.logDecision('TreasuryButler.propagateGravityFactor', proof, { velocity24hUSD });

    return { ...proof, timestamp: Date.now() };
  },
};
