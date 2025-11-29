// Load environment variables from backend/.env
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import connectToMongoDB from './db/connectToMongoDB.js';
import { app, server, io } from './socket/socket.js'; 
import mountMeetNamespace from "./meet-socket.js";


import adminRoutes from './routes/admin.routes.js'; // <-- NEW: Import Admin Routes
// ------------------------------------------------------------------
// CRITICAL FIX: FORCE MODEL LOADING HERE
// Importing the models at the top guarantees they are registered with Mongoose
// before the message controller executes its queries.
// ------------------------------------------------------------------
import Message from './models/message.model.js'; 
import Conversation from './models/conversation.model.js'; 
// ------------------------------------------------------------------


// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from backend folder
dotenv.config({ path: path.resolve(__dirname, '.env') });

// ---- Imports for Routes ----
import authRoutes from './routes/auth.routes.js';
import messageRoutes from './routes/message.routes.js';
import userRoutes from './routes/user.routes.js';
import contactRoutes from './routes/contact.routes.js';
import chatRoutes from './routes/chat.routes.js';
import otpRoutes from "./routes/otp.routes.js";
// import adminRoutes from "./admin/admin.routes.js"; // Imported the Admin Routes


const PORT = process.env.PORT || 5000;

// ------------------------------------------------------------------
// CRITICAL FIX: MIDDLEWARE PLACEMENT
// ------------------------------------------------------------------
app.use(express.json());    // Parses JSON bodies (req.body)

// This MUST run before adminRoutes is used
app.use(cookieParser());    // FIXES the TypeError by populating req.cookies

// CORS Configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

// ------------------------------------------------------------------

// ---- Mount ADMIN Routes (Now Safe to Mount) ----
// app.use("/api/admin", adminRoutes); 

// ---- Mount Other API Routes ----
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/auth/otp", otpRoutes);
app.use('/api/admin', adminRoutes);

//  Serve uploaded files (images, audio, video) from this one route.
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

//  Corrected path for serving frontend in production
app.use(express.static(path.join(__dirname, "..", "frontend", "dist")));

//  Corrected path for serving index.html fallback
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






// // Load environment variables from backend/.env
// import cookieParser from 'cookie-parser';
// import dotenv from 'dotenv';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import express from 'express';
// import cors from 'cors';
// import connectToMongoDB from './db/connectToMongoDB.js';
// import { app, server, io } from './socket/socket.js'; 
// import mountMeetNamespace from "./meet-socket.js";

// // Fix __dirname for ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Explicitly load .env from backend folder
// dotenv.config({ path: path.resolve(__dirname, '.env') });


// // ------------------------------------------------------------------
// // CRITICAL FIX: Explicitly import models to register their schemas with Mongoose
// // This resolves the "Schema hasn't been registered for model 'Message'" error
// // which causes the 500 Internal Server Error when fetching messages.
// // ------------------------------------------------------------------
// import './models/user.model.js';
// import './models/conversation.model.js';
// import './models/message.model.js';


// import Message from './models/message.model.js';
// import Conversation from './models/conversation.model.js';


// // ---- Imports for Routes ----
// import authRoutes from './routes/auth.routes.js';
// import messageRoutes from './routes/message.routes.js';
// import userRoutes from './routes/user.routes.js';
// import contactRoutes from './routes/contact.routes.js';
// import chatRoutes from './routes/chat.routes.js';
// import otpRoutes from "./routes/otp.routes.js";
// import adminRoutes from "./admin/admin.routes.js"; // Imported the Admin Routes


// const PORT = process.env.PORT || 5000; 

// // ------------------------------------------------------------------
// // CRITICAL FIX: MIDDLEWARE PLACEMENT
// // All middleware that processes the request body (JSON) or headers (Cookies) 
// // MUST be placed here before any routes that depend on them.
// // ------------------------------------------------------------------
// app.use(express.json());    // Parses JSON bodies (req.body)

// // This MUST run before adminRoutes is used
// app.use(cookieParser());    // FIXES the TypeError by populating req.cookies

// // CORS Configuration
// app.use(cors({
//   origin: 'http://localhost:3000',
//   credentials: true,
// }));

// // ------------------------------------------------------------------

// // ---- Mount ADMIN Routes (Now Safe to Mount) ----
// app.use("/api/admin", adminRoutes); 

// // ---- Mount Other API Routes ----
// app.use("/api/auth", authRoutes);
// app.use("/api/messages", messageRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/contacts", contactRoutes);
// app.use("/api/chat", chatRoutes);
// app.use("/api/auth/otp", otpRoutes);

// //  Serve uploaded files (images, audio, video) from this one route.
// app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// //  Corrected path for serving frontend in production
// app.use(express.static(path.join(__dirname, "..", "frontend", "dist")));

// //  Corrected path for serving index.html fallback
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "..", "frontend", "dist", "index.html"));
// });

// // ---- Mount Meet Namespace ----
// mountMeetNamespace(io);

// // ---- Start Server ----
// server.listen(PORT, () => {
//   console.log(`Server listening on port ${PORT}`);
//   console.log("Mongo URI loaded?", !!process.env.MONGO_DB_URI);
//   connectToMongoDB();
// });










