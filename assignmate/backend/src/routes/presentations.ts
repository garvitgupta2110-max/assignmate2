import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { Presentation } from "../models/Presentation";
import { AuthRequest } from "../middleware/auth";

const router = Router();

// Get all presentations for user
router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const presentations = await Presentation.find({ userId: req.userId });
    res.json(presentations);
  } catch (error) {
    res.status(500).json({ message: "Error fetching presentations" });
  }
});

// Create new presentation
router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { title, subject, template } = req.body;

    const presentation = new Presentation({
      userId: req.userId,
      title,
      subject,
      template,
      slides: [],
    });

    await presentation.save();
    res.status(201).json(presentation);
  } catch (error) {
    res.status(500).json({ message: "Error creating presentation" });
  }
});

// Update presentation
router.put("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const presentation = await Presentation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(presentation);
  } catch (error) {
    res.status(500).json({ message: "Error updating presentation" });
  }
});

// Delete presentation
router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    await Presentation.findByIdAndDelete(req.params.id);
    res.json({ message: "Presentation deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting presentation" });
  }
});

export default router;
