import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { Assignment } from "../models/Assignment";
import { Classroom } from "../models/Classroom";
import { Submission } from "../models/Submission";
import { Notification } from "../models/Notification";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// Multer setup for assignment file uploads (both teacher creation and student submission)
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: (err: Error | null, destination: string) => void) => {
    const uploadDir = path.resolve(__dirname, "..", "..", "uploads", "assignments");
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req: any, file: any, cb: (err: Error | null, filename: string) => void) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({ storage });

// 1. Get all assignments for user with filtering, search, and classroom associations
router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { status, priority, search, classroomId } = req.query;
    let query: any = {};

    if (req.userRole === "teacher") {
      // Teachers see assignments they created
      query = { creatorId: req.userId };
      if (classroomId) {
        query.classroomId = classroomId;
      }
    } else {
      // Students see personal assignments OR assignments in classrooms they belong to
      const studentClassrooms = await Classroom.find({ "sections.studentIds": req.userId as any });
      const classroomIds = studentClassrooms.map((c) => c._id);
      
      if (classroomId) {
        // Filter student view by specific classroom ID if student is enrolled
        const isEnrolled = classroomIds.some((id) => id.toString() === (classroomId as string));
        if (isEnrolled) {
          query = { classroomId: classroomId, visibility: "classroom" };
        } else {
          query = { classroomId: classroomId, userId: req.userId };
        }
      } else {
        query = {
          $or: [
            { userId: req.userId, visibility: "personal" },
            { classroomId: { $in: classroomIds }, visibility: "classroom" }
          ]
        };
      }
    }

    // Filter by progress status (student only) or priority
    if (status && status !== "all") {
      query.status = status;
    }
    if (priority && priority !== "all") {
      query.priority = priority;
    }
    if (search && typeof search === "string" && search.trim() !== "") {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const assignments = await Assignment.find(query)
      .populate("classroomId", "name subject")
      .sort({ dueDate: 1 });
    res.json(assignments);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching assignments: " + error.message });
  }
});

// 2. Create new assignment (personal or classroom)
router.post("/", authMiddleware, upload.array("files", 6), async (req: AuthRequest, res) => {
  try {
    const { title, subject, description, dueDate, priority, visibility, classroomId } = req.body;

    const assignmentData: any = {
      title,
      subject,
      description,
      dueDate: new Date(dueDate),
      priority,
      creatorId: req.userId,
      visibility: visibility || "personal",
    };

    if (visibility === "classroom") {
      const { sectionId } = req.body;
      if (!classroomId) {
        return res.status(400).json({ message: "Classroom ID is required for classroom assignments." });
      }
      const classroom = await Classroom.findById(classroomId);
      if (!classroom) {
        return res.status(404).json({ message: "Classroom not found." });
      }
      if (classroom.teacherId.toString() !== req.userId) {
        return res.status(403).json({ message: "Unauthorized. Only the classroom teacher can create assignments." });
      }
      assignmentData.classroomId = classroomId;
      // Teacher owns this assignment task entry
      assignmentData.userId = classroom.teacherId;
      // Attach targeted section if provided
      if (sectionId) {
        assignmentData.targetSectionId = sectionId;
      }
    } else {
      assignmentData.userId = req.userId;
      assignmentData.visibility = "personal";
    }

    const assignment = new Assignment(assignmentData);
    await assignment.save();

    // Attach uploaded files to assignment attachments
    const uploadedFiles = (req.files as any[]) || [];
    if (uploadedFiles.length > 0) {
      const publicPaths = uploadedFiles.map(f => `/uploads/assignments/${f.filename}`);
      assignment.attachments = publicPaths;
      await assignment.save();
    }

    // If classroom assignment, initialize empty pending Submissions for all enrolled students
    if (visibility === "classroom") {
      const classroom = await Classroom.findById(classroomId);
      if (classroom) {
        // Determine targeted students: entire classroom or a specific section
        let targetStudentIds: any[] = [];
        if ((assignment as any).targetSectionId) {
          const section = (classroom as any).sections?.find((s: any) => s._id?.toString() === (assignment as any).targetSectionId?.toString());
          if (!section) {
            return res.status(404).json({ message: "Target section not found in classroom." });
          }
          targetStudentIds = section.studentIds || [];
        } else {
          // Flatten all sections' studentIds
          targetStudentIds = (classroom as any).sections?.flatMap((s: any) => s.studentIds) || [];
        }

        // Dedupe student IDs
        targetStudentIds = Array.from(new Set(targetStudentIds.map((id: any) => id.toString()))).map(id => id);

        if (targetStudentIds.length > 0) {
          const submissions = targetStudentIds.map(studentId => ({
            assignmentId: assignment._id,
            studentId: studentId,
            status: "pending",
            submittedAttachments: [],
            feedbackHistory: []
          }));
          await Submission.insertMany(submissions);

          // Notify targeted students
          const hasAttachments = Array.isArray(assignment.attachments) && assignment.attachments.length > 0;
          const notifications = targetStudentIds.map(studentId => ({
            userId: studentId,
            title: "New Assignment Posted",
            message: `A new assignment "${title}" has been posted in ${classroom.name}.${hasAttachments ? " It includes attachments." : ""}`
          }));
          await Notification.insertMany(notifications);
        }
      }
    }

    res.status(201).json(assignment);
  } catch (error: any) {
    res.status(500).json({ message: "Error creating assignment: " + error.message });
  }
});

// 3. Submit assignment files (Student Only)
router.post("/:id/submit", authMiddleware, upload.array("files", 6), async (req: AuthRequest, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found." });
    }
    if (assignment.assignmentStatus === "closed") {
      return res.status(400).json({ message: "Submissions are closed for this assignment." });
    }

    let parsedAttachments: any[] = [];
    if (req.body.submittedAttachments) {
      if (typeof req.body.submittedAttachments === "string") {
        try {
          parsedAttachments = JSON.parse(req.body.submittedAttachments);
        } catch {
          parsedAttachments = [];
        }
      } else if (Array.isArray(req.body.submittedAttachments)) {
        parsedAttachments = req.body.submittedAttachments;
      }
    }

    // Process actual uploaded files (PDFs, docs, images)
    const uploadedFiles = (req.files as any[]) || [];
    if (uploadedFiles.length > 0) {
      const fileAttachments = uploadedFiles.map((f) => ({
        fileName: f.originalname,
        url: `/uploads/assignments/${f.filename}`,
        fileType: path.extname(f.originalname).replace(".", "").toLowerCase() || "pdf",
        fileSize: f.size,
      }));
      parsedAttachments = [...parsedAttachments, ...fileAttachments];
    }

    const now = new Date();
    const isLate = now > new Date(assignment.dueDate);
    const status = isLate ? "late" : "submitted";

    let submission = await Submission.findOne({
      assignmentId: assignment._id,
      studentId: req.userId,
    });

    if (submission) {
      submission.submittedAttachments = parsedAttachments;
      submission.submittedAt = now;
      submission.status = status;
      await submission.save();
    } else {
      submission = new Submission({
        assignmentId: assignment._id,
        studentId: req.userId,
        submittedAttachments: parsedAttachments,
        submittedAt: now,
        status: status,
      });
      await submission.save();
    }

    // Toggle local student-side assignment completion status
    await Assignment.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { status: "completed", progress: 100 }
    );

    // Notify the classroom teacher
    const classroom = await Classroom.findById(assignment.classroomId);
    if (classroom) {
      const studentUser = await Classroom.db.model("User").findById(req.userId);
      const notification = new Notification({
        userId: classroom.teacherId,
        title: "Assignment Submitted",
        message: `${studentUser?.name || "A student"} submitted work for "${assignment.title}" in ${classroom.name}.`
      });
      await notification.save();
    }

    res.json({ message: "Assignment submitted successfully", submission });
  } catch (error: any) {
    res.status(500).json({ message: "Error submitting assignment: " + error.message });
  }
});

// 4. Retrieve student's submissions history (Grades view)
router.get("/my-submissions", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const submissions = await Submission.find({ studentId: req.userId })
      .populate("assignmentId", "title subject dueDate creatorId")
      .sort({ updatedAt: -1 });
    res.json(submissions);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch submissions: " + error.message });
  }
});

// 5. Update assignment progress (Student personal tasks only)
router.put("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const assignment = await Assignment.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found or unauthorized." });
    }
    res.json(assignment);
  } catch (error: any) {
    res.status(500).json({ message: "Error updating assignment: " + error.message });
  }
});

// 6. Delete assignment
router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id });
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found." });
    }

    // Restrict deletion of classroom assignments to the creator teacher
    if (assignment.visibility === "classroom" && assignment.creatorId?.toString() !== req.userId) {
      return res.status(403).json({ message: "Only the teacher can delete classroom assignments." });
    }

    await Assignment.findByIdAndDelete(req.params.id);
    
    // Also clean up any submissions associated with it
    await Submission.deleteMany({ assignmentId: req.params.id });

    res.json({ message: "Assignment deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Error deleting assignment: " + error.message });
  }
});

export default router;
