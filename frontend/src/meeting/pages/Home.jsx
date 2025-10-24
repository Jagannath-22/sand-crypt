// frontend/src/meeting/pages/Home.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { ArrowLeft } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const [codeOrLink, setCodeOrLink] = useState("");

  const createMeeting = () => {
    const roomId = uuidv4().split("-")[0];
    navigate(`/meeting/room/${roomId}`, { state: { host: true } });
  };

  const join = () => {
    const text = codeOrLink.trim();
    if (!text) return;

    try {
      const url = new URL(text);
      const parts = url.pathname.split("/");
      const maybe = parts.pop() || parts.pop();
      if (maybe) {
        navigate(`/meeting/${maybe}`, { state: { host: false } });
        return;
      }
    } catch {
      // not a URL → treat as meeting code
    }

    navigate(`/meeting/${text}`, { state: { host: false } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-0 bg-[#0f0f10]">
      {/* Smooth gradient bg with blur glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#111827] via-[#0f172a] to-[#0f0f10]"></div>
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>

      {/* Main card */}
      <div className="relative w-full max-w-3xl rounded-2xl shadow-2xl border border-white/10 bg-[#121212]/95 backdrop-blur-xl p-10">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)} // ✅ Go back one page (to CallPanel)
            className="p-2 rounded-full bg-[#1e1e1e] hover:bg-pink-400 text-white transition"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-4xl font-extrabold text-white">
            SandCrypt <span className="text-pink-300">Meet</span>
          </h1>
        </div>

        <p className="text-gray-400 mb-8 text-lg">
          Fast, private meeting links. Create or join a secure meeting instantly.
        </p>

        {/* Actions */}
        <div className="space-y-6">
          <button
            onClick={createMeeting}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xl font-semibold shadow-lg transition"
          >
            ➕ New Meeting
          </button>

          <div className="flex items-center space-x-3">
            <input
              value={codeOrLink}
              onChange={(e) => setCodeOrLink(e.target.value)}
              placeholder="Paste meeting link or code"
              className="flex-1 px-4 py-3 rounded-lg text-lg bg-[#1e1e1e] text-white placeholder-gray-400 outline-none border border-white/10 focus:border-pink-500 transition"
              onKeyDown={(e) => e.key === "Enter" && join()}
            />
            <button
              onClick={join}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-lg shadow"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
