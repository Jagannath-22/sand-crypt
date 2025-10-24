import React, { useState, useRef } from "react";
import { BsSend } from "react-icons/bs";
import { FiPaperclip } from "react-icons/fi";
import useSendMessage from "../../../hooks/useSendMessage";

const MessageInput = () => {
  const [message, setMessage] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const { loading, sendMessage } = useSendMessage();

  // send text + file
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() && !selectedFile) return;

    await sendMessage({ message, file: selectedFile });

    setMessage("");
    setSelectedFile(null);
  };

  const handleFileClick = () => {
    setShowOptions(false);
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="sticky bottom-0 bg-gray-900 px-4 pt-2 pb-3">
      {/* File preview ABOVE input */}
      {selectedFile && (
        <div className="mb-2 flex items-center gap-2">
          {selectedFile.type.startsWith("image/") && (
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="preview"
              className="w-24 h-24 rounded"
            />
          )}
          {selectedFile.type.startsWith("video/") && (
            <video
              src={URL.createObjectURL(selectedFile)}
              controls
              className="w-32 rounded"
            />
          )}
          {selectedFile.type.startsWith("audio/") && (
            <audio controls src={URL.createObjectURL(selectedFile)} />
          )}
          {selectedFile.type.startsWith("application/") && (
            <div className="text-sm text-gray-300">📄 {selectedFile.name}</div>
          )}
        </div>
      )}

      {/* Input form */}
      <form className="relative flex items-center" onSubmit={handleSubmit}>
        {/* Attach button */}
        <button
          type="button"
          onClick={() => setShowOptions((prev) => !prev)}
          className="absolute left-3 text-gray-300 hover:text-white"
        >
          <FiPaperclip size={20} />
        </button>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Textarea instead of input */}
        <textarea
          rows={1}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          className="border text-sm rounded-lg resize-none block w-full pl-10 pr-10 p-3 bg-gray-800 border-gray-600 text-white"
          placeholder="Send a message"
        />

        {/* Send button */}
        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          {loading ? <div className="loading loading-spinner" /> : <BsSend />}
        </button>
      </form>

      {/* Options panel */}
      {showOptions && (
        <div className="absolute bottom-14 left-3 bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-2 flex flex-col gap-2 z-10">
          <button
            type="button"
            onClick={handleFileClick}
            className="text-sm text-white hover:bg-gray-700 rounded-md px-3 py-1 text-left"
          >
            📷 Image
          </button>
          <button
            type="button"
            onClick={handleFileClick}
            className="text-sm text-white hover:bg-gray-700 rounded-md px-3 py-1 text-left"
          >
            🎥 Video
          </button>
          <button
            type="button"
            onClick={handleFileClick}
            className="text-sm text-white hover:bg-gray-700 rounded-md px-3 py-1 text-left"
          >
            🎵 Audio
          </button>
          <button
            type="button"
            onClick={handleFileClick}
            className="text-sm text-white hover:bg-gray-700 rounded-md px-3 py-1 text-left"
          >
            📄 Document
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageInput;
