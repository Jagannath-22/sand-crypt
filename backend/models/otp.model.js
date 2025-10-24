import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  mobile: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, index: { expires: 300 } } // auto-delete after 5 minutes
});

const Otp = mongoose.model("Otp", otpSchema);
export default Otp;
