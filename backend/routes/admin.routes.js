import express from "express";
import jwt from 'jsonwebtoken';
// Import all controller functions from the file you just provided
import { login, logout, getUsers, toggleBan, checkSession, getMetrics, getAdminLogs } from "../controllers/admin.controller.js"; 
import Admin from '../models/admin.model.js'; // Needed to fetch admin details in middleware

const router = express.Router();

// 1. PUBLIC ROUTES
// Login handles cookie generation. Logout handles cookie clearing.
router.post('/login', login);
router.post('/logout', logout); 

// 2. Protection Middleware (Updated to check for 'adminJwt' and populate req.admin)
// Note: This needs to fetch the Admin model to populate 'req.admin' for the controller functions.
const protectAdminRoute = async (req, res, next) => {
    // Check for the updated cookie name
    const adminToken = req.cookies.adminJwt; 

    if (!adminToken) {
        // This is the error the frontend's checkSession call will see on page load if logged out
        return res.status(401).json({ error: "Unauthorized. Admin token required." });
    }

    try {
        // Use the common environment variable for the secret
        const decoded = jwt.verify(adminToken, process.env.JWT_SECRET); 
        
        // Find the admin user and attach the full object (minus sensitive data)
        const admin = await Admin.findById(decoded.adminId).select("-password -mfaSecret");

        if (!admin) {
             return res.status(401).json({ error: "Unauthorized. Admin account not found." });
        }
        
        req.admin = admin; // Set req.admin, which your controller functions rely on
        next();
    } catch (error) {
        // Clear the token if it's expired or invalid to prevent a bad cookie loop
        res.cookie('adminJwt', '', { maxAge: 0, httpOnly: true, sameSite: 'strict' });
        console.error("JWT verification failed, token cleared:", error.message);
        return res.status(401).json({ error: "Unauthorized. Invalid token." });
    }
};

// 3. APPLY the protection to everything that follows
router.use(protectAdminRoute); 

// 4. PROTECTED ROUTES

// CRITICAL: Session Check for Frontend Persistence
router.get('/session', checkSession);

// Admin Dashboard & Metrics
router.get('/metrics', getMetrics);

// User Management
router.get('/users', getUsers);
router.put('/users/:id/ban', toggleBan);

// Audit/Log Monitoring
router.get('/logs', getAdminLogs);

export default router;
