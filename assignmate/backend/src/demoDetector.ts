import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { analyzeSubmissionDocument } from "./utils/aiDetector";

dotenv.config();

async function runDemo() {
  console.log("=== AssignTantra AI & Handwriting Detection Demo ===");
  console.log("Checking environment configurations...");
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key" || apiKey.trim() === "") {
    console.log("WARNING: GEMINI_API_KEY is not configured in backend/.env.");
    console.log("Running demo in MOCK DEMO MODE (using filename rules)...");
  } else {
    console.log("GEMINI_API_KEY is configured. Running using real Gemini 1.5 Flash API...");
  }
  
  // We'll search for an available PDF in the uploads/assignments/ directory
  const uploadsDir = path.resolve(__dirname, "..", "uploads", "assignments");
  if (!fs.existsSync(uploadsDir)) {
    console.error(`ERROR: Uploads directory does not exist at ${uploadsDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(uploadsDir);
  const pdfFiles = files.filter(f => f.toLowerCase().endsWith(".pdf"));

  if (pdfFiles.length === 0) {
    console.error("ERROR: No PDF files found in uploads directory to use as a base.");
    process.exit(1);
  }

  // Setup the three demo scenarios automatically using the sample PDF as a base
  const basePdf = pdfFiles[0];
  const basePdfPath = path.join(uploadsDir, basePdf);

  const testCases = [
    { name: "digital_essay.pdf", type: "pdf", desc: "Digital Essay (Standard printed PDF)" },
    { name: "handwritten_notes_scan.pdf", type: "pdf", desc: "Handwritten Scanned Notes (Handwritten validation)" },
    { name: "ai_plagiarized_report.pdf", type: "pdf", desc: "AI Generated Report (AI Plagiarism validation)" }
  ];

  for (const tc of testCases) {
    const targetPath = path.join(uploadsDir, tc.name);
    if (!fs.existsSync(targetPath)) {
      fs.copyFileSync(basePdfPath, targetPath);
    }
  }

  console.log("\nSetup complete. Running detection on all test cases...");

  for (const tc of testCases) {
    const targetPath = path.join(uploadsDir, tc.name);
    console.log(`\n--------------------------------------------------`);
    console.log(`Testing Case: ${tc.desc}`);
    console.log(`File Name:    ${tc.name}`);
    console.log(`--------------------------------------------------`);

    const result = await analyzeSubmissionDocument(targetPath, tc.name, tc.type);

    if (result) {
      console.log(`Is Handwritten:  ${result.isHandwritten ? "✅ YES (Handwritten)" : "❌ NO (Digital/Printed)"}`);
      console.log(`Handwritten Explanation:\n  > ${result.handwrittenExplanation}\n`);
      console.log(`Is AI Generated: ${result.isAiGenerated ? "⚠️ YES (AI Plagiarized)" : "✅ NO (Human Content)"}`);
      console.log(`AI Score:        ${result.aiScore}%`);
      console.log(`AI Explanation:\n  > ${result.aiExplanation}`);
    } else {
      console.log("❌ Failed to analyze the document.");
    }
  }

  // Clean up created demo files
  for (const tc of testCases) {
    const targetPath = path.join(uploadsDir, tc.name);
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
  }
  console.log(`\n--------------------------------------------------`);
  console.log("Demo run completed and temporary files cleaned up.");
}

runDemo().catch(err => {
  console.error("Demo failed with error:", err);
});
