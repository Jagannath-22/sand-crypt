// routes/user.routes.js
import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { getUsersForSidebar, searchUserByQuery } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/", protectRoute, getUsersForSidebar);

router.get("/search", protectRoute, searchUserByQuery); // <-- Use the new function here

export default router;