import mongoose from 'mongoose';

const paymentOrderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    address: { type: String, required: true, lowercase: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, default: 'PENDING' },
    gateway: { type: String, required: true },
    paymentId: { type: String },
    customerDetails: {
        id: String,
        phone: String,
        email: String
    }
}, { timestamps: true });

export const PaymentOrder = mongoose.model('PaymentOrder', paymentOrderSchema);
