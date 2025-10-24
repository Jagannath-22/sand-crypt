import React, { useState } from "react";
import {
  FaUserLock,
  FaShieldAlt,
  FaPhoneAlt,
  FaUserCircle,
} from "react-icons/fa";
import EncryptionPanel from "./EncryptionPanel";
import SteganographyPanel from "./SteganographyPanel";
import CallPanel from "../CallPanel.jsx";

const SidebarNav = () => {
  const [showEnc, setShowEnc] = useState(false);
  const [showStego, setShowStego] = useState(false);
  const [showCall, setShowCall] = useState(false);

  return (
    <>
      <div className="w-[60px] h-full bg-[#0a0f1a] flex flex-col justify-between items-center py-4">
        {/* Top Icons */}
        <div className="flex flex-col gap-6 items-center text-white text-xl">
          <button
            title="Encryption"
            onClick={() => setShowEnc((v) => !v)}
            className="hover:text-pink-400 transition"
          >
            <FaShieldAlt />
          </button>

          <button
            title="Steganography"
            onClick={() => setShowStego((v) => !v)}
            className="hover:text-pink-400 transition"
          >
            <FaUserLock />
          </button>

          <button
            title="Call/Meet"
            onClick={() => setShowCall((v) => !v)}
            className="hover:text-pink-400 transition"
          >
            <FaPhoneAlt />
          </button>
        </div>

        {/* Bottom Profile Icon */}
        <div className="text-white text-2xl">
          <button title="Profile" className="hover:text-yellow-400 transition">
            <FaUserCircle />
          </button>
        </div>
      </div>

      {/* Panels */}
      <EncryptionPanel open={showEnc} onClose={() => setShowEnc(false)} />
      <SteganographyPanel open={showStego} onClose={() => setShowStego(false)} />
      <CallPanel open={showCall} onClose={() => setShowCall(false)} />
    </>
  );
};

export default SidebarNav;
