import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext";
import fetchClient from "../utils/fetchClient";

const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const { setAuthUser } = useAuthContext();

  const login = async (mobile, password) => {
    setLoading(true);
    try {
      const data = await fetchClient("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, password }), // ✅ matches backend
      });

      if (!data || !data._id) {
        throw new Error(data.error || "Invalid login response");
      }

      // Save user locally
      localStorage.setItem("chat-user", JSON.stringify(data));

      // Update context
      setAuthUser(data);

      toast.success("Logged in successfully!");
    } catch (error) {
      console.error("[useLogin] Login error:", error);
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return { loading, login };
};

export default useLogin;
