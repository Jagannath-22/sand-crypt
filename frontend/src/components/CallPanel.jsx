// frontend/src/meeting/components/CallPanel.jsx
import { useNavigate } from "react-router-dom";
import { Rnd } from "react-rnd"; // install: npm install react-rnd
import { useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react"; // install: npm install lucide-react

const CallPanel = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [isMaximized, setIsMaximized] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
      <Rnd
        default={{
          x: window.innerWidth * 0.1,
          y: window.innerHeight * 0.1,
          width: window.innerWidth * 0.75, // 75% default width
          height: window.innerHeight * 0.8, //  80% default height
        }}
        minWidth={400}
        minHeight={300}
        bounds="window"
        dragHandleClassName="drag-handle"
        enableResizing={!isMaximized}
        disableDragging={isMaximized}
        {...(isMaximized && {
          size: { width: "100%", height: "100%" },
          position: { x: 0, y: 0 },
        })}
        className="rounded-2xl shadow-2xl border border-white/10 bg-gradient-to-br from-[#1a1f2e] via-[#21283c] to-[#1a1f2e] transform transition-transform duration-300 hover:scale-[1.01]"
      >
        {/* Header */}
        <div className="drag-handle cursor-move bg-[#21283c]/70 p-4 rounded-t-2xl flex justify-between items-center border-b border-white/10">
          <h1 className="text-2xl font-bold text-white">
            Welcome to <span className="text-pink-500">SandCrypt Meet</span>
          </h1>
          <div className="flex gap-3 items-center">
            {/* Maximize / Restore */}
            <button
              onClick={() => setIsMaximized((m) => !m)}
              className="text-white hover:text-blue-400"
            >
              {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="text-white hover:text-pink-400 text-2xl"
            >
              ✖
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center justify-center gap-6 h-[85%] p-6 text-center">
          <p className="text-gray-400 text-lg mb-6">A secure Chanel</p>

          <button
            className="w-2/3 py-4 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xl font-semibold shadow-lg transition"
            onClick={() => {
              navigate("/meeting/home");
              onClose();
            }}
          >
             Go to Meeting Home
          </button>

          <button
            className="w-2/3 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xl font-semibold shadow-lg transition"
            onClick={() => {
              navigate("/meeting/join");
              onClose();
            }}
          >
            🎥 Join Meeting
          </button>
        </div>
      </Rnd>
    </div>
  );
};

export default CallPanel;
