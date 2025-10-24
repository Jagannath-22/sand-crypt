// frontend/src/pages/home/Home.jsx
import React, { useState } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import SidebarNav from "../../components/sidebar/SidebarNav";
import MessageContainer from "../../components/sidebar/messages/MessageContainer";

const Home = () => {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    return parseInt(localStorage.getItem("sidebarWidth")) || 300;
  });
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = () => setIsResizing(true);
  const stopResizing = () => setIsResizing(false);
  const resize = (e) => {
    if (isResizing) {
      const newWidth = Math.min(Math.max(e.clientX - 60, 200), 500);
      setSidebarWidth(newWidth);
      localStorage.setItem("sidebarWidth", newWidth);
    }
  };

  React.useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  });

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#0f172a] text-white">
      {/* Slim Sidebar */}
      <SidebarNav />

      {/* Resizable Sidebar */}
      <div
        className="border-r border-gray-700 overflow-y-auto relative"
        style={{ width: `${sidebarWidth}px`, minWidth: "200px", maxWidth: "500px" }}
      >
        <Sidebar />
        {/* Resizer */}
        <div
          onMouseDown={startResizing}
          className="absolute top-0 right-0 w-1 cursor-ew-resize h-full bg-transparent hover:bg-gray-600"
        />
      </div>

      {/* RIGHT: Message Panel (this is what was missing) */}
      <div className="flex-1 flex flex-col">
        <MessageContainer />
      </div>
    </div>
  );
};

export default Home;
