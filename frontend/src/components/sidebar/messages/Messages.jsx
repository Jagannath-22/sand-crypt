import React, { useEffect, useRef } from 'react';
import Message from './Message';
import useGetMessages from '../../../hooks/useGetMessages';
import MessageSkeleton from '../skeletons/MessageSkeleton';
import useListenMessages from '../../../hooks/useListenMessages';

const Messages = () => {
  const { messages, loading } = useGetMessages();
  useListenMessages();
  const lastMessageRef = useRef();

  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        lastMessageRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages]);

  if (loading) {
    return (
      <div className="px-4 flex-1 overflow-auto">
        {[...Array(3)].map((_, idx) => <MessageSkeleton key={idx} />)}
      </div>
    );
  }
  
  // 🔥 CRITICAL FIX: Add a defensive check to ensure 'messages' is an array.
  if (!loading && (!messages || !Array.isArray(messages) || messages.length === 0)) {
    return (
      <div className="px-4 flex-1 overflow-auto flex items-center justify-center">
        <p className="text-center text-gray-400">
          Send a message to start the conversation
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 flex-1 overflow-auto">
      {messages.map((message, index) => {
        if (!message || !message.senderId) return null;

        const currentDate = new Date(message.createdAt).toDateString();
        const prevDate =
          index > 0
            ? new Date(messages[index - 1]?.createdAt).toDateString()
            : null;
        const showDate = currentDate !== prevDate;

        return (
          <div key={message._id || index} ref={lastMessageRef}>
            <Message
              message={message}
              showDate={showDate}
              date={currentDate}
            />
          </div>
        );
      })}
    </div>
  );
};

export default Messages;