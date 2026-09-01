import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { Material } from "../models/Material";
import { Classroom } from "../models/Classroom";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// Multer storage for study materials uploads
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: (err: Error | null, destination: string) => void) => {
    const uploadDir = path.resolve(__dirname, "..", "..", "uploads", "materials");
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req: any, file: any, cb: (err: Error | null, filename: string) => void) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({ storage });

// 1. Get all study materials for a classroom
router.get("/:classroomId", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { classroomId } = req.params;

    // Verify enrollment/ownership
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    if (req.userRole === "student") {
      const isEnrolled = classroom.sections?.some((s) =>
        s.studentIds.some((id) => id.toString() === req.userId?.toString())
      ) || false;
      if (!isEnrolled) {
        return res.status(403).json({ message: "You are not enrolled in this classroom" });
      }
    } else {
      if (classroom.teacherId.toString() !== req.userId?.toString()) {
        return res.status(403).json({ message: "You are not the teacher of this classroom" });
      }
    }

    const materials = await Material.find({ classroomId }).sort({ createdAt: -1 });
    res.json(materials);
  } catch (error: any) {
    console.error("Error fetching materials:", error);
    res.status(500).json({ message: "Error fetching study materials" });
  }
});

// 2. Upload study material (Teacher only)
router.post("/:classroomId", authMiddleware, upload.single("file"), async (req: AuthRequest, res) => {
  try {
    const { classroomId } = req.params;
    const { title, description } = req.body;
    const file = req.file;

    if (req.userRole !== "teacher") {
      return res.status(403).json({ message: "Only teachers can upload study materials" });
    }

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(404).json({ message: "Classroom not found" });
    }

    if (classroom.teacherId.toString() !== req.userId?.toString()) {
      if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(403).json({ message: "You are not the teacher of this classroom" });
    }

    if (!title || !file) {
      if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({ message: "Title and file are required" });
    }

    const fileType = path.extname(file.originalname).replace(".", "").toLowerCase() || "pdf";

    const material = new Material({
      classroomId,
      teacherId: req.userId,
      title,
      description,
      fileName: file.originalname,
      url: `/uploads/materials/${file.filename}`,
      fileType,
      fileSize: file.size,
    });

    await material.save();
    res.status(201).json(material);
  } catch (error: any) {
    console.error("Error uploading material:", error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: "Error uploading study material" });
  }
});

// 3. Delete study material (Teacher only)
router.delete("/:classroomId/:materialId", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { classroomId, materialId } = req.params;

    if (req.userRole !== "teacher") {
      return res.status(403).json({ message: "Only teachers can delete study materials" });
    }

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    if (classroom.teacherId.toString() !== req.userId?.toString()) {
      return res.status(403).json({ message: "You are not the teacher of this classroom" });
    }

    const material = await Material.findOne({ _id: materialId, classroomId });
    if (!material) {
      return res.status(404).json({ message: "Study material not found" });
    }

    // Delete file from disk
    const filePath = path.resolve(__dirname, "..", "..", material.url.substring(1));
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Failed to delete material file from disk:", err);
      }
    }

    await Material.deleteOne({ _id: materialId });
    res.json({ message: "Study material deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting material:", error);
    res.status(500).json({ message: "Error deleting study material" });
  }
});

export default router;
