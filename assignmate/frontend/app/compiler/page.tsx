"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToastStore } from "@/store/toast-store";
import api from "@/lib/api";
import {
  Play,
  RotateCcw,
  Terminal,
  Code2,
  AlertTriangle,
  ShieldCheck,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  BookOpen,
  Info,
} from "lucide-react";

const TEMPLATES = {
  c: `#include <stdio.h>

int main() {
    printf("Hello, CVSync C Compiler!\\n");
    return 0;
}
`,
  python: `# Print greeting
print("Hello, CVSync Python Compiler!")

# Example: Read stdin
# name = input()
# print(f"Welcome, {name}!")
`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, CVSync Java Compiler!");
    }
}
`,
};

function CompilerContent() {
  const searchParams = useSearchParams();
  const initialAssignmentId = searchParams.get("assignmentId") || "";

  const addToast = useToastStore((state) => state.addToast);

  const [language, setLanguage] = useState<"c" | "python" | "java">("python");
  const [code, setCode] = useState<string>(TEMPLATES.python);
  const [stdin, setStdin] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [status, setStatus] = useState<
    "idle" | "running" | "success" | "compile-error" | "runtime-error" | "timeout"
  >("idle");

  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(initialAssignmentId);
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [isTestActive, setIsTestActive] = useState(false);
  const [isProblemInfoOpen, setIsProblemInfoOpen] = useState(true);

  // Refs to maintain latest state inside event listeners without re-binding
  const codeRef = useRef(code);
  const languageRef = useRef(language);
  const selectedAssignmentIdRef = useRef(selectedAssignmentId);
  const isTestActiveRef = useRef(isTestActive);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);
  useEffect(() => {
    languageRef.current = language;
  }, [language]);
  useEffect(() => {
    selectedAssignmentIdRef.current = selectedAssignmentId;
  }, [selectedAssignmentId]);
  useEffect(() => {
    isTestActiveRef.current = isTestActive;
  }, [isTestActive]);

  const activeAssignment = assignments.find(
    (a) => (a._id || a.id) === selectedAssignmentId
  );

  const getAttachmentUrl = (attachmentPath: string) => {
    if (!attachmentPath) return "#";
    if (/^https?:\/\//i.test(attachmentPath)) return attachmentPath;
    const apiRoot = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");
    return `${apiRoot}${attachmentPath.startsWith("/") ? attachmentPath : `/${attachmentPath}`}`;
  };

  const handleAutoSubmitAssignment = async (
    currentCode: string,
    currentLang: string,
    assignmentId: string
  ) => {
    if (typeof document !== "undefined" && document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    try {
      await api.post(`/assignments/${assignmentId}/submit`, {
        submittedCode: currentCode,
        submittedLanguage: currentLang,
      });

      addToast({
        title: "Test Auto-Submitted (3/3 Attempts Used)",
        description:
          "All 3 allowed attempts were exceeded due to tab/window switching. Your test has been submitted and locked.",
        variant: "destructive",
      });
    } catch (err: any) {
      console.error("Auto-submit failure:", err);
    }
  };

  // 3-Attempt Violation Warning and Lockout System
  const triggerTabSwitchWarning = () => {
    setIsLocked((locked) => {
      if (locked) return true;

      setTabSwitchCount((count) => {
        const nextCount = count + 1;

        if (nextCount >= 3) {
          // 3rd attempt reached -> Lock and auto-submit test if taking an exam
          if (isTestActiveRef.current && selectedAssignmentIdRef.current) {
            handleAutoSubmitAssignment(
              codeRef.current,
              languageRef.current,
              selectedAssignmentIdRef.current
            );
            setIsTestActive(false);
            setSelectedAssignmentId("");
            handleReset();
          }

          addToast({
            title: "Proctoring Lockout (3/3 Attempts Used)",
            description:
              "All 3 allowed attempts have been exceeded due to window/tab switching. The editor has been locked.",
            variant: "destructive",
          });

          setIsLocked(true);
          return nextCount;
        } else {
          const remaining = 3 - nextCount;
          addToast({
            title: `Security Warning (Attempt ${nextCount}/3)`,
            description: `External window, portal, or tab switch detected! You have ${remaining} attempt${
              remaining === 1 ? "" : "s"
            } remaining before your code is auto-submitted and locked.`,
            variant: "default",
          });
          return nextCount;
        }
      });

      return false;
    });
  };

  // Load student's classroom assignments
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await api.get("/assignments");
        // Show active classroom assignments only
        const activeClassroomAssignments = response.data.filter(
          (a: any) => a.visibility === "classroom" && a.assignmentStatus === "active"
        );
        setAssignments(activeClassroomAssignments);

        // If URL param assignmentId was provided, auto setup template
        if (initialAssignmentId) {
          const matched = activeClassroomAssignments.find(
            (a: any) => (a._id || a.id) === initialAssignmentId
          );
          if (matched) {
            setSelectedAssignmentId(matched._id || matched.id);
            if (matched.allowedLanguages && matched.allowedLanguages.length === 1) {
              const singleLang = matched.allowedLanguages[0] as "c" | "python" | "java";
              if (["c", "python", "java"].includes(singleLang)) {
                setLanguage(singleLang);
              }
            }
            if (matched.starterCode) {
              setCode(matched.starterCode);
            }
            if (matched.sampleInput) {
              setStdin(matched.sampleInput);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load assignments in compiler:", err);
      }
    };
    fetchAssignments();
  }, [initialAssignmentId]);

  const handleSelectAssignment = (assignmentId: string) => {
    if (!assignmentId) {
      setSelectedAssignmentId("");
      setIsTestActive(false);
      return;
    }

    const matched = assignments.find((a) => (a._id || a.id) === assignmentId);
    setSelectedAssignmentId(assignmentId);

    if (
      confirm(
        `Link Assignment "${matched?.title || "Coding Test"}" & Start Coding Test?\n\nThis will lock your browser in FULL-SCREEN PROCTORED MODE with full security:\n- You are allowed up to 3 attempts before your test auto-submits and locks.\n- Switching tabs, opening external windows, or exiting full-screen counts as an attempt.\n- Copy/Paste, shortcuts (Ctrl+T, Ctrl+N, F12), and right-click are disabled.`
      )
    ) {
      setTabSwitchCount(0);
      setIsLocked(false);
      setIsTestActive(true);

      let targetLang = language;
      if (matched?.allowedLanguages && matched.allowedLanguages.length === 1) {
        const singleLang = matched.allowedLanguages[0] as "c" | "python" | "java";
        if (["c", "python", "java"].includes(singleLang)) {
          targetLang = singleLang;
          setLanguage(singleLang);
        }
      }

      // Initialize with teacher's starter code if provided, otherwise default language template
      if (matched?.starterCode) {
        setCode(matched.starterCode);
      } else {
        setCode(TEMPLATES[targetLang]);
      }

      if (matched?.sampleInput) {
        setStdin(matched.sampleInput);
      }

      setOutput("");
      setStatus("idle");
    } else {
      setSelectedAssignmentId("");
    }
  };

  const handleSubmitCodeAssignment = async () => {
    if (!selectedAssignmentId) {
      addToast({
        title: "Selection Required",
        description: "Please select an assignment to submit your code for.",
        type: "error",
      });
      return;
    }

    if (typeof document !== "undefined" && document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }

    setIsSubmittingCode(true);
    try {
      await api.post(`/assignments/${selectedAssignmentId}/submit`, {
        submittedCode: code,
        submittedLanguage: language,
      });

      addToast({
        title: "Assignment Submitted",
        description: "Your source code has been successfully submitted to your teacher!",
        type: "success",
      });
      
      // Reset selection and exit test view
      setSelectedAssignmentId("");
      setIsTestActive(false);
      handleReset();
    } catch (err: any) {
      console.error(err);
      addToast({
        title: "Submission Failed",
        description: err.response?.data?.message || err.message || "Failed to submit assignment.",
        type: "error",
      });
    } finally {
      setIsSubmittingCode(false);
    }
  };

  // Fullscreen & Strict Proctoring Security Hook
  useEffect(() => {
    if (!isTestActive) return;

    // Request native browser fullscreen mode
    if (typeof document !== "undefined" && document.documentElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    // Exit fullscreen listener (counts toward 3 allowed attempts)
    const handleFullscreenChange = () => {
      if (typeof document !== "undefined" && !document.fullscreenElement && isTestActiveRef.current) {
        triggerTabSwitchWarning();
        if (document.documentElement && document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      }
    };

    // Block keyboard shortcuts (DevTools, new tab, print, save, inspect)
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Block F12 (DevTools)
      if (e.key === "F12" || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Block Ctrl/Cmd combinations
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        // Block Ctrl+T, Ctrl+N, Ctrl+W, Ctrl+U, Ctrl+P, Ctrl+S, Ctrl+R, Ctrl+H, Ctrl+J
        if (["t", "n", "w", "u", "p", "s", "r", "h", "j", "d", "e", "f", "g", "l", "o"].includes(key)) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        // Block Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (DevTools)
        if (e.shiftKey && ["i", "j", "c", "n", "p"].includes(key)) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      }

      // Block Alt combinations (Alt+Tab, Alt+F4, Alt+Left/Right)
      if (e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    };

    // Block right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Block page leave / refresh warning
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isTestActiveRef.current && selectedAssignmentIdRef.current) {
        handleAutoSubmitAssignment(
          codeRef.current,
          languageRef.current,
          selectedAssignmentIdRef.current
        );
      }
      e.preventDefault();
      e.returnValue = "A proctored exam is in progress. Leaving will submit your current code.";
      return e.returnValue;
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleGlobalKeyDown, true);
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleGlobalKeyDown, true);
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("beforeunload", handleBeforeUnload);

      // Exit fullscreen if still active
      if (typeof document !== "undefined" && document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [isTestActive]);

  // Tab / Window / External Portal switching detection hook (Active ONLY during locked assignment tests)
  useEffect(() => {
    if (!isTestActive) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        triggerTabSwitchWarning();
      }
    };

    const handleWindowBlur = () => {
      triggerTabSwitchWarning();
    };

    // Continuous 250ms Heartbeat: Detects external popups, Chrome profile pickers, or overlapping windows during assignment tests
    const focusInterval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hasFocus()) {
        triggerTabSwitchWarning();
      }
    }, 250);

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focusout", handleWindowBlur);
    window.addEventListener("pagehide", handleWindowBlur);

    return () => {
      clearInterval(focusInterval);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focusout", handleWindowBlur);
      window.removeEventListener("pagehide", handleWindowBlur);
    };
  }, [isTestActive]);

  const preventCopyPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    addToast({
      title: "Action Blocked",
      description: "Copying, cutting, or pasting is strictly disabled for code integrity.",
      type: "error",
    });
  };


  // Handle template switching
  const handleLanguageChange = (lang: "c" | "python" | "java") => {
    setLanguage(lang);
    setCode(TEMPLATES[lang]);
    setOutput("");
    setStatus("idle");
  };

  const handleReset = () => {
    setCode(TEMPLATES[language]);
    setOutput("");
    setStatus("idle");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = code.substring(0, start) + "    " + code.substring(end);
      setCode(newValue);
      
      // reset cursor position after browser updates textarea
      setTimeout(() => {
        e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 4;
      }, 0);
    }
  };

  const handleRun = async () => {
    setStatus("running");
    setOutput("");
    try {
      const response = await api.post("/compiler/execute", {
        language,
        code,
        stdin
      });
      
      const { status: runStatus, output: runOutput } = response.data;
      setStatus(runStatus);
      setOutput(runOutput);
    } catch (err: any) {
      console.error(err);
      setStatus("runtime-error");
      setOutput(err.response?.data?.message || err.message || "Failed to execute code.");
      addToast({
        title: "Execution Failed",
        description: "Could not connect to the compilation server.",
        type: "error"
      });
    }
  };

  if (isTestActive) {
    return (
      <ProtectedRoute>
        <div className="fixed inset-0 bg-[#0B0F19] text-foreground z-50 flex flex-col overflow-hidden select-none">
          {/* Test Header */}
          <div className="flex items-center justify-between px-6 py-3 bg-card border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center animate-pulse">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  PROCTORED ASSIGNMENT TEST
                </span>
                <h2 className="text-sm font-bold text-foreground">
                  {activeAssignment?.title || "Classroom Coding Task"}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsProblemInfoOpen((prev) => !prev)}
                className="h-8 text-xs font-semibold border-border/60 flex items-center gap-1.5"
              >
                <Info className="w-3.5 h-3.5 text-primary" />
                Problem Spec {isProblemInfoOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </Button>

              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold border ${
                  tabSwitchCount === 0
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : tabSwitchCount === 1
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse"
                    : "bg-red-500/10 border-red-500/30 text-red-400 animate-bounce"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Violations: {tabSwitchCount}/3 Attempts</span>
              </div>

              <Button
                variant="ghost"
                onClick={() => {
                  if (confirm("Are you sure you want to exit the test? Your written code will be reset.")) {
                    if (typeof document !== "undefined" && document.fullscreenElement && document.exitFullscreen) {
                      document.exitFullscreen().catch(() => {});
                    }
                    setIsTestActive(false);
                    setSelectedAssignmentId("");
                    handleReset();
                  }
                }}
                className="text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 px-3"
              >
                Exit Test
              </Button>

              <Button
                onClick={handleRun}
                disabled={status === "running" || isLocked}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3.5 flex items-center gap-2 text-xs font-bold"
              >
                {status === "running" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Run Code
                  </>
                )}
              </Button>

              <Button
                onClick={handleSubmitCodeAssignment}
                disabled={isSubmittingCode || isLocked}
                className="bg-emerald-600 text-white hover:bg-emerald-500 h-8 px-4 flex items-center gap-2 text-xs font-bold"
              >
                {isSubmittingCode ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Submit Test Code
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Collapsible Problem Info Banner */}
          {isProblemInfoOpen && activeAssignment && (
            <div className="bg-card/90 border-b border-border px-6 py-3 text-xs flex flex-col md:flex-row gap-4 justify-between items-start overflow-y-auto max-h-36">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground text-sm">{activeAssignment.title}</span>
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px]">
                    {activeAssignment.subject}
                  </span>
                  {activeAssignment.allowedLanguages && (
                    <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px]">
                      Languages: {activeAssignment.allowedLanguages.join(", ")}
                    </span>
                  )}
                </div>
                {activeAssignment.description && (
                  <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                    {activeAssignment.description}
                  </p>
                )}
              </div>

              {(activeAssignment.sampleInput || activeAssignment.expectedOutput) && (
                <div className="flex gap-3 text-[11px] font-mono shrink-0">
                  {activeAssignment.sampleInput && (
                    <div className="bg-slate-950 p-2 rounded border border-border/60 max-w-[200px]">
                      <span className="text-muted-foreground text-[9px] uppercase font-bold block mb-0.5">Sample Input</span>
                      <pre className="text-slate-200 overflow-x-auto">{activeAssignment.sampleInput}</pre>
                    </div>
                  )}
                  {activeAssignment.expectedOutput && (
                    <div className="bg-slate-950 p-2 rounded border border-border/60 max-w-[200px]">
                      <span className="text-muted-foreground text-[9px] uppercase font-bold block mb-0.5">Expected Output</span>
                      <pre className="text-emerald-400 overflow-x-auto">{activeAssignment.expectedOutput}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Test Workspace Grid */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 p-6 gap-6 overflow-hidden">
            {/* Code Editor Block */}
            <div className="lg:col-span-2 relative border border-border/60 bg-card/60 backdrop-blur-sm rounded-lg flex flex-col overflow-hidden">
              {isLocked && (
                <div className="absolute inset-0 bg-[#0B0F19]/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 z-50">
                  <AlertTriangle className="w-16 h-16 text-destructive animate-bounce mb-4" />
                  <h3 className="text-xl font-bold text-foreground">Test Disqualified & Locked</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-5">
                    Proctoring Alert: You switched tabs or left the browser window. The test session is locked to prevent academic plagiarism.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (typeof document !== "undefined" && document.fullscreenElement && document.exitFullscreen) {
                        document.exitFullscreen().catch(() => {});
                      }
                      setIsLocked(false);
                      setTabSwitchCount(0);
                      setIsTestActive(false);
                      setSelectedAssignmentId("");
                      handleReset();
                    }}
                    className="text-xs font-semibold px-4 py-2 h-auto"
                  >
                    Reset & Return to Compiler
                  </Button>
                </div>
              )}

              <div className="py-2.5 px-4 bg-muted/40 border-b border-border/40 flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-primary" />
                  Test Editor
                </span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-0.5 bg-muted rounded">
                  {language}
                </span>
              </div>

              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                onCopy={preventCopyPaste}
                onPaste={preventCopyPaste}
                onCut={preventCopyPaste}
                disabled={isLocked}
                className="flex-1 w-full p-6 bg-slate-950 font-mono text-sm leading-relaxed text-slate-100 placeholder:text-muted-foreground focus:outline-none resize-none overflow-y-auto"
                spellCheck={false}
                placeholder="// Write your exam/test code solution here..."
              />
            </div>

            {/* Test Terminals (Stdin/Stdout) */}
            <div className="flex flex-col gap-6 overflow-hidden">
              {/* Stdin */}
              <div className="flex-1 border border-border/60 bg-card/60 backdrop-blur-sm rounded-lg flex flex-col overflow-hidden">
                <div className="py-2.5 px-4 bg-muted/40 border-b border-border/40">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Stdin Input</span>
                </div>
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  onCopy={preventCopyPaste}
                  onPaste={preventCopyPaste}
                  onCut={preventCopyPaste}
                  disabled={isLocked}
                  className="flex-1 w-full p-4 bg-slate-950/40 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none resize-none"
                  placeholder="Provide test inputs here..."
                />
              </div>

              {/* Stdout Output */}
              <div className="flex-1 border border-border/60 bg-card/60 backdrop-blur-sm rounded-lg flex flex-col overflow-hidden">
                <div className="py-2.5 px-4 bg-muted/40 border-b border-border/40 flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Console Output</span>
                  {status !== "idle" && status !== "running" && (
                    <span
                      className={`text-xs font-bold ${
                        status === "success" ? "text-emerald-500" : "text-red-400"
                      }`}
                    >
                      {status.toUpperCase().replace("-", " ")}
                    </span>
                  )}
                </div>
                <div className="flex-1 p-4 bg-slate-950 font-mono text-xs overflow-y-auto whitespace-pre-wrap leading-relaxed text-slate-200">
                  {status === "idle" && (
                    <span className="text-muted-foreground/50 italic">Console output will print here.</span>
                  )}
                  {status === "running" && (
                    <div className="flex items-center gap-2 text-muted-foreground italic">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      Running compilation...
                    </div>
                  )}
                  {status !== "idle" && status !== "running" && (
                    <span
                      className={
                        status === "compile-error"
                          ? "text-red-300 font-semibold"
                          : status === "runtime-error"
                          ? "text-amber-300"
                          : "text-slate-100"
                      }
                    >
                      {output}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Header block */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
                    <Code2 className="w-8 h-8 text-primary" />
                    Interactive Code Compiler
                  </h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    Write, compile, and run C, Python, and Java programs in real-time.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                      Select Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => handleLanguageChange(e.target.value as any)}
                      className="bg-card border border-border/80 text-foreground px-3.5 py-1.5 rounded-md text-sm font-semibold focus:outline-none focus:border-primary transition-colors cursor-pointer"
                    >
                      <option value="c">C (GCC)</option>
                      <option value="python">Python 3</option>
                      <option value="java">Java (JDK)</option>
                    </select>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="mt-5 border-border/80 text-muted-foreground hover:text-foreground h-[38px] px-3 flex items-center gap-1.5"
                    title="Reset Template"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </Button>

                  <Button
                    onClick={handleRun}
                    disabled={status === "running" || isLocked}
                    className="mt-5 bg-primary text-primary-foreground hover:bg-primary/90 h-[38px] px-5 flex items-center gap-2"
                  >
                    {status === "running" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        Run Code
                      </>
                    )}
                  </Button>

                  {tabSwitchCount > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold border mt-5 bg-amber-500/10 border-amber-500/30 text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Violations: {tabSwitchCount}/3</span>
                    </div>
                  )}

                  {assignments.length > 0 && (
                    <div className="flex items-center gap-2 border-l border-border/40 pl-3">
                      <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                          Link Assignment
                        </label>
                        <select
                          value={selectedAssignmentId}
                          onChange={(e) => handleSelectAssignment(e.target.value)}
                          className="bg-card border border-border/80 text-foreground px-3.5 py-1.5 rounded-md text-sm font-semibold focus:outline-none focus:border-primary transition-colors cursor-pointer max-w-[180px] truncate"
                        >
                          <option value="">-- Select Test --</option>
                          {assignments.map((a) => (
                            <option key={a._id || a.id} value={a._id || a.id}>
                              {a.title} {a.assignmentType === "code" ? "💻" : "📄"}
                            </option>
                          ))}
                        </select>
                      </div>

                      <Button
                        onClick={handleSubmitCodeAssignment}
                        disabled={!selectedAssignmentId || isSubmittingCode || isLocked}
                        className="mt-5 bg-emerald-600 text-white hover:bg-emerald-500 h-[38px] px-4 flex items-center gap-2"
                      >
                        {isSubmittingCode ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            Submit Code
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Linked Assignment Information Box */}
              {activeAssignment && (
                <Card className="border-primary/40 bg-primary/5 backdrop-blur-sm">
                  <CardHeader className="py-3 px-5 border-b border-primary/20 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <div>
                        <CardTitle className="text-base font-bold text-foreground">
                          {activeAssignment.title}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          Subject: {activeAssignment.subject} | Due: {new Date(activeAssignment.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                        {activeAssignment.assignmentType === "code" ? "Coding Assignment" : "Classroom Assignment"}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 space-y-3 text-xs">
                    {activeAssignment.description && (
                      <div className="space-y-1">
                        <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                          Problem Statement & Instructions
                        </span>
                        <p className="text-foreground whitespace-pre-line leading-relaxed bg-background/50 p-3 rounded border border-border/40">
                          {activeAssignment.description}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {activeAssignment.sampleInput && (
                        <div className="space-y-1">
                          <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                            Sample Input (stdin)
                          </span>
                          <pre className="bg-slate-950 text-slate-100 p-2.5 rounded font-mono text-xs overflow-x-auto border border-border/40">
                            {activeAssignment.sampleInput}
                          </pre>
                        </div>
                      )}

                      {activeAssignment.expectedOutput && (
                        <div className="space-y-1">
                          <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                            Expected Output
                          </span>
                          <pre className="bg-slate-950 text-emerald-400 p-2.5 rounded font-mono text-xs overflow-x-auto border border-border/40">
                            {activeAssignment.expectedOutput}
                          </pre>
                        </div>
                      )}
                    </div>

                    {Array.isArray(activeAssignment.attachments) && activeAssignment.attachments.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider block">
                          Attached Problem Documents
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {activeAssignment.attachments.map((att: string, idx: number) => (
                            <a
                              key={idx}
                              href={getAttachmentUrl(att)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-card border border-border/60 text-[11px] text-primary hover:bg-primary/10 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>{decodeURIComponent(att.split("/").pop() || `Document ${idx + 1}`)}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Workspace Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Code input pane */}
                <div className="lg:col-span-2 space-y-4">
                  <Card className="border-border/50 bg-card/60 backdrop-blur-sm flex flex-col h-[550px]">
                    <CardHeader className="py-3 px-4 border-b border-border/40 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-muted-foreground" />
                        Source Code
                      </CardTitle>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-0.5 bg-muted/40 rounded">
                        {language}
                      </span>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 relative">
                      {isLocked && (
                        <div className="absolute inset-0 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 z-50 rounded-b-md">
                          <AlertTriangle className="w-12 h-12 text-destructive animate-bounce mb-3" />
                          <h3 className="text-lg font-bold text-foreground">Compiler Locked</h3>
                          <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                            You switched tabs or left the browser window. Copying, pasting, and tab switching are strictly prohibited to maintain code integrity.
                          </p>
                          <Button
                            variant="destructive"
                            onClick={() => {
                              setIsLocked(false);
                              setTabSwitchCount(0);
                              handleReset();
                            }}
                            className="text-xs font-semibold px-4 py-1.5 h-auto"
                          >
                            Reset & Unlock Editor
                          </Button>
                        </div>
                      )}
                      <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onCopy={preventCopyPaste}
                        onPaste={preventCopyPaste}
                        onCut={preventCopyPaste}
                        disabled={isLocked}
                        className="w-full h-full p-4 bg-background/20 font-mono text-sm leading-relaxed text-slate-100 placeholder:text-muted-foreground focus:outline-none resize-none overflow-y-auto"
                        spellCheck={false}
                        placeholder="// Write your code here..."
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Stdin and Stdout pane */}
                <div className="space-y-6">
                  {/* Stdin */}
                  <Card className="border-border/50 bg-card/60 backdrop-blur-sm flex flex-col h-[200px]">
                    <CardHeader className="py-2.5 px-4 border-b border-border/40">
                      <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Standard Input (stdin)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex-1">
                      <textarea
                        value={stdin}
                        onChange={(e) => setStdin(e.target.value)}
                        onCopy={preventCopyPaste}
                        onPaste={preventCopyPaste}
                        onCut={preventCopyPaste}
                        disabled={isLocked}
                        className="w-full h-full p-3 bg-background/10 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none resize-none"
                        placeholder="Provide test inputs here..."
                      />
                    </CardContent>
                  </Card>

                  {/* Stdout Output */}
                  <Card className="border-border/50 bg-card/60 backdrop-blur-sm flex flex-col h-[326px]">
                    <CardHeader className="py-2.5 px-4 border-b border-border/40 flex flex-row items-center justify-between">
                      <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Execution Output
                      </CardTitle>
                      {status !== "idle" && status !== "running" && (
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          {status === "success" && (
                            <span className="text-emerald-500 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Success
                            </span>
                          )}
                          {status === "compile-error" && (
                            <span className="text-red-400 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Compilation Error
                            </span>
                          )}
                          {status === "runtime-error" && (
                            <span className="text-amber-500 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Runtime Error
                            </span>
                          )}
                          {status === "timeout" && (
                            <span className="text-red-400 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Timeout
                            </span>
                          )}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="p-4 bg-muted/15 flex-1 font-mono text-xs overflow-y-auto whitespace-pre-wrap leading-relaxed text-slate-200">
                      {status === "idle" && (
                        <span className="text-muted-foreground/60 italic">
                          Output will be displayed here after you run the code.
                        </span>
                      )}
                      {status === "running" && (
                        <div className="flex items-center gap-2 text-muted-foreground italic">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                          Compiling and executing code...
                        </div>
                      )}
                      {status !== "idle" && status !== "running" && (
                        <span
                          className={
                            status === "compile-error"
                              ? "text-red-300 font-semibold"
                              : status === "runtime-error"
                              ? "text-amber-300"
                              : status === "timeout"
                              ? "text-red-400 font-bold"
                              : "text-slate-100"
                          }
                        >
                          {output}
                        </span>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function CompilerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <CompilerContent />
    </Suspense>
  );
}
