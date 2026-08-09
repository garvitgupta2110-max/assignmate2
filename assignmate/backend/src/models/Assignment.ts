import mongoose, { Schema, Document } from "mongoose";

export interface IAssignment extends Document {
  userId: mongoose.Types.ObjectId;
  creatorId?: mongoose.Types.ObjectId;
  title: string;
  subject: string;
  description?: string;
  dueDate: Date;
  priority: "low" | "medium" | "high";
  status: "pending" | "in-progress" | "completed";
  progress: number;
  attachments?: string[];
  visibility: "personal" | "classroom";
  classroomId?: mongoose.Types.ObjectId;
  assignmentStatus: "active" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<IAssignment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    attachments: {
      type: [String],
    },
    visibility: {
      type: String,
      enum: ["personal", "classroom"],
      default: "personal",
    },
    classroomId: {
      type: Schema.Types.ObjectId,
      ref: "Classroom",
    },
    assignmentStatus: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
    },
  },
  { timestamps: true }
);

assignmentSchema.index({
  title: "text",
  subject: "text",
  description: "text",
});

export const Assignment = mongoose.model<IAssignment>(
  "Assignment",
  assignmentSchema
);
