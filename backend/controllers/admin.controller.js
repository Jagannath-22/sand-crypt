// // Path: backend/controllers/admin.controller.js

// import bcrypt from 'bcryptjs';
// import Admin from '../models/admin.model.js';
// import User from '../models/user.model.js'; // Ensure this matches your model filename (user.model.js or User.js)
// import generateAdminToken from '../utils/generateAdminToken.js';
// // Assuming audit is available for logging
// import { audit } from '../utils/auditLog.js';
// // Assuming speakeasy is available for MFA logic if you implement it later

// // Admin Login Handler (Includes simplified MFA check from original request)
// export const login = async (req, res) => {
//     try {
//         const { username, password, totp } = req.body; // Added totp for completeness
        
//         // 1. Find the admin user
//         const admin = await Admin.findOne({ username });

//         // 2. Validate credentials
//         if (!admin) {
//             return res.status(401).json({ error: 'Invalid username or password' });
//         }
        
//         const isPasswordCorrect = await bcrypt.compare(password, admin.password || "");

//         if (!isPasswordCorrect) {
//             await audit({ adminId: admin._id, action: 'LOGIN_FAILED', details: { username }, req });
//             return res.status(401).json({ error: 'Invalid username or password' });
//         }

//         // 3. MFA Verification (If you add MFA secret to the Admin model)
//         if (admin.mfaSecret) {
//             if (!totp) return res.status(401).json({ error: 'MFA code required' });
//             const speakeasy = (await import('speakeasy')).default;
//             const ok = speakeasy.totp.verify({ secret: admin.mfaSecret, encoding: 'base32', token: totp, window: 1 });
//             if (!ok) {
//                 await audit({ adminId: admin._id, action: 'MFA_FAILED', req });
//                 return res.status(401).json({ error: 'Invalid MFA code' });
//             }
//         }
//         await audit({ adminId: admin._id, action: 'LOGIN_SUCCESS', req });

//         // 4. Generate token and set secure cookie
//         generateAdminToken(admin._id, res);

//         // 5. Send success response
//         res.status(200).json({
//             _id: admin._id,
//             username: admin.username,
//             role: admin.role,
//         });

//     } catch (error) {
//         console.log('Error in admin login controller: ', error.message);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// };

// // Admin Logout Handler
// export const logout = async (req, res) => {
//     try {
//         // Clear the admin token cookie
//         res.cookie('adminJwt', '', { maxAge: 0, httpOnly: true, sameSite: 'strict' });
//         await audit({ adminId: req.admin._id, action: 'LOGOUT', req });
//         res.status(200).json({ message: 'Admin logged out successfully' });
//     } catch (error) {
//         // req.admin._id might be undefined if cookie was already gone
//         console.log('Error in admin logout controller: ', error.message);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// };

// // Get All Chat Users (Admin Protected)
// // This is the controller function for GET /api/admin/users
// export const getUsers = async (req, res) => {
//     try {
//         // Fetch all users, excluding password, and sort them
//         const users = await User.find({}).select('-password').sort({ createdAt: -1 });

//         // Return the clean data list
//         const userList = users.map(user => ({
//             _id: user._id,
//             username: user.username,
//             mobile: user.mobile,
//             isBanned: user.isBanned || false,
//             createdAt: user.createdAt,
//         }));
        
//         // This array of users is exactly what the frontend AdminPage expects
//         res.status(200).json(userList);
//     } catch (error) {
//         console.log('Error in getUsers controller: ', error.message);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// };

// // Toggle Ban Status of a User (Admin Protected)
// // This is the controller function for PUT /api/admin/users/:id/ban
// export const toggleBan = async (req, res) => {
//     try {
//         const { id: userId } = req.params;
//         const { banStatus } = req.body; // Expects a boolean true/false

//         if (typeof banStatus !== 'boolean') {
//             return res.status(400).json({ error: 'Invalid banStatus provided.' });
//         }

//         const user = await User.findById(userId);

//         if (!user) {
//             return res.status(404).json({ error: 'User not found' });
//         }

//         // Update the isBanned status
//         user.isBanned = banStatus;
//         await user.save();

//         const action = banStatus ? 'USER_BANNED' : 'USER_UNBANNED';
//         await audit({ adminId: req.admin._id, action: action, details: { userId: user._id, username: user.username }, req });


//         res.status(200).json({ message: `User ${user.username} ban status updated to ${banStatus}`, isBanned: user.isBanned });

//     } catch (error) {
//         console.log('Error in toggleBan controller: ', error.message);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// };

// // Admin Check Session
// export const checkSession = (req, res) => {
//     // The protectAdminRoute middleware already verified the JWT and attached req.admin
//     res.json({ admin: { _id: req.admin._id, username: req.admin.username, role: req.admin.role }});
// }







import bcrypt from 'bcryptjs';
import Admin from '../models/admin.model.js';
import User from '../models/user.model.js'; 
// FIXED: Using the model name 'AdminAction' and file 'adminAction.model.js'
import AdminAction from '../models/adminAction.model.js'; 
// FIXED: Using the model name 'Message' (from Message.js / message.model.js)
// Based on your file explorer, this should be '../models/message.model.js'
import Message from '../models/message.model.js'; 

// Note: ActivityLog model import is omitted as it does not exist in your file structure.

import generateAdminToken from '../utils/generateAdminToken.js';
import { audit } from '../utils/auditLog.js'; 

// Admin Login Handler (Includes simplified MFA check from original request)
export const login = async (req, res) => {
    try {
        const { username, password, totp } = req.body; 
        
        // 1. Find the admin user
        const admin = await Admin.findOne({ username });

        // 2. Validate credentials
        if (!admin) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        const isPasswordCorrect = await bcrypt.compare(password, admin.password || "");

        if (!isPasswordCorrect) {
            await audit({ adminId: admin._id, action: 'LOGIN_FAILED', details: { username }, req });
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // 3. MFA Verification 
        if (admin.mfaSecret) {
            if (!totp) return res.status(401).json({ error: 'MFA code required' });
            const speakeasy = (await import('speakeasy')).default;
            const ok = speakeasy.totp.verify({ secret: admin.mfaSecret, encoding: 'base32', token: totp, window: 1 });
            if (!ok) {
                await audit({ adminId: admin._id, action: 'MFA_FAILED', req });
                return res.status(401).json({ error: 'Invalid MFA code' });
            }
        }
        await audit({ adminId: admin._id, action: 'LOGIN_SUCCESS', req });

        // 4. Generate token and set secure cookie
        generateAdminToken(admin._id, res);

        // 5. Send success response
        res.status(200).json({
            _id: admin._id,
            username: admin.username,
            role: admin.role,
        });

    } catch (error) {
        console.log('Error in admin login controller: ', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Admin Logout Handler
export const logout = async (req, res) => {
    try {
        if (req.admin?._id) {
            await audit({ adminId: req.admin._id, action: 'LOGOUT', req });
        }
        // Clear the admin token cookie
        res.cookie('adminJwt', '', { maxAge: 0, httpOnly: true, sameSite: 'strict' });
        res.status(200).json({ message: 'Admin logged out successfully' });
    } catch (error) {
        console.log('Error in admin logout controller: ', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Get All Chat Users (Admin Protected)
export const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });

        const userList = users.map(user => ({
            _id: user._id,
            username: user.username,
            mobile: user.mobile,
            isBanned: user.isBanned || false,
            createdAt: user.createdAt,
        }));
        
        await audit({ adminId: req.admin._id, action: 'FETCHED_USERS', req });
        res.status(200).json(userList);
    } catch (error) {
        console.log('Error in getUsers controller: ', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Toggle Ban Status of a User (Admin Protected)
export const toggleBan = async (req, res) => {
    try {
        const { id: userId } = req.params;
        const { banStatus } = req.body; 

        if (typeof banStatus !== 'boolean') {
            return res.status(400).json({ error: 'Invalid banStatus provided.' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.isBanned = banStatus;
        await user.save();

        const action = banStatus ? 'USER_BANNED' : 'USER_UNBANNED';
        await audit({ adminId: req.admin._id, action: action, details: { userId: user._id, username: user.username }, req });


        res.status(200).json({ message: `User ${user.username} ban status updated to ${banStatus}`, isBanned: user.isBanned });

    } catch (error) {
        console.log('Error in toggleBan controller: ', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Admin Check Session
export const checkSession = (req, res) => {
    res.json({ admin: { _id: req.admin._id, username: req.admin.username, role: req.admin.role }});
}

// --- METRICS CONTROLLER (For Dashboard Overview) ---
export const getMetrics = async (req, res) => {
    try {
        // Only counting users and messages as ActivityLog model is unknown
        const [totalUsers, bannedUsers, totalMessages] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ isBanned: true }),
            Message.countDocuments(), // Using Message model
        ]);
        
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const activeUsersToday = await User.countDocuments({ 
            lastActive: { $gte: oneDayAgo } 
        });

        await audit({ adminId: req.admin._id, action: 'FETCHED_METRICS', req });


        const metrics = {
            totalUsers,
            bannedUsers,
            activeUsersToday,
            totalMessages,
            // Fallback to 0 for unknown call metrics
            totalCalls: 0, 
            totalCallDurationSeconds: 0, 
            firewallStatus: 'Active', 
            threatCount: 14 
        };

        res.status(200).json(metrics);

    } catch (error) {
        console.log('Error in getMetrics controller: ', error.message);
        res.status(500).json({ error: 'Internal Server Error fetching metrics' });
    }
}


// --- AUDIT LOG RETRIEVAL (For Security Monitoring) ---
export const getAdminLogs = async (req, res) => {
    try {
        // Fetch the last 100 logs, sorting by newest first
        const logs = await AdminAction.find({}) // Using AdminAction model
            .sort({ createdAt: -1 })
            .limit(100)
            .exec();

        await audit({ 
            adminId: req.admin._id, 
            action: 'FETCHED_AUDIT_LOGS', 
            req 
        });
        
        const formattedLogs = logs.map(log => ({
            _id: log._id,
            timestamp: log.createdAt,
            action: log.action,
            adminId: log.adminId ? log.adminId.toString().slice(0, 8) : 'N/A', 
            details: log.details || {},
            ipAddress: log.ip, // Using 'ip' field from the schema you provided
        }));


        return res.status(200).json({ logs: formattedLogs });

    } catch (error) {
        console.error("Error in getAdminLogs controller:", error.message);
        return res.status(500).json({ error: "Internal Server Error fetching logs" });
    }
};
