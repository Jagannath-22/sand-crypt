// frontend/src/meeting/pages/MeetPage.jsx
import React from "react";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import Home from "./Home";
import JoinRoom from "./JoinRoom";
import MeetingRoom from "./MeetingRoom";
import { MeetingSocketProvider } from "../MeetingSocketContext"; // adjust path if needed

// If you already provide MeetingSocketProvider at app-level, you can skip wrapping here.

export default function MeetPageWrapper() {
  return (
    <MeetingSocketProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/join" element={<JoinRoom />} />
        {/* dynamic room route (React Router should be configured to pass :roomId) */}
        <Route path="/room/:roomId" element={<MeetingRoom />} />
        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MeetingSocketProvider>
  );
}
