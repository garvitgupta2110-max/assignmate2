import mongoose, { Schema, Document } from "mongoose";

export interface IClassroom extends Document {
  name: string;
  subject: string;
  teacherId: mongoose.Types.ObjectId;
  joinCode: string;
  sections?: {
    _id?: mongoose.Types.ObjectId;
    name: string;
    studentIds: mongoose.Types.ObjectId[];
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const generateJoinCode = () => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const part1 = Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join("");
  const part2 = Array.from({ length: 3 }, () => numbers[Math.floor(Math.random() * numbers.length)]).join("");
  return `${part1}-${part2}`;
};

const classroomSchema = new Schema<IClassroom>(
  {
    name: { type: String, required: true },
    subject: { type: String, required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    joinCode: {
      type: String,
      required: true,
      unique: true,
      default: generateJoinCode,
    },
    sections: [
      {
        name: { type: String, required: true },
        studentIds: [
          {
            type: Schema.Types.ObjectId,
            ref: "User",
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

classroomSchema.pre("save", function (next) {
  if (!this.joinCode) {
    this.joinCode = generateJoinCode();
  }
  next();
});

export const Classroom = mongoose.model<IClassroom>("Classroom", classroomSchema);
