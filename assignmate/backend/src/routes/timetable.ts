import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { Timetable } from "../models/Timetable";
import { AuthRequest } from "../middleware/auth";

const router = Router();

// Get timetable for user
router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    let timetable = await Timetable.findOne({ userId: req.userId });
    
    if (!timetable) {
      timetable = new Timetable({
        userId: req.userId,
        schedule: [],
      });
      await timetable.save();
    }

    res.json(timetable);
  } catch (error) {
    res.status(500).json({ message: "Error fetching timetable" });
  }
});

// Update timetable
router.put("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { schedule } = req.body;

    let timetable = await Timetable.findOne({ userId: req.userId });

    if (!timetable) {
      timetable = new Timetable({
        userId: req.userId,
        schedule,
      });
    } else {
      timetable.schedule = schedule;
    }

    await timetable.save();
    res.json(timetable);
  } catch (error) {
    res.status(500).json({ message: "Error updating timetable" });
  }
});

export default router;
