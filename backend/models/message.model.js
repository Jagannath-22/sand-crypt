import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String, // used only if type === "text"
    },
    type: {
      type: String,
      enum: ["text", "image", "video", "audio"],
      default: "text",
    },
    fileUrl: {
      type: String, // link to uploaded file (Cloudinary, local storage, etc.)
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
