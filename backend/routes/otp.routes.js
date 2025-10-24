// backend/routes/otp.routes.js
import express from 'express';
import { sendOtp, verifyOtpAndRegister } from '../controllers/otp.controller.js';

const router = express.Router();

// Route to send an OTP to a mobile number
router.post('/send', sendOtp);

// Route to verify the OTP and complete registration
router.post('/verify', verifyOtpAndRegister);

export default router;
