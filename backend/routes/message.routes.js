import express from "express";
import { getMessages, sendMessage } from "../controllers/message.controller.js";
import protectRoute from "../middleware/protectRoute.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Get all messages between logged-in user and another user
router.get("/:id", protectRoute, getMessages);

// Send a message (with optional file upload)
router.post("/send/:id", protectRoute, upload.single("file"), sendMessage);

export default router;
