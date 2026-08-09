import mongoose, { Schema, Document } from "mongoose";

export interface ITimetable extends Document {
  userId: mongoose.Types.ObjectId;
  schedule: Array<{
    day: number; // 0-6 (Sunday-Saturday)
    startTime: string; // HH:MM
    endTime: string;
    subject: string;
    color: string;
    room?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const timetableSchema = new Schema<ITimetable>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    schedule: [
      {
        day: Number,
        startTime: String,
        endTime: String,
        subject: String,
        color: String,
        room: String,
      },
    ],
  },
  { timestamps: true }
);

export const Timetable = mongoose.model<ITimetable>("Timetable", timetableSchema);
