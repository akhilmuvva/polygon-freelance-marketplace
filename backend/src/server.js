import express from 'express';
import cors from 'cors';
import { verifyMessage, formatEther, createPublicClient, http, parseAbi } from 'viem';
import { polygonAmoy } from 'viem/chains';
// Syncer removed: Backend is now Stateless. Indexing is delegated to The Graph.
import { publicClient, testBlockchainConnection } from './config/blockchain.js';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import crypto from 'crypto';
import paymentRoutes from './routes/paymentRoutes.js';
import { SiweMessage } from 'siwe';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { uploadJSONToIPFS, uploadFileToIPFS } from './services/ipfs.js';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import hpp from 'hpp';
import { body, validationResult } from 'express-validator';
import { GDPRService } from './services/gdpr.js';
import selfsigned from 'selfsigned';
import { logger } from './utils/logger.js';

// Helper for Regex escaping
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function validateEnv() {
    logger.info('--- Environment Diagnostic ---', 'CONFIG');
    const critical = []; // No centralized DB required
    const gateway = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'GEMINI_API_KEY'];

    // Log presence
    logger.info(`MONGODB_URI: ${process.env.MONGODB_URI ? 'LOADED' : 'MISSING'}`, 'CONFIG');
    logger.info(`RAZORPAY: ${process.env.RAZORPAY_KEY_ID ? 'CONFIGURED' : 'NOT CONFIGURED'}`, 'CONFIG');
    logger.info(`RPC_URL: ${process.env.RPC_URL ? 'LOADED' : 'FALLBACK-READY'}`, 'CONFIG');

    const missingCritical = critical.filter(key => !process.env[key]);
    if (missingCritical.length > 0) {
        logger.error(`CRITICAL variables missing: ${missingCritical.join(', ')}`, 'CONFIG');
        if (process.env.NODE_ENV === 'production') {
            logger.error('Missing required variables in production. Exiting.', 'CONFIG');
            process.exit(1);
        }
    }

    const missingGateway = gateway.filter(key => !process.env[key]);
    if (missingGateway.length > 0) {
        logger.warn(`RAZORPAY keys missing: ${missingGateway.join(', ')}. Server starting in TEST MODE (Mock Payments ENABLED).`, 'CONFIG');
    }
}

validateEnv();

// Global Public Client with robust fallback
testBlockchainConnection(logger).catch(() => {
    logger.warn('Continuing without verified blockchain connection. Syncer may be delayed.', 'SYNC');
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000, // Increased for development
    standardHeaders: true,
    legacyHeaders: false,
});

export const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/polylance';

const REPUTATION_ADDRESS = process.env.REPUTATION_ADDRESS || '0x89791A9A3210667c828492DB98DCa3e2076cc373';
const REPUTATION_ABI = [
    {
        "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "name": "portfolioCID",
        "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
        "stateMutability": "view",
        "type": "function"
    }
];

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://checkout.razorpay.com", "'unsafe-inline'", "'unsafe-eval'", "blob:"],
            frameSrc: ["'self'", "https://api.razorpay.com"],
            connectSrc: ["'self'", "https://api.razorpay.com", "https://*.render.com", "wss://*.render.com", "https://polylance.codes", "https://api.polylance.codes", process.env.BACKEND_URL || "https://localhost:3001", (process.env.BACKEND_URL || "https://localhost:3001").replace('https', 'wss')],
            imgSrc: ["'self'", "data:", "blob:", "https://gateway.pinata.cloud"],
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false
}));
app.use(hpp()); // Prevent HTTP Parameter Pollution
app.use(cors({
    origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(u => u.trim()) : [
        'https://localhost:5173', 'https://localhost:5174', 'https://localhost:5175',
        'https://localhost:5176', 'https://localhost:5177',
        'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175',
        'http://localhost:5176', 'http://localhost:5177',
        /\.4everland\.app$/, /\.limo$/, /\.link$/, /\.eth\.limo$/, /\.eth\.link$/,
        'https://polylance.codes', 'https://www.polylance.codes', 'https://polylance-zenith.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
app.use(express.json({ limit: '100kb' })); // Body limiting to prevent DoS

// HTTPS Configuration
const certPath = path.join(process.cwd(), 'certs');
let httpsOptions = null;

if (process.env.NODE_ENV !== 'production') {
    try {
        if (fs.existsSync(path.join(certPath, 'server.key')) && fs.existsSync(path.join(certPath, 'server.cert'))) {
            httpsOptions = {
                key: fs.readFileSync(path.join(certPath, 'server.key')),
                cert: fs.readFileSync(path.join(certPath, 'server.cert'))
            };
            logger.info('Loaded SSL certificates.', 'SERVER');
        } else {
            logger.warn('SSL certificates not found in backend/certs. Generating self-signed certificates...', 'SERVER');
            const attrs = [{ name: 'commonName', value: 'localhost' }];
            const pems = selfsigned.generate(attrs, { days: 365 });
            if (!fs.existsSync(certPath)) fs.mkdirSync(certPath);
            fs.writeFileSync(path.join(certPath, 'server.key'), pems.private);
            fs.writeFileSync(path.join(certPath, 'server.cert'), pems.cert);
            httpsOptions = { key: pems.private, cert: pems.cert };
            logger.success('Self-signed certificates generated successfully.', 'SERVER');
        }
    } catch (err) {
        logger.error('Failed to setup HTTPS certificates', 'SERVER', err);
    }
}

// 🚀 SOVEREIGN ARCHITECTURE: No Centralized Database Required
// Truth is verified On-Chain via Public Client
const bcClient = createPublicClient({
    chain: polygonAmoy,
    transport: http(process.env.RPC_URL || 'https://rpc-amoy.polygon.technology')
});

// Start Server Automatically
startServer();

function startServer() {
    const httpServer = process.env.NODE_ENV === 'production' ?
        createServer(app) :
        (httpsOptions ? createHttpsServer(httpsOptions, app) : createServer(app));

    const io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(u => u.trim()) : [
                'https://localhost:5173', 'https://localhost:5174', 'http://localhost:5173', 'http://localhost:5174',
                /\.4everland\.app$/, /\.limo$/, /\.link$/
            ],
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        logger.info(`Socket connected: ${socket.id}`, 'SOCKET');
        socket.on('disconnect', () => {
            logger.info(`Socket disconnected: ${socket.id}`, 'SOCKET');
        });
    });

    httpServer.listen(PORT, '0.0.0.0', () => {
        const mode = process.env.NODE_ENV === 'production' ? 'Production' : (httpsOptions ? 'HTTPS' : 'HTTP');
        logger.info(`${mode} Sovereign Server running on port ${PORT}`, 'SERVER');
        logger.info('Decentralized Truth: Blockchain + IPFS Indexers active.', 'SERVER');
    });

    const server = httpServer;

    // Graceful Shutdown
    process.on('SIGTERM', () => shutdown(server, 'SIGTERM'));
    process.on('SIGINT', () => shutdown(server, 'SIGINT'));

    // Process Level Error Handling
    process.on('uncaughtException', (err) => {
        logger.error('CRITICAL: Uncaught Exception', 'PROCESS', err);
        shutdown(server, 'UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason) => {
        logger.error('CRITICAL: Unhandled Rejection', 'PROCESS', reason);
        // We don't necessarily exit for rejections, but logging is vital
    });
}

async function shutdown(server, signal) {
    logger.info(`${signal} received. Closing server...`, 'SHUTDOWN');
    server.close(() => {
        logger.success('Server closed. Sovereign nodes remain active. Bye!', 'SHUTDOWN');
        process.exit(0);
    });
}

// Favicon Handler (Prevent 404s)
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Health Check
// Ephemeral memory cache for session nonces (DB-Free Auth)
const sessionNonces = new Map();

// Health Check
app.get('/api/health', async (req, res) => {
    res.json({
        status: 'ok',
        mode: 'sovereign',
        uptime: process.uptime(),
        network: process.env.NETWORK || 'Polygon Amoy'
    });
});

// Payment Routes
app.use('/api/payments', paymentRoutes);

// Auth Routes
app.get('/api/auth/nonce/:address', async (req, res) => {
    let { address } = req.params;
    const cleanAddress = address.toLowerCase();
    const nonce = crypto.randomBytes(16).toString('hex');
    sessionNonces.set(cleanAddress, { nonce, timestamp: Date.now() });
    res.json({ nonce });
});

app.post('/api/auth/verify', async (req, res) => {
    const { message, signature } = req.body;
    console.log('[AUTH] Verify called');
    try {
        const siweMessage = new SiweMessage(message);

        // Use the centralized public client
        const isValid = await publicClient.verifyMessage({
            address: siweMessage.address,
            message: siweMessage.prepareMessage(),
            signature,
        });

        if (!isValid) {
            console.warn('[AUTH] Signature verification failed');
            return res.status(401).json({ error: 'Signature verification failed' });
        }

        // Validate nonce against ephemeral memory cache
        const session = sessionNonces.get(siweMessage.address.toLowerCase());

        if (!session || session.nonce !== siweMessage.nonce) {
            console.warn('[AUTH] Nonce mismatch or expired');
            return res.status(400).json({ error: 'Invalid or expired nonce' });
        }

        // Auto-cleanup nonce after verification
        sessionNonces.delete(siweMessage.address.toLowerCase());

        console.log('[AUTH] Login successful for:', siweMessage.address);
        res.json({ ok: true, address: siweMessage.address });
    } catch (error) {
        console.error('[AUTH] Verify error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Profile Routes
app.get('/api/profiles/:address', async (req, res) => {
    const { address } = req.params;
    const cleanAddress = address.toLowerCase();
    try {
        console.log(`[SOVEREIGN] Resolving profile: ${cleanAddress}`);
        const portfolioCID = await bcClient.readContract({
            address: REPUTATION_ADDRESS,
            abi: REPUTATION_ABI,
            functionName: 'portfolioCID',
            args: [cleanAddress]
        });

        if (portfolioCID) {
            const { getJSONFromIPFS } = await import('./services/ipfs.js');
            const ipfsData = await getJSONFromIPFS(portfolioCID);
            return res.json({ ...ipfsData, address: cleanAddress, isSovereign: true });
        }
        
        res.json({ address: cleanAddress, isPlaceholder: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/profiles',
    [
        body('name').trim().isLength({ min: 2, max: 50 }).escape(),
        body('bio').trim().isLength({ max: 500 }).escape(),
        body('skills').trim().isLength({ max: 200 }).escape(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { address, name, bio, skills, avatarIpfsHash, ipfsCID, signature, message } = req.body;
        console.log(`[AUTH] Verifying profile for ${address}`);
        console.log(`[AUTH] Received body:`, JSON.stringify(req.body, null, 2));
        try {
            // Find profile by address OR the default address if using generic nonce
            let profile = await Profile.findOne({ address: address.toLowerCase() });
            if (!profile || !profile.nonce) {
                console.log(`[AUTH] Profile ${address} has no active nonce, checking default...`);
                profile = await Profile.findOne({ address: '0x0000000000000000000000000000000000000000' });
            }

            if (!profile || !profile.nonce) {
                console.warn(`[AUTH] No active nonce found for attempt by ${address}`);
                return res.status(400).json({ error: 'Nonce not found. Please request a nonce first.' });
            }

            // Verify that the message contains the nonce we generated
            if (!message || !message.includes(profile.nonce)) {
                console.warn(`[AUTH] Message does not contain expected nonce ${profile.nonce}`);
                return res.status(401).json({ error: 'Invalid nonce in message' });
            }

        const isValid = await verifyMessage({
            address: address,
            message: message,
            signature: signature,
        });

        if (!isValid) return res.status(401).json({ error: 'Invalid signature' });

        // SOVEREIGN SUCCESS: We return the projected profile data
        // The user must still propagate this to IPFS/Chain for persistence
        res.json({ address, name, bio, skills, isSovereign: true, status: 'verified' });
        } catch (error) {
            console.error(`[AUTH] Verification CRITICAL error for ${address}:`, error);
            res.status(500).json({ error: 'Internal server error during verification' });
        }
    });

app.get('/api/disputes', async (req, res) => {
    // DISPUTES: Served directly from the Subgraph in a pure P2P setup
    res.json([]); 
});

// Job Metadata Routes
app.get('/api/jobs', async (req, res) => {
    // JOBS: Resolved via Subgraph in the frontend SovereignService
    res.json([]);
});

app.get('/api/jobs/:jobId', async (req, res) => {
    const { jobId } = req.params;
    try {
        let job = await JobMetadata.findOne({ jobId: parseInt(jobId) });

        // SOVEREIGN FALLBACK
        if (!job) {
            console.log(`[SOVEREIGN] Job #${jobId} missing in DB, checking on-chain...`);
            try {
                const { CONTRACT_ADDRESS } = await import('./services/syncer.js');
                // Corrected path for Render/Container deployment
                const abiPath = path.join(__dirname, 'contracts', 'FreelanceEscrow.json');
                const FreelanceEscrowABI = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

                const jobData = await publicClient.readContract({
                    address: CONTRACT_ADDRESS,
                    abi: FreelanceEscrowABI.abi,
                    functionName: 'jobs',
                    args: [BigInt(jobId)]
                });

                const ipfsHash = Array.isArray(jobData) ? jobData[14] : jobData.ipfsHash;
                if (ipfsHash) {
                    const { getJSONFromIPFS } = await import('./services/ipfs.js');
                    const metadata = await getJSONFromIPFS(ipfsHash);

                    if (metadata) {
                        job = await JobMetadata.findOneAndUpdate(
                            { jobId: parseInt(jobId) },
                            {
                                jobId: parseInt(jobId),
                                title: metadata.title || `Job #${jobId}`,
                                description: metadata.description || '',
                                category: metadata.category || 'General',
                                ipfsHash: ipfsHash,
                                client: Array.isArray(jobData) ? jobData[1].toLowerCase() : jobData.client.toLowerCase(),
                                freelancer: Array.isArray(jobData) ? jobData[2].toLowerCase() : jobData.freelancer.toLowerCase(),
                                amount: Array.isArray(jobData) ? jobData[3].toString() : jobData.amount.toString(),
                                status: Array.isArray(jobData) ? jobData[10] : jobData.status,
                                deadline: Number(Array.isArray(jobData) ? jobData[4] : jobData.deadline)
                            },
                            { upsert: true, new: true }
                        );
                        console.log(`[SOVEREIGN] Job #${jobId} successfully recovered from On-Chain + IPFS.`);
                    }
                }
            } catch (err) {
                console.warn(`[SOVEREIGN] Job #${jobId} recovery failed: ${err.message}`);
            }
        }

        if (!job) return res.status(404).json({ error: 'Job not found' });
        res.json(job);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/jobs',
    [
        body('title').trim().isLength({ min: 5, max: 100 }).escape(),
        body('description').trim().isLength({ min: 10, max: 2000 }).escape(),
        body('category').trim().notEmpty().escape(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { jobId, title, description, category, tags } = req.body;
        try {
            const job = await JobMetadata.findOneAndUpdate(
                { jobId: parseInt(jobId) },
                {
                    title,
                    description,
                    category,
                    tags,
                },
                { upsert: true, new: true }
            );
            res.json(job);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

app.get('/api/leaderboard', async (req, res) => {
    // LEADERBOARD: Resolved via Sovereign Reputation Subgraph
    res.json([]);
});

app.get('/api/portfolios/:address', async (req, res) => {
    const { address } = req.params;
    try {
        const profile = await Profile.findOne({ address: address.toLowerCase() });
        const jobs = await JobMetadata.find({
            $or: [
                { client: address.toLowerCase() },
                { freelancer: address.toLowerCase() }
            ]
        }).sort({ createdAt: -1 });

        res.json({ profile, jobs });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// AI Job Matching
app.post('/api/profiles/polish-bio', apiLimiter, async (req, res) => {
    const { name, category, skills, bio } = req.body;
    try {
        const { polishProfileBio } = await import('./services/aiMatcher.js');
        const polishedBio = await polishProfileBio(name, category, skills, bio);
        res.json({ polishedBio });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/jobs/match/:jobId', apiLimiter, async (req, res) => {
    const { jobId } = req.params;
    try {
        const job = await JobMetadata.findOne({ jobId: parseInt(jobId) });
        if (!job) return res.status(404).json({ error: 'Job not found' });

        // Fetch profiles of applicants if any, otherwise fallback to top freelancers
        let candidateAddresses = [];
        if (job.applicants && job.applicants.length > 0) {
            candidateAddresses = job.applicants.map(a => a.address.toLowerCase());
        }

        const freelancers = await Profile.find({
            $or: [
                { address: { $in: candidateAddresses } },
                { completedJobs: { $gt: 0 } }
            ]
        }).limit(20);

        const { calculateMatchScore } = await import('./services/aiMatcher.js');

        const matches = await Promise.all(freelancers.map(async (f) => {
            const result = await calculateMatchScore(job.description, f);
            return {
                address: f.address,
                name: f.name || 'Pioneer',
                matchScore: result.score,
                reason: result.reason,
                isApplicant: candidateAddresses.includes(f.address.toLowerCase())
            };
        }));

        res.json(matches.sort((a, b) => b.matchScore - a.matchScore));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/match/:jobId/:address', apiLimiter, async (req, res) => {
    const { jobId, address } = req.params;
    try {
        const job = await JobMetadata.findOne({ jobId: parseInt(jobId) });
        if (!job) return res.status(404).json({ error: 'Job not found' });

        const profile = await Profile.findOne({ address: address.toLowerCase() });
        if (!profile) return res.status(404).json({ error: 'Profile not found' });

        const { calculateMatchScore } = await import('./services/aiMatcher.js');
        const result = await calculateMatchScore(job.description, profile);

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/disputes/analyze/:jobId', apiLimiter, async (req, res) => {
    const { jobId } = req.params;
    try {
        const { analyzeDispute } = await import('./services/aiMatcher.js');
        const job = await JobMetadata.findOne({ jobId: parseInt(jobId) });
        // Mocking chat and work for the Supreme demo, in prod these fetch from DB
        const result = await analyzeDispute(job, [], {});
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    if (!q || typeof q !== 'string') return res.json({ jobs: [], intent: {} });

    try {
        const { determineSearchIntent } = await import('./services/aiMatcher.js');
        const intent = await determineSearchIntent(q);

        let filter = {};
        if (intent.category && intent.category !== 'All') {
            filter.category = intent.category;
        }

        const safeQuery = escapeRegex(intent.refinedQuery || q);
        const jobs = await JobMetadata.find({
            $or: [
                { title: { $regex: safeQuery, $options: 'i' } },
                { description: { $regex: safeQuery, $options: 'i' } }
            ],
            ...filter
        }).limit(20);

        res.json({ jobs, intent });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/recommendations/:address', async (req, res) => {
    const { address } = req.params;
    try {
        const profile = await Profile.findOne({ address: address.toLowerCase() });
        const allJobs = await JobMetadata.find().limit(20);

        if (!profile) return res.status(404).json({ error: 'Profile not found' });

        const { calculateJobRecommendations } = await import('./services/aiMatcher.js');
        const recommendedIds = await calculateJobRecommendations(profile, allJobs);

        const recommendedJobs = allJobs.filter(j => recommendedIds.includes(j.jobId));
        res.json(recommendedJobs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/disputes/:jobId/analyze', async (req, res) => {
    const { jobId } = req.params;
    try {
        const job = await JobMetadata.findOne({ jobId: parseInt(jobId) });
        if (!job) return res.status(404).json({ error: 'Job not found' });

        const { analyzeDispute } = await import('./services/aiMatcher.js');
        // In a real app, we'd fetch actual chat logs and work metadata
        const analysis = await analyzeDispute(job, [], job.evidence || []);

        if (!job.disputeData) job.disputeData = {};
        job.disputeData.aiVerdict = analysis.verdict;
        job.disputeData.aiSplit = analysis.suggestedSplit;
        job.disputeData.reasoning = analysis.reasoning;
        await job.save();

        res.json(job.disputeData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/disputes/:jobId/resolve', async (req, res) => {
    const { jobId } = req.params;
    const { ruling, reasoning } = req.body;
    try {
        const job = await JobMetadata.findOne({ jobId: parseInt(jobId) });
        if (!job) return res.status(404).json({ error: 'Job not found' });

        // Update status based on ruling (1: Split, 2: Client Wins, 3: Freelancer Wins)
        // Global Status: 5: Completed, 6: Cancelled
        job.status = (ruling === 3) ? 5 : 6;
        if (!job.disputeData) job.disputeData = {};
        job.disputeData.reasoning = reasoning;
        await job.save();

        res.json({ ok: true, status: job.status });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ecosystem Analytics
app.get('/api/analytics', async (req, res) => {
    try {
        const totalJobs = await JobMetadata.countDocuments();
        const profiles = await Profile.find();



        // Volume and Reputation
        const totalVolumeWei = profiles.reduce((acc, p) => acc + BigInt(p.totalEarned || '0'), 0n);
        const totalVolume = parseFloat(formatEther(totalVolumeWei));

        const avgReputation = profiles.length > 0 ?
            profiles.reduce((acc, p) => acc + (p.reputationScore || 0), 0) / profiles.length : 0;

        // Category Distribution
        const jobs = await JobMetadata.find({}, 'category status createdAt milestones');
        const categoryDist = jobs.reduce((acc, job) => {
            const cat = job.category || 'Uncategorized';
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {});

        // Monthly Trends (Jobs Created)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const trends = await JobMetadata.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // TVL Approximation (Sum of unreleased milestones)
        let tvlWei = 0n;
        jobs.forEach(job => {
            if (job.status === 1) { // 1 = Active/Accepted
                job.milestones.forEach(m => {
                    if (!m.isReleased) {
                        tvlWei += BigInt(m.amount || '0');
                    }
                });
            }
        });
        const tvl = parseFloat(formatEther(tvlWei));

        res.json({

            totalJobs,
            totalVolume,
            avgReputation,
            totalUsers: profiles.length,
            categoryDistribution: Object.entries(categoryDist).map(([name, value]) => ({ name, value })),
            trends: trends.map(t => ({ date: t._id, count: t.count })),
            tvl
        });
    } catch (error) {
        console.error('[ANALYTICS] Fetch Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Farcaster Frame Integration
app.get('/api/frames/proposal/:id', async (req, res) => {
    const { id } = req.params;
    const proposalUrl = `${process.env.FRONTEND_URL || 'https://localhost:5173'}/governance?id=${id}`;
    const imageUrl = `https://placehold.co/600x400/02040a/ffffff?text=DAO+Proposal+%23${id}`;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta property="og:title" content="PolyLance DAO Proposal #${id}" />
            <meta property="og:image" content="${imageUrl}" />
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${imageUrl}" />
            <meta property="fc:frame:button:1" content="Vote Yes" />
            <meta property="fc:frame:button:2" content="Vote No" />
            <meta property="fc:frame:button:3" content="View Details" />
            <meta property="fc:frame:button:3:action" content="link" />
            <meta property="fc:frame:button:3:target" content="${proposalUrl}" />
            <meta property="fc:frame:post_url" content="${process.env.BACKEND_URL || 'https://localhost:3001'}/api/frames/callback" />
        </head>
        <body>
            <h1>Proposal #${id}</h1>
        </body>
        </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
});

app.post('/api/frames/callback', (req, res) => {
    // In a real implementation, we'd verify the Farcaster signature and cast a vote via meta-tx
    res.json({ message: "Interaction recorded! Please open the app to confirm your vote." });
});

// IPFS Storage Routes
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

app.post('/api/storage/upload-json', apiLimiter, async (req, res) => {
    try {
        const cid = await uploadJSONToIPFS(req.body);
        res.json({ cid, url: `https://gateway.pinata.cloud/ipfs/${cid}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/storage/upload-file', apiLimiter, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const cid = await uploadFileToIPFS(req.file.buffer, req.file.originalname);
        res.json({ cid, url: `https://gateway.pinata.cloud/ipfs/${cid}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// GDPR Compliance Endpoints
app.post('/api/gdpr/consent', async (req, res) => {
    try {
        const { address, category, basis, purpose, granted } = req.body;
        await GDPRService.recordConsent(address, category, basis, purpose, granted, req.ip, req.headers['user-agent']);
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/gdpr/export/:address', async (req, res) => {
    try {
        const data = await GDPRService.getUserDataExport(req.params.address, 'user_request', req.ip);
        if (!data) return res.status(404).json({ error: 'Profile not found' });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/gdpr/delete/:address', async (req, res) => {
    try {
        const result = await GDPRService.deleteUserData(req.params.address, 'user_request', req.ip);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// API Routes initialized above

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, _next) => {
    logger.error('Unhandled application error', 'APP', err);
    const status = err.status || 500;
    const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
    res.status(status).json({ error: message });
});

// Only start the server if running directly (not imported by Vercel)
// Handled in mongoose.connect loop now for better sync
export default app;
