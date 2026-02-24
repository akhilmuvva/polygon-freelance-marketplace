import express from "express";
import { createRazorpayOrder, verifyRazorpayPayment, retryFulfillment } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-order", createRazorpayOrder);
router.post("/verify", verifyRazorpayPayment);
router.post("/retry-fulfillment", retryFulfillment);

export default router;
