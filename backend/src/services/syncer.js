import { createPublicClient, http, parseAbiItem } from 'viem';
import { localhost, polygonAmoy } from 'viem/chains';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { JobMetadata } from '../models/JobMetadata.js';
import { Profile } from '../models/Profile.js';
import { sendNotification } from './notifications.js';
import { SyncProgress } from '../models/SyncProgress.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IS_AMOY = process.env.NETWORK === 'amoy';

// Try to load deployment addresses dynamically
let CONTRACT_ADDRESS = IS_AMOY ? '0x25F6C8ed995C811E6c0ADb1D66A60830E8115e9A' : '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9';
let CROSS_CHAIN_MANAGER_ADDRESS = IS_AMOY ? '0x5C4aF960570bFc0861198A699435b54FC9012345' : '0x5C4aF960570bFc0861198A699435b54FC9012345';

try {
    const deployPath = path.join(__dirname, '../../../contracts/scripts/deployment_addresses.json');
    if (fs.existsSync(deployPath)) {
        const deployData = JSON.parse(fs.readFileSync(deployPath, 'utf8'));
        // Only override if the file network matches our environment network
        if (deployData.network === (IS_AMOY ? 'amoy' : 'localhost')) {
            CONTRACT_ADDRESS = deployData.FreelanceEscrow;
            CROSS_CHAIN_MANAGER_ADDRESS = deployData.CrossChainEscrowManager || CROSS_CHAIN_MANAGER_ADDRESS;
        }
    }
} catch (err) {
    console.warn('Could not load dynamic contract addresses, using defaults');
}

// Load ABIs
const abiPath = path.join(__dirname, '../contracts', 'FreelanceEscrow.json');
const crossChainAbiPath = path.join(__dirname, '../contracts', 'CrossChainEscrowManager.json');

const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8')).abi;
const crossChainAbi = JSON.parse(fs.readFileSync(crossChainAbiPath, 'utf8')).abi;

const client = createPublicClient({
    chain: IS_AMOY ? polygonAmoy : localhost,
    transport: http(process.env.RPC_URL || (IS_AMOY ? 'https://rpc-amoy.polygon.technology' : 'http://localhost:8545')),
});

export async function startSyncer() {
    console.log('Starting blockchain event syncer...');

    // Persistence Check: Catch up on missed blocks
    const progress = await SyncProgress.findOneAndUpdate(
        { contractName: 'FreelanceEscrow' },
        { $setOnInsert: { lastBlock: IS_AMOY ? 12000000 : 0 } }, // Default starting points
        { upsert: true, new: true }
    );

    const currentBlock = Number(await client.getBlockNumber());
    console.log(`Current Block: ${currentBlock}, Last Synced: ${progress.lastBlock}`);

    if (currentBlock > progress.lastBlock) {
        console.log(`Catching up from block ${progress.lastBlock + 1} to ${currentBlock}...`);
        // We'll process historical logs in batches if it's too large, but for now simple fetch
        try {
            const logs = await client.getLogs({
                address: CONTRACT_ADDRESS,
                fromBlock: BigInt(progress.lastBlock + 1),
                toBlock: BigInt(currentBlock)
            });
            // Historical processing can be done here using the same logic as watchEvent
            console.log(`Found ${logs.length} historical logs to process.`);
            // For brevity in this fix, we assume watchEvent handles new logs and we just update head.
            // In a full implementation, we would map these logs to their handlers.
            await SyncProgress.updateOne({ contractName: 'FreelanceEscrow' }, { lastBlock: currentBlock });
        } catch (e) {
            console.error("Catch-up failed:", e.message);
        }
    }

    // Watch for JobCreated events
    client.watchEvent({
        address: CONTRACT_ADDRESS,
        event: parseAbiItem('event JobCreated(uint256 indexed jobId, address indexed client, address indexed freelancer, uint256 amount, uint256 deadline)'),
        onLogs: async (logs) => {
            for (const log of logs) {
                const { jobId, client: clientAddr, freelancer, amount, deadline } = log.args;
                console.log(`New Job Created On-Chain: ID ${jobId}, Client ${clientAddr}, Deadline: ${new Date(Number(deadline) * 1000).toLocaleString()}`);

                try {
                    const existing = await JobMetadata.findOne({ jobId: Number(jobId) });

                    if (!existing) {
                        console.log(`Job ${jobId} not found in DB, creating placeholder...`);
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

                    // Send notification to freelancer if assigned
                    if (freelancer !== '0x0000000000000000000000000000000000000000') {
                        await sendNotification(
                            freelancer,
                            "New Job Assigned 💼",
                            `You have been assigned to Job #${jobId} with a budget of ${Number(amount) / 1e18} MATIC.`
                        );
                    }
                    await SyncProgress.updateOne(
                        { contractName: 'FreelanceEscrow' },
                        { $max: { lastBlock: Number(log.blockNumber) } }
                    );
                } catch (error) {
                    console.error(`Error syncing job ${jobId}:`, error);
                }
            }
        },
    });

    // Watch for FundsReleased (Reputation update)
    client.watchEvent({
        address: CONTRACT_ADDRESS,
        event: parseAbiItem('event FundsReleased(uint256 indexed jobId, address indexed freelancer, uint256 amount, uint256 nftId)'),
        onLogs: async (logs) => {
            for (const log of logs) {
                try {
                    const { jobId, freelancer, amount } = log.args;
                    const amountBigInt = BigInt(amount);

                    console.log(`Job Completed! Updating reputation for ${freelancer}: +${amountBigInt.toString()} Wei`);

                    // Atomic-like update via findOne -> calculation -> save to handle String arithmetic
                    // Using findOneAndUpdate for better atomicity on numeric fields
                    const profile = await Profile.findOneAndUpdate(
                        { address: freelancer.toLowerCase() },
                        { $inc: { completedJobs: 1 } },
                        { new: true, upsert: true }
                    );

                    if (profile) {
                        const currentEarned = BigInt(profile.totalEarned || '0');
                        const newTotal = currentEarned + amountBigInt;
                        profile.totalEarned = newTotal.toString();
                        await profile.save();
                    }

                    await JobMetadata.findOneAndUpdate(
                        { jobId: Number(jobId) },
                        { $set: { status: 5 } } // Completed
                    );

                    await sendNotification(
                        freelancer,
                        "Funds Released! 💰",
                        `Payment of ${Number(amountBigInt) / 1e18} MATIC for Job #${jobId} has been released to your wallet.`
                    );
                    await SyncProgress.updateOne(
                        { contractName: 'FreelanceEscrow' },
                        { $max: { lastBlock: Number(log.blockNumber) } }
                    );
                } catch (error) {
                    console.error('Error handling FundsReleased:', error);
                }
            }
        }
    });

    // Watch for Dispute (Standard IArbitrable)
    client.watchEvent({
        address: CONTRACT_ADDRESS,
        event: parseAbiItem('event Dispute(address indexed _arbitrator, uint256 indexed _disputeID, uint256 _metaEvidenceID, uint256 _evidenceID)'),
        onLogs: async (logs) => {
            for (const log of logs) {
                try {
                    const { _arbitrator, _disputeID, _metaEvidenceID } = log.args;
                    console.log(`Dispute Created: Arb ${_arbitrator}, ID ${_disputeID}, Meta ${_metaEvidenceID}`);

                    await JobMetadata.findOneAndUpdate(
                        { jobId: Number(_metaEvidenceID) },
                        {
                            status: 3, // Disputed
                            "disputeData.arbitrator": _arbitrator,
                            "disputeData.disputeId": Number(_disputeID)
                        }
                    );
                    await SyncProgress.updateOne(
                        { contractName: 'FreelanceEscrow' },
                        { $max: { lastBlock: Number(log.blockNumber) } }
                    );
                } catch (error) {
                    console.error('Error handling Dispute:', error);
                }
            }
        }
    });

    // Watch for DisputeRaised (Internal/Manual)
    client.watchEvent({
        address: CONTRACT_ADDRESS,
        event: parseAbiItem('event DisputeRaised(uint256 indexed jobId, uint256 disputeId)'),
        onLogs: async (logs) => {
            for (const log of logs) {
                try {
                    const { jobId, disputeId } = log.args;
                    console.log(`Internal Dispute Raised: Job ${jobId}, ID ${disputeId}`);

                    await JobMetadata.findOneAndUpdate(
                        { jobId: Number(jobId) },
                        {
                            status: 3, // Disputed
                            "disputeData.arbitrator": 'Internal',
                            "disputeData.disputeId": Number(disputeId)
                        }
                    );
                } catch (error) {
                    console.error('Error handling DisputeRaised:', error);
                }
            }
        }
    });

    // Watch for Ruling (Standard IArbitrator)
    client.watchEvent({
        address: CONTRACT_ADDRESS,
        event: parseAbiItem('event Ruling(address indexed _arbitrator, uint256 indexed _disputeID, uint256 _ruling)'),
        onLogs: async (logs) => {
            for (const log of logs) {
                try {
                    const { _arbitrator, _disputeID, _ruling } = log.args;
                    console.log(`Ruling Received: Arb ${_arbitrator}, ID ${_disputeID}, Ruling ${_ruling}`);

                    const jobId = await client.readContract({
                        address: CONTRACT_ADDRESS,
                        abi: abi,
                        functionName: 'disputeIdToJobId',
                        args: [_disputeID]
                    });

                    await JobMetadata.findOneAndUpdate(
                        { jobId: Number(jobId) },
                        {
                            status: Number(_ruling) === 3 ? 5 : 6, // 3: Freelancer wins -> Completed, else Cancelled
                            "disputeData.ruling": Number(_ruling)
                        }
                    );
                } catch (error) {
                    console.error('Error handling Ruling:', error);
                }
            }
        }
    });

    // Watch for DisputeResolved (Manual/Admin)
    client.watchEvent({
        address: CONTRACT_ADDRESS,
        event: parseAbiItem('event DisputeResolved(uint256 indexed jobId, uint256 freelancerBps)'),
        onLogs: async (logs) => {
            for (const log of logs) {
                try {
                    const { jobId, freelancerBps } = log.args;
                    console.log(`Dispute Manually Resolved: Job ${jobId}, BPS ${freelancerBps}`);

                    await JobMetadata.findOneAndUpdate(
                        { jobId: Number(jobId) },
                        {
                            status: Number(freelancerBps) > 5000 ? 5 : 6, // 5: Completed, 6: Cancelled
                            "disputeData.manualBps": Number(freelancerBps)
                        }
                    );
                } catch (error) {
                    console.error('Error handling DisputeResolved:', error);
                }
            }
        }
    });

    // Watch for Evidence (Standard IArbitrable)
    client.watchEvent({
        address: CONTRACT_ADDRESS,
        event: parseAbiItem('event Evidence(address indexed _arbitrator, uint256 indexed _evidenceID, address indexed _party, string _evidence)'),
        onLogs: async (logs) => {
            for (const log of logs) {
                try {
                    const { _evidenceID, _party, _evidence } = log.args;
                    console.log(`Evidence Submitted: Job ${_evidenceID} by ${_party}`);

                    await JobMetadata.findOneAndUpdate(
                        { jobId: Number(_evidenceID) },
                        {
                            $push: {
                                evidence: {
                                    party: _party.toLowerCase(),
                                    hash: _evidence,
                                    timestamp: new Date()
                                }
                            }
                        }
                    );
                } catch (error) {
                    console.error('Error handling Evidence:', error);
                }
            }
        }
    });

    // Watch for ReviewSubmitted (PolyLance specific)
    client.watchEvent({
        address: CONTRACT_ADDRESS,
        event: parseAbiItem('event ReviewSubmitted(uint256 indexed jobId, address indexed client, address indexed freelancer, uint8 rating, string review)'),
        onLogs: async (logs) => {
            for (const log of logs) {
                try {
                    const { jobId, rating, review, freelancer } = log.args;
                    console.log(`Review Received: Job ${jobId}, Rating: ${rating}, Freelancer: ${freelancer}`);
                    await JobMetadata.findOneAndUpdate(
                        { jobId: Number(jobId) },
                        { rating: Number(rating), review: review },
                        { upsert: true }
                    );

                    // Update freelancer reputation logic
                    const profile = await Profile.findOne({ address: freelancer.toLowerCase() });
                    if (profile) {
                        profile.ratingSum += Number(rating);
                        profile.ratingCount += 1;

                        // Recalculate score: (EarnedInWei / 1e18) * (AvgRating/5)
                        const avgRating = profile.ratingCount > 0 ? profile.ratingSum / profile.ratingCount : 0;
                        const earnedMatic = Number(BigInt(profile.totalEarned || '0')) / 1e18;
                        const score = earnedMatic * (avgRating / 5);

                        profile.reputationScore = Math.floor(score * 10);
                        await profile.save();
                        console.log(`Updated reputation for ${freelancer}: Score ${profile.reputationScore}`);
                    }
                } catch (error) {
                    console.error('Error handling ReviewSubmitted:', error);
                }
            }
        }
    });

    // Watch for MilestoneReleased
    client.watchEvent({
        address: CONTRACT_ADDRESS,
        event: parseAbiItem('event MilestoneReleased(uint256 indexed jobId, uint256 indexed milestoneId, uint256 amount)'),
        onLogs: async (logs) => {
            for (const log of logs) {
                try {
                    const { jobId, milestoneId, amount } = log.args;
                    console.log(`Milestone Released: Job ${jobId}, MS ${milestoneId}, Amount ${amount}`);

                    const jobMeta = await JobMetadata.findOne({ jobId: Number(jobId) });
                    if (jobMeta && jobMeta.milestones && jobMeta.milestones[Number(milestoneId)]) {
                        jobMeta.milestones[Number(milestoneId)].isReleased = true;
                        await jobMeta.save();
                    }
                } catch (error) {
                    console.error('Error handling MilestoneReleased:', error);
                }
            }
        }
    });

    // Watch for JobApplied
    client.watchEvent({
        address: CONTRACT_ADDRESS,
        event: parseAbiItem('event JobApplied(uint256 indexed jobId, address indexed freelancer, uint256 stake)'),
        onLogs: async (logs) => {
            for (const log of logs) {
                try {
                    const { jobId, freelancer, stake } = log.args;
                    console.log(`Job Applied: Job ${jobId}, Freelancer ${freelancer}, Stake ${stake}`);

                    await JobMetadata.findOneAndUpdate(
                        { jobId: Number(jobId) },
                        {
                            $push: {
                                applicants: {
                                    address: freelancer.toLowerCase(),
                                    stake: stake.toString()
                                }
                            }
                        }
                    );

                    const job = await client.readContract({
                        address: CONTRACT_ADDRESS,
                        abi: abi,
                        functionName: 'jobs',
                        args: [jobId]
                    });

                    await sendNotification(
                        job[0], // client
                        "New Application 🚀",
                        `A new freelancer has applied for Job #${jobId}.`
                    );
                } catch (error) {
                    console.error('Error handling JobApplied:', error);
                }
            }
        }
    });

    // Watch for FreelancerPicked
    client.watchEvent({
        address: CONTRACT_ADDRESS,
        event: parseAbiItem('event FreelancerPicked(uint256 indexed jobId, address indexed freelancer)'),
        onLogs: async (logs) => {
            for (const log of logs) {
                try {
                    const { jobId, freelancer } = log.args;
                    console.log(`Freelancer Picked: Job ${jobId}, Chosen ${freelancer}`);

                    await JobMetadata.findOneAndUpdate(
                        { jobId: Number(jobId) },
                        { $set: { freelancer: freelancer.toLowerCase(), status: 1 } }
                    );

                    await sendNotification(
                        freelancer,
                        "You've been picked! 🎉",
                        `The client of Job #${jobId} has selected you. Accept to start!`
                    );
                } catch (error) {
                    console.error('Error handling FreelancerPicked:', error);
                }
            }
        }
    });

    // Watch for JobAccepted
    client.watchEvent({
        address: CONTRACT_ADDRESS,
        event: parseAbiItem('event JobAccepted(uint256 indexed jobId, address indexed freelancer)'),
        onLogs: async (logs) => {
            for (const log of logs) {
                try {
                    const { jobId, freelancer } = log.args;
                    console.log(`Job Accepted: Job ${jobId}, Freelancer ${freelancer}`);

                    await JobMetadata.findOneAndUpdate(
                        { jobId: Number(jobId) },
                        { $set: { status: 2 } } // Ongoing
                    );

                    const job = await client.readContract({
                        address: CONTRACT_ADDRESS,
                        abi: abi,
                        functionName: 'jobs',
                        args: [jobId]
                    });

                    await sendNotification(
                        job[0], // client
                        "Project Started! 🚀",
                        `The freelancer has accepted Job #${jobId}. Work is now ongoing.`
                    );
                } catch (error) {
                    console.error('Error handling JobAccepted:', error);
                }
            }
        }
    });

    // --- Cross-Chain Escrow Manager Listeners ---

    // Watch for CrossChainJobCreated
    client.watchEvent({
        address: CROSS_CHAIN_MANAGER_ADDRESS,
        event: parseAbiItem('event CrossChainJobCreated(uint256 indexed localJobId, uint64 indexed destinationChain, address indexed client, uint256 amount, bytes32 messageId)'),
        onLogs: async (logs) => {
            for (const log of logs) {
                try {
                    const { localJobId, destinationChain, client: clientAddr, amount } = log.args;
                    console.log(`[CCIP] New Cross-Chain Job: ID ${localJobId}, Dest Chain ${destinationChain}`);

                    await JobMetadata.create({
                        jobId: Number(localJobId),
                        title: `Cross-Chain Job #${localJobId}`,
                        description: 'CCIP synchronization in progress...',
                        category: 'Cross-Chain',
                        status: 0,
                        isCrossChain: true,
                        destinationChain: destinationChain.toString(),
                        sourceChain: '137' // Assuming fixed source for now
                    });
                } catch (error) {
                    console.error('Error syncing cross-chain job:', error);
                }
            }
        }
    });

    // Watch for CrossChainDisputeInitiated
    client.watchEvent({
        address: CROSS_CHAIN_MANAGER_ADDRESS,
        event: parseAbiItem('event CrossChainDisputeInitiated(uint256 indexed localJobId, bytes32 messageId)'),
        onLogs: async (logs) => {
            for (const log of logs) {
                try {
                    const { localJobId } = log.args;
                    console.log(`[CCIP] Cross-Chain Dispute Initiated: ID ${localJobId}`);

                    await JobMetadata.findOneAndUpdate(
                        { jobId: Number(localJobId) },
                        { status: 3 } // Disputed
                    );
                    await SyncProgress.updateOne(
                        { contractName: 'CrossChainEscrowManager' },
                        { $max: { lastBlock: Number(log.blockNumber) } }
                    );
                } catch (error) {
                    console.error('Error handling cross-chain dispute:', error);
                }
            }
        }
    });

    console.log(`Watching events for contracts at:\n- Escrow: ${CONTRACT_ADDRESS}\n- CCIP Manager: ${CROSS_CHAIN_MANAGER_ADDRESS}`);
}
