import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { verifyMessage } from 'viem';
import { startSyncer } from './syncer.js';
import crypto from 'crypto';
import Stripe from 'stripe';
import { Profile } from './models/Profile.js';
import { JobMetadata } from './models/JobMetadata.js';

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/polylance';

app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://20.30.75.78:5173',
        'http://20.30.75.78:5174'
    ],
    credentials: true,
}));
app.use(express.json());

// Database Connection
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));

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
    console.log('[AUTH] Verify called with:', { message, signature });
    try {
        // Find nonce from profile (search message for it)
        // A real implementation would parse the SIWE message properly
        const nonceMatch = message.match(/Nonce: ([a-zA-Z0-9]+)/);
        const nonce = nonceMatch ? nonceMatch[1] : null;

        const addressMatch = message.match(/^0x[a-fA-F0-9]{40}/) || message.match(/ [a-fA-F0-9]{40}/);
        // Better way: use siwe library if available, but for now we have viem verifyMessage

        // Let's find the profile by nonce if possible
        const profile = await Profile.findOne({ nonce });
        if (!profile) {
            console.warn('[AUTH] No profile found for nonce:', nonce);
            return res.status(400).json({ error: 'Invalid or expired nonce' });
        }

        const isValid = await verifyMessage({
            address: profile.address,
            message: message,
            signature: signature,
        });

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // Clear nonce and return success
        profile.nonce = null;
        await profile.save();

        res.json({ ok: true, address: profile.address });
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

app.post('/api/profiles', async (req, res) => {
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

app.post('/api/jobs', async (req, res) => {
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
app.get('/api/jobs/match/:jobId', async (req, res) => {
    const { jobId } = req.params;
    try {
        const job = await JobMetadata.findOne({ jobId: parseInt(jobId) });
        if (!job) return res.status(404).json({ error: 'Job not found' });

        const freelancers = await Profile.find({ completedJobs: { $gt: 0 } });
        const { calculateMatchScore } = await import('./aiMatcher.js');

        const matches = await Promise.all(freelancers.map(async (f) => {
            const score = await calculateMatchScore(job.description, f);
            return { address: f.address, name: f.name, matchScore: score };
        }));

        res.json(matches.sort((a, b) => b.matchScore - a.matchScore));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ecosystem Analytics
app.get('/api/analytics', async (req, res) => {
    try {
        const totalJobs = await JobMetadata.countDocuments();
        const profiles = await Profile.find();
        const totalVolume = profiles.reduce((acc, p) => acc + (p.totalEarned || 0), 0);
        const avgReputation = profiles.length > 0 ?
            profiles.reduce((acc, p) => acc + (p.reputationScore || 0), 0) / profiles.length : 0;

        res.json({
            totalJobs,
            totalVolume,
            avgReputation,
            totalUsers: profiles.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Stripe Crypto Onramp
app.post('/api/stripe/create-onramp-session', async (req, res) => {
    try {
        const { address } = req.body;

        if (!process.env.STRIPE_SECRET_KEY) {
            console.warn('[STRIPE] Missing STRIPE_SECRET_KEY environment variable');
            return res.status(400).json({ error: 'Stripe Secret Key not configured on server.' });
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const onrampSession = await stripe.crypto.onrampSessions.create({
            transaction_details: {
                destination_currency: 'usdc',
                destination_network: 'polygon',
                destination_address: address,
            },
            customer_ip_address: req.ip,
        });

        res.json({ client_secret: onrampSession.client_secret });
    } catch (error) {
        console.error('[STRIPE] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`CORS allowed from: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    startSyncer().catch(console.error);
});
