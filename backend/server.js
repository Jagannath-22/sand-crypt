// // Load environment variables from backend/.env
// import dotenv from 'dotenv';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import express from 'express';
// import cookieParser from 'cookie-parser';
// import cors from 'cors';
// import connectToMongoDB from './db/connectToMongoDB.js';
// import { app, server, io } from './socket/socket.js';  // ✅ io now available
// import mountMeetNamespace from "./meet-socket.js";


// // mountMeetNamespace(io);


// // Fix __dirname for ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Explicitly load .env from backend folder
// dotenv.config({ path: path.resolve(__dirname, '.env') });

// // ---- Routes ----
// import authRoutes from './routes/auth.routes.js';
// import messageRoutes from './routes/message.routes.js';
// import userRoutes from './routes/user.routes.js';
// import contactRoutes from './routes/contact.routes.js';
// import chatRoutes from './routes/chat.routes.js';
// import otpRoutes from "./routes/otp.routes.js";

// const PORT = process.env.PORT || 5000;

// app.use(express.json());
// app.use(cookieParser());

// // CORS Configuration
// app.use(cors({
//   origin: 'http://localhost:3000',
//   credentials: true,
// }));

// // ---- Mount API Routes ----
// app.use("/api/auth", authRoutes);
// app.use("/api/messages", messageRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/contacts", contactRoutes);
// app.use("/api/chat", chatRoutes);
// app.use("/api/auth/otp", otpRoutes);

// // ✅ Serve uploaded files (images, audio, video) from this one route.
// // This handles all media serving and streaming.
// app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// // ✅ Corrected path for serving frontend in production
// app.use(express.static(path.join(__dirname, "..", "frontend", "dist")));

// // ✅ Corrected path for serving index.html fallback
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "..", "frontend", "dist", "index.html"));
// });

// // ---- Start Server ----
// server.listen(PORT, () => {
//     console.log(`Server listening on port ${PORT}`);
//     console.log("Mongo URI loaded?", !!process.env.MONGO_DB_URI);
//     connectToMongoDB();
// });

// Load environment variables from backend/.env
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import connectToMongoDB from './db/connectToMongoDB.js';
import { app, server, io } from './socket/socket.js';  // ✅ io now available
import mountMeetNamespace from "./meet-socket.js";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from backend folder
dotenv.config({ path: path.resolve(__dirname, '.env') });

// ---- Routes ----
import authRoutes from './routes/auth.routes.js';
import messageRoutes from './routes/message.routes.js';
import userRoutes from './routes/user.routes.js';
import contactRoutes from './routes/contact.routes.js';
import chatRoutes from './routes/chat.routes.js';
import otpRoutes from "./routes/otp.routes.js";

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());

// CORS Configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

// ---- Mount API Routes ----
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/auth/otp", otpRoutes);

//  Serve uploaded files (images, audio, video) from this one route.
// This handles all media serving and streaming.
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

//  Corrected path for serving frontend in production
app.use(express.static(path.join(__dirname, "..", "frontend", "dist")));

//  Corrected path for serving index.html fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "dist", "index.html"));
});

// ---- Mount Meet Namespace ----
mountMeetNamespace(io);

// ---- Start Server ----
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log("Mongo URI loaded?", !!process.env.MONGO_DB_URI);
  connectToMongoDB();
});
