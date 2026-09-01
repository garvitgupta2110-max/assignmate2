import mongoose, { Schema, Document } from "mongoose";

export interface ISubmission extends Document {
  assignmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  submittedAttachments: Array<{
    fileName: string;
    url: string;
    fileType: string;
    fileSize?: number;
    publicId?: string;
  }>;
  submittedAt?: Date;
  status: "pending" | "submitted" | "late" | "graded";
  marks?: number;
  maxMarks?: number;
  percentage?: number;
  gradeLetter?: string;
  feedbackHistory: Array<{
    feedback: string;
    createdAt: Date;
  }>;
  isHandwritten?: boolean;
  handwrittenExplanation?: string;
  isAiGenerated?: boolean;
  aiScore?: number;
  aiExplanation?: string;
  submittedCode?: string;
  submittedLanguage?: string;
  isAutoEvaluated?: boolean;
  autoEvaluationPassed?: boolean;
  autoEvaluationOutput?: string;
  autoEvaluationExpected?: string;
  gradedBy?: mongoose.Types.ObjectId;
  gradedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const submissionSchema = new Schema<ISubmission>(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    submittedAttachments: [
      {
        fileName: { type: String, required: true },
        url: { type: String, required: true },
        fileType: { type: String, required: true },
        fileSize: { type: Number },
        publicId: { type: String },
      },
    ],
    submittedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["pending", "submitted", "late", "graded"],
      default: "pending",
    },
    marks: {
      type: Number,
    },
    maxMarks: {
      type: Number,
    },
    percentage: {
      type: Number,
    },
    gradeLetter: {
      type: String,
    },
    feedbackHistory: [
      {
        feedback: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    isHandwritten: {
      type: Boolean,
    },
    handwrittenExplanation: {
      type: String,
    },
    isAiGenerated: {
      type: Boolean,
    },
    aiScore: {
      type: Number,
    },
    aiExplanation: {
      type: String,
    },
    submittedCode: {
      type: String,
    },
    submittedLanguage: {
      type: String,
    },
    isAutoEvaluated: {
      type: Boolean,
    },
    autoEvaluationPassed: {
      type: Boolean,
    },
    autoEvaluationOutput: {
      type: String,
    },
    autoEvaluationExpected: {
      type: String,
    },
    gradedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    gradedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

submissionSchema.index({ studentId: 1 });
submissionSchema.index({ assignmentId: 1 });
submissionSchema.index({ status: 1 });
submissionSchema.index({ studentId: 1, assignmentId: 1 }, { unique: true }); // A student can have only one submission per assignment

export const Submission = mongoose.model<ISubmission>("Submission", submissionSchema);
