import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { teacherMiddleware } from "../middleware/teacher";
import { Classroom } from "../models/Classroom";
const router = Router();

// 1. Create a Classroom (Teacher Only)
router.post("/create", authMiddleware, teacherMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, subject } = req.body;

    if (!name || !subject) {
      return res.status(400).json({ message: "Classroom name and subject are required." });
    }

    const { sections } = req.body;

    const classroom = new Classroom({
      name,
      subject,
      teacherId: req.userId,
      sections: Array.isArray(sections)
        ? sections.map((s: any) => ({ name: s.name, studentIds: s.studentIds || [] }))
        : [],
    });

    await classroom.save();
    res.status(201).json(classroom);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to create classroom: " + error.message });
  }
});

// 2. Join Classroom (Student Only)
router.post("/join", authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== "student") {
      return res.status(403).json({ message: "Only students can join classrooms." });
    }

    const { joinCode } = req.body;
    if (!joinCode || typeof joinCode !== "string") {
      return res.status(400).json({ message: "Join code is required." });
    }

    const classroom = await Classroom.findOne({ joinCode: joinCode.trim().toUpperCase() });
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found for this join code." });
    }

    const studentId = req.userId;
    const alreadyJoined = (classroom.sections || []).some((section: any) =>
      (section.studentIds || []).some((id: any) => id.toString() === studentId)
    );

    if (alreadyJoined) {
      return res.status(409).json({ message: "You are already enrolled in this classroom." });
    }

    const defaultSection = (classroom.sections || []).find((section: any) => section.name === "General")
      || (classroom.sections || [])[0]
      || null;

    if (classroom.sections && classroom.sections.length > 0) {
      const section = classroom.sections[0];
      if (section && Array.isArray(section.studentIds)) {
        section.studentIds.push(studentId as any);
      } else {
        classroom.sections = [
          ...(classroom.sections || []),
          { name: "General", studentIds: [studentId as any] }
        ];
      }
    } else {
      classroom.sections = [
        { name: "General", studentIds: [studentId as any] }
      ];
    }

    await classroom.save();
    res.status(200).json(classroom);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to join classroom: " + error.message });
  }
});

// 3. Get User's Classrooms (Student & Teacher)
router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.userRole === "teacher") {
      const classrooms = await Classroom.find({ teacherId: req.userId })
        .populate({ path: "sections.studentIds", select: "name email" });
      return res.json(classrooms);
    } else {
      const classrooms = await Classroom.find({ "sections.studentIds": req.userId })
        .populate("teacherId", "name email")
        .populate({ path: "sections.studentIds", select: "name email" });
      return res.json(classrooms);
    }
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch classrooms: " + error.message });
  }
});

export default router;
