import express from "express";
import { sendOtp, verifyOtp, logout, signupUser, loginUser, forgotPassword, resetPassword } from "../controllers/auth.controller.js";

const router = express.Router();

// OTP-based registration and login
router.post("/send-otp", sendOtp); // Sends an OTP to the provided mobile number
router.post("/verify-otp", verifyOtp); // Verifies the OTP to complete registration/login

// Traditional password-based authentication
router.post("/signup", signupUser);  // For traditional username/password signup
router.post("/login", loginUser);  // For traditional mobile/password login
router.post("/logout", logout);

// NEW: Forgot Password / Reset Password flow
router.post("/forgot-password", forgotPassword); // Initiates the password reset by sending an OTP
router.post("/reset-password", resetPassword);  // Verifies the OTP and updates the password

export default router;