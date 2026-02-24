import Razorpay from "razorpay";
import crypto from "crypto";
import { logger } from "../utils/logger.js";
import { PaymentOrder } from "../models/PaymentOrder.js";
import { fulfillOnramp } from "../services/paymentService.js";

const getRazorpayInstance = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

export const createRazorpayOrder = async (req, res) => {
    try {
        const { amount, address, customer_details } = req.body;

        // Detect if we are using live keys
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

            await PaymentOrder.create({
                orderId: mockOrder.id,
                address: address.toLowerCase(),
                amount: amount,
                gateway: 'RAZORPAY_MOCK',
                status: 'PENDING',
                customerDetails: {
                    id: address.toLowerCase(),
                    phone: customer_details?.phone || "9999999999",
                    email: customer_details?.email || "user@polylance.com"
                }
            });

            return res.json(mockOrder);
        }

        const razorpay = getRazorpayInstance();

        const options = {
            amount: Math.round(amount * 100), // amount in the smallest currency unit (paisa for INR)
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);

        // Store in MongoDB
        await PaymentOrder.create({
            orderId: order.id,
            address: address.toLowerCase(),
            amount: amount,
            gateway: 'RAZORPAY',
            status: 'PENDING',
            customerDetails: {
                id: address.toLowerCase(),
                phone: customer_details?.phone || "9999999999",
                email: customer_details?.email || "user@polylance.com"
            }
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

        // Verify Mock
        if (razorpay_order_id?.startsWith('mock_')) {
            const updatedOrder = await PaymentOrder.findOneAndUpdate(
                { orderId: razorpay_order_id },
                { status: 'PAID', paymentId: razorpay_payment_id || 'mock_pay_123' },
                { new: true }
            );

            logger.success(`MOCK Payment verified: ${razorpay_order_id}`, 'PAYMENT');

            // Trigger on-chain fulfillment (will follow mock logic inside the service if no PK)
            try {
                const fulfillment = await fulfillOnramp(
                    updatedOrder.address,
                    updatedOrder.amount,
                    razorpay_order_id
                );

                await PaymentOrder.findOneAndUpdate(
                    { orderId: razorpay_order_id },
                    {
                        status: 'FULFILLED',
                        fulfillmentTx: fulfillment.txHash,
                        isMock: true
                    }
                );

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
            // Update MongoDB
            const updatedOrder = await PaymentOrder.findOneAndUpdate(
                { orderId: razorpay_order_id },
                { status: 'PAID', paymentId: razorpay_payment_id },
                { new: true }
            );

            logger.success(`Payment verified successfully: ${razorpay_payment_id}`, 'PAYMENT');

            // Trigger on-chain fulfillment
            try {
                const fulfillment = await fulfillOnramp(
                    updatedOrder.address,
                    updatedOrder.amount,
                    razorpay_order_id
                );

                await PaymentOrder.findOneAndUpdate(
                    { orderId: razorpay_order_id },
                    {
                        status: 'FULFILLED',
                        fulfillmentTx: fulfillment.txHash,
                        isMock: fulfillment.mock || false
                    }
                );

                res.json({
                    status: 'SUCCESS',
                    message: 'Payment verified and crypto fulfilled',
                    txHash: fulfillment.txHash
                });
            } catch (fulfillError) {
                logger.error('Fulfillment Error after payment', 'PAYMENT', fulfillError);
                // We keep it as PAID but log the error so admin can retry
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
    try {
        const { orderId } = req.body;
        const order = await PaymentOrder.findOne({ orderId });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.status !== 'PAID' && order.status !== 'FAILED') {
            return res.status(400).json({ error: `Cannot fulfill order in ${order.status} state` });
        }

        logger.info(`Manual fulfillment retry triggered for ${orderId}`, 'PAYMENT');

        const fulfillment = await fulfillOnramp(
            order.address,
            order.amount,
            orderId
        );

        await PaymentOrder.findOneAndUpdate(
            { orderId: orderId },
            {
                status: 'FULFILLED',
                fulfillmentTx: fulfillment.txHash,
                isMock: fulfillment.mock || false
            }
        );

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
