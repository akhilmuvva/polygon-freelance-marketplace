import Razorpay from "razorpay";
import crypto from "crypto";
import { logger } from "../utils/logger.js";
import { fulfillOnramp } from "../services/paymentService.js";

const getRazorpayInstance = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

// Stateless In-Memory Order Storage (Ephemeral)
// For a truly decentralized path, we don't store PII in a DB.
const pendingOrders = new Map();

export const createRazorpayOrder = async (req, res) => {
    try {
        const { amount, address } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }
        if (!address) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }

        const isLive = process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_');
        const isMockMode = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('replace_me');

        if (isMockMode && !isLive) {
            logger.warn('RAZORPAY: Missing keys. Initializing MOCK order flow.', 'PAYMENT');
            const mockOrder = {
                id: `mock_order_${Date.now()}`,
                amount: Math.round(amount * 100),
                currency: "INR",
                receipt: `mock_receipt_${Date.now()}`,
            };

            pendingOrders.set(mockOrder.id, {
                orderId: mockOrder.id,
                address: address.toLowerCase(),
                amount: amount,
                status: 'PENDING',
                isMock: true
            });

            return res.json(mockOrder);
        }

        const razorpay = getRazorpayInstance();
        const options = {
            amount: Math.round(amount * 100),
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);

        // Track in memory
        pendingOrders.set(order.id, {
            orderId: order.id,
            address: address.toLowerCase(),
            amount: amount,
            status: 'PENDING',
            isMock: false
        });

        res.json(order);
    } catch (error) {
        logger.error('Razorpay Order Creation Error', 'PAYMENT', error);
        res.status(500).json({ error: error.message });
    }
};

export const verifyRazorpayPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        const orderData = pendingOrders.get(razorpay_order_id);
        if (!orderData) {
            return res.status(404).json({ error: 'Order not found or expired' });
        }

        // Verify Mock
        if (razorpay_order_id?.startsWith('mock_')) {
            logger.success(`MOCK Payment verified: ${razorpay_order_id}`, 'PAYMENT');

            try {
                const fulfillment = await fulfillOnramp(
                    orderData.address,
                    orderData.amount,
                    razorpay_order_id
                );

                pendingOrders.delete(razorpay_order_id); // Clear after fulfillment

                return res.json({
                    status: 'SUCCESS',
                    message: 'Mock payment verified and crypto fulfilled',
                    txHash: fulfillment.txHash
                });
            } catch (fulfillError) {
                logger.error('Mock Fulfillment Error', 'PAYMENT', fulfillError);
                return res.json({ status: 'SUCCESS', message: 'Mock payment verified' });
            }
        }

        if (!process.env.RAZORPAY_KEY_SECRET) {
            return res.status(400).json({ error: 'Razorpay secret key not configured' });
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            logger.success(`Payment verified successfully: ${razorpay_payment_id}`, 'PAYMENT');

            try {
                const fulfillment = await fulfillOnramp(
                    orderData.address,
                    orderData.amount,
                    razorpay_order_id
                );

                pendingOrders.delete(razorpay_order_id);

                res.json({
                    status: 'SUCCESS',
                    message: 'Payment verified and crypto fulfilled',
                    txHash: fulfillment.txHash
                });
            } catch (fulfillError) {
                logger.error('Fulfillment Error after payment', 'PAYMENT', fulfillError);
                res.json({
                    status: 'SUCCESS',
                    message: 'Payment verified but fulfillment pending',
                    warning: 'Fulfillment failed'
                });
            }
        } else {
            logger.warn(`Invalid payment signature for order: ${razorpay_order_id}`, 'PAYMENT');
            res.status(400).json({ error: 'Invalid signature' });
        }
    } catch (error) {
        logger.error('Razorpay Verification Error', 'PAYMENT', error);
        res.status(500).json({ error: error.message });
    }
};

export const retryFulfillment = async (req, res) => {
    // In a stateless world without a DB, we can only retry if the order is still in memory.
    // For a real production app, you might want a persistent cache like Redis, 
    // but here we favor the "Zero Centralized DB" rule.
    try {
        const { orderId } = req.body;
        const order = pendingOrders.get(orderId);

        if (!order) {
            return res.status(404).json({ error: 'Order not found in memory. Retrying from client state is recommended.' });
        }

        logger.info(`Manual fulfillment retry triggered for ${orderId}`, 'PAYMENT');

        const fulfillment = await fulfillOnramp(
            order.address,
            order.amount,
            orderId
        );

        pendingOrders.delete(orderId);

        res.json({
            status: 'SUCCESS',
            message: 'Order fulfilled manually',
            txHash: fulfillment.txHash
        });
    } catch (error) {
        logger.error('Manual Fulfillment Retry Error', 'PAYMENT', error);
        res.status(500).json({ error: error.message });
    }
};

