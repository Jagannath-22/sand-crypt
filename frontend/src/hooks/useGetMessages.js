// frontend/src/hooks/useGetMessages.js
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import useConversation from '../zustand/useConversation'; // Import your Zustand store
import fetchClient from '../utils/fetchClient'; // Ensure this is the corrected fetchClient

const useGetMessages = () => {
    const [loading, setLoading] = useState(false);
    // Destructure messages and setMessages directly from useConversation
    // selectedConversation is used for the API call URL
    const { messages, setMessages, selectedConversation } = useConversation(); 

    useEffect(() => {
        const getMessages = async () => {
            // If no conversation is selected, or if the ID is missing, don't fetch.
            // Ensure messages is an empty array in the store to prevent map errors.
            if (!selectedConversation || !selectedConversation._id) {
                setMessages([]); // CRITICAL: Ensure messages in store is an empty array if no conversation
                return; 
            }

            setLoading(true);
            try {
                // Construct the API URL for fetching messages
                const responseData = await fetchClient(`/api/messages/${selectedConversation._id}`);

                // CRITICAL: Explicitly check if the data received is an array.
                // If not, log a warning and set messages to an empty array to prevent crashes.
                if (!Array.isArray(responseData)) {
                    console.warn("API response for messages was not an array:", responseData);
                    setMessages([]); // Set to empty array if response is malformed
                    toast.error("Received unexpected message data from server. Please try again.");
                    return; // Exit function early
                }
                
                // If data is an array, update the messages state in Zustand
                setMessages(responseData);
            } catch (error) {
                console.error("Error in useGetMessages hook:", error.message);
                // fetchClient already handles toast.error for non-ok responses,
                // but this catches other unexpected errors during the hook's execution.
                if (!error.message.includes("Failed to fetch")) { // Avoid double-toasting common fetch errors
                    toast.error("Failed to load messages.");
                }
                setMessages([]); // CRITICAL: Ensure messages is reset to an empty array on any error
            } finally {
                setLoading(false);
            }
        };

        // Call the async function to fetch messages
        getMessages();

        // Dependencies: Re-run this effect when:
        // 1. selectedConversation._id changes (i.e., when you select a different chat)
        // 2. setMessages function changes (though it's stable from Zustand, it's good practice)
    }, [selectedConversation?._id, setMessages]); 

    // Return the current messages and loading status directly from the Zustand store
    return { messages, loading };
};

export default useGetMessages;