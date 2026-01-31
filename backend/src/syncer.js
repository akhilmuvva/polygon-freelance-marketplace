import { createPublicClient, http, parseAbiItem } from 'viem';
import { localhost } from 'viem/chains';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JobMetadata } from './models/JobMetadata.js';
import { Profile } from './models/Profile.js';
import { sendNotification } from './notifications.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load deployment address dynamically
let CONTRACT_ADDRESS = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9';
try {
    const deployPath = path.join(__dirname, '../../contracts/scripts/deployment_addresses.json');
    if (fs.existsSync(deployPath)) {
        const deployData = JSON.parse(fs.readFileSync(deployPath, 'utf8'));
        CONTRACT_ADDRESS = deployData.FreelanceEscrow;
    }
} catch (err) {
    console.warn('Could not load dynamic contract address, using default:', CONTRACT_ADDRESS);
}

// Load ABI
const abiPath = path.join(__dirname, 'contracts', 'FreelanceEscrow.json');
const contractData = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
const abi = contractData.abi;

const client = createPublicClient({
    chain: localhost,
    transport: http(),
});

export async function startSyncer() {
    console.log('Starting blockchain event syncer...');

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
                    const { freelancer, amount } = log.args;
                    const maticAmount = Number(amount) / 1e18;
                    console.log(`Job Completed! Updating reputation for ${freelancer}: +${maticAmount} MATIC`);

                    await Profile.findOneAndUpdate(
                        { address: freelancer.toLowerCase() },
                        {
                            $inc: { totalEarned: maticAmount, completedJobs: 1 }
                        },
                        { upsert: true, new: true }
                    );

                    await sendNotification(
                        freelancer,
                        "Funds Released! 💰",
                        `Payment of ${maticAmount} MATIC for Job #${jobId} has been released to your wallet.`
                    );
                } catch (error) {
                    console.error('Error handling FundsReleased:', error);
                }
            }
        }
    });

    // Watch for JobDisputed
    client.watchEvent({
        address: CONTRACT_ADDRESS,
        event: parseAbiItem('event JobDisputed(uint256 indexed jobId)'),
        onLogs: async (logs) => {
            for (const log of logs) {
                try {
                    const { jobId } = log.args;
                    console.log(`Dispute Signal: Job ${jobId} enters dispute phase.`);

                    const job = await client.readContract({
                        address: CONTRACT_ADDRESS,
                        abi: abi,
                        functionName: 'jobs',
                        args: [jobId]
                    });
                    const freelancer = job[2];
                    const clientAddress = job[1];

                    const profile = await Profile.findOne({ address: freelancer.toLowerCase() });
                    if (profile) {
                        profile.disputedJobs += 1;

                        const avgRating = profile.ratingCount > 0 ? profile.ratingSum / profile.ratingCount : 0;
                        const disputeRate = profile.completedJobs > 0 ? profile.disputedJobs / profile.completedJobs : 0;
                        const score = (profile.totalEarned) * (avgRating / 5) * (Math.max(0, 1 - disputeRate));
                        profile.reputationScore = Math.floor(score * 10);

                        await profile.save();
                        console.log(`Updated reputation for ${freelancer} (Dispute)`);

                        await sendNotification(
                            freelancer,
                            "Dispute Opened ⚖️",
                            `A dispute has been initiated for Job #${jobId}. Please check the platform for details.`
                        );
                        await sendNotification(
                            clientAddress,
                            "Dispute Opened ⚖️",
                            `An official dispute has been recorded for Job #${jobId}.`
                        );
                    }
                } catch (error) {
                    console.error('Error handling JobDisputed:', error);
                }
            }
        }
    });

    // Watch for ReviewSubmitted (PolyLance specific)
    client.watchEvent({
        address: CONTRACT_ADDRESS,
        event: parseAbiItem('event ReviewSubmitted(uint256 indexed jobId, address indexed reviewer, uint8 rating, string comment)'),
        onLogs: async (logs) => {
            for (const log of logs) {
                try {
                    const { jobId, rating, comment } = log.args;
                    console.log(`Review Received: Job ${jobId}, Rating: ${rating}`);
                    await JobMetadata.findOneAndUpdate(
                        { jobId: Number(jobId) },
                        { rating: Number(rating), review: comment },
                        { upsert: true }
                    );

                    // Update freelancer reputation logic
                    const job = await client.readContract({
                        address: CONTRACT_ADDRESS,
                        abi: abi,
                        functionName: 'jobs',
                        args: [jobId]
                    });
                    const freelancer = job[2];

                    const profile = await Profile.findOne({ address: freelancer.toLowerCase() });
                    if (profile) {
                        profile.ratingSum += Number(rating);
                        profile.ratingCount += 1;
                        // Recalculate score...
                        const avgRating = profile.ratingCount > 0 ? profile.ratingSum / profile.ratingCount : 0;
                        const score = (profile.totalEarned) * (avgRating / 5);
                        profile.reputationScore = Math.floor(score * 10);
                        await profile.save();
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

    console.log(`Watching events for contract at ${CONTRACT_ADDRESS}`);
}
