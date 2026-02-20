import dotenv from 'dotenv';
// Load environment variables immediately at the absolute top
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { verifyMessage, formatEther } from 'viem';
import { polygonAmoy } from 'viem/chains';
import { startSyncer } from './services/syncer.js';
import { publicClient, testBlockchainConnection } from './config/blockchain.js';
import crypto from 'crypto';
import paymentRoutes from './routes/paymentRoutes.js';
import { Profile } from './models/Profile.js';
import { JobMetadata } from './models/JobMetadata.js';
import { SiweMessage } from 'siwe';
import https from 'https';
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
    const critical = ['MONGODB_URI', 'GEMINI_API_KEY'];
    const gateway = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'];

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

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://checkout.razorpay.com", "'unsafe-inline'", "'unsafe-eval'", "blob:"],
            frameSrc: ["'self'", "https://api.razorpay.com"],
            connectSrc: ["'self'", "https://api.razorpay.com", "https://*.render.com", "wss://*.render.com", "https://localhost:3001", "wss://localhost:3001", "https://rpc-amoy.polygon.technology", "https://rpc.ankr.com", "https://polygon-amoy-bor-rpc.publicnode.com", "https://polylance.codes", "https://api.polylance.codes"],
            imgSrc: ["'self'", "data:", "blob:", "https://gateway.pinata.cloud"],
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false
}));
app.use(hpp()); // Prevent HTTP Parameter Pollution
app.use(cors({
    origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [
        'https://localhost:5173', 'https://localhost:5174', 'https://localhost:5175',
        'https://localhost:5176', 'https://localhost:5177',
        'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175',
        'http://localhost:5176', 'http://localhost:5177',
        'https://polygon-freelance-marketplace-onf5efcpb.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
app.use(express.json({ limit: '10kb' })); // Body limiting to prevent DoS

// Database Connection
mongoose.connect(MONGODB_URI)
    .then(() => {
        logger.success('Connected to MongoDB Atlas', 'DB');
        // Start server only after DB is ready
        if (process.argv[1] === fileURLToPath(import.meta.url)) {
            startServer();
        }
    })
    .catch(err => logger.error('MongoDB connection error', 'DB', err));

function startServer() {
    const server = process.env.NODE_ENV === 'production' ?
        app.listen(PORT, '0.0.0.0', () => {
            logger.info(`HTTP Server running on port ${PORT} (Production Mode)`, 'SERVER');
            startSyncer().catch(e => logger.error('Syncer failed to start', 'SYNC', e));
        }) :
        (httpsOptions ?
            https.createServer(httpsOptions, app).listen(PORT, '0.0.0.0', () => {
                logger.info(`HTTPS Server running on port ${PORT}`, 'SERVER');
                startSyncer().catch(e => logger.error('Syncer failed to start', 'SYNC', e));
            }) :
            app.listen(PORT, '0.0.0.0', () => {
                logger.info(`HTTP Server running on port ${PORT}`, 'SERVER');
                startSyncer().catch(e => logger.error('Syncer failed to start', 'SYNC', e));
            }));

    // Graceful Shutdown
    process.on('SIGTERM', () => shutdown(server, 'SIGTERM'));
    process.on('SIGINT', () => shutdown(server, 'SIGINT'));

    // Process Level Error Handling
    process.on('uncaughtException', (err) => {
        logger.error('CRITICAL: Uncaught Exception', 'PROCESS', err);
        shutdown(server, 'UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
        logger.error('CRITICAL: Unhandled Rejection', 'PROCESS', reason);
        // We don't necessarily exit for rejections, but logging is vital
    });
}

async function shutdown(server, signal) {
    logger.info(`${signal} received. Closing server...`, 'SHUTDOWN');
    server.close(async () => {
        logger.info('Server closed. Disconnecting DB...', 'SHUTDOWN');
        await mongoose.connection.close(false);
        logger.success('Database disconnected. Bye!', 'SHUTDOWN');
        process.exit(0);
    });
}

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        network: process.env.NETWORK || 'localhost'
    });
});

// Payment Routes
app.use('/api/payments', paymentRoutes);

// Auth Routes
app.get('/api/auth/nonce/:address', async (req, res) => {
    let { address } = req.params;
    console.log(`[AUTH] Nonce requested for: ${address}`);
    const dbAddress = address === 'default' ? '0x0000000000000000000000000000000000000000' : address.toLowerCase();
    const nonce = crypto.randomBytes(16).toString('hex');
    try {
        await Profile.findOneAndUpdate(
            { address: dbAddress },
            { nonce },
            { upsert: true, new: true }
        );
        console.log(`[AUTH] Generated nonce ${nonce} for ${dbAddress}`);
        res.json({ nonce });
    } catch (error) {
        console.error(`[AUTH] Nonce error: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
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

        const fields = siweMessage;

        // Validate nonce against database
        const profile = await Profile.findOne({
            $or: [
                { address: fields.address.toLowerCase(), nonce: fields.nonce },
                { address: '0x0000000000000000000000000000000000000000', nonce: fields.nonce }
            ]
        });

        if (!profile) {
            console.warn('[AUTH] Nonce mismatch or expired:', fields.nonce);
            return res.status(400).json({ error: 'Invalid or expired nonce' });
        }

        // Clear nonce and return success
        profile.nonce = null;
        await profile.save();

        // Ensure user profile exists
        await Profile.findOneAndUpdate(
            { address: fields.address.toLowerCase() },
            {}, // Just ensure it exists
            { upsert: true }
        );

        console.log('[AUTH] Login successful for:', fields.address);
        res.json({ ok: true, address: fields.address });
    } catch (error) {
        console.error('[AUTH] Verify error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Profile Routes
app.get('/api/profiles/:address', async (req, res) => {
    const { address } = req.params;
    try {
        const profile = await Profile.findOne({ address: address.toLowerCase() });
        res.json(profile || {});
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

        const { address, name, bio, skills, signature, message } = req.body;
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

            console.log(`[AUTH] Signature verification result for ${address}: ${isValid}`);

            if (!isValid) {
                console.warn(`[AUTH] Invalid signature for address ${address}`);
                return res.status(401).json({ error: 'Invalid signature' });
            }

            // Update profile and clear nonce
            const updatedProfile = await Profile.findOneAndUpdate(
                { address: address.toLowerCase() },
                { name, bio, skills, nonce: null },
                { upsert: true, new: true }
            );
            console.log(`[AUTH] Profile updated/verified for ${address}`);
            res.json(updatedProfile);
        } catch (error) {
            console.error(`[AUTH] Verification CRITICAL error for ${address}:`, error);
            res.status(500).json({ error: 'Internal server error during verification' });
        }
    });

app.get('/api/disputes', async (req, res) => {
    try {
        const disputes = await JobMetadata.find({ status: 3 }).sort({ updatedAt: -1 });
        res.json(disputes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Job Metadata Routes
app.get('/api/jobs', async (req, res) => {
    try {
        const jobs = await JobMetadata.find().sort({ createdAt: -1 });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/jobs/:jobId', async (req, res) => {
    const { jobId } = req.params;
    try {
        const job = await JobMetadata.findOne({ jobId: parseInt(jobId) });
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
            const job = await JobMetadata.create({
                jobId: parseInt(jobId),
                title,
                description,
                category,
                tags,
            });
            res.json(job);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

app.get('/api/leaderboard', async (req, res) => {
    try {
        const topFreelancers = await Profile.find({ totalEarned: { $gt: 0 } })
            .sort({ reputationScore: -1 })
            .limit(10)
            .select('address name bio skills totalEarned completedJobs reputationScore ratingSum ratingCount');

        const leadersWithRatings = topFreelancers.map(leader => {
            const avgRating = leader.ratingCount > 0 ? (leader.ratingSum / leader.ratingCount) : 0;
            return {
                ...leader.toObject(),
                avgRating: avgRating
            };
        });

        res.json(leadersWithRatings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
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


// Start HTTPS Server
// Try to load certs, fallback to HTTP if missing (for prod/CI)
const certPath = path.join(process.cwd(), 'certs');
let httpsOptions = null;

if (process.env.NODE_ENV !== 'production') {
    try {
        if (fs.existsSync(path.join(certPath, 'server.key')) && fs.existsSync(path.join(certPath, 'server.cert'))) {
            httpsOptions = {
                key: fs.readFileSync(path.join(certPath, 'server.key')),
                cert: fs.readFileSync(path.join(certPath, 'server.cert'))
            };
            console.log('Loaded SSL certificates.');
        } else {
            console.warn('SSL certificates not found in backend/certs. Generating self-signed certificates...');
            const attrs = [{ name: 'commonName', value: 'localhost' }];
            const pems = selfsigned.generate(attrs, { days: 365 });
            httpsOptions = {
                key: pems.private,
                cert: pems.cert
            };
            // mkdir if not exists
            if (!fs.existsSync(certPath)) fs.mkdirSync(certPath);
            fs.writeFileSync(path.join(certPath, 'server.key'), pems.private);
            fs.writeFileSync(path.join(certPath, 'server.cert'), pems.cert);
            console.log('Generated and saved new SSL certificates.');
        }
    } catch (e) {
        console.warn('Error loading/generating SSL certs:', e.message);
    }
}

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    logger.error('Unhandled application error', 'APP', err);
    const status = err.status || 500;
    const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
    res.status(status).json({ error: message });
});

// Only start the server if running directly (not imported by Vercel)
// Handled in mongoose.connect loop now for better sync
export default app;
