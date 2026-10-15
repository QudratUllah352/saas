require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Admin = require("../models/Admin");

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected");

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error(
        "ADMIN_EMAIL and ADMIN_PASSWORD are required"
      );
    }

    const existingAdmin = await Admin.findOne({
      email: email.toLowerCase(),
    });

    if (existingAdmin) {
      console.log("Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    await Admin.create({
      name: "SaaSPic Admin",
      email,
      password: hashedPassword,
      role: "superadmin",
    });

    console.log("Admin created successfully");
  } catch (error) {
    process.exitCode = 1;
    console.error(
      "Create admin error:",
      error.message
    );
  } finally {
    await mongoose.connection.close();
  }
}

createAdmin();
