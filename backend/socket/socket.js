import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            "http://localhost:3000",
            "https://sand-crypt.vercel.app",
        ],
        methods: ["GET", "POST"],
        credentials: true,
    },
});

export const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
};

const userSocketMap = {}; // {userId:socketId}

io.on("connection", (socket) => {
    console.log("A user connected", socket.id);

    const userId = socket.handshake.query.userId;
    if (userId && userId !== "undefined") {
        userSocketMap[userId] = socket.id;
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // --- PeerJS-related Socket.IO Signaling Events ---

    // This event is now primarily used by the caller's UI to indicate an outgoing call attempt
    // and by the receiver's UI to show a rejection or busy state.
    // PeerJS itself handles the direct call establishment.
    // The `callUser` and `acceptCall` events are largely replaced by PeerJS's internal mechanisms,
    // but we can use them to signal UI states.

    // Example of a minimal signaling for PeerJS (mostly for UI updates / status)
    socket.on("callUser", ({ userToCall, from, fromName, type }) => {
        const receiverSocketId = getReceiverSocketId(userToCall);
        if (receiverSocketId) {
            console.log(`Socket: Signaling for ${type} call to ${userToCall} from ${fromName} (via PeerJS).`);
            // We don't pass signal data here as PeerJS handles it.
            // This event can be used to trigger an "incoming call" prompt on the receiver.
            io.to(receiverSocketId).emit("peerJsIncomingCallNotification", {
                type,
                callerId: from,
                callerName: fromName,
                // No 'signal' data here, PeerJS will handle that.
            });
        } else {
            console.log(`Socket: User ${userToCall} is not online to receive call from ${fromName}`);
            socket.emit("userNotOnline", { userId: userToCall });
        }
    });

    // Receiver explicitly rejects the call (e.g., clicks "Decline" on prompt)
    socket.on("rejectCall", ({ to, reason }) => {
        const callerSocketId = getReceiverSocketId(to);
        if (callerSocketId) {
            console.log(`Socket: Call rejected by ${socket.handshake.query.userId} for ${to}, reason: ${reason || 'User rejected'}`);
            io.to(callerSocketId).emit("callRejected", { from: socket.handshake.query.userId, reason });
        }
    });

    // Either party ends the call
    socket.on("endCall", ({ to }) => {
        // 'to' here is the ID of the other user in the call
        const recipientSocketId = getReceiverSocketId(to);
        if (recipientSocketId) {
            console.log(`Socket: Call ended by ${socket.handshake.query.userId}. Notifying ${to}.`);
            io.to(recipientSocketId).emit("callEnded");
        }
        // Also ensure the sender's UI is reset in case of disconnect or edge cases
        socket.emit("callEnded"); 
    });

    // Check if user is online (for PeerJS `call` method if it returns null immediately)
    socket.on("checkUserOnline", ({ userId }) => {
        const targetSocketId = getReceiverSocketId(userId);
        if (!targetSocketId) {
            socket.emit("userNotOnline", { userId });
        }
    });


    // --- Disconnect Event ---
    socket.on("disconnect", () => {
        console.log("User disconnected", socket.id);
        if (userId && userSocketMap[userId]) {
            delete userSocketMap[userId];
        }
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
        // Potentially, if a user disconnects mid-call, notify their peer.
        // This is handled by PeerJS's own 'close' event on the call object,
        // but a redundant socket event could be useful for robustness.
    });
});

export { app, io, server };

