import mongoose from "mongoose";

const userContactSchema = new mongoose.Schema(
  {
    // The user who owns this contact list entry
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // References the User model
      required: false, // TEMPORARILY set to false for signup troubleshooting
    },
    // The actual contact (another user in the system)
    contactUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // References the User model
      required: false, // TEMPORARILY set to false for signup troubleshooting
    },
    // The private, custom name the owner assigns to this contact
    customName: {
      type: String,
      required: false, // TEMPORARILY set to false for signup troubleshooting
      trim: true,
    },
    // To allow quick lookup of contacts by the owner for a specific mobile number
    // This mobile is for the 'contactUser', not the 'owner'
    contactMobile: {
      type: String,
      required: false, // TEMPORARILY set to false for signup troubleshooting
      trim: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

// Ensure that an owner can only have one custom name entry per contactUser
// Keep this index, but it will only apply if both fields are provided (which they won't be if optional)
userContactSchema.index({ owner: 1, contactUser: 1 }, { unique: true });

// Check if the model already exists before defining it
// This prevents the OverwriteModelError during hot-reloads/nodemon restarts
const UserContact = mongoose.models.UserContact || mongoose.model("UserContact", userContactSchema);

export default UserContact;
