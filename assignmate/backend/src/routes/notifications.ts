import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { Notification } from "../models/Notification";

const router = Router();

// 1. Get user notifications
router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const notifications = await Notification.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch notifications: " + error.message });
  }
});

// 2. Mark notification as read
router.put("/:id/read", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }
    res.json(notification);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to update notification: " + error.message });
  }
});

// 3. Mark all as read
router.put("/read/all", authMiddleware, async (req: AuthRequest, res) => {
  try {
    await Notification.updateMany({ userId: req.userId, read: false }, { read: true });
    res.json({ message: "All notifications marked as read." });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to mark all as read: " + error.message });
  }
});

export default router;
