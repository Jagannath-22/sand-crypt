// frontend/src/context/CallContext.jsx

import React, { createContext, useContext, useEffect, useRef, useCallback } from "react";
import Peer from 'peerjs';
import toast from 'react-hot-toast';
import useCall from "../zustand/useCall";
import useConversation from "../zustand/useConversation";
import { useSocketContext } from "./SocketContext";
import { useAuthContext } from "./AuthContext";

const CallContext = createContext();

export const useCallContext = () => {
    return useContext(CallContext);
};

export const CallContextProvider = ({ children }) => {
    const { authUser } = useAuthContext();
    const { socket } = useSocketContext();
    const { setActiveCall, setLocalStream, setRemoteStream, resetCallState, localStream, remoteStream } = useCall();
    const { setMessages } = useConversation();
    const peerInstance = useRef(null);
    const currentCall = useRef(null);

    const cleanupCallResources = useCallback(() => {
        const currentLocalStream = useCall.getState().localStream;
        if (currentLocalStream) {
            currentLocalStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
        if (currentCall.current) {
            if (!currentCall.current.closed) {
                currentCall.current.close();
            }
            currentCall.current = null;
        }
        setRemoteStream(null);
        resetCallState();
    }, [setLocalStream, setRemoteStream, resetCallState]);

    const endCall = useCallback((notifyPeer = true) => {
        const active = useCall.getState().activeCall;
        const otherPeerId = active?.peerId;

        if (notifyPeer && socket && otherPeerId && authUser._id !== otherPeerId) {
            socket.emit("endCall", { to: otherPeerId });
        }

        if (currentCall.current && !currentCall.current.closed) {
            try { currentCall.current.close(); } catch (e) { console.error("Error closing PeerJS call:", e); }
        }
        currentCall.current = null;
        cleanupCallResources();
    }, [authUser, cleanupCallResources, socket]);


    useEffect(() => {
        if (!authUser || !socket) {
            return;
        }

        if (!peerInstance.current || !peerInstance.current.open) {
            peerInstance.current = new Peer(authUser._id, {
                host: '0.peerjs.com',
                port: 443,
                path: '/',
                secure: true,
                debug: 3
            });

            peerInstance.current.on('open', (id) => {
                console.log('PeerJS: Connected to server with ID:', id);
                toast.success(`PeerJS ready! Your ID: ${id}`);
            });

            peerInstance.current.on('call', (call) => {
                if (useCall.getState().activeCall) {
                    call.close();
                    socket.emit("rejectCall", { to: call.peer, reason: "busy" });
                    toast.error(`You are already in a call. Rejected new call.`);
                    return;
                }

                currentCall.current = call;
                const accept = window.confirm(`Incoming call from ${call.peer}. Accept ${call.metadata?.type || 'video'} call?`);

                if (accept) {
                    const requestMedia = async () => {
                        let stream = null;
                        let actualCallType = call.metadata?.type || 'video';
                        const constraints = { audio: true, video: actualCallType === 'video' };
                        stream = await navigator.mediaDevices.getUserMedia(constraints);
                        return { stream, actualCallType };
                    };

                    requestMedia()
                        .then(({ stream, actualCallType }) => {
                            setLocalStream(stream);
                            call.answer(stream);
                            setActiveCall({ type: actualCallType, callerId: call.peer, receiverId: authUser._id, peerId: call.peer, status: 'connected', isCaller: false });

                            call.on('stream', (remoteStream) => setRemoteStream(remoteStream));
                            call.on('close', cleanupCallResources);
                            call.on('error', (err) => { console.error('PeerJS: Incoming call error:', err); cleanupCallResources(); });
                            toast.success("Call connected!");
                        })
                        .catch(err => {
                            console.error('Final media access failed:', err);
                            toast.error("Could not access media devices for incoming call.");
                            cleanupCallResources();
                            try { call.close(); } catch {}
                            socket.emit("rejectCall", { to: call.peer, reason: "media_access_failed" });
                        });
                } else {
                    call.close();
                    socket.emit("rejectCall", { to: call.peer, reason: "user_rejected" });
                }
            });

            peerInstance.current.on('error', (err) => {
                console.error("PeerJS: Peer instance error:", err);
                if (err.type === 'peer-unavailable') {
                    toast.error("Recipient is not online or PeerJS ID is invalid.");
                } else {
                    toast.error("PeerJS connection error. Please check console.");
                }
                cleanupCallResources();
            });

            peerInstance.current.on('disconnected', () => {
                console.warn("PeerJS: Instance disconnected. Attempting reconnect...");
            });

            peerInstance.current.on('close', () => {
                console.log("PeerJS: Instance connection closed.");
                peerInstance.current = null;
            });
        }

        socket.on("callRejected", cleanupCallResources);
        socket.on("callEnded", cleanupCallResources);
        socket.on("userNotOnline", cleanupCallResources);

        return () => {
            if (peerInstance.current) {
                peerInstance.current.destroy();
                peerInstance.current = null;
            }
            socket.off("callRejected", cleanupCallResources);
            socket.off("callEnded", cleanupCallResources);
            socket.off("userNotOnline", cleanupCallResources);
            cleanupCallResources();
        };
    }, [authUser, socket, cleanupCallResources, setLocalStream, setRemoteStream, setActiveCall, resetCallState, setMessages]);


    const startCall = async (type, recipientId) => {
        if (!socket || !peerInstance.current || !peerInstance.current.open || !recipientId || authUser._id === recipientId) {
            toast.error("Could not start call. Check recipient or try again later.");
            return;
        }
    
        try {
            const constraints = { audio: true, video: type === 'video' };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setLocalStream(stream);
    
            setActiveCall({ type, callerId: authUser._id, receiverId: recipientId, peerId: recipientId, status: 'outgoing', isCaller: true });
    
            const call = peerInstance.current.call(recipientId, stream, { metadata: { type } });
            if (call) {
                currentCall.current = call;
                call.on('stream', (remoteStream) => {
                    setRemoteStream(remoteStream);
                    setActiveCall(prev => ({ ...prev, status: 'connected' }));
                    toast.success("Call connected!");
                });
                call.on('close', cleanupCallResources);
                call.on('error', cleanupCallResources);
            }
        } catch (err) {
            console.error("Error getting user media or initiating call:", err);
            toast.error("Could not access media devices for outgoing call.");
            cleanupCallResources();
        }
    };
    

    return (
        <CallContext.Provider value={{ startCall, endCall, localStream, remoteStream }}>
            {children}
        </CallContext.Provider>
    );
};