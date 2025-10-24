import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthContext } from '../context/AuthContext';
import fetchClient from '../utils/fetchClient'; // ✅ IMPORT YOUR FETCH CLIENT HERE

const useGetConversation = () => {
    const [loading, setLoading] = useState(false);
    const [conversations, setConversations] = useState([]);
    const { authUser } = useAuthContext();

    useEffect(() => {
        const getConversations = async () => {
            // Check if authUser is available. We no longer check for a token in localStorage here.
            // The presence of authUser indicates a successful login has happened and the context is updated.
            if (!authUser) {
                console.log("[useGetConversation] No authenticated user found. Skipping conversation fetch.");
                setConversations([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                console.log("[useGetConversation] Attempting to fetch conversations for authenticated user...");

                // ✅ Use the fetchClient utility that correctly handles cookies
                // It will automatically include the httpOnly JWT cookie thanks to `credentials: 'include'`
                const data = await fetchClient('/api/chat/list'); // No need for manual headers or token variable

                // After successful fetch, if data implies an error, handle it
                if (data.error) {
                    // This case should ideally be caught by fetchClient's !response.ok check,
                    // but it's good to have a final safeguard for API-specific errors
                    throw new Error(data.error);
                }

                setConversations(data);
                console.log("[useGetConversation] Successfully fetched conversations:", data);

            } catch (error) {
                console.error("[useGetConversation] Error fetching conversations:", error.message);
                // The fetchClient already handles toast.error for non-ok responses,
                // but you can keep this for other unexpected errors during fetch.
                toast.error(error.message); 
                setConversations([]);
            } finally {
                setLoading(false);
            }
        };

        getConversations();
    }, [authUser]); // Depend on authUser, so the fetch runs when the user logs in/out

    return { loading, conversations };
};

export default useGetConversation;