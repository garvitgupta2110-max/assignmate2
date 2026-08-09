import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import axios from "axios";

const router = Router();

// Ollama API configuration
const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3";

// Helper function to call Ollama
async function callOllama(prompt: string, systemPrompt: string): Promise<any> {
  try {
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt: prompt,
      system: systemPrompt,
      stream: false,
      format: "json",
    }, { timeout: 120000 });

    return JSON.parse(response.data.response);
  } catch (error: any) {
    console.error("Error communicating with Ollama:", error.message);
    throw new Error(
      error.code === "ECONNREFUSED"
        ? "Could not connect to Ollama. Please verify Ollama is running locally on port 11434."
        : "Ollama generation failed: " + error.message
    );
  }
}

// Helper function to call Google Gemini API
async function callGemini(prompt: string, systemPrompt: string): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${systemPrompt}\n\nUser Request: ${prompt}`
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      },
      { timeout: 45000 }
    );

    const text = response.data.candidates[0].content.parts[0].text;
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Error communicating with Gemini:", error.response?.data || error.message);
    const apiError = error.response?.data?.error?.message || error.message;
    throw new Error(`Gemini generation failed: ${apiError}`);
  }
}

// Orchestrator helper choosing between Gemini and Ollama
async function callAI(prompt: string, systemPrompt: string): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  const isGeminiConfigured = apiKey && apiKey !== "your_gemini_api_key" && apiKey.trim() !== "";

  if (isGeminiConfigured) {
    return callGemini(prompt, systemPrompt);
  } else {
    console.log("Gemini API key not configured. Falling back to local Ollama...");
    return callOllama(prompt, systemPrompt);
  }
}

// 1. Generate Resume Content
router.post("/resume/generate", authMiddleware, async (req: AuthRequest, res) => {
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ message: "Description of your background is required." });
  }

  const systemPrompt = `You are a Senior Executive Technical Resume Writer and ATS Optimizer. Your goal is to generate an exceptionally detailed, professional, and long resume based on the user's background details.
Extrapolate the user's background professionally, filling in gaps with industry-standard achievements, metrics, technologies, and bullet points. Each role and project description should be highly detailed and thorough (never single sentences; always write a comprehensive description consisting of 3-4 detailed bullet points outlining responsibilities, achievements, and technical impact).

Return ONLY a valid JSON object matching the following TypeScript interface:
interface ResumeContent {
  summary: string; // A rich, 3-4 sentence professional summary focusing on strengths, domains, and goals.
  skills: string[]; // Minimum 12-18 comprehensive technical and soft skills matching their domain.
  experience: { role: string; company: string; duration: string; description: string }[]; // Provide detailed positions. In the 'description' field, write 3-4 substantial bullet points separated by newlines, highlighting actions using strong verbs (e.g., 'Implemented', 'Designed', 'Architected') and metrics (e.g., 'boosting efficiency by 25%').
  projects: { title: string; description: string; technologies: string[] }[]; // Detailed projects. The 'description' should detail the architecture, problem solved, and direct outcomes.
}
Do not include any Markdown headers, HTML tags, backticks (like \`\`\`json), or conversational dialogue. Just return the raw JSON object.`;

  const prompt = `Generate a comprehensive, detailed, and long professional resume for a candidate with this background: "${description}". Elaborate on their skills, projects, and experiences to make it look highly competitive and senior.`;

  try {
    const generatedContent = await callAI(prompt, systemPrompt);
    res.json(generatedContent);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Generate Presentation Slides
router.post("/presentation/generate", authMiddleware, async (req: AuthRequest, res) => {
  const { topic, slideCount } = req.body;

  if (!topic) {
    return res.status(400).json({ message: "Topic is required." });
  }

  const count = slideCount ? Math.min(Number(slideCount), 15) : 5;

  const systemPrompt = `You are a professional deck designer. You must generate structured slides for a presentation on the requested topic.
Return ONLY a valid JSON object matching the following TypeScript interface:
interface Presentation {
  title: string;
  slides: { slideNumber: number; title: string; content: string[]; notes: string }[];
}
Do not include any Markdown headers, HTML tags, backticks (like \`\`\`json), or conversational dialogue. Just return the raw JSON object.`;

  const prompt = `Generate a presentation title and ${count} structured slides for the topic: "${topic}"`;

  try {
    const generatedSlides = await callAI(prompt, systemPrompt);
    res.json(generatedSlides);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// 3. Generate Detailed Assignment Plan
router.post("/assignment/generate", authMiddleware, async (req: AuthRequest, res) => {
  const { topic } = req.body;

  if (!topic) {
    return res.status(400).json({ message: "Topic is required." });
  }

  const systemPrompt = `You are an academic advisor and study organizer. You must help generate a highly detailed and structured assignment plan based on the user's prompt or topic description.
Return ONLY a valid JSON object matching the following TypeScript interface:
interface AssignmentPlan {
  title: string; // Sleek, clean title for the assignment.
  subject: string; // Associated subject or course name/code.
  description: string; // Detailed breakdown of the assignment. Consist of Objectives, Key Requirements, step-by-step milestones, and learning tips. Format this beautifully with markdown elements like bullet points.
  priority: 'low' | 'medium' | 'high'; // Suggested priority level based on complexity.
}
Do not include any Markdown headers, HTML tags, backticks (like \`\`\`json), or conversational dialogue. Just return the raw JSON object.`;

  const prompt = `Generate a detailed academic assignment plan for the topic: "${topic}"`;

  try {
    const generatedAssignment = await callAI(prompt, systemPrompt);
    res.json(generatedAssignment);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
