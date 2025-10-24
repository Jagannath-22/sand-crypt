// frontend/src/meeting/pages/MeetingRoom.jsx
import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useMeetingSocket } from "../MeetingSocketContext";
import { PhoneOff, Mic, Video, Settings } from "lucide-react";

const MeetingRoom = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { joinRoom, peers, localStreamRef, peerError, peerReady } =
    useMeetingSocket();

  const [showCard, setShowCard] = useState(true);
  const [micOn, setMicOn] = useState(true);
const [camOn, setCamOn] = useState(true);

const toggleMic = () => {
  if (localStreamRef.current) {
    localStreamRef.current.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
    });
  }
};

const toggleCam = () => {
  if (localStreamRef.current) {
    localStreamRef.current.getVideoTracks().forEach(track => {
      track.enabled = !track.enabled;
      setCamOn(track.enabled);
    });
  }
};


  // ✅ Run once per room
  useEffect(() => {
    const userId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    joinRoom(roomId, userId);
  }, [roomId, joinRoom]);

  if (peerError) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-red-500 text-lg">
        ❌ Meet error: {peerError}. Try refreshing.
      </div>
    );
  }

  if (!peerReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-gray-300 text-lg">
        🔄 Connecting to meeting server...
      </div>
    );
  }

  return (
    <div className="relative bg-black h-screen flex flex-col">
      {/* Meeting Ready Card - bottom left, stable */}
      {showCard && (
        <div className="absolute bottom-6 left-6 bg-white text-black p-4 rounded-xl shadow-lg w-80">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold">Your meeting’s ready</h2>
            <button onClick={() => setShowCard(false)}>✖</button>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full mb-3"
          >
            📋 Copy Link
          </button>
          <p className="text-sm text-gray-600 break-all">
            {window.location.href}
          </p>
        </div>
      )}

      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 place-items-center">
        {/* Local video */}
        <video
          ref={(videoEl) => {
            if (videoEl && localStreamRef.current) {
              videoEl.srcObject = localStreamRef.current;
              videoEl.play().catch(() => {});
            }
          }}
          muted
          autoPlay
          playsInline
          className="w-full h-full max-h-[300px] rounded-xl border border-gray-700 shadow-lg object-cover"
        />

        {/* Remote videos */}
        {Object.entries(peers).length === 0 ? (
          <p className="text-gray-400 text-center w-full col-span-full">
            👀 Waiting for participants...
          </p>
        ) : (
          Object.entries(peers).map(([id, stream]) => (
            <video
              key={id}
              ref={(videoEl) => {
                if (videoEl && stream) {
                  videoEl.srcObject = stream;
                  videoEl.play().catch(() => {});
                }
              }}
              autoPlay
              playsInline
              className="w-full h-full max-h-[300px] rounded-xl border border-gray-700 shadow-lg object-cover"
            />
          ))
        )}
      </div>

      {/* Control Bar */}
<div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-6 bg-[#1a1a1a] px-6 py-3 rounded-full shadow-xl">
  <button
    onClick={() => navigate("/meeting/home")}
    className="w-12 h-12 flex items-center justify-center bg-red-600 rounded-full hover:bg-red-700 transition text-white"
  >
    <PhoneOff className="w-6 h-6" />
  </button>

  <button
    onClick={toggleMic}
    className={`w-12 h-12 flex items-center justify-center rounded-full transition text-white ${
      micOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"
    }`}
  >
    <Mic className="w-6 h-6" />
  </button>

  <button
    onClick={toggleCam}
    className={`w-12 h-12 flex items-center justify-center rounded-full transition text-white ${
      camOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"
    }`}
  >
    <Video className="w-6 h-6" />
  </button>

  <button className="w-12 h-12 flex items-center justify-center bg-gray-700 rounded-full hover:bg-gray-600 transition text-white">
    <Settings className="w-6 h-6" />
  </button>
</div>

    </div>
  );
};

export default MeetingRoom;
