import mongoose, { Schema, Document } from "mongoose";

export interface IPresentation extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  subject: string;
  template: string;
  slides: Array<{
    title: string;
    content: string;
    imageUrl?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const presentationSchema = new Schema<IPresentation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    template: {
      type: String,
      enum: ["academic", "business", "minimal", "modern"],
      default: "modern",
    },
    slides: [
      {
        title: String,
        content: String,
        imageUrl: String,
      },
    ],
  },
  { timestamps: true }
);

export const Presentation = mongoose.model<IPresentation>(
  "Presentation",
  presentationSchema
);
