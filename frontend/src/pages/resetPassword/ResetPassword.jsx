// frontend/src/pages/resetPassword/ResetPassword.jsx

import React, { useState } from "react";
import toast from "react-hot-toast"; // Make sure you have react-hot-toast installed
import { useNavigate } from "react-router-dom"; // Use useNavigate for redirection

export default function ResetPassword() {
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async () => {
    if (!otp || !newPassword || !confirmNewPassword) {
      return toast.error("All fields are required.");
    }
    if (newPassword !== confirmNewPassword) {
      return toast.error("Passwords do not match.");
    }
    if (newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters.");
    }

    setLoading(true);
    try {
      // You'll need to pass the mobile number here. 
      // A common way to do this is to pass it as state from the ForgotPassword component
      // Or store it in local storage/session storage after the OTP is sent.
      const mobile = localStorage.getItem("resetMobile"); // Example of getting mobile number
      if (!mobile) {
        throw new Error("Mobile number not found. Please start over.");
      }
      
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, otp, newPassword, confirmNewPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }

      toast.success(data.message);
      localStorage.removeItem("resetMobile"); // Clean up the stored mobile number
      navigate("/login"); // Redirect to the login page
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-w-96 mx-auto">
      <div className="w-full p-6 rounded-lg shadow-md bg-gray-400 bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-0">
        <h1 className="text-3xl font-semibold text-center text-gray-300">
          Reset <span className="text-blue-500">Password</span>
        </h1>

        <form onSubmit={(e) => { e.preventDefault(); handleResetPassword(); }}>
          <div>
            <label className="label p-2">
              <span className="text-base label-text">OTP</span>
            </label>
            <input
              type="text"
              placeholder="Enter OTP"
              className="w-full input input-bordered h-10"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>

          <div>
            <label className="label">
              <span className="text-base label-text">New Password</span>
            </label>
            <input
              type="password"
              placeholder="Enter New Password"
              className="w-full input input-bordered h-10"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="label">
              <span className="text-base label-text">Confirm Password</span>
            </label>
            <input
              type="password"
              placeholder="Confirm New Password"
              className="w-full input input-bordered h-10"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />
          </div>

          <button className="btn btn-block btn-sm mt-2" disabled={loading}>
            {loading ? <span className="loading loading-spinner"></span> : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}