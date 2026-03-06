import CeramicService from './CeramicService';
import ReasoningProofService from './ReasoningProofService';

export const GhostModeratorService = {
    // Shared ZK-Identity Root Tracker (Simulation)
    identityRootMap: new Map(), // root -> [{address, ens}]

    /**
     * Verify ZK-Personhood (WorldID mock) and maintain the Reputation Graph.
     * @param {string} address - User's Ethereum address.
     * @param {Object} proof - ZK-proof data from WorldID or Oasis Sapphire.
     */
    async verifyAndHydrate(address, proof, ens = null) {
        console.log(`[GHOST] Verifying ZK-Personhood for:`, address);

        // 1. Check for Sybil Attack (Same ZK-Identity root, different ENS/Address)
        if (proof && proof.identityRoot) {
            const isSybil = await this.detectSybilAttack(address, proof.identityRoot, ens);
            if (isSybil) {
                await this.shadowBan(address, 'SYBIL_DETECTED_SAME_ROOT');
                return { verified: false, status: 'SHADOW_BANNED', reason: 'SYBIL_ATTACK' };
            }
        }

        // Mocking ZK-Proof validation
        const isValid = proof && proof.nullifierHash && proof.merkleRoot;
        const isBot = !isValid || proof.reputation < 0;

        if (isBot) {
            console.warn(`[GHOST] Bot identity detected! Updating Ceramic stream...`);
            await this.shadowBan(address, 'BOT_DETECTION_ZK_FAILURE');
            return { verified: false, status: 'SHADOW_BANNED' };
        }

        return { verified: true, status: 'PIONEER_VERIFIED' };
    },

    /**
     * Detects Sybil attacks by checking if the same ZK-Identity root is used across 3+ addresses.
     */
    async detectSybilAttack(address, root, ens) {
        const users = this.identityRootMap.get(root) || [];

        // Add current user if not present
        if (!users.some(u => u.address === address)) {
            users.push({ address, ens });
            this.identityRootMap.set(root, users);
        }

        // Feature: 3 accounts per root = Sybil Threshold
        if (users.length >= 3) {
            console.error(`[GHOST] SYBIL THRESHOLD REACHED: Root ${root} is mapping to ${users.length} unique ENS/Addresses.`);
            return true;
        }
        return false;
    },

    /**
     * Update the user's sovereign Ceramic stream to "Hidden."
     * This removes them from the frontend board without a centralized ban.
     */
    async shadowBan(address, reason) {
        const stream = await CeramicService.getProfile(address);

        const decision = {
            action: 'SHADOW_BAN',
            address,
            reason,
            visibility: 'Hidden'
        };

        // Anchor reasoning in AGA_AUDIT_STREAM
        await ReasoningProofService.logDecision('GhostModerator', decision, { address, reason });

        if (stream) {
            await CeramicService.updateSovereignProfile(address, {
                ...stream,
                visibility: 'Hidden',
                isShadowBanned: true,
                banTimestamp: Date.now()
            });
            console.log(`[GHOST] Profile for ${address} is now 'Weightless-Hidden' on Ceramic.`);
        }
    }
};
