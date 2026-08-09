import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { Resume } from "../models/Resume";
import { AuthRequest } from "../middleware/auth";

const router = Router();

// Get all resumes for user
router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const resumes = await Resume.find({ userId: req.userId });
    res.json(resumes);
  } catch (error) {
    res.status(500).json({ message: "Error fetching resumes" });
  }
});

// Create new resume
router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { title, template, content } = req.body;

    const resume = new Resume({
      userId: req.userId,
      title,
      template,
      content,
    });

    await resume.save();
    res.status(201).json(resume);
  } catch (error) {
    res.status(500).json({ message: "Error creating resume" });
  }
});

// Update resume
router.put("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const resume = await Resume.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(resume);
  } catch (error) {
    res.status(500).json({ message: "Error updating resume" });
  }
});

// Delete resume
router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    await Resume.findByIdAndDelete(req.params.id);
    res.json({ message: "Resume deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting resume" });
  }
});

export default router;
