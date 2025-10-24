// frontend/src/meeting/MeetingSocketContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import Peer from "peerjs";

const MeetingSocketContext = createContext();
export const useMeetingSocket = () => useContext(MeetingSocketContext);

export const MeetingSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [peers, setPeers] = useState({});
  const [peerError, setPeerError] = useState(null);
  const [peerReady, setPeerReady] = useState(false);

  const localStreamRef = useRef(null);
  const peerRef = useRef(null);

  useEffect(() => {
    const s = io("https://chatnet-jo4c.onrender.com");
    setSocket(s);

    const p = new Peer(undefined, {
      host: "0.peerjs.com",
      port: 443,
      path: "/",
      secure: true,
    });
    peerRef.current = p;

    p.on("open", (id) => {
      console.log("✅ PeerJS connected with ID:", id);
      setPeerReady(true);
    });

    p.on("error", (err) => {
      console.error("❌ PeerJS error:", err);
      setPeerError(err.type || "PeerJS connection failed");
      setPeerReady(false);
    });

    return () => {
      s.disconnect();
      p.destroy();
    };
  }, []);


//  Memoized joinRoom
const joinRoom = useCallback(async (roomId, userId) => {
  if (!socket || !peerRef.current) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localStreamRef.current = stream;

    // Wait until PeerJS is ready
    peerRef.current.on("open", (peerId) => {
      // send peerId instead of random userId
      socket.emit("join-room", roomId, peerId);
    });

    peerRef.current.on("call", (call) => {
      call.answer(stream);
      call.on("stream", (remoteStream) => {
        setPeers((prev) => ({ ...prev, [call.peer]: remoteStream }));
      });
    });

    socket.on("user-connected", (newPeerId) => {
      const call = peerRef.current.call(newPeerId, stream);
      call.on("stream", (remoteStream) => {
        setPeers((prev) => ({ ...prev, [newPeerId]: remoteStream }));
      });
    });

    socket.on("user-disconnected", (disconnectedPeerId) => {
      setPeers((prev) => {
        const updated = { ...prev };
        delete updated[disconnectedPeerId];
        return updated;
      });
    });
  } catch (err) {
    console.error("❌ Media error:", err);
    setPeerError("Camera or microphone blocked");
  }
}, [socket]);


  return (
    <MeetingSocketContext.Provider
      value={{ socket, joinRoom, peers, localStreamRef, peerError, peerReady }}
    >
      {children}
    </MeetingSocketContext.Provider>
  );
};
