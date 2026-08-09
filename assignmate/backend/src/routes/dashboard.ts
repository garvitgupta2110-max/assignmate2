import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { Assignment } from "../models/Assignment";
import { Resume } from "../models/Resume";
import { Presentation } from "../models/Presentation";

const router = Router();

// Get aggregated dashboard statistics
router.get("/stats", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;

    // Run queries concurrently
    const [
      totalAssignments,
      completedAssignments,
      resumesCount,
      presentationsCount,
      upcomingDeadlines,
    ] = await Promise.all([
      Assignment.countDocuments({ userId }),
      Assignment.countDocuments({ userId, status: "completed" }),
      Resume.countDocuments({ userId }),
      Presentation.countDocuments({ userId }),
      Assignment.find({ userId, status: { $ne: "completed" } })
        .sort({ dueDate: 1 })
        .limit(5),
    ]);

    // Calculate due date categories
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    const endOfTomorrow = new Date(endOfToday.getTime() + 24 * 60 * 60 * 1000);
    const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [overdueCount, todayCount, tomorrowCount, thisWeekCount] = await Promise.all([
      Assignment.countDocuments({
        userId,
        status: { $ne: "completed" },
        dueDate: { $lt: startOfToday },
      }),
      Assignment.countDocuments({
        userId,
        status: { $ne: "completed" },
        dueDate: { $gte: startOfToday, $lte: endOfToday },
      }),
      Assignment.countDocuments({
        userId,
        status: { $ne: "completed" },
        dueDate: { $gte: startOfTomorrow, $lte: endOfTomorrow },
      }),
      Assignment.countDocuments({
        userId,
        status: { $ne: "completed" },
        dueDate: { $gte: startOfToday, $lte: endOfWeek },
      }),
    ]);

    // Calculate productivity score (percentage completed)
    const productivity = totalAssignments > 0
      ? Math.round((completedAssignments / totalAssignments) * 100)
      : 0;

    res.json({
      assignments: totalAssignments,
      completed: completedAssignments,
      upcoming: totalAssignments - completedAssignments,
      resumes: resumesCount,
      presentations: presentationsCount,
      productivity,
      upcomingDeadlines,
      dueCategories: {
        today: todayCount,
        tomorrow: tomorrowCount,
        thisWeek: thisWeekCount,
        overdue: overdueCount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching dashboard statistics" });
  }
});

export default router;
