const mongoose = require("mongoose");

mongoose.set("strictQuery", true);

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is not set in environment variables");
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    throw error;
  }
};

mongoose.connection.on("error", (error) => {
  console.error(`MongoDB connection error: ${error.message}`);
});

module.exports = connectDB;
