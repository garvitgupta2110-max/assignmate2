import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { User } from "./models/User";
import { Classroom } from "./models/Classroom";
import { Assignment } from "./models/Assignment";
import { Submission } from "./models/Submission";

dotenv.config();

const mongoUrl = process.env.MONGODB_URI || "mongodb://localhost:27017/cvsync";

async function seed() {
  try {
    await mongoose.connect(mongoUrl);
    console.log("Connected to MongoDB for seeding...");

    const passwordHash = await bcrypt.hash("Password@123", 10);

    // 1. Create or Update Teacher
    let teacher = await User.findOne({ email: "teacher@assignmate.com" });
    if (!teacher) {
      teacher = new User({
        email: "teacher@assignmate.com",
        password: passwordHash,
        name: "Prof. Rajesh Sharma",
        role: "teacher",
        college: "National Institute of Technology",
        branch: "Computer Science",
        semester: 0,
      });
      await teacher.save();
      console.log("Teacher account created: teacher@assignmate.com");
    } else {
      teacher.password = passwordHash;
      teacher.role = "teacher";
      await teacher.save();
      console.log("Teacher account updated: teacher@assignmate.com");
    }

    // 2. Create or Update Student
    let student = await User.findOne({ email: "student@assignmate.com" });
    if (!student) {
      student = new User({
        email: "student@assignmate.com",
        password: passwordHash,
        name: "Garvit Gupta",
        role: "student",
        college: "National Institute of Technology",
        branch: "Computer Science",
        semester: 6,
      });
      await student.save();
      console.log("Student account created: student@assignmate.com");
    } else {
      student.password = passwordHash;
      student.role = "student";
      await student.save();
      console.log("Student account updated: student@assignmate.com");
    }

    // 3. Create or Link Demo Classroom
    let classroom = await Classroom.findOne({ teacherId: teacher._id, name: "Advanced Web Technologies" });
    if (!classroom) {
      classroom = new Classroom({
        name: "Advanced Web Technologies",
        subject: "CS-601",
        teacherId: teacher._id,
        joinCode: "CS6-001",
        sections: [
          {
            name: "Section A",
            studentIds: [student._id],
          },
        ],
      });
      await classroom.save();
      console.log("Demo Classroom created with Join Code: CS6-001");
    } else {
      // Ensure student is in sections
      if (!classroom.sections || classroom.sections.length === 0) {
        classroom.sections = [{ name: "Section A", studentIds: [student._id] as any }];
      } else {
        const sec = classroom.sections[0];
        if (!sec.studentIds.some((id: any) => id.toString() === student._id.toString())) {
          sec.studentIds.push(student._id as any);
        }
      }
      await classroom.save();
      console.log("Demo Classroom synced with student enrolled.");
    }

    // 4. Create Demo Classroom Assignment
    let assignment = await Assignment.findOne({ classroomId: classroom._id, title: "Lab 3: Full Stack REST API & PDF Parser" });
    if (!assignment) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      assignment = new Assignment({
        userId: teacher._id,
        creatorId: teacher._id,
        title: "Lab 3: Full Stack REST API & PDF Parser",
        subject: "CS-601",
        description: "Implement a full stack NodeJS + Next.js application with JWT authentication, MongoDB models, and PDF upload support.\nSubmit your solution PDF report and source code archive.",
        dueDate: dueDate,
        priority: "high",
        visibility: "classroom",
        classroomId: classroom._id,
        targetSectionId: classroom.sections?.[0]?._id,
        assignmentStatus: "active",
        attachments: ["/uploads/assignments/sample.pdf"],
      });
      await assignment.save();
      console.log("Demo Assignment created: Lab 3: Full Stack REST API & PDF Parser");

      // Seed a pending submission for the student
      const submission = new Submission({
        assignmentId: assignment._id,
        studentId: student._id,
        status: "pending",
        submittedAttachments: [],
        feedbackHistory: [],
      });
      await submission.save();
    }

    console.log("Seeding complete successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
