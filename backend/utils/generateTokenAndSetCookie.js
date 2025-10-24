// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";

// dotenv.config();

// const generateTokenAndSetCookie = (userId, res) => {
//   const jwtSecret = process.env.JWT_SECRET;

//   if (!jwtSecret) {
//     console.error("JWT_SECRET is missing in .env");
//     throw new Error("JWT_SECRET not configured");
//   }

//   const token = jwt.sign({ userId }, jwtSecret, { expiresIn: "15d" });

//   res.cookie("jwt", token, {
//     maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
//     httpOnly: true,
//     sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
//     secure: process.env.NODE_ENV === "production" // false in dev, true in prod
//   });

//   return token;
// };

// export default generateTokenAndSetCookie;

import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const generateTokenAndSetCookie = (userId, res) => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error("JWT_SECRET is missing in .env");
    throw new Error("JWT_SECRET not configured");
  }

  const token = jwt.sign({ userId }, jwtSecret, { expiresIn: "15d" });

  res.cookie("jwt", token, {
    maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
    httpOnly: true, // Prevents client-side JS from accessing the cookie
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // Use 'lax' for development to allow cross-port requests
    secure: process.env.NODE_ENV === "production" // Only use 'secure: true' on production (HTTPS)
  });

  return token;
};

export default generateTokenAndSetCookie;