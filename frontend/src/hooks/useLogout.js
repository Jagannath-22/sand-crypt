import React, { useState } from 'react'
import { useAuthContext } from '../context/AuthContext'
import toast from 'react-hot-toast';
import fetchClient from '../utils/fetchClient'; // Import the new utility

const useLogout = () => {
  const [loading, setLoading] = useState(false)
  const { setAuthUser } = useAuthContext();

  const logout = async () => {
    setLoading(true)
    try {
      // Use fetchClient, which will include the token for the logout request
      const res = await fetchClient("/api/auth/logout", {
        method: 'POST',
        // Content-Type is already set by fetchClient, but can be overridden if needed
        // headers: {"Content-Type": "application/json"}
      });

   if (res.error) {
  throw new Error(res.error || "Logout failed");
}


      // If logout successful, remove user data and update auth context
      localStorage.removeItem("chat-user");
      setAuthUser(null);
      toast.success("Logged out successfully!"); // Show success message
    }
    catch (error) {
      console.error("[useLogout] Logout error:", error);
      toast.error(error.message);
    }
    finally {
      setLoading(false)
    }
  }
  return { loading, logout };
};

export default useLogout;
