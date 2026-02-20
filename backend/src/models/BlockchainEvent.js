import mongoose from 'mongoose';

const blockchainEventSchema = new mongoose.Schema({
    transactionHash: { type: String, required: true },
    logIndex: { type: Number, required: true },
    eventName: { type: String, required: true },
    blockNumber: { type: Number, required: true },
    data: { type: Object },
    notified: { type: Boolean, default: false }
}, { timestamps: true });

// Ensure uniqueness based on txHash and logIndex
blockchainEventSchema.index({ transactionHash: 1, logIndex: 1 }, { unique: true });

export const BlockchainEvent = mongoose.model('BlockchainEvent', blockchainEventSchema);
