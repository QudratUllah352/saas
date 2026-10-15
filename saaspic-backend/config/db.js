const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    ...(process.env.NODE_ENV === "production" ? { autoIndex: false } : {}),
  });
  console.log("MongoDB connected successfully");
};

module.exports = connectDB;
