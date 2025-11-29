import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['superadmin'], // Only one role for now
        default: 'superadmin',
    },
});

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;
