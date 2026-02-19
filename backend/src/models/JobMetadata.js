import mongoose from 'mongoose';

const jobMetadataSchema = new mongoose.Schema({
    jobId: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String },
    freelancer: { type: String, lowercase: true },
    status: { type: Number, default: 0 },
    tags: { type: String },
    ipfsHash: { type: String }, // Link to immutable contract details
    review: { type: String },
    rating: { type: Number },
    client: { type: String, lowercase: true },
    amount: { type: String },
    deadline: { type: Number },
    milestones: [{
        amount: String,
        description: String,
        isReleased: { type: Boolean, default: false }
    }],
    applicants: [{
        address: { type: String, lowercase: true },
        stake: String,
        timestamp: { type: Date, default: Date.now }
    }],
    evidence: [{
        party: { type: String, lowercase: true },
        hash: String,
        timestamp: { type: Date, default: Date.now }
    }],
    disputeData: {
        arbitrator: String,
        disputeId: Number,
        aiVerdict: String,
        aiSplit: Number,
        reasoning: String
    },
    isCrossChain: { type: Boolean, default: false },
    sourceChain: String,
    destinationChain: String
}, { timestamps: true });

jobMetadataSchema.index({ client: 1 });
jobMetadataSchema.index({ freelancer: 1 });

export const JobMetadata = mongoose.model('JobMetadata', jobMetadataSchema);
