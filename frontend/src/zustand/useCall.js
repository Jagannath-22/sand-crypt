// frontend/src/zustand/useCall.js
import { create } from "zustand";

const useCall = create((set) => ({
    // Represents the active call information
    activeCall: null, // { type: 'audio'|'video', callerId: string, receiverId: string, peerId: string }
    
    // Local stream (your camera/mic)
    localStream: null, 
    
    // Remote stream (the other person's camera/mic)
    remoteStream: null,

    // Function to set the active call
    setActiveCall: (callInfo) => set({ activeCall: callInfo }),
    
    // Function to set the local stream
    setLocalStream: (stream) => set({ localStream: stream }),
    
    // Function to set the remote stream
    setRemoteStream: (stream) => set({ remoteStream: stream }),

    // Function to reset all call-related state when a call ends or is rejected
    resetCallState: () => set({ activeCall: null, localStream: null, remoteStream: null }),
}));

export default useCall;
