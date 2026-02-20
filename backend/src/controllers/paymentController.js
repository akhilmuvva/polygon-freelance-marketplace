import Razorpay from "razorpay";
import crypto from "crypto";
import { logger } from "../utils/logger.js";
import { PaymentOrder } from "../models/PaymentOrder.js";

const getRazorpayInstance = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

export const createRazorpayOrder = async (req, res) => {
    try {
        const { amount, address, customer_details } = req.body;

        // Mock Flow for Developers
        if (process.env.NODE_ENV !== 'production' && (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('replace_me'))) {
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
            await PaymentOrder.findOneAndUpdate(
                { orderId: razorpay_order_id },
                { status: 'PAID', paymentId: razorpay_payment_id },
                { new: true }
            );
            logger.success(`MOCK Payment verified: ${razorpay_order_id}`, 'PAYMENT');
            return res.json({ status: 'SUCCESS', message: 'Mock payment verified' });
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Update MongoDB
            await PaymentOrder.findOneAndUpdate(
                { orderId: razorpay_order_id },
                { status: 'PAID', paymentId: razorpay_payment_id },
                { new: true }
            );

            logger.success(`Payment verified successfully: ${razorpay_payment_id}`, 'PAYMENT');
            res.json({ status: 'SUCCESS', message: 'Payment verified' });
        } else {
            logger.warn(`Invalid payment signature for order: ${razorpay_order_id}`, 'PAYMENT');
            res.status(400).json({ error: 'Invalid signature' });
        }
    } catch (error) {
        logger.error('Razorpay Verification Error', 'PAYMENT', error);
        res.status(500).json({ error: error.message });
    }
};
