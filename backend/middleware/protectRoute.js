import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const protectRoute = async (req, res, next) => {
  try {
    console.log(`[protectRoute] Incoming request to: ${req.path}`);

    // Get token from cookies or Authorization header
    const token = req.cookies.jwt || req.headers.authorization?.split(" ")[1];
    console.log(`[protectRoute] Token found: ${token ? "YES" : "NO"}`);

    if (!token) {
      console.log("[protectRoute] No token found. User not authorized.");
      return res.status(401).json({ error: "No token, authorization denied" });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("[protectRoute] Token successfully decoded:", decoded);
    } catch (jwtError) {
      console.error("[protectRoute] JWT Verification Failed:", jwtError.message);
      res.clearCookie("jwt"); // remove invalid cookie
      return res.status(401).json({ error: "Token is not valid or expired" });
    }

    // Find user
    const user = await User.findById(decoded.userId).select("-password");
    console.log(
      `[protectRoute] User found for ID ${decoded.userId}: ${user ? "YES" : "NO"}`
    );

    if (!user) {
      console.log("[protectRoute] User not found in DB for decoded ID.");
      return res.status(404).json({ error: "User not found" });
    }

    // Attach user to request
    req.user = user;
    console.log(
      `[protectRoute] User ${user.username} attached to req.user. Continuing...`
    );

    next();
  } catch (error) {
    console.error("Error in protectRoute middleware:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default protectRoute;
