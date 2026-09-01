import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

const router = Router();

const TEMP_DIR = path.resolve(__dirname, "..", "..", "temp");

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

export interface ExecuteRequest {
  language: "c" | "cpp" | "python" | "java" | "javascript";
  code: string;
  stdin?: string;
}

export interface ExecutionResult {
  status: "success" | "compile-error" | "runtime-error" | "timeout";
  output: string;
}

export async function executeCode({
  language,
  code,
  stdin = "",
}: ExecuteRequest): Promise<ExecutionResult> {
  if (!language || !code) {
    throw new Error("Language and code are required.");
  }

  const runId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const workingDir = path.join(TEMP_DIR, runId);

  try {
    fs.mkdirSync(workingDir, { recursive: true });

    let fileName = "";
    let compileCmd = "";
    let runCmd = "";

    if (language === "python") {
      fileName = "solution.py";
      const filePath = path.join(workingDir, fileName);
      fs.writeFileSync(filePath, code);
      runCmd = `python "${filePath}"`;
    } else if (language === "c") {
      fileName = "solution.c";
      const filePath = path.join(workingDir, fileName);
      const exePath = path.join(workingDir, "solution.exe");
      fs.writeFileSync(filePath, code);
      compileCmd = `gcc "${filePath}" -o "${exePath}"`;
      runCmd = `"${exePath}"`;
    } else if (language === "cpp") {
      fileName = "solution.cpp";
      const filePath = path.join(workingDir, fileName);
      const exePath = path.join(workingDir, "solution.exe");
      fs.writeFileSync(filePath, code);
      compileCmd = `g++ "${filePath}" -o "${exePath}"`;
      runCmd = `"${exePath}"`;
    } else if (language === "java") {
      // Parse Java class name
      let className = "Main";
      const classMatch = code.match(/public\s+class\s+(\w+)/) || code.match(/class\s+(\w+)/);
      if (classMatch && classMatch[1]) {
        className = classMatch[1];
      }
      fileName = `${className}.java`;
      const filePath = path.join(workingDir, fileName);
      fs.writeFileSync(filePath, code);
      compileCmd = `javac "${filePath}"`;
      runCmd = `java -cp "${workingDir}" ${className}`;
    } else if (language === "javascript") {
      fileName = "solution.js";
      const filePath = path.join(workingDir, fileName);
      fs.writeFileSync(filePath, code);
      runCmd = `node "${filePath}"`;
    } else {
      throw new Error("Unsupported language.");
    }

    const execOptions = {
      timeout: 6000, // 6 seconds timeout
      maxBuffer: 1024 * 1024, // 1MB output limit
    };

    // Stdin handling
    const stdinFilePath = path.join(workingDir, "stdin.txt");
    fs.writeFileSync(stdinFilePath, stdin);

    // Compilation step if needed
    if (compileCmd) {
      await new Promise<void>((resolve, reject) => {
        exec(compileCmd, execOptions, (error, stdout, stderr) => {
          if (error) {
            reject({ type: "compile", message: stderr || stdout || error.message });
          } else {
            resolve();
          }
        });
      });
    }

    // Execution step
    // Pipe stdin from file to handle multi-line inputs properly on Windows & Linux
    const finalCmd = `${runCmd} < "${stdinFilePath}"`;

    return await new Promise<ExecutionResult>((resolve) => {
      exec(finalCmd, execOptions, (error, stdout, stderr) => {
        // Clean up files in the background
        setTimeout(() => {
          try {
            if (fs.existsSync(workingDir)) {
              fs.rmSync(workingDir, { recursive: true, force: true });
            }
          } catch (cleanupErr) {
            console.error("Cleanup error:", cleanupErr);
          }
        }, 1000);

        if (error) {
          if (error.killed) {
            return resolve({
              status: "timeout",
              output: "Execution Time Limit Exceeded (6s limit).",
            });
          }
          return resolve({
            status: "runtime-error",
            output: stderr || error.message,
          });
        }

        resolve({
          status: "success",
          output: stdout || stderr || "[No Output]",
        });
      });
    });
  } catch (err: any) {
    // Cleanup on error
    try {
      if (fs.existsSync(workingDir)) {
        fs.rmSync(workingDir, { recursive: true, force: true });
      }
    } catch (cleanupErr) {
      console.error("Error during failure cleanup:", cleanupErr);
    }

    if (err.type === "compile") {
      return {
        status: "compile-error",
        output: err.message,
      };
    }

    throw err;
  }
}

router.post("/execute", authMiddleware, async (req: AuthRequest, res) => {
  const { language, code, stdin = "" } = req.body as ExecuteRequest;

  if (!language || !code) {
    return res.status(400).json({ message: "Language and code are required." });
  }

  try {
    const result = await executeCode({ language, code, stdin });
    res.json(result);
  } catch (err: any) {
    console.error("Executor failure:", err);
    res.status(500).json({ message: err.message || "Failed to execute code." });
  }
});

export default router;
