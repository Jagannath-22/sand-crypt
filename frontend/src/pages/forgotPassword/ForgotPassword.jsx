import React, { useState } from "react";
import toast from "react-hot-toast"; // Make sure to import toast

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

// frontend/src/pages/forgotPassword/ForgotPassword.jsx

// (Code for state and functions as you have them)

const requestOtp = async () => {
  try {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to send OTP.");
    }

    toast.success(data.message);
    
    // 🔑 NEW: Save the mobile number to localStorage
    localStorage.setItem("resetMobile", mobile);

    // 🔑 NEW: Redirect to the ResetPassword page
    // You need to import `useNavigate` for this.
    // navigate("/reset-password");

  } catch (error) {
    toast.error(error.message);
  }
};

  const resetPassword = async () => {
    try {
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
      // Optional: Redirect to login page after successful reset
      // navigate("/login"); 
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="forgot-password">
      {step === 1 && (
        <div>
          <h2>Forgot Password</h2>
          <input
            type="text" // Change type to text for mobile number
            placeholder="Enter your mobile number"
            value={mobile}
            onChange={e => setMobile(e.target.value)}
          />
          <button onClick={requestOtp}>Send OTP</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2>Enter OTP & New Password</h2>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={e => setOtp(e.target.value)}
          />
          <input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmNewPassword}
            onChange={e => setConfirmNewPassword(e.target.value)}
          />
          <button onClick={resetPassword}>Reset Password</button>
        </div>
      )}
    </div>
  );
}