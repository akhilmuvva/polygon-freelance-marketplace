import { parseAbiItem, decodeEventLog } from 'viem';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { JobMetadata } from '../models/JobMetadata.js';
import { Profile } from '../models/Profile.js';
import { sendNotification } from './notifications.js';
import { SyncProgress } from '../models/SyncProgress.js';
import { logger } from '../utils/logger.js';
import { publicClient as client } from '../config/blockchain.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IS_AMOY = process.env.NETWORK === 'amoy';
const CHUNK_SIZE = 10; // Reduced for CCIP Manager compatibility
const DEPLOY_BLOCK = BigInt(process.env.CONTRACT_DEPLOY_BLOCK || (IS_AMOY ? '34230000' : '0'));

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Try to load deployment addresses dynamically
let CONTRACT_ADDRESS = IS_AMOY ? '0x25F6C8ed995C811E6c0ADb1D66A60830E8115e9A' : '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9';
let CROSS_CHAIN_MANAGER_ADDRESS = IS_AMOY ? '0x5C4aF960570bFc0861198A699435b54FC9012345' : '0x5C4aF960570bFc0861198A699435b54FC9012345';

try {
    const deployPath = path.join(__dirname, '../../../contracts/scripts/deployment_addresses.json');
    if (fs.existsSync(deployPath)) {
        const deployData = JSON.parse(fs.readFileSync(deployPath, 'utf8'));
        if (deployData.network === (IS_AMOY ? 'amoy' : 'localhost')) {
            CONTRACT_ADDRESS = deployData.FreelanceEscrow;
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
    JobApplied: parseAbiItem('event JobApplied(uint256 indexed jobId, address indexed freelancer, uint256 stake)'),
    FreelancerPicked: parseAbiItem('event FreelancerPicked(uint256 indexed jobId, address indexed freelancer)'),
    JobAccepted: parseAbiItem('event JobAccepted(uint256 indexed jobId, address indexed freelancer)'),
};

const CROSS_CHAIN_EVENTS = {
    CrossChainJobCreated: parseAbiItem('event CrossChainJobCreated(uint256 indexed localJobId, uint64 indexed destinationChain, address indexed client, uint256 amount, bytes32 messageId)'),
    CrossChainDisputeInitiated: parseAbiItem('event CrossChainDisputeInitiated(uint256 indexed localJobId, bytes32 messageId)'),
};

// Event Handlers
const handlers = {
    JobCreated: async (args) => {
        const { jobId, client: clientAddr, freelancer, amount, deadline } = args;
        const existing = await JobMetadata.findOne({ jobId: Number(jobId) });
        if (!existing) {
            await JobMetadata.create({
                jobId: Number(jobId),
                title: `Job #${jobId} (On-chain)`,
                description: 'Metadata sync pending...',
                category: 'General',
                client: clientAddr.toLowerCase(),
                amount: amount.toString(),
                deadline: Number(deadline),
                freelancer: freelancer === '0x0000000000000000000000000000000000000000' ? null : freelancer.toLowerCase(),
                status: freelancer === '0x0000000000000000000000000000000000000000' ? 0 : 1
            });
        }
        if (freelancer !== '0x0000000000000000000000000000000000000000') {
            await sendNotification(freelancer, "New Job Assigned 💼", `You have been assigned to Job #${jobId}.`);
        }
    },
    FundsReleased: async (args) => {
        const { jobId, freelancer, amount } = args;
        const amountBigInt = BigInt(amount);
        const profile = await Profile.findOneAndUpdate(
            { address: freelancer.toLowerCase() },
            { $inc: { completedJobs: 1 } },
            { new: true, upsert: true }
        );
        if (profile) {
            profile.totalEarned = (BigInt(profile.totalEarned || '0') + amountBigInt).toString();
            await profile.save();
        }
        await JobMetadata.findOneAndUpdate({ jobId: Number(jobId) }, { $set: { status: 5 } });
        await sendNotification(freelancer, "Funds Released! 💰", `Payment for Job #${jobId} has been released.`);
    },
    Dispute: async (args) => {
        const { _arbitrator, _disputeID, _metaEvidenceID } = args;
        await JobMetadata.findOneAndUpdate({ jobId: Number(_metaEvidenceID) }, {
            status: 3,
            "disputeData.arbitrator": _arbitrator,
            "disputeData.disputeId": Number(_disputeID)
        });
    },
    DisputeRaised: async (args) => {
        const { jobId, disputeId } = args;
        await JobMetadata.findOneAndUpdate({ jobId: Number(jobId) }, {
            status: 3,
            "disputeData.arbitrator": 'Internal',
            "disputeData.disputeId": Number(disputeId)
        });
    },
    Ruling: async (args) => {
        const { _disputeID, _ruling } = args;
        const jobId = await client.readContract({
            address: CONTRACT_ADDRESS,
            abi: abi,
            functionName: 'disputeIdToJobId',
            args: [_disputeID]
        });
        await JobMetadata.findOneAndUpdate({ jobId: Number(jobId) }, {
            status: Number(_ruling) === 3 ? 5 : 6,
            "disputeData.ruling": Number(_ruling)
        });
    },
    DisputeResolved: async (args) => {
        const { jobId, freelancerBps } = args;
        await JobMetadata.findOneAndUpdate({ jobId: Number(jobId) }, {
            status: Number(freelancerBps) > 5000 ? 5 : 6,
            "disputeData.manualBps": Number(freelancerBps)
        });
    },
    Evidence: async (args) => {
        const { _evidenceID, _party, _evidence } = args;
        await JobMetadata.findOneAndUpdate({ jobId: Number(_evidenceID) }, {
            $push: { evidence: { party: _party.toLowerCase(), hash: _evidence, timestamp: new Date() } }
        });
    },
    ReviewSubmitted: async (args) => {
        const { jobId, rating, review, freelancer } = args;
        await JobMetadata.findOneAndUpdate({ jobId: Number(jobId) }, { rating: Number(rating), review: review }, { upsert: true });
        const profile = await Profile.findOne({ address: freelancer.toLowerCase() });
        if (profile) {
            profile.ratingSum += Number(rating);
            profile.ratingCount += 1;
            const avgRating = profile.ratingSum / profile.ratingCount;
            const earnedMatic = Number(BigInt(profile.totalEarned || '0')) / 1e18;
            profile.reputationScore = Math.floor(earnedMatic * (avgRating / 5) * 10);
            await profile.save();
        }
    },
    MilestoneReleased: async (args) => {
        const { jobId, milestoneId } = args;
        const job = await JobMetadata.findOne({ jobId: Number(jobId) });
        if (job && job.milestones && job.milestones[Number(milestoneId)]) {
            job.milestones[Number(milestoneId)].isReleased = true;
            await job.save();
        }
    },
    JobApplied: async (args) => {
        const { jobId, freelancer, stake } = args;
        await JobMetadata.findOneAndUpdate({ jobId: Number(jobId) }, {
            $push: { applicants: { address: freelancer.toLowerCase(), stake: stake.toString() } }
        });
        const jobOnChain = await client.readContract({ address: CONTRACT_ADDRESS, abi, functionName: 'jobs', args: [jobId] });
        await sendNotification(jobOnChain[0], "New Application 🚀", `A freelancer applied for Job #${jobId}.`);
    },
    FreelancerPicked: async (args) => {
        const { jobId, freelancer } = args;
        await JobMetadata.findOneAndUpdate({ jobId: Number(jobId) }, { $set: { freelancer: freelancer.toLowerCase(), status: 1 } });
        await sendNotification(freelancer, "You've been picked! 🎉", `Selected for Job #${jobId}.`);
    },
    JobAccepted: async (args) => {
        const { jobId, freelancer } = args;
        await JobMetadata.findOneAndUpdate({ jobId: Number(jobId) }, { $set: { status: 2 } });
        const jobOnChain = await client.readContract({ address: CONTRACT_ADDRESS, abi, functionName: 'jobs', args: [jobId] });
        await sendNotification(jobOnChain[0], "Project Started! 🚀", `Job #${jobId} accepted.`);
    },
    CrossChainJobCreated: async (args) => {
        const { localJobId, destinationChain } = args;
        await JobMetadata.create({
            jobId: Number(localJobId),
            title: `Cross-Chain Job #${localJobId}`,
            description: 'CCIP synchronization...',
            category: 'Cross-Chain',
            status: 0,
            isCrossChain: true,
            destinationChain: destinationChain.toString(),
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
            await handler(log.args, log);
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

async function fetchLogsInChunks(contractAddress, targetAbi, startBlock, endBlock) {
    let current = startBlock;
    const MAX_GAP = 5000n;
    if (endBlock - current > MAX_GAP) {
        logger.warn(`Gap too large (${endBlock - current} blocks). Syncing only last ${MAX_GAP} blocks.`, 'SYNC');
        current = endBlock - MAX_GAP;
    }

    while (current <= endBlock) {
        const to = current + BigInt(CHUNK_SIZE - 1) > endBlock ? endBlock : current + BigInt(CHUNK_SIZE - 1);
        logger.sync(`[BC-SYNC]: Scanning ${contractAddress.slice(0, 8)}... (${current} to ${to})`);

        try {
            const logs = await client.getLogs({
                address: contractAddress,
                fromBlock: current,
                toBlock: to
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
        } catch (err) {
            if (err.status === 429) {
                logger.warn('Alchemy Rate Limited! Pausing 2s...', 'SYNC');
                await sleep(2000);
                continue; // Retry this chunk
            }
            logger.error(`Failed to fetch logs ${current}-${to}:`, 'SYNC', err);
        }
        current = to + 1n;
    }
}

export async function startSyncer() {
    logger.sync('Starting blockchain event syncer (Alchemy Optimized)...');

    // 1. Determine Starting Blocks
    const escrowProgress = await SyncProgress.findOne({ contractName: 'FreelanceEscrow' });
    const ccProgress = await SyncProgress.findOne({ contractName: 'CrossChainEscrowManager' });

    const escrowStart = escrowProgress ? BigInt(escrowProgress.lastBlock + 1) : DEPLOY_BLOCK;
    const ccStart = ccProgress ? BigInt(ccProgress.lastBlock + 1) : DEPLOY_BLOCK;

    const currentBlock = await client.getBlockNumber();

    // 2. Catch up in Chunks
    if (currentBlock >= escrowStart) {
        await fetchLogsInChunks(CONTRACT_ADDRESS, abi, escrowStart, currentBlock);
    }
    if (currentBlock >= ccStart) {
        await fetchLogsInChunks(CROSS_CHAIN_MANAGER_ADDRESS, crossChainAbi, ccStart, currentBlock);
    }

    // 3. Start Live Watchers
    for (const [name, event] of Object.entries(EVENTS)) {
        client.watchEvent({
            address: CONTRACT_ADDRESS,
            event: event,
            onLogs: (logs) => logs.forEach(log => processLog(log, name))
        });
    }

    for (const [name, event] of Object.entries(CROSS_CHAIN_EVENTS)) {
        client.watchEvent({
            address: CROSS_CHAIN_MANAGER_ADDRESS,
            event: event,
            onLogs: (logs) => logs.forEach(log => processLog(log, name))
        });
    }

    logger.success('Event syncer caught up and watching for live events.', 'SYNC');
}
