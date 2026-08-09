import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { User } from "../models/User";
import { AuthRequest } from "../middleware/auth";

const router = Router();

// Get current user
router.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user" });
  }
});

// Update user profile
router.put("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, college, branch, semester } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, college, branch, semester },
      { new: true }
    ).select("-password");

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error updating user" });
  }
});

export default router;
