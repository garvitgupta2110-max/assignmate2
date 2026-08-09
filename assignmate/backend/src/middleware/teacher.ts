import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

export const teacherMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.userRole !== "teacher") {
    return res.status(403).json({ message: "Access denied. Teacher role required." });
  }
  next();
};
