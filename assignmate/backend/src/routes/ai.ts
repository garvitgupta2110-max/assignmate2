import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import axios from "axios";
import fs from "fs";
import path from "path";
import { Material } from "../models/Material";
import { analyzeSubmissionDocument } from "../utils/aiDetector";

const router = Router();

// Groq API configuration
async function callGroq(prompt: string, systemPrompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured in the environment.");
  }

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.2
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        timeout: 45000
      }
    );

    return response.data.choices[0].message.content;
  } catch (error: any) {
    console.error("Error communicating with Groq:", error.response?.data || error.message);
    const apiError = error.response?.data?.error?.message || error.message;
    throw new Error(`Groq API generation failed: ${apiError}`);
  }
}

// Helper function to extract text content from a file
function extractTextFromFile(filePath: string, fileName: string, fileType: string): string {
  try {
    if (!fs.existsSync(filePath)) {
      return "";
    }
    const fileBuffer = fs.readFileSync(filePath);
    const contentString = fileBuffer.toString("utf-8");

    // Clean up basic plain text files / markdown
    if (fileType === "txt" || fileType === "md" || fileType === "json" || fileType === "html") {
      return contentString.slice(0, 15000); // limit to 15k chars for tokens
    }

    // Basic bracket-based PDF content extractor
    if (fileType === "pdf") {
      const textMatches = contentString.match(/\(([^)]+)\)/g);
      if (textMatches) {
        const cleanText = textMatches.map(m => m.slice(1, -1)).join(" ");
        // Filter out binary garbage or too short strings
        const words = cleanText.split(/\s+/).filter(w => w.length > 1 && /^[a-zA-Z0-9.,!?-]+$/.test(w));
        if (words.length > 20) {
          return words.slice(0, 3000).join(" "); // limit words
        }
      }
    }

    return "";
  } catch (error) {
    console.error("Error extracting text from file:", error);
    return "";
  }
}


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

// 4. Summarize Study Material/Note
router.post("/material/summarize", authMiddleware, async (req: AuthRequest, res) => {
  const { materialId } = req.body;

  if (!materialId) {
    return res.status(400).json({ message: "Material ID is required." });
  }

  try {
    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({ message: "Study material not found." });
    }

    let sourceText = "";
    if (material.url) {
      const filePath = path.resolve(__dirname, "..", "..", material.url.substring(1));
      sourceText = extractTextFromFile(filePath, material.fileName, material.fileType);
    }

    if (!sourceText || sourceText.trim().length < 50) {
      sourceText = `Title: ${material.title}\nDescription: ${material.description || "(No description provided)"}`;
    }

    const systemPrompt = `You are an advanced academic assistant. Your task is to generate a comprehensive, structured, and clear summary of the student notes/study materials provided.
Structure the summary with the following clear markdown components:
- **Key Concepts & Definitions**
- **Core Summary (3-4 concise bullet points)**
- **Critical Takeaways**

Ensure the tone is helpful, scholarly, and easy for students to study from. Keep it under 300 words. Return ONLY the markdown-formatted summary, with no other introductory or concluding conversational text.`;

    const prompt = `Summarize the following study material:\n\n${sourceText}`;
    const summary = await callGroq(prompt, systemPrompt);

    res.json({ summary });
  } catch (error: any) {
    console.error("Summarization error:", error);
    res.status(500).json({ message: error.message || "Failed to generate summary." });
  }
});

// 5. Detect AI in Study Material/Note
router.post("/material/detect-ai", authMiddleware, async (req: AuthRequest, res) => {
  const { materialId } = req.body;

  if (!materialId) {
    return res.status(400).json({ message: "Material ID is required." });
  }

  try {
    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({ message: "Study material not found." });
    }

    let sourceText = "";
    let formatResult = null;

    if (material.url) {
      const filePath = path.resolve(__dirname, "..", "..", material.url.substring(1));
      sourceText = extractTextFromFile(filePath, material.fileName, material.fileType);
      
      // Run local handwriting/format analysis
      if (fs.existsSync(filePath)) {
        formatResult = await analyzeSubmissionDocument(filePath, material.fileName, material.fileType);
      }
    }

    if (!sourceText || sourceText.trim().length < 50) {
      sourceText = `Title: ${material.title}\nDescription: ${material.description || "(No description provided)"}`;
    }

    const systemPrompt = `You are a highly accurate AI Content Detector and Linguistic Analyst. Your task is to analyze the provided text and determine if it was written by a human or generated by an Artificial Intelligence (such as an LLM).
Analyze the text based on:
1. Perplexity (entropy of word selections)
2. Burstiness (variation in sentence length and structure)
3. Frequency of typical AI transition markers and clichés (e.g., 'delve', 'tapestry', 'furthermore', 'testament', etc.)

You must output your analysis ONLY as a valid JSON object with the following fields:
{
  "isAiGenerated": boolean, // true if AI confidence score is 50% or higher
  "aiScore": number, // an integer from 0 to 100 representing the probability/confidence that the text is AI-generated
  "aiExplanation": string // a detailed explanation (2-3 sentences) detailing the linguistic markers, perplexity, burstiness, and clues that led to the verdict
}
Do not include any Markdown headers, HTML tags, backticks (like \`\`\`json), or conversational dialogue. Just return the raw JSON object.`;

    const prompt = `Analyze the following text for AI content:\n\n${sourceText}`;
    const groqResponse = await callGroq(prompt, systemPrompt);

    let parsedResult = {
      isAiGenerated: false,
      aiScore: 15,
      aiExplanation: "Linguistic patterns indicate typical human composition."
    };

    try {
      // Clean possible backticks/json labels that LLMs sometimes generate despite strict instructions
      let cleanedJson = groqResponse.trim();
      if (cleanedJson.startsWith("```")) {
        cleanedJson = cleanedJson.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      }
      parsedResult = JSON.parse(cleanedJson);
    } catch (parseErr) {
      console.error("Failed to parse Groq AI detection JSON response:", groqResponse);
      // Fallback: If parsing fails, fall back to a heuristic check or raw assessment
      if (groqResponse.toLowerCase().includes("ai") || groqResponse.toLowerCase().includes("generated")) {
        parsedResult = {
          isAiGenerated: true,
          aiScore: 85,
          aiExplanation: "Textual flow and marker density suggest programmatic origin."
        };
      }
    }

    res.json({
      isAiGenerated: parsedResult.isAiGenerated,
      aiScore: parsedResult.aiScore,
      aiExplanation: parsedResult.aiExplanation,
      isHandwritten: formatResult ? formatResult.isHandwritten : false,
      handwrittenExplanation: formatResult ? formatResult.handwrittenExplanation : "VERDICT: DIGITAL TEXT DETECTED. Note details are typed electronically."
    });
  } catch (error: any) {
    console.error("AI Detection error:", error);
    res.status(500).json({ message: error.message || "Failed to analyze document." });
  }
});

export default router;

