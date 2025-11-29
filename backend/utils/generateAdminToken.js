import jwt from "jsonwebtoken";

const generateAdminToken = (adminId, res) => {
  const token = jwt.sign({ adminId }, process.env.JWT_SECRET, {
    expiresIn: "7d", // Token valid for 7 days
  });

  res.cookie("adminJwt", token, {
    httpOnly: true, // Can't be accessed from JS
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod
    sameSite: "strict", // Prevent CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export default generateAdminToken;
