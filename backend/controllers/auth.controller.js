// backend/controllers/authController.js

// 🔑 CRITICAL: Ensure dotenv.config() is at the very top and UNCOMMENTED
import dotenv from "dotenv";
dotenv.config();

import twilio from "twilio";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Otp from "../models/otp.model.js";
import generateTokenAndSetCookie from "../utils/generateTokenAndSetCookie.js";

// Twilio client - ensures env variables are loaded correctly now
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// ---------------- Reusable OTP Sending Helper ----------------
const sendSmsOtp = async (mobileNumber) => {
    try {
        if (!mobileNumber) {
            throw new Error("Mobile number is required for sending OTP.");
        }

        // Add the country code if it's missing (for India, +91)
        let formattedMobile = mobileNumber.startsWith('+') ? mobileNumber : `+91${mobileNumber}`;

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Find and update or create an OTP record for the mobile number
        await Otp.findOneAndUpdate(
            { mobile: formattedMobile }, // Store/find OTP with the formatted number
            { otp, createdAt: Date.now() },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Send OTP via Twilio
        await client.messages.create({
            body: `Your SandCrypt OTP is ${otp}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: formattedMobile, // Use the formatted number for Twilio
        });

        console.log(`OTP for ${formattedMobile}: ${otp} (sent via Twilio)`);
        return { success: true, message: "OTP sent successfully. It is valid for 5 minutes." };

    } catch (error) {
        console.error("sendSmsOtp helper error:", error.message);
        console.error("Twilio error details:", error);
        throw new Error("Failed to send OTP via SMS. Please check mobile number or Twilio setup.");
    }
};


// ---------------- OTP-BASED REGISTRATION FLOW ----------------

export const sendOtp = async (req, res) => {
    try {
        const { mobile } = req.body;
        const result = await sendSmsOtp(mobile);
        return res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const verifyOtp = async (req, res) => {
    try {
        const { mobile, otp, username, gender } = req.body;
        if (!mobile || !otp) return res.status(400).json({ error: "Mobile and OTP required" });

        // Normalize mobile for lookup (assuming database stores without +91)
        const lookupMobile = mobile.startsWith('+91') ? mobile.substring(3) : mobile; // Removes +91 if present
        const record = await Otp.findOne({ mobile: mobile }); // Should match what's stored in DB (with +91)

        if (!record || record.otp !== otp.toString()) {
            return res.status(400).json({ error: "Invalid OTP or expired" });
        }
        await Otp.deleteMany({ mobile: mobile }); // Delete all OTPs for this number after successful verification

        let user = await User.findOne({ mobile: lookupMobile }); // Lookup user by stored mobile format
        const boyPic = `https://avatar.iran.liara.run/public/boy?username=${username || lookupMobile}`;
        const girlPic = `https://avatar.iran.liara.run/public/girl?username=${username || lookupMobile}`;

        if (!user) {
            // User does not exist, proceed with signup
            if (!username) return res.status(400).json({ error: "Username is required for signup" });
            if (await User.findOne({ username })) {
                return res.status(400).json({ error: "Username already taken" });
            }

            user = await User.create({
                mobile: lookupMobile, // Store mobile in DB without +91
                username,
                displayName: username,
                gender: gender || null,
                profilePic: gender === "male" ? boyPic : gender === "female" ? girlPic : boyPic,
                isVerified: true,
            });
        } else {
            // User exists, update verification status or profile details
            user.isVerified = true;
            if (username && !user.username) user.username = username;
            if (username && !user.displayName) user.displayName = username;
            if (gender && !user.gender) user.gender = gender;
            if (!user.profilePic) {
                user.profilePic = gender === "male" ? boyPic : girlPic;
            }
            await user.save();
        }

        const token = generateTokenAndSetCookie(user._id, res);
        console.log("✅ JWT issued for user:", user._id);

        res.status(200).json({
            _id: user._id,
            username: user.username,
            mobile: user.mobile,
            displayName: user.displayName,
            gender: user.gender,
            profilePic: user.profilePic,
            token: token
        });
    } catch (error) {
        console.error("verifyOtp error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ---------------- PASSWORD-BASED SIGNUP/LOGIN (Existing) ----------------

export const signupUser = async (req, res) => {
    try {
        const { username, mobile, password, confirmPassword, gender } = req.body;

        if (!username || !mobile || !password || !confirmPassword || !gender) {
            return res.status(400).json({ error: "Please fill all fields" });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ error: "Passwords do not match" });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        }
        if (await User.findOne({ username })) {
            return res.status(400).json({ error: "Username already exists" });
        }
        // Normalize mobile for lookup (assuming database stores without +91)
        const lookupMobile = mobile.startsWith('+91') ? mobile.substring(3) : mobile;
        if (await User.findOne({ mobile: lookupMobile })) {
            return res.status(400).json({ error: "Mobile already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const boyPic = `https://avatar.iran.liara.run/public/boy?username=${username}`;
        const girlPic = `https://avatar.iran.liara.run/public/girl?username=${username}`;

        const newUser = await User.create({
            username,
            mobile: lookupMobile, // Store mobile in DB without +91
            password: hashedPassword,
            gender,
            profilePic: gender === "male" ? boyPic : girlPic,
            isVerified: true,
        });

        generateTokenAndSetCookie(newUser._id, res);

        res.status(201).json({
            _id: newUser._id,
            username: newUser.username,
            mobile: newUser.mobile,
            displayName: newUser.displayName || newUser.username,
            gender: newUser.gender,
            profilePic: newUser.profilePic,
        });
    } catch (error) {
        console.error("signupUser error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


export const loginUser = async (req, res) => {
    try {
        let { mobile, password } = req.body;
        if (!mobile || !password) {
            return res.status(400).json({ error: "Please enter mobile number and password" });
        }

        // Normalize mobile for lookup (assuming database stores without +91)
        const lookupMobile = mobile.startsWith('+91') ? mobile.substring(3) : mobile;
        const user = await User.findOne({ mobile: lookupMobile });
        if (!user) return res.status(400).json({ error: "Invalid mobile or password" });

        const isPasswordCorrect = await bcrypt.compare(password, user.password || "");
        if (!isPasswordCorrect) return res.status(400).json({ error: "Invalid mobile or password" });

        const token = generateTokenAndSetCookie(user._id, res);

        res.status(200).json({
            token,
            _id: user._id,
            username: user.username,
            mobile: user.mobile,
            displayName: user.displayName || user.username,
            gender: user.gender,
            profilePic: user.profilePic,
        });
    } catch (error) {
        console.error("loginUser error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0, httpOnly: true });
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("logout error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ---------------- FORGOT PASSWORD FLOW ----------------

export const forgotPassword = async (req, res) => {
    let { mobile } = req.body;

    try {
        // 1. Normalize the mobile number input to match DB format
        let mobilePlain = mobile;
        if (mobile.startsWith('+91')) {
            mobilePlain = mobile.substring(3);
        } else if (mobile.startsWith('91') && mobile.length === 12) {
            mobilePlain = mobile.substring(2);
        }
        
        // 2. Find the user using the normalized mobile number
        const user = await User.findOne({ mobile: mobilePlain });

        if (!user) {
            return res.status(404).json({ error: "No account found with this mobile number." });
        }

        // 3. Use the reusable helper to send OTP
        // The helper will add the +91 prefix back for the Twilio API call
        const result = await sendSmsOtp(user.mobile);

        return res.json(result);

    } catch (error) {
        console.error("Error in forgotPassword initiation:", error.message);
        // This will now correctly log the Twilio API error if it occurs
        console.error("Twilio error details:", error);
        res.status(500).json({ error: error.message || "Failed to initiate password reset. Please try again." });
    }
};

// All other functions in authController.js remain the same as the previous response.

export const resetPassword = async (req, res) => {
    const { mobile, otp, newPassword, confirmNewPassword } = req.body;

    if (!mobile || !otp || !newPassword || !confirmNewPassword) {
        return res.status(400).json({ error: "All fields are required." });
    }
    if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ error: "New passwords do not match." });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters long." });
    }

    try {
        // Normalize mobile for lookup (assuming database stores without +91)
        const lookupMobile = mobile.startsWith('+91') ? mobile.substring(3) : mobile;

        // 1. Verify the OTP
        const otpRecord = await Otp.findOne({ mobile: mobile }); // OTPs are stored with +91 if sent with it
        if (!otpRecord || otpRecord.otp !== otp.toString()) {
            return res.status(400).json({ error: "Invalid or expired OTP." });
        }

        // 2. Find the user and update their password
        const user = await User.findOne({ mobile: lookupMobile }); // Lookup user by stored mobile format
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        // 3. Delete the used OTP record
        await Otp.deleteOne({ mobile: mobile }); // Delete the OTP using the same format it was stored with

        res.status(200).json({ message: "Password reset successfully. You can now log in with your new password." });

    } catch (error) {
        console.error("Error in resetPassword:", error.message);
        res.status(500).json({ error: "Failed to reset password. Please try again." });
    }
};
