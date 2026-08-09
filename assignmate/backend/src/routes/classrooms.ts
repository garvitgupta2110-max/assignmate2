import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { teacherMiddleware } from "../middleware/teacher";
import { Classroom } from "../models/Classroom";
import crypto from "crypto";

const router = Router();

// Helper to generate readable strong join codes: SUBJECT-XXXX
function generateJoinCode(subject: string): string {
  const cleanSubject = subject
    .replace(/[^a-zA-Z]/g, "")
    .substring(0, 4)
    .toUpperCase();
  const prefix = cleanSubject.padEnd(4, "X");
  const randomChars = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${prefix}-${randomChars}`;
}

// 1. Create a Classroom (Teacher Only)
router.post("/create", authMiddleware, teacherMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, subject } = req.body;

    if (!name || !subject) {
      return res.status(400).json({ message: "Classroom name and subject are required." });
    }

    // Generate unique code
    let joinCode = generateJoinCode(subject);
    let codeExists = await Classroom.findOne({ joinCode });
    while (codeExists) {
      joinCode = generateJoinCode(subject);
      codeExists = await Classroom.findOne({ joinCode });
    }

    const classroom = new Classroom({
      name,
      subject,
      teacherId: req.userId,
      joinCode,
      studentIds: [],
    });

    await classroom.save();
    res.status(201).json(classroom);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to create classroom: " + error.message });
  }
});

// 2. Join a Classroom (Student Only)
router.post("/join", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { joinCode } = req.body;

    if (!joinCode) {
      return res.status(400).json({ message: "Join code is required." });
    }

    const classroom = await Classroom.findOne({ joinCode: joinCode.trim().toUpperCase() });
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found. Please verify the code." });
    }

    // Check if student is already enrolled
    const studentIdObj: any = req.userId;
    if (classroom.studentIds.includes(studentIdObj)) {
      return res.status(400).json({ message: "Already joined this classroom." });
    }

    // Add student to classroom
    classroom.studentIds.push(studentIdObj);
    await classroom.save();

    res.json({ message: "Successfully joined classroom", classroom });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to join classroom: " + error.message });
  }
});

// 3. Get User's Classrooms (Student & Teacher)
router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.userRole === "teacher") {
      const classrooms = await Classroom.find({ teacherId: req.userId }).populate("studentIds", "name email");
      return res.json(classrooms);
    } else {
      const classrooms = await Classroom.find({ studentIds: req.userId }).populate("teacherId", "name email");
      return res.json(classrooms);
    }
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch classrooms: " + error.message });
  }
});

export default router;
