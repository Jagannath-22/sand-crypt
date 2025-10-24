import mongoose from "mongoose";

const connectToMongoDB = async () => {
  try {
    const mongoURI = process.env.MONGO_DB_URI;

    if (!mongoURI) {
      console.error("❌ Error: MONGO_DB_URI not found in environment variables. Please set it in your .env file.");
      process.exit(1); // Exit the process if the URI is not found
    }

    await mongoose.connect(mongoURI);

    // Optional: Log connection details for confirmation
    const { host, port, name } = mongoose.connection; // Use mongoose.connection directly
    console.log("✅ Connected to MongoDB");
    console.log(`📦 Database Name: ${name}`);
    console.log(`🌐 Host: ${host}`);
    console.log(`📍 Port: ${port}`);
    console.log(`🔗 Connection Status: ${mongoose.connection.readyState === 1 ? "Connected" : "Not Connected"}`);

  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error.message);
    process.exit(1); // Exit process with failure
  }
};

export default connectToMongoDB;
