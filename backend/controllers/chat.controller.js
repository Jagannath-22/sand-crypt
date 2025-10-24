// backend/controllers/chat.controller.js
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js"; // Import User model to populate display names

export const sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const { receiverId } = req.params; // Get receiverId from URL parameters
        const senderId = req.user._id; // `req.user` is set by protectRoute middleware

        // Find existing conversation or create a new one
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
            });
        }

        // Create new message
        const newMessage = new Message({
            senderId,
            receiverId,
            message,
        });

        if (newMessage) {
            conversation.messages.push(newMessage._id);
        }

        // Save conversation and message in parallel for efficiency
        await Promise.all([conversation.save(), newMessage.save()]);

        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Error in sendMessage controller:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { receiverId } = req.params;
        const senderId = req.user._id;

        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        }).populate("messages"); // Populate the actual message documents

        if (!conversation) {
            return res.status(200).json([]); // No messages yet, return empty array
        }

        const messages = conversation.messages;
        res.status(200).json(messages);
    } catch (error) {
        console.error("Error in getMessages controller:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get all conversations for the authenticated user (list for the left sidebar)
export const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        const conversations = await Conversation.find({
            participants: userId,
        })
            .populate({
                path: "participants",
                select: "-password -isVerified",
                match: { _id: { $ne: userId } },
            })
            .select("-messages");

        const conversationList = conversations
            .map((conv) => {
                const other = conv.participants.find(
                    (p) => p && p._id.toString() !== userId.toString()
                );
                if (other) {
                    return {
                        _id: other._id,
                        username: other.username,
                        displayName: other.displayName || other.username,
                        profilePic: other.profilePic,
                        gender: other.gender,
                        mobile: other.mobile,
                    };
                }
                return null;
            })
            .filter(Boolean);

        const unique = Array.from(
            new Map(conversationList.map((i) => [i._id.toString(), i])).values()
        );

        res.status(200).json(unique);
    } catch (error) {
        console.error("Error in getConversations controller:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// NEW: create-or-get conversation so clicking a search result opens the panel immediately
export const ensureConversation = async (req, res) => {
    try {
        const ownerId = req.user._id;
        const { userId } = req.params; // the other user's id

        // Validate target user exists
        const otherUser = await User.findById(userId).select(
            "_id username displayName profilePic gender mobile"
        );
        if (!otherUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Find or create conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [ownerId, userId] },
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [ownerId, userId],
            });
        }

        // Return a “sidebar conversation item shape” for the other user
        const other = {
            _id: otherUser._id,
            username: otherUser.username,
            displayName: otherUser.displayName || otherUser.username,
            profilePic: otherUser.profilePic,
            gender: otherUser.gender,
            mobile: otherUser.mobile,
        };

        res.status(200).json({ conversationId: conversation._id, other });
    } catch (error) {
        console.error("Error in ensureConversation controller:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};
