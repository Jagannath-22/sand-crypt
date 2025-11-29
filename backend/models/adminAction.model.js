// backend/models/adminAction.model.js
import mongoose from 'mongoose';

const adminActionSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  action: { type: String, required: true }, // e.g., 'LOGIN', 'BAN_USER'
  target: { type: String },                  // optional: user id or resource
  details: { type: Object, default: {} },
  ip: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('AdminAction', adminActionSchema);
