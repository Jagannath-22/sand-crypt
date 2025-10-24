// frontend/src/hooks/useChat.js
import { useEffect, useState } from 'react';
import useConversation from '../zustand/useConversation';
import fetchClient from '../utils/fetchClient';
import toast from 'react-hot-toast';

const useChat = () => {
    const [loading, setLoading] = useState(false);
    const { messages, setMessages, selectedConversation, setSelectedConversation } = useConversation();

    // Fetch messages for the selected conversation
    const fetchMessages = async (conversationId) => {
        if (!conversationId) return;

        setLoading(true);
        try {
            const data = await fetchClient(`/api/messages/${conversationId}`);
            if (!Array.isArray(data)) {
                console.warn("API response for messages was not an array:", data);
                setMessages([]);
                toast.error("Received unexpected message data from server.");
                return;
            }
            setMessages(data);
        } catch (error) {
            console.error("Error fetching messages:", error.message);
            toast.error(error.message);
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    // Send a new message
    const sendMessage = async (message) => {
        if (!selectedConversation?._id || !message.trim()) return;

        try {
            const responseData = await fetchClient(`/api/chat/send/${selectedConversation._id}`, {
                method: 'POST',
                body: JSON.stringify({ message }),
            });

            const newMessage = responseData.message || responseData;
            if (newMessage) {
                setMessages((prev) => [...(prev || []), newMessage]);
            }
        } catch (error) {
            console.error("Error sending message:", error.message);
            toast.error(error.message);
        }
    };

    useEffect(() => {
        if (selectedConversation?._id) {
            fetchMessages(selectedConversation._id);
        }
    }, [selectedConversation?._id]);

    return { messages, loading, sendMessage, fetchMessages };
};

export default useChat;