import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { teacherMiddleware } from "../middleware/teacher";
import { Classroom } from "../models/Classroom";
import { Assignment } from "../models/Assignment";
import { Submission } from "../models/Submission";
import { Notification } from "../models/Notification";

const router = Router();

// Helper to calculate Grade Letter
function getGradeLetter(percentage: number): string {
  if (percentage >= 90) return "A";
  if (percentage >= 80) return "B";
  if (percentage >= 70) return "C";
  if (percentage >= 60) return "D";
  return "F";
}

// 1. Get all student submissions for a classroom (Teacher Only)
router.get("/classroom/:classroomId", authMiddleware, teacherMiddleware, async (req: AuthRequest, res) => {
  try {
    const { classroomId } = req.params;

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found." });
    }

    // Classroom ownership check
    if (classroom.teacherId.toString() !== req.userId) {
      return res.status(403).json({ message: "Unauthorized. You do not teach this classroom." });
    }

    const classroomAssignments = await Assignment.find({ classroomId });
    const assignmentIds = classroomAssignments.map((a) => a._id);

    const submissions = await Submission.find({ assignmentId: { $in: assignmentIds } })
      .populate("studentId", "name email college branch semester")
      .populate("assignmentId", "title subject dueDate assignmentStatus")
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch classroom submissions: " + error.message });
  }
});

// 2. Classroom Grading Analytics (Teacher Only)
router.get("/stats/:classroomId", authMiddleware, teacherMiddleware, async (req: AuthRequest, res) => {
  try {
    const { classroomId } = req.params;

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found." });
    }

    if (classroom.teacherId.toString() !== req.userId) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    const classroomAssignments = await Assignment.find({ classroomId });
    const assignmentIds = classroomAssignments.map((a) => a._id);

    const submissions = await Submission.find({ assignmentId: { $in: assignmentIds } });

    const totalStudents = classroom.studentIds.length;
    const totalSubmissions = submissions.filter((s) => s.status !== "pending").length;
    const pendingReviews = submissions.filter((s) => s.status === "submitted" || s.status === "late").length;
    const lateSubmissions = submissions.filter((s) => s.status === "late").length;

    // Calculate marks analytics
    const gradedSubmissions = submissions.filter((s) => s.status === "graded" && s.percentage !== undefined);
    let avgScore = 0;
    let highestScore = 0;
    let lowestScore = 100;
    let passCount = 0;

    if (gradedSubmissions.length > 0) {
      let totalPercentage = 0;
      gradedSubmissions.forEach((s) => {
        const pct = s.percentage || 0;
        totalPercentage += pct;
        if (pct > highestScore) highestScore = pct;
        if (pct < lowestScore) lowestScore = pct;
        if (pct >= 50) passCount++;
      });
      avgScore = Math.round(totalPercentage / gradedSubmissions.length);
    } else {
      lowestScore = 0;
    }

    const passRate = gradedSubmissions.length > 0 
      ? Math.round((passCount / gradedSubmissions.length) * 100) 
      : 0;

    // Grade distribution counters
    const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    gradedSubmissions.forEach((s) => {
      const gl = s.gradeLetter || "F";
      if (gl in gradeDistribution) {
        gradeDistribution[gl as keyof typeof gradeDistribution]++;
      }
    });

    res.json({
      totalStudents,
      totalSubmissions,
      pendingReviews,
      lateSubmissions,
      avgScore,
      highestScore: Math.round(highestScore),
      lowestScore: Math.round(lowestScore),
      passRate,
      gradeDistribution,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to load classroom stats: " + error.message });
  }
});

// 3. Grade a Submission (Teacher Only)
router.put("/:id/grade", authMiddleware, teacherMiddleware, async (req: AuthRequest, res) => {
  try {
    const { marks, maxMarks, feedback } = req.body;

    if (marks === undefined || maxMarks === undefined) {
      return res.status(400).json({ message: "Marks and Max Marks are required." });
    }

    const submission = await Submission.findById(req.params.id).populate("assignmentId");
    if (!submission) {
      return res.status(404).json({ message: "Submission not found." });
    }

    const assignment = submission.assignmentId as any;
    const classroom = await Classroom.findById(assignment.classroomId);

    // Verify teacher owns the classroom
    if (!classroom || classroom.teacherId.toString() !== req.userId) {
      return res.status(403).json({ message: "Unauthorized. You are not the teacher of this assignment." });
    }

    const percentage = Math.round((Number(marks) / Number(maxMarks)) * 100);
    const gradeLetter = getGradeLetter(percentage);

    submission.marks = Number(marks);
    submission.maxMarks = Number(maxMarks);
    submission.percentage = percentage;
    submission.gradeLetter = gradeLetter;
    submission.status = "graded";
    submission.gradedBy = req.userId as any;
    submission.gradedAt = new Date();

    if (feedback && feedback.trim() !== "") {
      submission.feedbackHistory.push({
        feedback: feedback.trim(),
        createdAt: new Date(),
      });
    }

    await submission.save();

    // Trigger Notification for the student
    const notification = new Notification({
      userId: submission.studentId,
      title: "Assignment Graded",
      message: `Your work for "${assignment.title}" has been graded: ${marks}/${maxMarks} (${gradeLetter} - ${percentage}%)`,
    });
    await notification.save();

    res.json({ message: "Submission graded successfully", submission });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to grade submission: " + error.message });
  }
});

export default router;
