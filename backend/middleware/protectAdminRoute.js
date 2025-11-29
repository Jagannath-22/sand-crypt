import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";

const protectAdminRoute = async (req, res, next) => {
  try {
    const token = req.cookies.adminJwt;

    if (!token) {
      return res.status(401).json({ error: "Not authorized, token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.adminId).select("-password");

    if (!admin) {
      return res.status(401).json({ error: "Not authorized, admin not found" });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error("Error in protectAdminRoute:", error.message);
    return res.status(401).json({ error: "Not authorized, token invalid" });
  }
};

export default protectAdminRoute;
