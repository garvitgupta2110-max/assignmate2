import mongoose, { Schema, Document } from "mongoose";

export interface IResume extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  template: string;
  content: {
    personalDetails: {
      name: string;
      email: string;
      phone?: string;
      location?: string;
      profileSummary?: string;
    };
    education: Array<{
      school: string;
      degree: string;
      field: string;
      startDate: Date;
      endDate: Date;
    }>;
    skills: string[];
    projects: Array<{
      title: string;
      description: string;
      link?: string;
    }>;
    certifications: Array<{
      name: string;
      issuer: string;
      date: Date;
    }>;
    experience: Array<{
      company: string;
      position: string;
      startDate: Date;
      endDate: Date;
      description: string;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const resumeSchema = new Schema<IResume>(
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
    template: {
      type: String,
      enum: ["modern", "ats-friendly", "professional", "minimal"],
      default: "modern",
    },
    content: {
      personalDetails: {
        name: String,
        email: String,
        phone: String,
        location: String,
        profileSummary: String,
      },
      education: [
        {
          school: String,
          degree: String,
          field: String,
          startDate: Date,
          endDate: Date,
        },
      ],
      skills: [String],
      projects: [
        {
          title: String,
          description: String,
          link: String,
        },
      ],
      certifications: [
        {
          name: String,
          issuer: String,
          date: Date,
        },
      ],
      experience: [
        {
          company: String,
          position: String,
          startDate: Date,
          endDate: Date,
          description: String,
        },
      ],
    },
  },
  { timestamps: true }
);

export const Resume = mongoose.model<IResume>("Resume", resumeSchema);
