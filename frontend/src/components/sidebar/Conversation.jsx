import React from 'react';
import { useSocketContext } from "../../context/SocketContext";
import useConversation from "../../zustand/useConversation";

const Conversation = ({ conversation, lastIdx, emoji }) => {
    const { selectedConversation, setSelectedConversation } = useConversation();
    const isSelected = selectedConversation?._id === conversation._id;

    const { onlineUsers } = useSocketContext();
    const isOnline = onlineUsers.includes(conversation._id);

    const nameToDisplay = conversation.username; 
    const mobileNumber = conversation.mobile;

    return (
        <>
            <div
                className={`flex gap-2 items-center hover:bg-sky-500 rounded p-2 py-1 cursor-pointer
                ${isSelected ? "bg-sky-500" : ""}
                `}
                onClick={() => setSelectedConversation(conversation)}
            >
                <div className={`avatar ${isOnline ? "online" : ""}`}>
                    <div className="w-12 rounded-full">
                        <img src={conversation.profilePic} alt="user avatar" />
                    </div>
                </div>

                <div className="flex flex-col flex-1">
                    <div className="flex gap-3 justify-between">
                        <p className="font-bold text-gray-200">{nameToDisplay}</p>
                        <span className="text-xl">{emoji}</span>
                    </div>
                    <p className="text-gray-400 text-sm">{mobileNumber}</p>
                </div>
            </div>
            {!lastIdx && <div className="divider my-0 py-0 h-1" />}
        </>
    );
};

export default Conversation;