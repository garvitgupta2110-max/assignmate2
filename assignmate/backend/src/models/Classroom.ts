import mongoose, { Schema, Document } from "mongoose";

export interface IClassroom extends Document {
  name: string;
  subject: string;
  teacherId: mongoose.Types.ObjectId;
  joinCode: string;
  studentIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const classroomSchema = new Schema<IClassroom>(
  {
    name: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    joinCode: {
      type: String,
      required: true,
      unique: true,
    },
    studentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

classroomSchema.index({ joinCode: 1 });

export const Classroom = mongoose.model<IClassroom>("Classroom", classroomSchema);
