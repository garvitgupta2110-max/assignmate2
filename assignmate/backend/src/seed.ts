import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { User } from "./models/User";
import { connectDB } from "./config/database";

dotenv.config();

const seed = async () => {
  try {
    await connectDB();

    const studentEmail = "test@example.com";
    const teacherEmail = "teacher@example.com";

    const studentExists = await User.findOne({ email: studentEmail });
    if (!studentExists) {
      const hashedPassword = await bcrypt.hash("password123", 10);
      const demoStudent = new User({
        email: studentEmail,
        name: "Demo Student",
        password: hashedPassword,
        college: "State University",
        branch: "Computer Science",
        semester: 6,
        role: "student",
      });

      await demoStudent.save();
    }

    const teacherExists = await User.findOne({ email: teacherEmail });
    if (!teacherExists) {
      const hashedPassword = await bcrypt.hash("teacher123", 10);
      const demoTeacher = new User({
        email: teacherEmail,
        name: "Demo Teacher",
        password: hashedPassword,
        college: "State University",
        branch: "Computer Science",
        semester: 6,
        role: "teacher",
      });

      await demoTeacher.save();
    }

    console.log("Database seeded successfully.");
    console.log("Student login: test@example.com / password123");
    console.log("Teacher login: teacher@example.com / teacher123");
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
};

seed();
