import { parseAbiItem, decodeEventLog } from 'viem';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { JobMetadata } from '../models/JobMetadata.js';
import { Profile } from '../models/Profile.js';
import { sendNotification } from './notifications.js';
import { SyncProgress } from '../models/SyncProgress.js';
import { BlockchainEvent } from '../models/BlockchainEvent.js';
import { logger } from '../utils/logger.js';
import { publicClient as client } from '../config/blockchain.js';

let ioInstance = null;

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IS_AMOY = process.env.NETWORK === 'amoy';
const CHUNK_SIZE = 10;
// Update START_BLOCK to actual deployment block (around 34230000)
const DEPLOY_BLOCK = BigInt(process.env.CONTRACT_DEPLOY_BLOCK || '34230000');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Updated default address for FreelanceEscrow
let CONTRACT_ADDRESS = IS_AMOY ? '0x38c76A767d45Fc390160449948aF80569E2C4217' : '0x38c76A767d45Fc390160449948aF80569E2C4217';
let CROSS_CHAIN_MANAGER_ADDRESS = IS_AMOY ? '0x5C4aF960570bFc0861198A699435b54FC9012345' : '0x5C4aF960570bFc0861198A699435b54FC9012345';

try {
    const deployPath = path.join(__dirname, '../../../contracts/scripts/deployment_addresses.json');
    if (fs.existsSync(deployPath)) {
        const deployData = JSON.parse(fs.readFileSync(deployPath, 'utf8'));
        if (deployData.network === (IS_AMOY ? 'amoy' : 'localhost')) {
            CONTRACT_ADDRESS = deployData.FreelanceEscrow || CONTRACT_ADDRESS;
            CROSS_CHAIN_MANAGER_ADDRESS = deployData.CrossChainEscrowManager || CROSS_CHAIN_MANAGER_ADDRESS;
        }
    }
} catch (err) {
    logger.warn('Could not load dynamic contract addresses, using defaults', 'SYNC');
}

// Load ABIs
const abiPath = path.join(__dirname, '../contracts', 'FreelanceEscrow.json');
const crossChainAbiPath = path.join(__dirname, '../contracts', 'CrossChainEscrowManager.json');
const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8')).abi;
const crossChainAbi = JSON.parse(fs.readFileSync(crossChainAbiPath, 'utf8')).abi;

// Event Definitions
const EVENTS = {
    JobCreated: parseAbiItem('event JobCreated(uint256 indexed jobId, address indexed client, address indexed freelancer, uint256 amount, uint256 deadline)'),
    FundsReleased: parseAbiItem('event FundsReleased(uint256 indexed jobId, address indexed freelancer, uint256 amount, uint256 nftId)'),
    Dispute: parseAbiItem('event Dispute(address indexed _arbitrator, uint256 indexed _disputeID, uint256 _metaEvidenceID, uint256 _evidenceID)'),
    DisputeRaised: parseAbiItem('event DisputeRaised(uint256 indexed jobId, uint256 disputeId)'),
    Ruling: parseAbiItem('event Ruling(address indexed _arbitrator, uint256 indexed _disputeID, uint256 _ruling)'),
    DisputeResolved: parseAbiItem('event DisputeResolved(uint256 indexed jobId, uint256 freelancerBps)'),
    Evidence: parseAbiItem('event Evidence(address indexed _arbitrator, uint256 indexed _evidenceID, address indexed _party, string _evidence)'),
    ReviewSubmitted: parseAbiItem('event ReviewSubmitted(uint256 indexed jobId, address indexed client, address indexed freelancer, uint8 rating, string review)'),
    MilestoneReleased: parseAbiItem('event MilestoneReleased(uint256 indexed jobId, uint256 indexed milestoneId, uint256 amount)'),
    ApplicationSubmitted: parseAbiItem('event ApplicationSubmitted(uint256 indexed jobId, address indexed applicant, uint256 stake)'),
    MilestoneCreated: parseAbiItem('event MilestoneCreated(uint256 indexed jobId, uint256 milestoneId, uint256 amount, string description)')
};

const CROSS_CHAIN_EVENTS = {
    CrossChainJobCreated: parseAbiItem('event CrossChainJobCreated(uint256 indexed localJobId, uint256 indexed remoteJobId, string destinationChain)'),
    CrossChainFundsReleased: parseAbiItem('event CrossChainFundsReleased(uint256 indexed localJobId, uint256 amount, string sourceChain)'),
    CrossChainDisputeInitiated: parseAbiItem('event CrossChainDisputeInitiated(uint256 indexed localJobId, uint256 disputeId, string sourceChain)')
};

const handlers = {
    JobCreated: async (args) => {
        const { jobId, client, freelancer, amount, deadline } = args;
        const job = await JobMetadata.findOneAndUpdate(
            { jobId: Number(jobId) },
            {
                client: client.toLowerCase(),
                freelancer: freelancer.toLowerCase(),
                amount: amount.toString(),
                deadline: Number(deadline),
                status: 1 // Active
            },
            { upsert: true, new: true }
        );

        if (!job.notified) {
            await sendNotification('Freelancer', freelancer, `New Job Created! ID: ${jobId}`, `/jobs/${jobId}`);
            await JobMetadata.updateOne({ jobId: Number(jobId) }, { notified: true });
        }
    },
    FundsReleased: async (args) => {
        const { jobId, freelancer, amount } = args;
        await JobMetadata.findOneAndUpdate({ jobId: Number(jobId) }, { status: 2 }); // Completed
        await Profile.findOneAndUpdate(
            { address: freelancer.toLowerCase() },
            { $inc: { totalEarned: Number(amount), completedJobs: 1 } },
            { upsert: true }
        );
    },
    Dispute: async (args) => {
        const { _disputeID } = args;
        await JobMetadata.findOneAndUpdate(
            { 'disputeData.disputeId': Number(_disputeID) },
            { status: 3 } // Disputed
        );
    },
    DisputeRaised: async (args) => {
        const { jobId, disputeId } = args;
        await JobMetadata.findOneAndUpdate(
            { jobId: Number(jobId) },
            {
                status: 3,
                'disputeData.disputeId': Number(disputeId)
            }
        );
    },
    DisputeResolved: async (args) => {
        const { jobId } = args;
        await JobMetadata.findOneAndUpdate({ jobId: Number(jobId) }, { status: 4 }); // Resolved
    },
    ReviewSubmitted: async (args) => {
        const { freelancer, rating } = args;
        await Profile.findOneAndUpdate(
            { address: freelancer.toLowerCase() },
            {
                $inc: { ratingSum: Number(rating), ratingCount: 1 },
                $set: { lastReviewAt: new Date() }
            },
            { upsert: true }
        );
    },
    MilestoneReleased: async (args) => {
        const { jobId, milestoneId } = args;
        await JobMetadata.updateOne(
            { jobId: Number(jobId), "milestones._id": milestoneId },
            { $set: { "milestones.$.isReleased": true } }
        );
    },
    ApplicationSubmitted: async (args) => {
        const { jobId, applicant, stake } = args;
        await JobMetadata.updateOne(
            { jobId: Number(jobId) },
            { $push: { applicants: { address: applicant.toLowerCase(), stake: stake.toString() } } }
        );
    },
    CrossChainJobCreated: async (args) => {
        const { localJobId, remoteJobId, destinationChain } = args;
        await JobMetadata.findOneAndUpdate({ jobId: Number(localJobId) }, {
            isCrossChain: true,
            destinationChain,
            'disputeData.disputeId': Number(remoteJobId) // Use remote ID for mapping
        });
    },
    CrossChainFundsReleased: async (args) => {
        const { localJobId } = args;
        await JobMetadata.findOneAndUpdate({ jobId: Number(localJobId) }, {
            status: 2,
            sourceChain: '137'
        });
    },
    CrossChainDisputeInitiated: async (args) => {
        const { localJobId } = args;
        await JobMetadata.findOneAndUpdate({ jobId: Number(localJobId) }, { status: 3 });
    }
};

async function processLog(log, eventName) {
    try {
        const handler = handlers[eventName];
        if (handler) {
            // Prevent duplicate notifications
            const eventId = `${log.transactionHash}_${log.logIndex}`;
            const existingEvent = await BlockchainEvent.findOne({ transactionHash: log.transactionHash, logIndex: log.logIndex });

            if (!existingEvent) {
                // Save the event as processed but not yet notified
                await BlockchainEvent.create({
                    transactionHash: log.transactionHash,
                    logIndex: log.logIndex,
                    eventName,
                    blockNumber: Number(log.blockNumber),
                    data: log.args,
                    notified: false
                });
            } else if (existingEvent.notified) {
                // If it was already notified, we only run the handler (internal state update) and return
                await handler(log.args, log);
                return;
            }

            // Run internal state handler (e.g., updating JobMetadata in MongoDB)
            await handler(log.args, log);

            // Emit real-time notification via Socket.io
            if (ioInstance) {
                ioInstance.emit('NEW_BLOCKCHAIN_EVENT', {
                    type: eventName,
                    data: log.args,
                    txHash: log.transactionHash,
                    block: Number(log.blockNumber)
                });
                logger.info(`Real-time event emitted: ${eventName}`, 'SOCKET');
            }

            // Mark as notified in DB
            await BlockchainEvent.updateOne(
                { transactionHash: log.transactionHash, logIndex: log.logIndex },
                { $set: { notified: true } }
            );

            await SyncProgress.updateOne(
                { contractName: log.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase() ? 'FreelanceEscrow' : 'CrossChainEscrowManager' },
                { $max: { lastBlock: Number(log.blockNumber) } },
                { upsert: true }
            );
        }
    } catch (err) {
        logger.error(`Error processing ${eventName} log:`, 'SYNC', err);
    }
}

async function fetchLogsInChunks(address, targetAbi, from, to, contractName) {
    let current = from;
    while (current <= to) {
        // Strictly inclusive of only 10 blocks (e.g., from to from + 9)
        let chunkTo = current + 9n;

        // Ensure toBlock never exceeds fromBlock + 9 and doesn't overshoot the final 'to' block
        if (chunkTo > to) chunkTo = to;

        logger.sync(`[BC-SYNC]: Scanning ${address.slice(0, 8)}... (${current} to ${chunkTo})`);

        try {
            const logs = await client.getLogs({
                address,
                fromBlock: current,
                toBlock: chunkTo
            });

            for (const log of logs) {
                try {
                    const decoded = decodeEventLog({
                        abi: targetAbi,
                        data: log.data,
                        topics: log.topics,
                    });
                    await processLog({ ...log, args: decoded.args }, decoded.eventName);
                } catch (e) {
                    // Skip logs that don't match target ABI
                }
            }

            // Fixed delay to respect Alchemy rate limits
            await sleep(250);

            // Advance progress even if no logs
            if (contractName) {
                await SyncProgress.updateOne(
                    { contractName },
                    { $max: { lastBlock: Number(chunkTo) } },
                    { upsert: true }
                );
            }
        } catch (err) {
            if (err.status === 429) {
                logger.warn('Alchemy Rate Limited! Pausing 2s...', 'SYNC');
                await sleep(2000);
                continue; // Retry this chunk
            }
            logger.error(`Failed to fetch logs ${current}-${chunkTo}:`, 'SYNC', err);
            await sleep(5000); // Wait before retrying same chunk
            continue;
        }
        current = chunkTo + 1n;
    }
}

export async function startSyncer(io) {
    ioInstance = io;
    logger.sync('Starting blockchain event syncer (Socket.io Enabled)...');

    // 1. Determine Starting Blocks
    const escrowProgress = await SyncProgress.findOne({ contractName: 'FreelanceEscrow' });
    const ccProgress = await SyncProgress.findOne({ contractName: 'CrossChainEscrowManager' });

    const escrowStart = escrowProgress ? BigInt(escrowProgress.lastBlock + 1) : DEPLOY_BLOCK;
    const ccStart = ccProgress ? BigInt(ccProgress.lastBlock + 1) : DEPLOY_BLOCK;

    const currentBlock = await client.getBlockNumber();

    // 2. Catch up in Chunks
    if (currentBlock >= escrowStart) {
        await fetchLogsInChunks(CONTRACT_ADDRESS, abi, escrowStart, currentBlock, 'FreelanceEscrow');
    }
    if (currentBlock >= ccStart) {
        await fetchLogsInChunks(CROSS_CHAIN_MANAGER_ADDRESS, crossChainAbi, ccStart, currentBlock, 'CrossChainEscrowManager');
    }

    // 3. Start Live Watchers
    for (const [name, event] of Object.entries(EVENTS)) {
        client.watchEvent({
            address: CONTRACT_ADDRESS,
            event: event,
            onLogs: (logs) => logs.forEach(log => processLog(log, name)),
            onError: (err) => logger.error(`Watcher error for ${name}:`, 'SYNC', err)
        });
    }

    for (const [name, event] of Object.entries(CROSS_CHAIN_EVENTS)) {
        client.watchEvent({
            address: CROSS_CHAIN_MANAGER_ADDRESS,
            event: event,
            onLogs: (logs) => logs.forEach(log => processLog(log, name)),
            onError: (err) => logger.error(`Watcher error for ${name}:`, 'SYNC', err)
        });
    }

    logger.success('Event syncer caught up and watching for live events.', 'SYNC');
}
