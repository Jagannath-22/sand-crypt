import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true, // Ensures usernames are unique
        trim: true, // Removes whitespace from start/end
    },
    mobile: {
        type: String,
        required: true,
        unique: true, // Ensures mobile numbers are unique
        trim: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6, // Matches your frontend validation
    },
    gender: {
        type: String,
        required: true,
        enum: ['male', 'female'], // Restricts gender to these values
    },
    profilePic: {
        type: String,
        default: '', // Default value if not provided, to avoid 'undefined'
    },
    displayName: { // Optional: for display name, often same as username initially
        type: String,
        trim: true,
    },
    isVerified: { // Used by your verifyOtp and signupUser controllers
        type: Boolean,
        default: true, // Assuming direct signup means verified
    },
    // *** NEW FIELD FOR ADMIN MANAGEMENT: isBanned ***
    isBanned: {
        type: Boolean,
        default: false,
        required: true
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Important: Prevents Mongoose from trying to recompile the model if it already exists
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
