// frontend/src/meeting/pages/JoinRoom.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function JoinRoom() {
  const [roomId, setRoomId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const navigate = useNavigate();

  const handleJoin = () => {
    if (!roomId.trim()) return;
    const id = roomId.trim();
    navigate(`/meeting/${id}`, { state: { name: displayName || "Guest" } });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-semibold mb-4">Join a meeting</h2>
        <p className="text-sm text-slate-500 mb-6">Enter the meeting code or paste the meeting link below.</p>

        <div className="space-y-4">
          <input
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Meeting code or link"
            className="w-full px-4 py-3 border rounded-lg outline-none"
          />
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name (optional)"
            className="w-full px-4 py-3 border rounded-lg outline-none"
          />
          <div className="flex gap-3">
            <button onClick={handleJoin} className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">
              Join meeting
            </button>
            <button onClick={() => navigate("/meeting")} className="py-3 px-4 bg-gray-200 rounded-lg">
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
