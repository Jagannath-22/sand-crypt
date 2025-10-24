// frontend/src/hooks/useSendMessage.js
import { useState } from "react";
import toast from "react-hot-toast";
import useConversation from "../zustand/useConversation";

const useSendMessage = () => {
  const [loading, setLoading] = useState(false);
  const { selectedConversation } = useConversation();

  const sendMessage = async ({ message, file }) => {
    setLoading(true);
    try {
      if (!selectedConversation?._id) {
        toast.error("No conversation selected.");
        return;
      }

      // ✅ Use FormData for both text + file
      const formData = new FormData();
      if (message?.trim()) formData.append("message", message.trim());
      if (file) formData.append("file", file);

      // ✅ Add type (file type if file, else "text")
      formData.append("type", file ? file.type.split("/")[0] : "text");

      const res = await fetch(`/api/messages/send/${selectedConversation._id}`, {
        method: "POST",
        body: formData, // Browser automatically sets headers for FormData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");

      // ✅ State will be updated by useListenMessages
      return data;
    } catch (error) {
      console.error("[useSendMessage] Error:", error);
      toast.error(error.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, loading };
};

export default useSendMessage;
