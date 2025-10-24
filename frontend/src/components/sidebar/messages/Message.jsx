// frontend/src/components/sidebar/messages/Message.jsx

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthContext } from "../../../context/AuthContext.jsx";
import useConversation from "../../../zustand/useConversation";
import { extractTime } from "../../../../../backend/utils/extractTime.js";
import {
  FaCopy,
  FaTrash,
  FaReply,
  FaStar,
  FaShare,
  FaSmile,
  FaCheckCircle,
} from "react-icons/fa";
import DateDivider from "./DateDivider";

const BASE_URL = "http://localhost:5000";

const Message = ({ message, showDate, date }) => {
  const { authUser } = useAuthContext();
  const { selectedConversation, setReplyingToMessage } = useConversation();
  const messageRef = useRef(null);

  if (!message || !authUser || !message.senderId) return null;

  const fromMe = message.senderId === authUser._id;
  const formattedTime = extractTime(message.createdAt);
  const chatClassName = fromMe ? "chat-end" : "chat-start";
  const profilePic = fromMe
    ? authUser.profilePic
    : message.senderPic || selectedConversation?.profilePic;
  const bubbleBgColor = fromMe ? "bg-blue-500" : "bg-gray-700";

  const [panelOpen, setPanelOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState(false);
  const [isStarred, setIsStarred] = useState(message.isStarred || false);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        panelOpen &&
        messageRef.current &&
        !messageRef.current.contains(event.target)
      ) {
        setPanelOpen(false);
      }
    };
    if (panelOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [panelOpen]);

  const togglePanel = (e) => {
    e.stopPropagation();
    setPanelOpen((prev) => !prev);
  };

  const handleCopy = (e) => {
    e.stopPropagation();
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(message.message || "").then(() => {
        setCopyStatus(true);
        setTimeout(() => setCopyStatus(false), 1500);
      });
    }
    setPanelOpen(false);
  };

  // ✅ New Handler: Function to handle message deletion via API
  const handleDeleteMessage = async (deleteType) => {
    try {
      const endpoint = deleteType === 'forMe'
        ? `/api/messages/delete/forMe/${message._id}`
        : `/api/messages/delete/forEveryone/${message._id}`;

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error("Failed to delete the message");
      }

      console.log(`[DELETE]: Message ${message._id} deleted successfully for ${deleteType}`);
      // TODO: You might want to update the UI state to remove the message
      // e.g., using a state management library or context
    } catch (error) {
      console.error("Error deleting message:", error);
    } finally {
      setPanelOpen(false);
    }
  };

  const handleDeleteForMe = (e) => {
    e.stopPropagation();
    handleDeleteMessage('forMe');
  };

  const handleDeleteForEveryone = (e) => {
    e.stopPropagation();
    handleDeleteMessage('forEveryone');
  };

  const handleReply = (e) => {
    e.stopPropagation();
    if (setReplyingToMessage) setReplyingToMessage(message);
    setPanelOpen(false);
  };

  const handleForward = (e) => {
    e.stopPropagation();
    console.log(`[FORWARD ACTION]: Triggered for message ID: ${message._id}`);
    setPanelOpen(false);
  };

  const handleStar = (e) => {
    e.stopPropagation();
    setIsStarred(!isStarred);
    setPanelOpen(false);
  };

  const renderMessageContent = () => {
    let fileUrl = null;
    if (message.fileUrl) {
      fileUrl = message.fileUrl.startsWith("http")
        ? message.fileUrl
        : `${BASE_URL}${message.fileUrl}`;
    }

    // ✅ New Logic: Timestamps inside a container for all message types
    const contentWithTime = (content) => (
      <div className="relative">
        {content}
        <div
          className={`absolute bottom-0 right-1 text-xs opacity-50`}
        >
          {formattedTime}
        </div>
      </div>
    );

    switch (message.type) {
    case "text":
  return (
    <div className="flex items-end gap-3 ">
      <p className="break-words text-white">{message.message}</p>
      <div className="flex-shrink-0 text-xs opacity-50">
        {formattedTime}
      </div>
    </div>
  );
      case "image":
        return contentWithTime(
          // ✅ New: Added onClick handler to open image in a new tab
          <img
            src={fileUrl}
            alt="sent-img"
            className="w-full h-auto max-w-sm max-h-60 rounded-lg object-contain cursor-pointer"
            onClick={(e) => { e.stopPropagation(); window.open(fileUrl, '_blank'); }}
          />
        );
      case "video":
        return contentWithTime(
          // ✅ New: Added onClick handler to open video in a new tab
          <video
            controls
            className="w-full h-auto max-w-sm max-h-60 rounded-lg bg-black object-contain cursor-pointer"
            onClick={(e) => { e.stopPropagation(); window.open(fileUrl, '_blank'); }}
          >
            <source src={fileUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        );
      case "audio":
        return contentWithTime(
          <audio controls className="w-48">
            <source src={fileUrl} type="audio/mpeg" />
            Your browser does not support the audio tag.
          </audio>
        );
      case "document":
        return (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline"
          >
            📄 {message.fileName || "Document"}
          </a>
        );
      default:
        return <span className="text-gray-300">sent-file</span>;
    }
  };

  return (
    <>
      {showDate && <DateDivider date={date} />}

      <div
  ref={messageRef}
  className={`chat ${chatClassName} items-end gap-2 relative `}
>

        <div
          className="chat-image avatar w-8 h-8 self-end cursor-pointer flex-shrink-0 mb-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="avatar-wrapper w-8 h-8 rounded-full overflow-hidden">
            <img
              alt="User Avatar"
              src={profilePic}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div
          className={`chat-bubble ${bubbleBgColor} text-white px-1 py-1 rounded-lg relative break-words inline-block max-w-[48vw] md:max-w-md lg:max-w-lg group`}
        >
          {renderMessageContent()}

          <div
            className={`absolute top-1/2 -translate-y-1/2 z-10
              ${fromMe ? "right-full translate-x-2" : "left-full -translate-x-2"}
              opacity-0 group-hover:opacity-100
              transition-opacity duration-100 ease-in-out`}
            onClick={togglePanel}
          >
            <div className="bg-[#2a2f32] p-1 rounded-full text-white flex items-center justify-center text-sm">
              <FaSmile />
            </div>
          </div>
        </div>

        <AnimatePresence>
          {panelOpen && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className={`absolute z-50 w-max bg-[#2a2f32] text-white rounded shadow-lg px-2 py-1 flex flex-col gap-1
                ${
                  fromMe
                    ? "left-0 -translate-x-[110%] -ml-1"
                    : "right-0 translate-x-[110%] ml-1"
                }
                top-1/2 -translate-y-1/2`}
            >
              <div
                className="flex items-center gap-2 hover:bg-gray-700 p-1 rounded cursor-pointer"
                onClick={handleReply}
              >
                <FaReply /> <span>Reply</span>
              </div>
              {message.type === "text" && (
                <div
                  className="flex items-center gap-2 hover:bg-gray-700 p-1 rounded cursor-pointer"
                  onClick={handleCopy}
                >
                  {copyStatus ? (
                    <FaCheckCircle className="text-green-400" />
                  ) : (
                    <FaCopy />
                  )}
                  <span>{copyStatus ? "Copied!" : "Copy"}</span>
                </div>
              )}
              <div
                className="flex items-center gap-2 hover:bg-gray-700 p-1 rounded cursor-pointer"
                onClick={handleForward}
              >
                <FaShare /> <span>Forward</span>
              </div>
              <div
                className="flex items-center gap-2 hover:bg-gray-700 p-1 rounded cursor-pointer"
                onClick={handleStar}
              >
                <FaStar className={isStarred ? "text-yellow-400" : ""} />
                <span>{isStarred ? "Unstar" : "Star"}</span>
              </div>
              {fromMe && (
                <div
                  className="flex flex-col gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className="flex items-center gap-2 hover:bg-gray-700 p-1 rounded cursor-pointer"
                    onClick={() => setShowDeleteOptions(!showDeleteOptions)}
                  >
                    <FaTrash /> <span>Delete</span>
                  </div>
                  {showDeleteOptions && (
                    <div className="ml-6 flex flex-col bg-gray-600 rounded-lg shadow-lg p-1">
                      <div
                        className="flex items-center gap-2 hover:bg-gray-700 p-1 rounded cursor-pointer text-sm"
                        onClick={handleDeleteForMe}
                      >
                        <span>🗑️ Delete for Me</span>
                      </div>
                      <div
                        className="flex items-center gap-2 hover:bg-gray-700 p-1 rounded cursor-pointer text-sm"
                        onClick={handleDeleteForEveryone}
                      >
                        <span>❌ Delete for Everyone</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div
                className="text-xs text-gray-400 text-center mt-1 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setPanelOpen(false);
                }}
              >
                Close
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Message;