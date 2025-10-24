// frontend/src/components/CallOverlay.jsx
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSocketContext } from "../context/SocketContext";
import { FaTimesCircle, FaPhone } from "react-icons/fa"; // Added FaPhone for audio call icon

export default function CallOverlay() {
  // Destructure subscribed states from SocketContext for rendering and logic
  const { activeCall, endCall, localStream: localStreamState, remoteStream: remoteStreamState, localVideoRef, remoteVideoRef } = useSocketContext();
  const boxRef = useRef(null);
  const [position, setPosition] = useState({ x: window.innerWidth - 380, y: window.innerHeight - 250 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Reset position and dimensions when a call starts
  useEffect(() => {
    if (activeCall) {
      // Set initial position to bottom-right, relative to window size
      setPosition({ x: window.innerWidth - 380, y: window.innerHeight - 250 });
    }
  }, [activeCall]);

  // Drag behavior for the floating window
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;

    const onMouseMove = (e) => {
      if (isDragging) {
        // Update position based on mouse movement and initial offset
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const onMouseUp = () => {
      setIsDragging(false); // Stop dragging when mouse button is released
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      // Cleanup event listeners when component unmounts or dependencies change
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, dragOffset, position.x, position.y]); // Dependencies for drag effect

  const onMouseDownDrag = (e) => {
    setIsDragging(true); // Start dragging
    // Calculate offset from mouse pointer to element's top-left corner
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  if (!activeCall) return null; // Don't render if no active call

  const isVideoCall = activeCall.type === 'video';
  const width = isVideoCall ? 360 : 180; // Differentiate width for video vs audio
  const height = isVideoCall ? 220 : 120; // Differentiate height for video vs audio

  return createPortal(
    <div
      ref={boxRef}
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        width: width,
        height: height,
        zIndex: 9999, // Ensure it floats above other content
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0,0,0,.35)",
        background: "#111",
        transition: isDragging ? 'none' : 'transform 0.1s ease-out, width 0.3s ease-out, height 0.3s ease-out', // Smooth transition for non-dragging movement and size changes
        cursor: isDragging ? 'grabbing' : 'grab', // Change cursor during drag
        display: 'flex', // Use flexbox for internal layout (header + content)
        flexDirection: 'column',
      }}
    >
      <div 
        className="drag-handle" 
        onMouseDown={onMouseDownDrag} // Make header draggable
        style={{ 
          cursor: isDragging ? "grabbing" : "grab", 
          height: 28, 
          background: "#1d1d1d", 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '0 8px',
          color: '#bbb',
          fontSize: '0.8rem',
          flexShrink: 0, // Prevent header from shrinking
        }} 
      >
        <span>{activeCall.type === 'video' ? 'Video Call' : 'Audio Call'}</span>
      </div>
      
      {/* Conditional rendering for video or audio content area */}
      {isVideoCall ? (
        // Video Call content
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flexGrow: 1, gap: 4, padding: 4 }}>
          <video ref={localVideoRef} autoPlay playsInline muted srcObject={localStreamState} style={{ width: "100%", height: "100%", background: "#202733", borderRadius: 8, objectFit: 'cover' }} />
          <video ref={remoteVideoRef} autoPlay playsInline srcObject={remoteStreamState} style={{ width: "100%", height: "100%", background: "#202733", borderRadius: 8, objectFit: 'cover' }} />
        </div>
      ) : (
        // Audio Call content (displays a phone icon)
        <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: "#111", padding: 8 }}>
            <FaPhone className="w-10 h-10 text-green-500 animate-pulse" />
            {/* Audio elements are rendered for audio stream, but not visually */}
            <audio ref={localVideoRef} autoPlay playsInline muted srcObject={localStreamState}></audio>
            <audio ref={remoteVideoRef} autoPlay playsInline srcObject={remoteStreamState}></audio>
        </div>
      )}

      {/* End Call button */}
      <button
        onClick={endCall}
        style={{
          position: "absolute", // Position absolute within the floating div
          right: 8, 
          bottom: 8, 
          borderRadius: 999,
          padding: isVideoCall ? "8px 12px" : "6px 10px", // Dynamic padding
          border: "none",
          background: "#e53935",
          color: "white",
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 6px 20px rgba(229,57,53,.4)",
          display: 'flex',
          alignItems: 'center',
          gap: isVideoCall ? '5px' : '3px',
          fontSize: isVideoCall ? '0.9rem' : '0.8rem',
        }}
      >
        <FaTimesCircle style={{marginRight: '0px'}}/> {isVideoCall ? 'End Call' : 'End'} {/* Dynamic text */}
      </button>
    </div>,
    document.body // Render via portal to body
  );
}






// // frontend/src/components/CallOverlay.jsx

// import React, { useEffect, useRef, useState, useCallback } from "react";
// import { createPortal } from "react-dom";
// // Use the correct context hook for call-related functions
// import { useCallContext } from "../context/CallContext"; 
// // Use the zustand store for call states
// import useCall from "../zustand/useCall";
// import toast from "react-hot-toast";
// import { FaTimesCircle, FaPhone } from "react-icons/fa"; 
// import { useAuthContext } from "../context/AuthContext";
// // Corrected import: useConversation is a default export
// import useConversation from "../zustand/useConversation";

// export default function CallOverlay() {
//     const { authUser } = useAuthContext();
//     const { selectedConversation } = useConversation();
//     const { activeCall, localStream, remoteStream, resetCallState, toggleMic, toggleVideo } = useCall();
//     const { endCall } = useCallContext();

//     const [isDraggable, setIsDraggable] = useState(false);
//     const [isResizing, setIsResizing] = useState(false);
//     const [position, setPosition] = useState({ x: window.innerWidth - 380, y: window.innerHeight - 250 });
//     const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
//     const [dimensions, setDimensions] = useState({
//         width: activeCall?.type === 'video' ? 360 : 180,
//         height: activeCall?.type === 'video' ? 220 : 120
//     });

//     const localVideoRef = useRef(null);
//     const remoteVideoRef = useRef(null);

//     // Update dimensions based on call type
//     useEffect(() => {
//         if (activeCall) {
//             setDimensions({
//                 width: activeCall.type === 'video' ? 360 : 180,
//                 height: activeCall.type === 'video' ? 220 : 120
//             });
//             // Reset position on new call
//             setPosition({ x: window.innerWidth - 380, y: window.innerHeight - 250 });
//         }
//     }, [activeCall]);

//     // Attach streams to video elements
//     useEffect(() => {
//         if (localVideoRef.current && localStream) {
//             localVideoRef.current.srcObject = localStream;
//         } else if (localVideoRef.current) {
//             localVideoRef.current.srcObject = null;
//         }

//         if (remoteVideoRef.current && remoteStream) {
//             remoteVideoRef.current.srcObject = remoteStream;
//         } else if (remoteVideoRef.current) {
//             remoteVideoRef.current.srcObject = null;
//         }
//     }, [localStream, remoteStream]);

//     // Cleanup resources
//     useEffect(() => {
//         const handleBeforeUnload = (event) => {
//             if (activeCall) {
//                 event.preventDefault();
//                 event.returnValue = ''; // Required for Chrome
//                 endCall();
//             }
//         };

//         window.addEventListener('beforeunload', handleBeforeUnload);

//         return () => {
//             window.removeEventListener('beforeunload', handleBeforeUnload);
//             if (!activeCall) {
//                 resetCallState();
//             }
//         };
//     }, [activeCall, endCall, resetCallState]);


//     // Draggable/Resizable functionality (simplified for this example)
//     const onMouseDownDrag = (e) => {
//         setIsDraggable(true);
//         setDragOffset({
//             x: e.clientX - position.x,
//             y: e.clientY - position.y,
//         });
//     };

//     const onMouseMove = useCallback((e) => {
//         if (isDraggable) {
//             setPosition({
//                 x: e.clientX - dragOffset.x,
//                 y: e.clientY - dragOffset.y,
//             });
//         }
//     }, [isDraggable, dragOffset]);

//     const onMouseUp = useCallback(() => {
//         setIsDraggable(false);
//     }, []);

//     useEffect(() => {
//         if (isDraggable) {
//             window.addEventListener('mousemove', onMouseMove);
//             window.addEventListener('mouseup', onMouseUp);
//         } else {
//             window.removeEventListener('mousemove', onMouseMove);
//             window.removeEventListener('mouseup', onMouseUp);
//         }

//         return () => {
//             window.removeEventListener('mousemove', onMouseMove);
//             window.removeEventListener('mouseup', onMouseUp);
//         };
//     }, [isDraggable, onMouseMove, onMouseUp]);


//     if (!activeCall) return null;

//     const isVideoCall = activeCall.type === 'video';
//     const remoteUser = selectedConversation;
//     const isCaller = activeCall.isCaller;

//     return createPortal(
//         <div
//             style={{
//                 position: "fixed",
//                 left: position.x,
//                 top: position.y,
//                 width: dimensions.width,
//                 height: dimensions.height,
//                 zIndex: 9999,
//                 borderRadius: 16,
//                 overflow: "hidden",
//                 boxShadow: "0 10px 30px rgba(0,0,0,.35)",
//                 background: "#111",
//                 transition: isDraggable ? 'none' : 'transform 0.1s ease-out',
//                 cursor: isDraggable ? 'grabbing' : 'grab',
//                 display: 'flex',
//                 flexDirection: 'column',
//             }}
//         >
//             <div
//                 onMouseDown={onMouseDownDrag}
//                 style={{
//                     cursor: isDraggable ? "grabbing" : "grab",
//                     height: 28,
//                     background: "#1d1d1d",
//                     display: 'flex',
//                     justifyContent: 'space-between',
//                     alignItems: 'center',
//                     padding: '0 8px',
//                     color: '#bbb',
//                     fontSize: '0.8rem',
//                     flexShrink: 0,
//                 }}
//             >
//                 <span>
//                     {isCaller ? `Calling ${remoteUser?.displayName || '...'}` : `Incoming from ${remoteUser?.displayName || '...'}`}
//                 </span>
//                 <FaPhone style={{ color: isVideoCall ? 'cyan' : 'green' }} />
//             </div>

//             {isVideoCall ? (
//                 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flexGrow: 1, gap: 4, padding: 4 }}>
//                     <video ref={localVideoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", background: "#202733", borderRadius: 8, objectFit: 'cover' }} />
//                     <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "100%", height: "100%", background: "#202733", borderRadius: 8, objectFit: 'cover' }} />
//                 </div>
//             ) : (
//                 <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: "#111", padding: 8 }}>
//                     <FaPhone className="w-10 h-10 text-green-500 animate-pulse" />
//                     <audio ref={localVideoRef} autoPlay playsInline muted></audio>
//                     <audio ref={remoteVideoRef} autoPlay playsInline></audio>
//                 </div>
//             )}

//             <button
//                 onClick={endCall}
//                 style={{
//                     position: "absolute",
//                     right: 8,
//                     bottom: 8,
//                     borderRadius: 999,
//                     padding: isVideoCall ? "8px 12px" : "6px 10px",
//                     border: "none",
//                     background: "#e53935",
//                     color: "white",
//                     fontWeight: 600,
//                     cursor: "pointer",
//                     boxShadow: "0 6px 20px rgba(229,57,53,.4)",
//                     display: 'flex',
//                     alignItems: 'center',
//                     gap: '5px',
//                     fontSize: '0.9rem',
//                 }}
//             >
//                 <FaTimesCircle style={{marginRight: '0px'}}/> {isVideoCall ? 'End Call' : 'End'}
//             </button>
//         </div>,
//         document.body
//     );
// }