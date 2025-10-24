// backend/routes/chat.routes.js
import express from "express";
import {
  getMessages,
  sendMessage,
  getConversations,
  ensureConversation,
} from "../controllers/chat.controller.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

// Get messages with a specific user
router.get("/messages/:receiverId", protectRoute, getMessages);

// Send a message to a specific user
router.post("/send/:receiverId", protectRoute, sendMessage);

// List conversations for the authenticated user (left sidebar)
router.get("/list", protectRoute, getConversations);

// NEW: Ensure a conversation exists & return the “other user” shape for UI
router.post("/ensure/:userId", protectRoute, ensureConversation);

export default router;
