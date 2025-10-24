// frontend/src/components/sidebar/Sidebar.jsx
import React, { useState } from 'react';
import SearchInput from './SearchInput.jsx';
import Conversations from './Conversations.jsx';
import LogoutButton from './LogoutButton.jsx';
import EncryptionSettings from './EncryptionSettings.jsx';
import useConversation from '../../zustand/useConversation.js';
import toast from 'react-hot-toast';
import fetchClient from '../../utils/fetchClient.js';

const Sidebar = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [searchedUser, setSearchedUser] = useState(null);
  const [inviteUser, setInviteUser] = useState(null);
  const { setSelectedConversation } = useConversation();

  const handleInvite = () => {
    toast.success(`Invitation link sent to ${inviteUser}`);
    setInviteUser(null);
    setSearchedUser(null);
  };

  // On clicking a search result: ensure conversation exists, then select it
  const handleSelectSearchedUser = async () => {
    try {
      if (!searchedUser?._id) return;

      // Ensure a conversation exists with this user
      const ensured = await fetchClient(`/api/chat/ensure/${searchedUser._id}`, {
        method: 'POST',
      });

      // ensured = { conversationId, other: {...} }
      const other = ensured.other;

      // Select the "other user" shape so MessageContainer renders immediately
      setSelectedConversation({
        _id: other._id,
        username: other.username,
        displayName: other.displayName,
        profilePic: other.profilePic,
        gender: other.gender,
        mobile: other.mobile,
      });

      setSearchedUser(null);
      toast.success(`Started a new chat`);
    } catch (err) {
      console.error("[Sidebar] ensure conversation failed:", err);
      toast.error(err.message || "Could not open chat");
    }
  };

  return (
    <div className="w-full max-w-[320px] h-full bg-[#0f172a] text-white flex flex-col justify-between">
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <SearchInput setSearchedUser={setSearchedUser} setInviteUser={setInviteUser} />
        <div className="divider my-3 border-t border-slate-600" />

        {searchedUser ? (
          <div
            className="p-2 flex items-center gap-4 hover:bg-sky-500 rounded-md transition duration-300 cursor-pointer"
            onClick={handleSelectSearchedUser}
          >
            <div className="avatar">
              <div className="w-12 rounded-full">
                <img src={searchedUser.profilePic} alt="user avatar" />
              </div>
            </div>
            <div>
              {/* WhatsApp-like: show number (or saved name if you add personal contacts later) */}
              <p className="text-lg font-semibold">{searchedUser.mobile}</p>
              {/* Optionally, show a hint line with username faintly */}
              {/* <p className="text-sm text-gray-400">@{searchedUser.username}</p> */}
            </div>
          </div>
        ) : inviteUser ? (
          <div className="p-4 text-center">
            <p className="mb-2">User with mobile number {inviteUser} not found.</p>
            <button onClick={handleInvite} className="btn btn-primary btn-sm">
              Invite to Sandcrypt
            </button>
          </div>
        ) : (
          <Conversations />
        )}
      </div>

      <div className="px-4 py-3 flex items-center justify-between border-t border-slate-700">
        <button
          onClick={() => setShowSettings(true)}
          className="hover:text-yellow-400 transition duration-300"
          title="Encryption Settings"
        >
          <i className="fas fa-lock text-xl"></i>
        </button>
        <LogoutButton />
      </div>

      {showSettings && <EncryptionSettings close={() => setShowSettings(false)} />}
    </div>
  );
};

export default Sidebar;
