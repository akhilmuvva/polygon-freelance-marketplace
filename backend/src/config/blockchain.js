import { createPublicClient, http } from 'viem';
import { polygonAmoy } from 'viem/chains';
import dotenv from 'dotenv';

// Ensure env vars are loaded
dotenv.config();

const DEFAULT_RPC = 'https://polygon-amoy.g.alchemy.com/v2/xd727FUEtN2c-SPI_yo3B';

export const publicClient = createPublicClient({
    chain: polygonAmoy,
    transport: http(process.env.RPC_URL || DEFAULT_RPC)
});

/**
 * Diagnostic helper to test blockchain connectivity
 */
export async function testBlockchainConnection(logger) {
    try {
        const block = await publicClient.getBlockNumber();
        if (logger) logger.success(`Blockchain connection verified. Current block: ${block}`, 'SYNC');
        return block;
    } catch (error) {
        if (logger) logger.error(`BLOCKCHAIN CONNECTION FAILED. Using RPC: ${process.env.RPC_URL || DEFAULT_RPC}`, 'SYNC', error);
        throw error;
    }
}
