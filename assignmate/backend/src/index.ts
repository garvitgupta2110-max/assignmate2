import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { connectDB } from "./config/database";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import assignmentRoutes from "./routes/assignments";
import resumeRoutes from "./routes/resumes";
import presentationRoutes from "./routes/presentations";
import timetableRoutes from "./routes/timetable";
import dashboardRoutes from "./routes/dashboard";
import aiRoutes from "./routes/ai";
import classroomRoutes from "./routes/classrooms";
import submissionRoutes from "./routes/submissions";
import notificationRoutes from "./routes/notifications";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const baseAllowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:3002",
];

// Helper to check if origin is allowed
const isOriginAllowed = (origin?: string): boolean => {
  if (!origin) return true; // Allow non-browser requests (Postman, server-to-server, mobile)
  
  const normalizedOrigin = origin.replace(/\/$/, "");
  
  // Explicit base origins
  if (baseAllowedOrigins.includes(normalizedOrigin)) return true;

  // Check FRONTEND_URL and ALLOWED_ORIGINS env variables
  const customOrigins = [
    ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",") : []),
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : []),
  ].map((url) => url.trim().replace(/\/$/, ""));

  if (customOrigins.includes(normalizedOrigin) || customOrigins.includes("*")) {
    return true;
  }

  // Regex patterns for local dev and cloud platforms (Render, Vercel, Netlify)
  try {
    const url = new URL(origin);
    if (
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname.endsWith(".onrender.com") ||
      url.hostname.endsWith(".vercel.app") ||
      url.hostname.endsWith(".netlify.app")
    ) {
      return true;
    }
  } catch {
    // If URL parsing fails, continue to check
  }

  return false;
};

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(path.resolve(__dirname, "..", "uploads")));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "Server is running" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/presentations", presentationRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/classrooms", classroomRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/notifications", notificationRoutes);

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
