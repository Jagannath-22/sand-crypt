import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AuthHome from "./pages/home/Home";
import Login from "./pages/login/Login";
import Signup from "./pages/signup/Signup";
import { useAuthContext } from "./context/AuthContext";
import { SocketContextProvider } from "./context/SocketContext";
import CallOverlay from "./components/CallOverlay";
import ForgotPassword from "./pages/forgotPassword/ForgotPassword";
import ResetPassword from "./pages/resetPassword/ResetPassword";

// Import meeting-specific pages and the new MeetingSocketProvider
import MeetHome from "./meeting/pages/Home";
import JoinRoom from "./meeting/pages/JoinRoom";
import MeetingRoom from "./meeting/pages/MeetingRoom";
import { MeetingSocketProvider } from "./meeting/MeetingSocketContext";
import AdminPage from "./pages/AdminPage";
function App() {
  const { authUser, loading } = useAuthContext();
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-0 h-screen flex items-center justify-center">
      {/* Your original SocketContext for chat is kept here, untouched. */}
      <SocketContextProvider>
        <Routes>
          {/* Your authentication routes remain the same */}
          <Route
            path="/"
            element={authUser ? <AuthHome /> : <Navigate to="/login" />}
          />
          <Route
            path="/login"
            element={authUser ? <Navigate to="/" /> : <Login />}
          />
          <Route
            path="/signup"
            element={authUser ? <Navigate to="/" /> : <Signup />}
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* The meeting routes are now wrapped in their own, separate context. */}
          <Route
            path="/meeting/home"
            element={
              <MeetingSocketProvider>
                <MeetHome />
              </MeetingSocketProvider>
            }
          />
          <Route
            path="/meeting/join/"
            element={
              <MeetingSocketProvider>
                <JoinRoom />
              </MeetingSocketProvider>
            }
          />
          <Route
            path="/meeting/room/:roomId"
            element={
              <MeetingSocketProvider>
                <MeetingRoom />
              </MeetingSocketProvider>
            }
          />

          <Route path="/admin" element={<AdminPage />} />

        </Routes>
        <CallOverlay />
      </SocketContextProvider>
      <Toaster position="top-center" />
    </div>
  );
}

export default App;









// import { Routes, Route, Navigate } from "react-router-dom";
// import { Toaster } from "react-hot-toast";

// import AuthHome from "./pages/home/Home";
// import Login from "./pages/login/Login";
// import Signup from "./pages/signup/Signup";

// import { useAuthContext } from "./context/AuthContext";
// import { SocketContextProvider } from "./context/SocketContext";
// import { CallContextProvider } from "./context/CallContext"; // Import the new context
// import CallOverlay from "./components/CallOverlay";

// import ForgotPassword from "./pages/forgotPassword/ForgotPassword";
// import ResetPassword from "./pages/resetPassword/ResetPassword";

// import MeetHome from "./meeting/pages/Home";
// import JoinRoom from "./meeting/pages/JoinRoom";
// import MeetingRoom from "./meeting/pages/MeetingRoom";
// import { CallSocketProvider } from "./meeting/CallSocketContext";

// function App() {
//   const { authUser, loading } = useAuthContext();

//   if (loading) {
//     return (
//       <div className="h-screen flex items-center justify-center text-white">
//         Loading...
//       </div>
//     );
//   }

//   return (
//     <div className="p-0 h-screen flex items-center justify-center">
//       <SocketContextProvider>
//         <CallContextProvider> {/* Wrap the app with the new personal call context */}
//           <Routes>
//             {/* Auth routes */}
//             <Route path="/" element={authUser ? <AuthHome /> : <Navigate to="/login" />} />
//             <Route path="/login" element={authUser ? <Navigate to="/" /> : <Login />} />
//             <Route path="/signup" element={authUser ? <Navigate to="/" /> : <Signup />} />

//             {/* Password reset routes */}
//             <Route path="/forgot-password" element={<ForgotPassword />} />
//             <Route path="/reset-password" element={<ResetPassword />} />

//             {/* Meeting routes wrapped in their own separate context */}
//             <Route path="/meet" element={<CallSocketProvider><MeetHome /></CallSocketProvider>} />
//             <Route path="/meeting/join/:roomId" element={<CallSocketProvider><JoinRoom /></CallSocketProvider>} />
//             <Route path="/meeting/room/:roomId" element={<CallSocketProvider><MeetingRoom /></CallSocketProvider>} />
//           </Routes>
//           <CallOverlay />
//         </CallContextProvider>
//       </SocketContextProvider>

//       <Toaster position="top-center" />
//     </div>
//   );
// }

// export default App;