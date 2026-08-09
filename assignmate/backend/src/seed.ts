import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { User } from "./models/User";
import { connectDB } from "./config/database";

dotenv.config();

const seed = async () => {
  try {
    await connectDB();

    const email = "test@example.com";
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log("Demo user test@example.com already exists in the database.");
    } else {
      const hashedPassword = await bcrypt.hash("password123", 10);
      const demoUser = new User({
        email,
        name: "Demo Student",
        password: hashedPassword,
        college: "State University",
        branch: "Computer Science",
        semester: "6",
      });

      await demoUser.save();
      console.log("Database seeded successfully. Demo user created:");
      console.log("Email: test@example.com");
      console.log("Password: password123");
    }
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
};

seed();
