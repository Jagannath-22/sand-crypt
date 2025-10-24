// frontend/src/hooks/useListenMessages.js
import { useEffect } from 'react';
import { useSocketContext } from '../context/SocketContext';
import useConversation from '../zustand/useConversation';
import { useAuthContext } from '../context/AuthContext'; // ✅ IMPORT useAuthContext
import notificationSound from '../assets/sounds/notification.mp3';

const useListenMessages = () => {
    const { socket } = useSocketContext();
    const { setMessages } = useConversation();
    const { authUser } = useAuthContext(); // ✅ GET THE CURRENT AUTHENTICATED USER

    useEffect(() => {
        socket?.on("newMessage", (newMessage) => {
            // 🔥 CRITICAL FIX: Check if the incoming message is from the current user.
            // If it is, we already handled the state update in `useSendMessage.js`, so we return early.
            // We only want to handle messages from other users here.
            if (newMessage.senderId === authUser._id) {
                return;
            }

            newMessage.shouldShake = true;
            const sound = new Audio(notificationSound);
            sound.play();

            // Use the functional update form of setMessages to be safe
            setMessages(prevMessages => [...(prevMessages || []), newMessage]);
        });

        return () => socket?.off("newMessage");
    }, [socket, setMessages, authUser]);
};

export default useListenMessages;