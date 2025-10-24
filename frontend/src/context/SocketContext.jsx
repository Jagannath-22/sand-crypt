// frontend/src/context/SocketContext.jsx

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { useAuthContext } from "./AuthContext";
import useCall from "../zustand/useCall";
import useConversation from "../zustand/useConversation"; // Corrected import
import { io } from "socket.io-client";
import Peer from 'peerjs';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocketContext = () => {
    return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
    const [socket, setSocket] = useState(null); // State for Socket.IO instance
    const [onlineUsers, setOnlineUsers] = useState([]);
    const { authUser } = useAuthContext();

    // Subscribed Zustand states for rendering in components that consume this context
    const activeCall = useCall(s => s.activeCall);
    const localStreamState = useCall(s => s.localStream);
    const remoteStreamState = useCall(s => s.remoteStream);

    // Zustand setters (these are stable and don't cause re-renders when passed as dependencies)
    const { setActiveCall, setLocalStream, setRemoteStream, resetCallState } = useCall();
    const { setMessages } = useConversation();

    const peerInstance = useRef(null); // Ref for PeerJS instance
    const currentCall = useRef(null); // Ref for the active PeerJS Call object
    const socketRef = useRef(null); // Ref to store the current Socket.IO instance for callbacks

    const localVideoRef = useRef(null); // Ref for local video element
    const remoteVideoRef = useRef(null); // Ref for remote video element

    // PeerJS server configuration
    const PEERJS_SERVER_HOST = '0.peerjs.com'; 
    const PEERJS_SERVER_PORT = 443;
    const PEERJS_SERVER_PATH = '/';


    // Define cleanupCallResources before useEffect
    const cleanupCallResources = useCallback(() => {
        console.log("Cleanup: Cleaning up call resources...");
        // Get localStream from the current Zustand state for direct use here
        const currentLocalStream = useCall.getState().localStream; 

        if (currentLocalStream) { 
            console.log("Cleanup: Stopping local media tracks.");
            currentLocalStream.getTracks().forEach(track => {
                if (track.readyState === 'live') { // Only stop if track is actively streaming
                    track.stop();
                }
            });
            setLocalStream(null); // Clear local stream state
        } else {
            console.log("Cleanup: No localStream to stop.");
        }

        if (currentCall.current) {
            console.log("Cleanup: Closing PeerJS call object (if exists).");
            if (!currentCall.current.closed) { // Only close if not already closed
                currentCall.current.close();
            }
            currentCall.current = null; // Clear the call ref
        } else {
            console.log("Cleanup: No active PeerJS call to close.");
        }
        setRemoteStream(null); // Clear remote stream state
        resetCallState(); // Reset global call state
        console.log("Cleanup: Call state reset.");
    }, [setLocalStream, setRemoteStream, resetCallState]); // Dependencies are stable Zustand setters


    // Define endCall before useEffect to prevent ReferenceError
    // This version is made more robust for use in cleanup scenarios
    const endCall = useCallback((notifyPeer = true) => { // Added notifyPeer parameter
      console.log(`End Call button/event triggered (notifyPeer: ${notifyPeer}).`);

      const active = useCall.getState().activeCall;
      const otherPeerId = active?.peerId;

      const currentSocket = socketRef.current; 
      if (notifyPeer && currentSocket && otherPeerId && authUser._id !== otherPeerId) {
        console.log(`EndCall: Emitting 'endCall' to ${otherPeerId}`);
        currentSocket.emit("endCall", { to: otherPeerId });
      } else if (notifyPeer) {
        console.log("EndCall: Not emitting 'endCall' (no socket, peerId, or self-call) but notifyPeer was true.");
      }

      if (currentCall.current && !currentCall.current.closed) {
        console.log("EndCall: Closing PeerJS call object.");
        try { currentCall.current.close(); } catch (e) { console.error("Error closing PeerJS call:", e); }
      } else {
        console.log("EndCall: No active PeerJS call object (or already closed).");
      }
      currentCall.current = null; // Always clear the call ref

      cleanupCallResources(); // Perform local cleanup
    }, [authUser, cleanupCallResources]);


    // Main useEffect for Socket.IO and PeerJS initialization/teardown
    useEffect(() => {
        let newSocket; // Declare newSocket here for cleanup scope
        let activePeer; // Declare activePeer here for cleanup scope

        const initializePeerJS = async (userIdToUse) => {
            console.log("PeerJS: Attempting to initialize with ID:", userIdToUse);
            
            // Destroy existing PeerJS instance if it exists and its ID is different
            if (peerInstance.current && peerInstance.current.id !== userIdToUse) {
                console.log("PeerJS: Destroying old peer instance before new initialization.");
                peerInstance.current.destroy();
                peerInstance.current = null;
            }

            try {
                activePeer = new Peer(userIdToUse, { // Assign to activePeer variable
                    host: PEERJS_SERVER_HOST,
                    port: PEERJS_SERVER_PORT,
                    path: PEERJS_SERVER_PATH,
                    secure: true,
                    debug: 3 // Set debug level to 3 for detailed logs
                });

                activePeer.on('open', (id) => {
                    console.log('PeerJS: Connected to server with ID:', id);
                    toast.success(`PeerJS ready! Your ID: ${id}`);
                    peerInstance.current = activePeer; // Assign to ref on successful open
                });

                activePeer.on('call', (call) => {
                    console.log('PeerJS: Incoming call received:', call);
                    // Get latest activeCall state directly from Zustand store
                    if (useCall.getState().activeCall) { 
                        console.log("PeerJS: Already in an active call, rejecting new incoming call.");
                        call.close();
                        socketRef.current?.emit("rejectCall", { to: call.peer, reason: "busy" }); 
                        toast.error(`You are already in a call. Rejected new call.`);
                        return;
                    }

                    currentCall.current = call; // Store the incoming call object
                    
                    const accept = window.confirm(`Incoming call from ${call.peer}. Accept ${call.metadata?.type || 'video'} call?`);

                    if (accept) {
                        const requestMedia = async () => {
                            let stream = null;
                            let actualCallType = call.metadata?.type || 'video';
                            const constraints = { audio: true, video: actualCallType === 'video' };

                            try {
                                console.log(`PeerJS: Attempting to get media for incoming call with constraints:`, constraints);
                                stream = await navigator.mediaDevices.getUserMedia(constraints);
                                console.log("PeerJS: Successfully got media stream for incoming call.");
                            } catch (err) {
                                console.error('PeerJS: Initial getUserMedia failed for incoming call:', err);
                                if (actualCallType === 'video' && err?.name === 'NotReadableError') {
                                    console.warn("PeerJS: Video device busy, trying audio-only as fallback for incoming call.");
                                    try {
                                        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                                        toast.warn("Video device busy, incoming call proceeding as audio-only.");
                                        setActiveCall(prev => ({ ...prev, type: 'audio' }));
                                        actualCallType = 'audio';
                                    } catch (audioErr) {
                                        console.error('PeerJS: Audio-only getUserMedia also failed for incoming call:', audioErr);
                                        throw audioErr;
                                    }
                                } else {
                                    throw err;
                                }
                            }
                            return { stream, actualCallType };
                        };

                        requestMedia()
                            .then(({ stream, actualCallType }) => {
                                if (!stream) {
                                    console.error("PeerJS: No stream obtained after media request for incoming call.");
                                    toast.error("Could not obtain media stream for incoming call.");
                                    cleanupCallResources();
                                    call.close();
                                    socketRef.current?.emit("rejectCall", { to: call.peer, reason: "media_access_failed" });
                                    return;
                                }

                                setLocalStream(stream);
                                call.answer(stream);
                                setActiveCall({ type: actualCallType, callerId: call.peer, receiverId: authUser._id, peerId: call.peer, status: 'connected', isCaller: false });
                                
                                call.on('stream', (remoteStream) => {
                                    console.log('PeerJS: Received remote stream from incoming call.');
                                    setRemoteStream(remoteStream);
                                });
                                call.on('close', () => {
                                    console.log('PeerJS: Incoming call closed (on close event).');
                                    cleanupCallResources();
                                    setMessages(prevMessages => [...prevMessages, { _id: Date.now(), senderId: "system", message: `Call with ${call.peer} ended.`, createdAt: new Date().toISOString(), type: "text", }]);
                                });
                                call.on('error', (err) => {
                                    console.error('PeerJS: Incoming call error (on error event):', err);
                                    toast.error("Call failed!");
                                    cleanupCallResources();
                                });
                                toast.success("Call connected!");
                                setMessages(prevMessages => [...prevMessages, { _id: Date.now(), senderId: "system", message: `You accepted a call from ${call.peer}.`, createdAt: new Date().toISOString(), type: "text", }]);
                            })
                            .catch(err => {
                                console.error('PeerJS: Final media access failed for incoming call:', err);
                                if (err?.name === "NotAllowedError") {
                                    toast.error("Permission denied: enable camera/mic for this site.");
                                } else if (err?.name === "NotFoundError") {
                                    toast.error("No camera or microphone found.");
                                } else if (err?.name === "NotReadableError") {
                                    toast.error("Camera is busy (used by another app) — close WhatsApp/Meet/Zoom and retry.");
                                } else if (err?.name === "OverconstrainedError") {
                                    toast.error("Camera constraints not supported by device.");
                                } else if (err?.name === "SecurityError") {
                                    toast.error("Camera requires a secure context (HTTPS/localhost).");
                                } else {
                                    toast.error("Could not access media devices for incoming call.");
                                }
                                cleanupCallResources();
                                try { call.close(); } catch {}
                                socketRef.current?.emit("rejectCall", { to: call.peer, reason: "media_access_failed" });
                            });
                    } else {
                        console.log('PeerJS: Incoming call rejected by user.');
                        call.close();
                        socketRef.current?.emit("rejectCall", { to: call.peer, reason: "user_rejected" });
                        setMessages(prevMessages => [...prevMessages, { _id: Date.now(), senderId: "system", message: `You rejected a call from ${call.peer}.`, createdAt: new Date().toISOString(), type: "text", }]);
                    }
                });

                activePeer.on('error', (err) => {
                    console.error("PeerJS: Peer instance error (on peer error event):", err);
                    if (err.type === 'peer-unavailable') {
                        toast.error("Recipient is not online or PeerJS ID is invalid.");
                    } else if (err.type === 'unavailable-id' || (err.message && err.message.includes('ID is taken'))) {
                        toast.error("PeerJS ID taken. Retrying with a unique ID.");
                        if (peerInstance.current && peerInstance.current.id === userIdToUse) { // Ensure it's THIS peer that failed
                            peerInstance.current.destroy();
                            peerInstance.current = null;
                        }
                        setTimeout(() => {
                           console.log("PeerJS: Retrying init with random ID due to ID taken.");
                           initializePeerJS(authUser._id + '-' + Math.random().toString(36).substring(7));
                        }, 1000);
                    } else {
                        toast.error("PeerJS connection error. Please check console.");
                    }
                    cleanupCallResources();
                });

                activePeer.on('disconnected', () => {
                    console.warn("PeerJS: Instance disconnected from server. Attempting reconnect...");
                    // This event can fire if the peer server connection drops.
                    // PeerJS usually handles reconnection, but if it doesn't, we might need to re-initialize.
                });

                activePeer.on('close', () => {
                    console.log("PeerJS: Instance connection closed (destroyed event).");
                    // Ensure peerInstance.current is cleared if the PeerJS instance is truly gone.
                    if (peerInstance.current && peerInstance.current.id === userIdToUse) { 
                         peerInstance.current = null;
                         console.log("PeerJS: peerInstance.current cleared after close.");
                    }
                });

            } catch (initError) {
                console.error("PeerJS: Failed to initialize Peer instance:", initError);
                toast.error("Failed to initialize PeerJS. Check console and network.");
            }
        };

        if (authUser) {
            // 1. Initialize Socket.IO connection
            newSocket = io("https://chatnet-jo4c.onrender.com", {
                query: { userId: authUser._id },
                reconnection: true, reconnectionAttempts: 5, reconnectionDelay: 1000,
                timeout: 20000, transports: ['websocket', 'polling'],
            });
            setSocket(newSocket); // Update state
            socketRef.current = newSocket; // Update ref for callbacks

            newSocket.on("getOnlineUsers", (users) => setOnlineUsers(users));

            // 2. Initialize PeerJS instance ONLY if one doesn't exist or is not open
            if (!peerInstance.current || !peerInstance.current.open) {
                initializePeerJS(authUser._id);
            } else {
                console.log("PeerJS: Peer instance already exists and is open. Using existing instance:", peerInstance.current.id);
            }

            // Socket.IO listeners for call events
            // These listeners are crucial for real-time signaling
            newSocket.on("callRejected", ({ from, reason }) => {
                console.log(`Socket.IO: Call rejected by: ${from}, reason: ${reason || 'User rejected'}`);
                toast.error(`Call rejected${reason ? ` (${reason})` : ''}.`);
                cleanupCallResources();
                setMessages(prevMessages => [...prevMessages, { _id: Date.now(), senderId: "system", message: `Your call was rejected.`, createdAt: new Date().toISOString(), type: "text", }]);
            });
            newSocket.on("callEnded", () => {
                console.log("Socket.IO: Call ended event received.");
                cleanupCallResources(); // THIS IS CRUCIAL: Resets activeCall state
                setMessages(prevMessages => [...prevMessages, { _id: Date.now(), senderId: "system", message: "The call has ended.", createdAt: new Date().toISOString(), type: "text", }]);
            });
            newSocket.on("userNotOnline", ({ userId }) => {
                console.log(`Socket.IO: User ${userId} is not online.`);
                toast.error("Recipient is not online.");
                cleanupCallResources();
                setMessages(prevMessages => [...prevMessages, { _id: Date.now(), senderId: "system", message: `Recipient is not online. Call ended.`, createdAt: new Date().toISOString(), type: "text", }]);
            });

        } else {
            // When authUser becomes null (logout), clean up all resources
            console.log("SocketContext cleanup: AuthUser null or changed, cleaning up resources.");
            if (socketRef.current) { 
                socketRef.current.close();
                setSocket(null);
                socketRef.current = null;
            }
            if (peerInstance.current) { 
                peerInstance.current.destroy(); 
                peerInstance.current = null;
            }
            cleanupCallResources(); 
        }

        // Add 'beforeunload' listener for browser tab close/refresh
        const handleUnload = () => {
            console.log("Window 'beforeunload' event triggered.");
            // Pass false to notifyPeer to prevent double-emit if PeerJS itself triggers close
            // But we need to ensure the socket emits even if PeerJS isn't fully cleaned up.
            const currentActiveCallState = useCall.getState().activeCall;
            if (socketRef.current && currentActiveCallState && currentActiveCallState.peerId) {
                console.log(`Unload: Emitting 'endCall' to ${currentActiveCallState.peerId} due to browser unload.`);
                socketRef.current.emit("endCall", { to: currentActiveCallState.peerId });
            }
            // Always perform local cleanup quickly
            cleanupCallResources();
            // Destroy PeerJS instance to force server cleanup of the ID
            if (peerInstance.current) {
                console.log("Unload: Destroying PeerJS instance to release ID.");
                peerInstance.current.destroy();
                peerInstance.current = null;
            }
        };
        window.addEventListener('beforeunload', handleUnload);

        // Cleanup function for this useEffect
        return () => {
            console.log("SocketContext unmount cleanup: Running effect cleanup.");
            window.removeEventListener('beforeunload', handleUnload); 

            if (newSocket) { // Use newSocket declared in this scope for cleanup
                newSocket.off("getOnlineUsers");
                newSocket.off("callRejected");
                newSocket.off("callEnded");
                newSocket.off("userNotOnline");
                newSocket.close();
                console.log("Socket.IO: Socket closed on unmount.");
            }
            // This destruction is vital for the 'ID is taken' issue on refresh
            if (peerInstance.current) { 
               console.log("SocketContext unmount cleanup: Destroying PeerJS instance for component unmount.");
               peerInstance.current.destroy();
               peerInstance.current = null;
            }
            cleanupCallResources(); // Final local cleanup
            socketRef.current = null; // Clear socket ref on unmount
        };

    // Dependencies: This effect should ONLY re-run when authUser changes (login/logout).
    // cleanupCallResources and endCall are stable due to useCallback. setMessages is a stable setter.
    }, [authUser, cleanupCallResources, setMessages, endCall]);


    // Effect to assign local stream to video element
    useEffect(() => {
        if (localVideoRef.current && localStreamState) {
            console.log("VideoRef: Assigning local stream to video element.");
            localVideoRef.current.srcObject = localStreamState;
        } else {
            console.log("VideoRef: No localStreamState or localVideoRef for assignment.");
        }
    }, [localStreamState]); // Depend on subscribed state

    // Effect to assign remote stream to video element
    useEffect(() => {
        if (remoteVideoRef.current && remoteStreamState) {
            console.log("VideoRef: Assigning remote stream to video element.");
            remoteVideoRef.current.srcObject = remoteStreamState;
        } else {
            console.log("VideoRef: No remoteStreamState or remoteVideoRef for assignment.");
        }
    }, [remoteStreamState]); // Depend on subscribed state


    // Function to start a call using PeerJS
    const startCall = async (type, recipientId) => {
        const currentActiveCall = useCall.getState().activeCall; 

        if (!socketRef.current) { // Use socketRef here
            toast.error("Socket not connected.");
            return;
        }
        if (!peerInstance.current || !peerInstance.current.open) {
            console.warn("StartCall: PeerJS instance not ready or not open. Current state:", peerInstance.current?.open);
            toast.error("PeerJS not ready. Please wait a moment and try again.");
            if (!peerInstance.current && authUser?._id) { // If peerInstance is null, try to initialize
                console.log("StartCall: PeerJS not found, attempting re-initialization.");
                initializePeerJS(authUser._id);
            }
            return;
        }
        if (!recipientId) {
            toast.error("No recipient selected for call.");
            return;
        }
        if (currentActiveCall) { 
            toast.error("You are already in a call.");
            return;
        }
        if (authUser._id === recipientId) {
            toast.error("Cannot call yourself!");
            return;
        }

        try {
            console.log("StartCall: Getting local media stream with type:", type);
            let stream = null;
            let actualCallType = type; // Store original requested type, will update if fallback happens
            const constraints = { audio: true, video: type === 'video' };

            try {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (err) {
                console.error('StartCall: Initial getUserMedia failed:', err);
                if (type === 'video' && err?.name === 'NotReadableError') {
                    console.warn("StartCall: Video device busy, trying audio-only as fallback.");
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                        toast.warn("Video device busy, call proceeding as audio-only.");
                        actualCallType = 'audio'; // Adjust actual type for activeCall state
                    } catch (audioErr) {
                        console.error('StartCall: Audio-only getUserMedia also failed:', audioErr);
                        throw audioErr; // Re-throw if audio also fails
                    }
                } else {
                    throw err; // Re-throw other errors
                }
            }
            
            if (!stream) {
                console.error("StartCall: No stream obtained after media request.");
                toast.error("Could not obtain media stream for outgoing call.");
                cleanupCallResources();
                return;
            }
            setLocalStream(stream);

            setActiveCall({ type: actualCallType, callerId: authUser._id, receiverId: recipientId, peerId: recipientId, status: 'outgoing', isCaller: true });

            console.log(`StartCall: Making PeerJS call to ID: ${recipientId} with local stream.`);
            const call = peerInstance.current.call(recipientId, stream, { metadata: { type: actualCallType } }); // Use actualCallType in metadata
            
            if (call) {
                currentCall.current = call;

                call.on('stream', (remoteStream) => {
                    console.log('PeerJS: Outgoing call received remote stream.');
                    setRemoteStream(remoteStream);
                    setActiveCall(prev => ({ ...prev, status: 'connected' }));
                    toast.success("Call connected!");
                });
                call.on('close', () => {
                    console.log('PeerJS: Outgoing call closed (on close event).');
                    cleanupCallResources();
                    setMessages(prevMessages => [...prevMessages, { _id: Date.now(), senderId: "system", message: `Call with ${recipientId} ended.`, createdAt: new Date().toISOString(), type: "text", }]);
                });
                call.on('error', (err) => {
                    console.error('PeerJS: Outgoing call error (on error event):', err);
                    toast.error("Call failed!");
                    cleanupCallResources();
                });
                console.log(`StartCall: PeerJS call object created successfully for ${recipientId}.`);
            } else {
                console.error("StartCall: PeerJS call object was null/undefined, likely recipient not found or PeerJS error.");
                toast.error("Could not initiate call. Recipient might be offline or ID invalid.");
                cleanupCallResources();
                socketRef.current?.emit("checkUserOnline", { userId: recipientId });
            }

            setMessages(prevMessages => [...prevMessages, { _id: Date.now(), senderId: "system", message: `You started a ${actualCallType} call.`, createdAt: new Date().toISOString(), type: "text", }]);

        } catch (err) {
            console.error("StartCall: Error getting user media or initiating call:", err);
            // Granular error messages for media access failures
            if (err?.name === "NotAllowedError") {
                toast.error("Permission denied: enable camera/mic for this site.");
            } else if (err?.name === "NotFoundError") {
                toast.error("No camera or microphone found.");
            } else if (err?.name === "NotReadableError") {
                toast.error("Camera is busy (used by another app) — close WhatsApp/Meet/Zoom and retry.");
            } else if (err?.name === "OverconstrainedError") {
                toast.error("Camera constraints not supported by device.");
            } else if (err?.name === "SecurityError") {
                toast.error("Camera requires a secure context (HTTPS/localhost).");
            } else {
                toast.error("Could not access media devices for outgoing call.");
            }
            cleanupCallResources();
        }
    };


    return (
        <SocketContext.Provider value={{ 
            socket, // Using state for direct reference, though socketRef.current is used in callbacks
            onlineUsers, 
            startCall, 
            endCall, 
            activeCall, // Subscribed state
            localStream: localStreamState, // Subscribed state
            remoteStream: remoteStreamState, // Subscribed state
            localVideoRef, 
            remoteVideoRef 
        }}>
            {children}
        </SocketContext.Provider>
    );
};