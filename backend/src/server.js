import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { verifyMessage } from 'viem';
import { startSyncer } from './syncer.js';
import crypto from 'crypto';
import { Profile } from './models/Profile.js';
import { JobMetadata } from './models/JobMetadata.js';

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/polylance';

app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));

// Auth Routes
app.get('/api/auth/nonce/:address', async (req, res) => {
    const { address } = req.params;
    const nonce = crypto.randomBytes(16).toString('hex');
    try {
        await Profile.findOneAndUpdate(
            { address: address.toLowerCase() },
            { nonce },
            { upsert: true, new: true }
        );
        res.json({ nonce });
    } catch (error) {
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
    const { address, name, bio, skills, signature } = req.body;
    try {
        const profile = await Profile.findOne({ address: address.toLowerCase() });

        if (!profile || !profile.nonce) {
            return res.status(400).json({ error: 'Nonce not found. Please request a nonce first.' });
        }

        const message = `Login to PolyLance: ${profile.nonce}`;
        const isValid = await verifyMessage({
            address: address,
            message: message,
            signature: signature,
        });

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // Update profile and clear nonce
        const updatedProfile = await Profile.findOneAndUpdate(
            { address: address.toLowerCase() },
            { name, bio, skills, nonce: null },
            { new: true }
        );
        res.json(updatedProfile);
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
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startSyncer().catch(console.error);
});
