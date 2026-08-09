import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  name: string;
  password?: string;
  profileImage?: string;
  college?: string;
  branch?: string;
  semester?: number;
  role: "student" | "teacher";
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
    },
    profileImage: {
      type: String,
    },
    college: {
      type: String,
    },
    branch: {
      type: String,
    },
    semester: {
      type: Number,
    },
    role: {
      type: String,
      enum: ["student", "teacher"],
      default: "student",
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema);
