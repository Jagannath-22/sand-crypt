// backend/controllers/otp.controller.js
import Otp from "../models/otp.model.js";
import User from "../models/user.model.js"; // Assuming your User model is here
import twilio from "twilio";
import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/generateTokenAndSetCookie.js";

// Initialize Twilio client with your environment variables
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export const sendOtp = async (req, res) => {
    const { mobile } = req.body;
    
    if (!mobile) {
        return res.status(400).json({ error: "Mobile number is required." });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        // Delete any existing OTPs for this number to avoid conflicts
        await Otp.deleteMany({ mobile });

        // Save the new OTP to the database, which will auto-expire in 5 minutes
        const newOtp = new Otp({ mobile, otp });
        await newOtp.save();

        // Send the OTP via Twilio
        await client.messages.create({
            body: `Your SandCrypt verification code is: ${otp}`,
            from: process.env.TWILIO_PHONE_NUMBER, // Make sure you have this in your .env
            to: mobile
        });

        res.status(200).json({ message: "OTP sent successfully. It is valid for 5 minutes." });
    } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({ error: "Failed to send OTP. Please check the mobile number and your Twilio credentials." });
    }
};

export const verifyOtpAndRegister = async (req, res) => {
    const { mobile, otp, username, password } = req.body;

    if (!mobile || !otp || !username || !password) {
        return res.status(400).json({ error: "All fields are required." });
    }

    try {
        // Check if a user with that username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: "Username already exists." });
        }

        // Find and validate the OTP from the database
        const otpRecord = await Otp.findOne({ mobile, otp });
        if (!otpRecord) {
            return res.status(400).json({ error: "Invalid or expired OTP." });
        }

        // If OTP is valid, proceed with user registration
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const profilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`; // Example avatar service
        
        const newUser = new User({
            username,
            password: hashedPassword,
            mobile,
            profilePic
        });
        
        if (newUser) {
            // Generate JWT token and set cookie
            generateTokenAndSetCookie(newUser._id, res);
            await newUser.save();
            
            // Delete the used OTP record
            await Otp.deleteOne({ mobile });

            res.status(201).json({
                _id: newUser._id,
                username: newUser.username,
                profilePic: newUser.profilePic
            });
        } else {
            res.status(400).json({ error: "Invalid user data." });
        }
    } catch (error) {
        console.error("Error verifying OTP and registering user:", error);
        res.status(500).json({ error: "Failed to verify OTP and register user." });
    }
};