import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext";

const useSignup = () => {
  const [loading, setLoading] = useState(false);
  const { setAuthUser } = useAuthContext();

  const signup = async ({ username, mobile, password, confirmPassword, gender }) => {
    const success = handleInputErrors({ username, mobile, password, confirmPassword, gender });
    if (!success) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, mobile, password, confirmPassword, gender })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Signup failed");
      }

      localStorage.setItem("chat-user", JSON.stringify(data));
      setAuthUser(data);
      toast.success("Signup successful!");
    } catch (error) {
      console.error("[useSignup] Signup error:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };
  return { loading, signup };
};
export default useSignup;

function handleInputErrors({ username, mobile, password, confirmPassword, gender }) {
  if (!username || !mobile || !password || !confirmPassword || !gender) {
    toast.error("Please fill all the required fields");
    return false;
  }
  if (password !== confirmPassword) {
    toast.error("Passwords do not match");
    return false;
  }
  if (password.length < 6) {
    toast.error("Password must be at least 6 characters");
    return false;
  }
  return true;
}
