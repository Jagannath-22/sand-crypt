// frontend/src/components/sidebar/messages/MessageContainer.jsx
import React, { useEffect } from 'react';
import Messages from './Messages';
import MessageInput from './MessageInput';
import { TiMessages } from "react-icons/ti";
import useConversation from '../../../zustand/useConversation.js';
import { useAuthContext } from '../../../context/AuthContext.jsx';
import { useSocketContext } from '../../../context/SocketContext.jsx';
import toast from 'react-hot-toast'; 
import fetchClient from '../../../utils/fetchClient.js'; 
import { FaPhone, FaVideo } from "react-icons/fa"; 


// IMPORTANT: The CallUI component definition (fixed inset-0 full screen)
// must NOT be defined or rendered here. It has been replaced by CallOverlay in App.jsx.


const MessageContainer = () => {
    const { selectedConversation, setSelectedConversation } = useConversation();
    const { authUser } = useAuthContext();
    const { startCall, activeCall } = useSocketContext(); 

    useEffect(() => {
        return () => setSelectedConversation(null);
    }, [setSelectedConversation]);

    // IMPORTANT: There is NO 'if (activeCall)' block here that would hide the chat.
    // The MessageContainer always renders the chat interface.
    // The CallOverlay (globally rendered in App.jsx) appears on top of this.

    const handleSaveContact = async () => {
        try {
            const name = prompt("Enter a name to save this contact as:");
            if (!name || !name.trim()) return;
            await fetchClient(`/api/contacts/save/${selectedConversation._id}`, {
                method: "POST",
                body: JSON.stringify({ savedName: name.trim() })
            });
            setSelectedConversation({ ...selectedConversation, savedName: name.trim() });
            toast.success("Contact saved");
        } catch (err) {
            console.error("Save contact failed:", err);
            toast.error(err.message || "Could not save contact");
        }
    };

    const handleAudioCall = () => {
        if (!selectedConversation) {
            toast.error("Please select a contact to call.");
            return;
        }
        if (activeCall) { 
            toast.error("You are already in a call.");
            return;
        }
        startCall('audio', selectedConversation._id);
    };

    const handleVideoCall = () => {
        if (!selectedConversation) {
            toast.error("Please select a contact to call.");
            return;
        }
        if (activeCall) { 
            toast.error("You are already in a call.");
            return;
        }
        startCall('video', selectedConversation._id);
    };

    return (
        <div className='md:min-w-[450px] flex flex-col h-full'>
            {!selectedConversation ? (
                <NoChatSelected authUser={authUser} />
            ) : (
                <>
                    {/* Chat Header */}
                    <div className='bg-slate-500 px-4 py-2 mb-2 flex items-center justify-between'>
                        <div className="flex items-center gap-2">
                            <div className="avatar">
                                <div className="w-10 rounded-full">
                                    <img
                                        src={selectedConversation.profilePic || 'https://avatar.iran.liara.run/public/boy'}
                                        alt="user avatar"
                                    />
                                </div>
                            </div>
                            <div>
                                <span className='label-text text-white'>To:</span>{" "}
                                <span className='text-white font-bold'>
                                    {selectedConversation.savedName ||
                                     selectedConversation.mobile ||
                                     selectedConversation.displayName ||
                                     selectedConversation.username}
                                </span>
                            </div>
                        </div>

                        {/* Call Icons in the chat header */}
                        <div className="flex items-center gap-2">
                            <button
                                className="p-2 rounded-full bg-slate-600 hover:bg-slate-700 text-white focus:outline-none transition-all duration-200 shadow-md transform hover:scale-105"
                                onClick={handleAudioCall}
                                title="Audio Call"
                                disabled={activeCall} 
                            >
                                <FaPhone className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                            <button
                                className="p-2 rounded-full bg-slate-600 hover:bg-slate-700 text-white focus:outline-none transition-all duration-200 shadow-md transform hover:scale-105"
                                onClick={handleVideoCall}
                                title="Video Call"
                                disabled={activeCall} 
                            >
                                <FaVideo className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Messages area should expand and be scrollable */}
                    <div className="flex-1 min-h-0 overflow-auto px-4">
                        <Messages />
                    </div>

                    {/* Input sits after messages and will stay at bottom because parent is flex-col */}
                    <div className="mt-2">
                        <MessageInput />
                    </div>
                </>
            )}
        </div>
    );
};

export default MessageContainer;

const NoChatSelected = ({ authUser }) => {
    return (
        <div className='flex items-center justify-center w-full h-full'>
            <div className='px-4 text-center sm:text-lg md:text-xl text-gray-200 font-semibold flex flex-col items-center gap-2'>
                <p>Welcome 🤛🏼 {authUser?.username}✨</p>
                <p>Select a chat to start your messaging</p>
                <TiMessages className='text-3xl md:text-6xl text-center' />
            </div>
        </div>
    );
};

// // frontend/src/components/sidebar/messages/MessageContainer.jsx
// import React, { useEffect } from 'react';
// import Messages from './Messages';
// import MessageInput from './MessageInput';
// import { TiMessages } from "react-icons/ti";
// import useConversation from '../../../zustand/useConversation.js';
// import { useAuthContext } from '../../../context/AuthContext.jsx';
// // Import the correct context for calling
// import { useCallContext } from '../../../context/CallContext.jsx'; 
// // Import the correct zustand hook for the call state
// import useCall from '../../../zustand/useCall.js';
// import toast from 'react-hot-toast'; 
// import fetchClient from '../../../utils/fetchClient.js'; 
// import { FaPhone, FaVideo } from "react-icons/fa"; 

// const MessageContainer = () => {
//     const { selectedConversation, setSelectedConversation } = useConversation();
//     const { authUser } = useAuthContext();
//     // Use the correct context hook to access startCall and endCall
//     const { startCall, endCall } = useCallContext();
//     // Use the zustand hook to get the active call state
//     const { activeCall } = useCall();

//     useEffect(() => {
//         return () => setSelectedConversation(null);
//     }, [setSelectedConversation]);

//     const handleSaveContact = async () => {
//         try {
//             const name = prompt("Enter a name to save this contact as:");
//             if (!name || !name.trim()) return;
//             await fetchClient(`/api/contacts/save/${selectedConversation._id}`, {
//                 method: "POST",
//                 body: JSON.stringify({ savedName: name.trim() })
//             });
//             setSelectedConversation({ ...selectedConversation, savedName: name.trim() });
//             toast.success("Contact saved");
//         } catch (err) {
//             console.error("Save contact failed:", err);
//             toast.error(err.message || "Could not save contact");
//         }
//     };

//     const handleAudioCall = () => {
//         if (!selectedConversation) {
//             toast.error("Please select a contact to call.");
//             return;
//         }
//         if (activeCall) { 
//             toast.error("You are already in a call.");
//             return;
//         }
//         startCall('audio', selectedConversation._id);
//     };

//     const handleVideoCall = () => {
//         if (!selectedConversation) {
//             toast.error("Please select a contact to call.");
//             return;
//         }
//         if (activeCall) { 
//             toast.error("You are already in a call.");
//             return;
//         }
//         startCall('video', selectedConversation._id);
//     };

//     return (
//         <div className='md:min-w-[450px] flex flex-col h-full'>
//             {!selectedConversation ? (
//                 <NoChatSelected authUser={authUser} />
//             ) : (
//                 <>
//                     {/* Chat Header */}
//                     <div className='bg-slate-500 px-4 py-2 mb-2 flex items-center justify-between'>
//                         <div className="flex items-center gap-2">
//                             <div className="avatar">
//                                 <div className="w-10 rounded-full">
//                                     <img
//                                         src={selectedConversation.profilePic || 'https://avatar.iran.liara.run/public/boy'}
//                                         alt="user avatar"
//                                     />
//                                 </div>
//                             </div>
//                             <div>
//                                 <span className='label-text text-white'>To:</span>{" "}
//                                 <span className='text-white font-bold'>
//                                     {selectedConversation.savedName ||
//                                      selectedConversation.mobile ||
//                                      selectedConversation.displayName ||
//                                      selectedConversation.username}
//                                 </span>
//                             </div>
//                         </div>

//                         {/* Call Icons in the chat header */}
//                         <div className="flex items-center gap-2">
//                             <button
//                                 className="p-2 rounded-full bg-slate-600 hover:bg-slate-700 text-white focus:outline-none transition-all duration-200 shadow-md transform hover:scale-105"
//                                 onClick={handleAudioCall}
//                                 title="Audio Call"
//                                 disabled={activeCall} 
//                             >
//                                 <FaPhone className="w-4 h-4 md:w-5 md:h-5" />
//                             </button>
//                             <button
//                                 className="p-2 rounded-full bg-slate-600 hover:bg-slate-700 text-white focus:outline-none transition-all duration-200 shadow-md transform hover:scale-105"
//                                 onClick={handleVideoCall}
//                                 title="Video Call"
//                                 disabled={activeCall} 
//                             >
//                                 <FaVideo className="w-4 h-4 md:w-5 md:h-5" />
//                             </button>
//                         </div>
//                     </div>

//                     {/* Messages area should expand and be scrollable */}
//                     <div className="flex-1 min-h-0 overflow-auto px-4">
//                         <Messages />
//                     </div>

//                     {/* Input sits after messages and will stay at bottom because parent is flex-col */}
//                     <div className="mt-2">
//                         <MessageInput />
//                     </div>
//                 </>
//             )}
//         </div>
//     );
// };

// export default MessageContainer;

// const NoChatSelected = ({ authUser }) => {
//     return (
//         <div className='flex items-center justify-center w-full h-full'>
//             <div className='px-4 text-center sm:text-lg md:text-xl text-gray-200 font-semibold flex flex-col items-center gap-2'>
//                 <p>Welcome 🤛🏼 {authUser?.username}✨</p>
//                 <p>Select a chat to start your messaging</p>
//                 <TiMessages className='text-3xl md:text-6xl text-center' />
//             </div>
//         </div>
//     );
// };