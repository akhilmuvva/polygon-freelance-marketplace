import StorageService from './StorageService';

/**
 * ReasoningProofService: Ensures AGA DAO auditability.
 * Logs decisions as hashed "Reasoning Proofs" on IPFS.
 */
export const ReasoningProofService = {
    /**
     * Uploads the reasoning behind an autonomous decision to IPFS.
     * @param {string} agent - The sub-agent (Stabilizer, Butler, etc).
     * @param {Object} decision - Precise details of the action taken.
     * @param {Object} data - Sensory inputs used for the logic.
     */
    async logDecision(agent, decision, data) {
        const payload = {
            version: "AGA-1.0",
            timestamp: new Date().toISOString(),
            agent,
            decision,
            sensoryInputs: data,
            protocol: 'PolyLance Zenith'
        };

        console.log(`[AGA-AUDIT] Generating Reasoning Proof for ${agent}...`);

        try {
            // Upload to decentralized storage
            const result = await StorageService.uploadMetadata(payload);
            console.log(`[AGA-AUDIT] Decision proof anchored at: ipfs://${result.cid}`);
            return result.cid;
        } catch (err) {
            console.error('[AGA-AUDIT] Audit log failed:', err);
            return null;
        }
    }
};

export default ReasoningProofService;
