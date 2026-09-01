"use client";

import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToastStore } from "@/store/toast-store";
import { useAuthStore } from "@/store/auth-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, BookOpen, Users, Copy, Check, Loader2, ArrowLeft, UploadCloud, FileText, Download, Trash2, Calendar, Paperclip, Cpu, Sparkles, Code2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export default function ClassroomsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  // Form states
  const [className, setClassName] = useState("");
  const [classSubject, setClassSubject] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Classroom Detail View & Study Materials states
  const [selectedClassroom, setSelectedClassroom] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"materials" | "assignments">("materials");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Summarize & AI Detect states
  const [selectedMaterialForSummary, setSelectedMaterialForSummary] = useState<any>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [noteSummary, setNoteSummary] = useState<string>("");

  const [selectedMaterialForDetection, setSelectedMaterialForDetection] = useState<any>(null);
  const [isDetectionLoading, setIsDetectionLoading] = useState(false);
  const [detectionResult, setDetectionResult] = useState<any>(null);

  const handleSummarizeMaterial = async (material: any) => {
    setSelectedMaterialForSummary(material);
    setIsSummaryLoading(true);
    setNoteSummary("");
    try {
      const response = await api.post("/ai/material/summarize", { materialId: material._id });
      setNoteSummary(response.data.summary);
    } catch (err: any) {
      console.error(err);
      addToast({
        title: "Summarization Failed",
        description: err.response?.data?.message || err.message || "Failed to generate summary",
        type: "error",
      });
      setSelectedMaterialForSummary(null);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleDetectAiMaterial = async (material: any) => {
    setSelectedMaterialForDetection(material);
    setIsDetectionLoading(true);
    setDetectionResult(null);
    try {
      const response = await api.post("/ai/material/detect-ai", { materialId: material._id });
      setDetectionResult(response.data);
    } catch (err: any) {
      console.error(err);
      addToast({
        title: "AI Detection Failed",
        description: err.response?.data?.message || err.message || "Failed to analyze document",
        type: "error",
      });
      setSelectedMaterialForDetection(null);
    } finally {
      setIsDetectionLoading(false);
    }
  };


  // Queries for active classroom details
  const { data: materials, isLoading: isMaterialsLoading } = useQuery({
    queryKey: ["materials", selectedClassroom?._id],
    queryFn: async () => {
      if (!selectedClassroom?._id) return [];
      const response = await api.get(`/materials/${selectedClassroom._id}`);
      return response.data;
    },
    enabled: !!selectedClassroom?._id,
  });

  const { data: classroomAssignments, isLoading: isAssignmentsLoading } = useQuery({
    queryKey: ["classroomAssignments", selectedClassroom?._id],
    queryFn: async () => {
      if (!selectedClassroom?._id) return [];
      const response = await api.get(`/assignments?classroomId=${selectedClassroom._id}`);
      return response.data;
    },
    enabled: !!selectedClassroom?._id,
  });

  // Mutations
  const uploadMaterialMutation = useMutation({
    mutationFn: async (fd: FormData) => {
      const response = await api.post(`/materials/${selectedClassroom._id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials", selectedClassroom?._id] });
      triggerToast("Material Uploaded", "Successfully uploaded study material.", "success");
      setUploadTitle("");
      setUploadDesc("");
      setUploadFile(null);
      const fileInput = document.getElementById("material-file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    },
    onError: (err: any) => {
      triggerToast("Upload Failed", err.response?.data?.message || "Could not upload file.", "destructive");
    },
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: async (materialId: string) => {
      const response = await api.delete(`/materials/${selectedClassroom._id}/${materialId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials", selectedClassroom?._id] });
      triggerToast("Material Deleted", "Successfully removed study material.", "success");
    },
    onError: (err: any) => {
      triggerToast("Delete Failed", err.response?.data?.message || "Could not delete material.", "destructive");
    },
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle || !uploadFile) {
      triggerToast("Missing Fields", "Please enter a title and select a file.", "destructive");
      return;
    }
    const fd = new FormData();
    fd.append("title", uploadTitle);
    fd.append("description", uploadDesc);
    fd.append("file", uploadFile);
    uploadMaterialMutation.mutate(fd);
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const getAttachmentUrl = (attachmentPath: string) => {
    if (!attachmentPath) return "#";
    if (/^https?:\/\//i.test(attachmentPath)) return attachmentPath;
    const apiRoot = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");
    return `${apiRoot}${attachmentPath.startsWith("/") ? attachmentPath : `/${attachmentPath}`}`;
  };

  const triggerToast = (title: string, description: string, variant: "default" | "destructive" | "success") => {
    addToast({
      id: Math.random().toString(36).substring(2, 9),
      title,
      description,
      variant,
      open: true,
    });
  };

  // 1. Fetch Classrooms Query
  const { data: classrooms, isLoading } = useQuery({
    queryKey: ["classrooms"],
    queryFn: async () => {
      const response = await api.get("/classrooms");
      return response.data;
    },
  });

  // 2. Create Classroom Mutation (Teacher Only)
  const createMutation = useMutation({
    mutationFn: async (newClass: any) => {
      const response = await api.post("/classrooms/create", newClass);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      triggerToast("Classroom Created", `Successfully created "${data.name}"`, "success");
      setIsCreateOpen(false);
      setClassName("");
      setClassSubject("");
    },
    onError: (err: any) => {
      triggerToast("Failed to Create", err.response?.data?.message || "An error occurred.", "destructive");
    },
  });

  // 3. Join Classroom Mutation (Student Only)
  const joinMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await api.post("/classrooms/join", { joinCode: code });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      const clsName = data?.name || data?.classroom?.name || "Classroom";
      triggerToast("Classroom Joined", `Successfully enrolled in "${clsName}"`, "success");
      setIsJoinOpen(false);
      setJoinCodeInput("");
    },
    onError: (err: any) => {
      triggerToast("Failed to Join", err.response?.data?.message || "Verify the code is correct.", "destructive");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className || !classSubject) {
      triggerToast("Missing Fields", "Please enter classroom name and subject.", "destructive");
      return;
    }
    createMutation.mutate({ name: className, subject: classSubject });
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) {
      triggerToast("Code Required", "Please enter a classroom join code.", "destructive");
      return;
    }
    joinMutation.mutate(joinCodeInput.trim().toUpperCase());
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    triggerToast("Code Copied", `Join code "${code}" copied to clipboard.`, "default");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isTeacher = user?.role === "teacher";

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 overflow-auto">
            {!selectedClassroom ? (
              <div className="p-8 space-y-8">
              {/* Header block */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-bold mb-2">My Classrooms</h1>
                  <p className="text-muted-foreground">
                    {isTeacher
                      ? "Create classrooms, share join codes, and grade student assignments"
                      : "Join your courses and submit your assignments on time"}
                  </p>
                </div>

                <div>
                  {isTeacher ? (
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-primary to-secondary" size="lg">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Classroom
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="border-border/50 bg-card/90 backdrop-blur-md max-w-md w-full">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-bold flex items-center">
                            <Plus className="w-5 h-5 text-primary mr-2" />
                            Create New Classroom
                          </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateSubmit} className="space-y-4 mt-2">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">Classroom Name *</label>
                            <Input
                              placeholder="e.g., Computer Networks"
                              value={className}
                              onChange={(e) => setClassName(e.target.value)}
                              disabled={createMutation.isPending}
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">Subject / Course Code *</label>
                            <Input
                              placeholder="e.g., CSE-301"
                              value={classSubject}
                              onChange={(e) => setClassSubject(e.target.value)}
                              disabled={createMutation.isPending}
                              required
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsCreateOpen(false)}
                              disabled={createMutation.isPending}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={createMutation.isPending}
                              className="bg-gradient-to-r from-primary to-secondary"
                            >
                              {createMutation.isPending ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Creating...
                                </>
                              ) : (
                                "Create"
                              )}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-primary to-secondary" size="lg">
                          <Plus className="w-4 h-4 mr-2" />
                          Join Classroom
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="border-border/50 bg-card/90 backdrop-blur-md max-w-md w-full">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-bold flex items-center">
                            <BookOpen className="w-5 h-5 text-primary mr-2" />
                            Enroll in a Classroom
                          </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleJoinSubmit} className="space-y-4 mt-2">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">Classroom Join Code *</label>
                            <Input
                              placeholder="e.g., COMP-9X2F"
                              value={joinCodeInput}
                              onChange={(e) => setJoinCodeInput(e.target.value)}
                              disabled={joinMutation.isPending}
                              required
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Enter the 8-character join code provided by your teacher.
                            </p>
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsJoinOpen(false)}
                              disabled={joinMutation.isPending}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={joinMutation.isPending}
                              className="bg-gradient-to-r from-primary to-secondary"
                            >
                              {joinMutation.isPending ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Joining...
                                </>
                              ) : (
                                "Join Classroom"
                              )}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>

              {/* Classrooms list */}
              <div>
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-44 w-full" />
                    <Skeleton className="h-44 w-full" />
                    <Skeleton className="h-44 w-full" />
                  </div>
                ) : !classrooms || classrooms.length === 0 ? (
                  <Card className="border-border/40 bg-card/40 backdrop-blur-sm p-12 text-center max-w-md mx-auto">
                    <BookOpen className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No classrooms found</h3>
                    <p className="text-muted-foreground text-sm mb-6">
                      {isTeacher
                        ? "Get started by creating your first course page and inviting students."
                        : "You are not enrolled in any classrooms yet. Enter a code to join one."}
                    </p>
                    <Button
                      onClick={() => (isTeacher ? setIsCreateOpen(true) : setIsJoinOpen(true))}
                      className="bg-gradient-to-r from-primary to-secondary"
                    >
                      {isTeacher ? "Create Classroom" : "Join Classroom"}
                    </Button>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                      {classrooms.map((classroom: any, index: number) => (
                        <motion.div
                          key={classroom._id || classroom.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.15, delay: index * 0.05 }}
                        >
                          <Card className="border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-all hover:scale-[1.01] hover:shadow-lg flex flex-col h-full justify-between">
                            <CardHeader className="pb-3">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                                {classroom.subject}
                              </span>
                              <CardTitle className="text-xl font-bold leading-tight mt-1">
                                {classroom.name}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-0">
                              {isTeacher ? (
                                <>
                                  <div className="flex items-center justify-between p-2.5 rounded bg-background/50 border border-border/40 text-sm">
                                    <div className="space-y-0.5">
                                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Join Code</p>
                                      <p className="font-mono font-bold text-foreground text-base tracking-wide">{classroom.joinCode}</p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                      onClick={() => handleCopyCode(classroom.joinCode)}
                                    >
                                      {copiedCode === classroom.joinCode ? (
                                        <Check className="w-4 h-4 text-success" />
                                      ) : (
                                        <Copy className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </div>
                                  <div className="flex items-center text-xs text-muted-foreground space-x-2">
                                    <Users className="w-4 h-4 text-primary" />
                                    <span>{classroom.studentIds?.length || 0} students enrolled</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="text-xs space-y-1">
                                    <p className="text-muted-foreground font-semibold">Teacher</p>
                                    <p className="font-bold text-foreground">{classroom.teacherId?.name || "Dr. Instructor"}</p>
                                    <p className="text-[10px] text-muted-foreground">{classroom.teacherId?.email}</p>
                                  </div>
                                  <div className="flex items-center text-xs text-muted-foreground space-x-2 border-t border-border/45 pt-3">
                                    <Users className="w-4 h-4 text-primary" />
                                    <span>{classroom.studentIds?.length || 0} classmates</span>
                                  </div>
                                </>
                              )}
                              <Button
                                onClick={() => {
                                  setSelectedClassroom(classroom);
                                  setActiveTab("materials");
                                }}
                                className="w-full mt-4 bg-gradient-to-r from-primary/80 to-secondary/80 hover:from-primary hover:to-secondary"
                              >
                                Enter Classroom
                              </Button>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 space-y-8 animate-in fade-in-50 duration-150">
              {/* Back button and Classroom Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
                <div className="flex items-start space-x-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSelectedClassroom(null)}
                    className="border-border/50 text-muted-foreground mt-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                      {selectedClassroom.subject}
                    </span>
                    <h1 className="text-3xl font-bold mt-0.5">{selectedClassroom.name}</h1>
                    <p className="text-muted-foreground text-sm">
                      {isTeacher 
                        ? `Join Code: ${selectedClassroom.joinCode} | ${selectedClassroom.studentIds?.length || 0} enrolled`
                        : `Teacher: ${selectedClassroom.teacherId?.name || "Dr. Instructor"} (${selectedClassroom.teacherId?.email || "N/A"})`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Custom Tab Selector */}
              <div className="flex border-b border-border/40 space-x-6">
                <button
                  onClick={() => setActiveTab("materials")}
                  className={`pb-3 font-semibold text-sm transition-colors border-b-2 px-1 ${
                    activeTab === "materials"
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Study Materials
                </button>
                <button
                  onClick={() => setActiveTab("assignments")}
                  className={`pb-3 font-semibold text-sm transition-colors border-b-2 px-1 ${
                    activeTab === "assignments"
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Classroom Assignments
                </button>
              </div>

              {/* Tab content */}
              {activeTab === "materials" ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left: Materials list */}
                  <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold">Lecture Notes & Documents</h2>
                    {isMaterialsLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    ) : !materials || materials.length === 0 ? (
                      <Card className="border-border/40 bg-card/30 backdrop-blur-sm p-8 text-center">
                        <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                        <p className="text-muted-foreground text-sm">No study materials uploaded yet.</p>
                        {isTeacher && <p className="text-xs text-muted-foreground/60 mt-1">Use the upload form to add slides, assignments details, or syllabus documents.</p>}
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {materials.map((material: any) => (
                          <Card key={material._id} className="border-border/50 bg-card/60 backdrop-blur-sm p-4 hover:border-primary/20 transition-all">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start space-x-3">
                                <div className="p-2.5 bg-primary/10 rounded-md text-primary mt-0.5">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-foreground leading-snug">{material.title}</h3>
                                  {material.description && (
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{material.description}</p>
                                  )}
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground/80 mt-2 font-medium">
                                    <span className="flex items-center">
                                      <Paperclip className="w-3 h-3 mr-1" />
                                      {material.fileName}
                                    </span>
                                    <span>•</span>
                                    <span>{formatBytes(material.fileSize)}</span>
                                    <span>•</span>
                                    <span className="flex items-center">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {new Date(material.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-1.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleSummarizeMaterial(material)}
                                  disabled={isSummaryLoading}
                                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                  title="Summarize Note"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDetectAiMaterial(material)}
                                  disabled={isDetectionLoading}
                                  className="h-8 w-8 text-muted-foreground hover:text-secondary hover:bg-secondary/10"
                                  title="Detect AI Content"
                                >
                                  <Cpu className="w-3.5 h-3.5" />
                                </Button>
                                <a
                                  href={getAttachmentUrl(material.url)}
                                  download={material.fileName}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center rounded-md text-xs font-medium border border-border/80 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                                  title="Download notes"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                                {isTeacher && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteMaterialMutation.mutate(material._id)}
                                    disabled={deleteMaterialMutation.isPending}
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    title="Delete notes"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Upload form for teacher */}
                  {isTeacher && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold">Upload Lecture Notes</h2>
                      <Card className="border-border/50 bg-card/60 p-5">
                        <form onSubmit={handleUploadSubmit} className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">Material Title *</label>
                            <Input
                              placeholder="e.g. Unit 3 - Sliding Window Protocols"
                              value={uploadTitle}
                              onChange={(e) => setUploadTitle(e.target.value)}
                              disabled={uploadMaterialMutation.isPending}
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">Description / Notes</label>
                            <textarea
                              placeholder="Explain topics covered, references, or instructions..."
                              value={uploadDesc}
                              onChange={(e) => setUploadDesc(e.target.value)}
                              disabled={uploadMaterialMutation.isPending}
                              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary h-20 resize-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-muted-foreground">Select File *</label>
                              <div className="border-2 border-dashed border-border/80 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors bg-background/50 relative">
                                <input
                                  type="file"
                                  id="material-file-input"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                      setUploadFile(e.target.files[0]);
                                    }
                                  }}
                                  disabled={uploadMaterialMutation.isPending}
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  required
                                />
                                <UploadCloud className="w-7 h-7 text-muted-foreground/60 mx-auto mb-2" />
                                <p className="text-xs font-medium text-foreground">
                                  {uploadFile ? uploadFile.name : "Click to browse slides / notes"}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">PDF, DOC, Images, or TXT up to 10MB</p>
                              </div>
                            </div>
                          <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-primary to-secondary"
                            disabled={uploadMaterialMutation.isPending}
                          >
                            {uploadMaterialMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              "Upload Lecture Notes"
                            )}
                          </Button>
                        </form>
                      </Card>
                    </div>
                  )}
                </div>
              ) : (
                // Assignments Tab
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Classroom Assignments</h2>
                    {isTeacher && (
                      <Link href="/teacher" className="text-xs font-semibold text-primary hover:underline">
                        Create or manage in Teacher Portal →
                      </Link>
                    )}
                  </div>

                  {isAssignmentsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Skeleton className="h-32 w-full" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                  ) : !classroomAssignments || classroomAssignments.length === 0 ? (
                    <Card className="border-border/40 bg-card/30 backdrop-blur-sm p-8 text-center max-w-md mx-auto">
                      <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                      <p className="text-muted-foreground text-sm">No assignments posted for this classroom.</p>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {classroomAssignments.map((assignment: any) => {
                        const isCode = assignment.assignmentType === "code";
                        return (
                          <Card key={assignment._id} className="border-border/50 bg-card/60 backdrop-blur-sm p-5 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                                    assignment.priority === "high"
                                      ? "bg-red-500/10 text-red-500"
                                      : assignment.priority === "medium"
                                      ? "bg-amber-500/10 text-amber-500"
                                      : "bg-slate-500/10 text-slate-500"
                                  }`}>
                                    {assignment.priority} Priority
                                  </span>
                                  {isCode && (
                                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-primary/15 border border-primary/25 text-primary flex items-center gap-1">
                                      <Code2 className="w-3 h-3" />
                                      Code
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-semibold">
                                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                              <h3 className="font-bold text-lg mt-2 text-foreground">{assignment.title}</h3>
                              {assignment.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-3 leading-relaxed">{assignment.description}</p>
                              )}
                            </div>
                            <div className="border-t border-border/40 mt-4 pt-3 flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 capitalize">Status: {assignment.assignmentStatus || "active"}</span>
                              {isCode ? (
                                <Link
                                  href={`/compiler?assignmentId=${assignment._id}`}
                                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                >
                                  <Code2 className="w-3.5 h-3.5" />
                                  Solve in Compiler →
                                </Link>
                              ) : (
                                <Link
                                  href="/assignments"
                                  className="text-xs font-bold text-primary hover:underline"
                                >
                                  View/Submit Work →
                                </Link>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
        </div>
      </div>

      {/* Note Summary Dialog */}
      <Dialog open={!!selectedMaterialForSummary} onOpenChange={(open) => !open && setSelectedMaterialForSummary(null)}>
        <DialogContent className="border-border/50 bg-card/90 backdrop-blur-md max-w-lg w-full max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              AI Study Summary
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="p-3 bg-primary/5 border border-primary/10 rounded-md">
              <h4 className="font-semibold text-sm text-foreground mb-1">Source Note</h4>
              <p className="text-xs text-muted-foreground">{selectedMaterialForSummary?.title}</p>
              {selectedMaterialForSummary?.fileName && (
                <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center">
                  <Paperclip className="w-3 h-3 mr-1" /> {selectedMaterialForSummary.fileName}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-foreground">Summary</h4>
              {isSummaryLoading ? (
                <div className="space-y-2 pt-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              ) : (
                <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/20 p-4 rounded-md border border-border/40 leading-relaxed font-sans">
                  {noteSummary}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Detection Dialog */}
      <Dialog open={!!selectedMaterialForDetection} onOpenChange={(open) => !open && setSelectedMaterialForDetection(null)}>
        <DialogContent className="border-border/50 bg-card/90 backdrop-blur-md max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Cpu className="w-5 h-5 text-secondary" />
              AI Plagiarism & Integrity Analysis
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="p-3 bg-secondary/5 border border-secondary/10 rounded-md">
              <h4 className="font-semibold text-sm text-foreground mb-1">Document Checked</h4>
              <p className="text-xs text-muted-foreground">{selectedMaterialForDetection?.title}</p>
              {selectedMaterialForDetection?.fileName && (
                <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center">
                  <Paperclip className="w-3 h-3 mr-1" /> {selectedMaterialForDetection.fileName}
                </p>
              )}
            </div>

            {isDetectionLoading ? (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Analyzing linguistic style and structure...</span>
                  <Loader2 className="w-4 h-4 animate-spin text-secondary" />
                </div>
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : detectionResult && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/30 border border-border/40 rounded-md">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground block mb-1">AI GENERATION SCORE</span>
                    <span className={`text-3xl font-extrabold tracking-tight ${detectionResult.isAiGenerated ? 'text-destructive' : 'text-emerald-500'}`}>
                      {detectionResult.aiScore}%
                    </span>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-xs font-bold border ${detectionResult.isAiGenerated ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                    {detectionResult.isAiGenerated ? "AI Generated" : "Human Written"}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-foreground">Analysis Explanation</h4>
                  <div className="text-xs text-muted-foreground bg-muted/20 p-3.5 rounded-md border border-border/40 leading-relaxed">
                    {detectionResult.aiExplanation}
                  </div>
                </div>

                {detectionResult.handwrittenExplanation && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-foreground">Format Check</h4>
                    <div className="text-xs text-muted-foreground bg-muted/20 p-3.5 rounded-md border border-border/40 leading-relaxed">
                      {detectionResult.handwrittenExplanation}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}

