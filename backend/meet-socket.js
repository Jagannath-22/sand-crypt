// backend/meet-socket.js
export default function mountMeetNamespace(io) {
  const nsp = io.of("/meet");

  nsp.on("connection", (socket) => {
    // client sends: { roomId, displayName }
    socket.on("join-room", ({ roomId, displayName }) => {
      socket.data.roomId = roomId;
      socket.data.displayName = displayName || "Guest";
      socket.join(roomId);

      // tell others someone joined
      socket.to(roomId).emit("user-joined", {
        socketId: socket.id,
        displayName: socket.data.displayName,
      });

      // return current peers in room
      const clients = [...nsp.adapter.rooms.get(roomId) || []].filter(id => id !== socket.id);
      socket.emit("existing-peers", clients);
    });

    // WebRTC signaling
    socket.on("offer", ({ to, sdp }) => nsp.to(to).emit("offer", { from: socket.id, sdp }));
    socket.on("answer", ({ to, sdp }) => nsp.to(to).emit("answer", { from: socket.id, sdp }));
    socket.on("ice-candidate", ({ to, candidate }) =>
      nsp.to(to).emit("ice-candidate", { from: socket.id, candidate })
    );

    // Chat message signaling
    socket.on("send-chat-message", ({ to, message }) => {
      socket.to(to).emit("chat-message", {
        from: socket.data.displayName || "Guest",
        message: message.message,
        timestamp: message.timestamp,
      });
    });

    socket.on("leave-room", () => handleLeave(socket));
    socket.on("disconnect", () => handleLeave(socket));

    function handleLeave(sock) {
      const roomId = sock.data.roomId;
      if (!roomId) return;
      sock.to(roomId).emit("user-left", { socketId: sock.id });
      sock.leave(roomId);
      sock.data.roomId = null;
    }
  });
}