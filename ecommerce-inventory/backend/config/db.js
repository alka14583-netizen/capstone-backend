const mongoose = require("mongoose");

// Connects to MongoDB using the address stored in the .env file.
module.exports = async function connectDB() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is missing in .env");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");
};
