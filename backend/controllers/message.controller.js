// // backend/controllers/message.controller.js
// import Conversation from "../models/conversation.model.js";
// import Message from "../models/message.model.js";
// import { getReceiverSocketId, io } from "../socket/socket.js";


// // ✅ Send message (text + file)
// export const sendMessage = async (req, res) => {
//   try {
//     const { message } = req.body;
//     const { id: receiverId } = req.params;
//     const senderId = req.user._id;

//     // find or create conversation
//     let conversation = await Conversation.findOne({
//       participants: { $all: [senderId, receiverId] },
//     });

//     if (!conversation) {
//       conversation = await Conversation.create({
//         participants: [senderId, receiverId],
//       });
//     }

//     // detect type properly
//     let type = "text";
//     if (req.file) {
//       const mimeType = req.file.mimetype.split("/")[0]; // "image" | "video" | "audio" | "application"
//       type = mimeType === "application" ? "document" : mimeType;
//     }

//     // create message object
//     const newMessage = new Message({
//       senderId,
//       receiverId,
//       message: req.file ? "" : message, // only save text if not file
//       type,
//       fileUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
//       fileName: req.file ? req.file.originalname : undefined,
//     });

//     // push into conversation
//     conversation.messages.push(newMessage._id);

//     // save both
//     await Promise.all([conversation.save(), newMessage.save()]);

//     // socket.io push to receiver
//     const receiverSocketId = getReceiverSocketId(receiverId);
//     if (receiverSocketId) {
//       io.to(receiverSocketId).emit("newMessage", newMessage);
//     }

//     res.status(201).json(newMessage);
//   } catch (error) {
//     console.error("Error in sendMessage controller:", error.message);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };


// // ✅ Get all messages in conversation
// export const getMessages = async (req, res) => {
//   try {
//     const { id: userToChatId } = req.params;
//     const senderId = req.user._id;

//     const conversation = await Conversation.findOne({
//       participants: { $all: [senderId, userToChatId] },
//     }).populate("messages");

//     if (!conversation) {
//       return res.status(200).json([]);
//     }

//     res.status(200).json(conversation.messages);
//   } catch (error) {
//     console.error("Error in getMessages controller:", error.message);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };








import Conversation from "../models/conversation.model.js";
// import Message from "../models/message.model.js"; <-- REMOVED CONFLICTING IMPORT
import { getReceiverSocketId, io } from "../socket/socket.js";
import mongoose from "mongoose"; 

// ✅ Send message (text + file)
export const sendMessage = async (req, res) => {
    try {
        const Message = mongoose.model('Message'); // Get model reference here
        
        // If you are using FormData, the message (text) content will also be in req.body.
        const { message } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        // find or create conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
            });
        }

        // detect type properly
        let type = "text";
        if (req.file) {
            const mimeType = req.file.mimetype.split("/")[0]; // "image" | "video" | "audio" | "application"
            type = mimeType === "application" ? "document" : mimeType;
        }

        // create message object
        const newMessage = new Message({ // Uses the model reference fetched above
            senderId,
            receiverId,
            // FIXED: If a file is present, use the message text if provided, 
            // otherwise use "[Sent File]" placeholder text.
            message: req.file ? (message || `[Sent ${type}]`) : message, 
            type,
            fileUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
            fileName: req.file ? req.file.originalname : undefined,
        });

        // push into conversation
        conversation.messages.push(newMessage._id);

        // save both
        await Promise.all([conversation.save(), newMessage.save()]);

        // socket.io push to receiver
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Error in sendMessage controller:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ✅ Get all messages in conversation
export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const senderId = req.user._id;
        
        // CRITICAL FIX: Ensure the Message model is registered and available
        // by checking and fetching it directly from Mongoose's global registry.
        if (!mongoose.models.Message) {
            mongoose.model('Message');
        }

        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, userToChatId] }, 
        }).populate("messages");

        if (!conversation) {
            return res.status(200).json([]);
        }

        res.status(200).json(conversation.messages);
    } catch (error) {
        console.error("Error in getMessages controller:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};




