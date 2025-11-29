import mongoose from 'mongoose';

// Rename the schema variable if necessary, but the model name is CRITICAL
const MessageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // ... rest of your schema fields ...
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, { timestamps: true });

// CRITICAL CHANGE: Register the model as 'Message' (lowercase 'message' collection)
const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);

export default Message;
