import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
    address: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String },
    bio: { type: String },
    skills: { type: String },
    avatarIpfsHash: { type: String },
    ipfsCID: { type: String }, // The primary CID for the whole profile object
    website: { type: String },
    github: { type: String },
    totalEarned: { type: String, default: '0' },
    completedJobs: { type: Number, default: 0 },
    disputedJobs: { type: Number, default: 0 },
    ratingSum: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    reputationScore: { type: Number, default: 0 },
    nonce: { type: String },
    isSovereign: { type: Boolean, default: false }, // Flag to indicate data is backed by IPFS
}, { timestamps: true });

profileSchema.index({ reputationScore: -1 });
profileSchema.index({ nonce: 1 });

export const Profile = mongoose.model('Profile', profileSchema);
