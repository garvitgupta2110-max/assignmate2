"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
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
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Plus,
  CheckSquare,
  Search,
  Trash2,
  Check,
  AlertCircle,
  Calendar as CalendarIcon,
  RefreshCw,
  Sparkles,
  Loader2,
  Upload,
  Lock,
  BookOpen,
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export default function Assignments() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  // Filter and Search states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  // Dialog and form states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high">("medium");

  // AI planner states
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Submit Work states
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState("");
  const [submissionFiles, setSubmissionFiles] = useState<FileList | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState("pdf");

  const triggerToast = (title: string, description: string, variant: "default" | "destructive" | "success") => {
    addToast({
      id: Math.random().toString(36).substring(2, 9),
      title,
      description,
      variant,
      open: true,
    });
  };

  // 1. Fetch Assignments Query
  const { data: assignments, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["assignments", search, statusFilter],
    queryFn: async () => {
      const params: any = {};
      if (statusFilter && statusFilter !== "all" && statusFilter !== "overdue" && statusFilter !== "high") {
        params.status = statusFilter;
      }
      if (statusFilter === "high") {
        params.priority = "high";
      }
      if (search.trim() !== "") {
        params.search = search;
      }

      const response = await api.get("/assignments", { params });

      // Client-side overdue filter
      if (statusFilter === "overdue") {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        return response.data.filter(
          (a: any) => new Date(a.dueDate) < startOfToday && a.status !== "completed"
        );
      }

      return response.data;
    },
  });

  // 2. Fetch Student's Submissions Query
  const { data: mySubmissions } = useQuery({
    queryKey: ["mySubmissions"],
    queryFn: async () => {
      const response = await api.get("/assignments/my-submissions");
      return response.data;
    },
    enabled: user?.role === "student",
  });

  // 3. Create Assignment Mutation
  const createMutation = useMutation({
    mutationFn: async (newAssignment: any) => {
      const response = await api.post("/assignments", newAssignment);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      triggerToast("Assignment Created", `Successfully added "${data.title}"`, "success");
      setIsAddOpen(false);
      // Reset form
      setNewTitle("");
      setNewSubject("");
      setNewDescription("");
      setNewDueDate("");
      setNewPriority("medium");
    },
    onError: (err: any) => {
      triggerToast("Creation Failed", err.response?.data?.message || "An error occurred.", "destructive");
    },
  });

  // 4. Update Assignment Mutation (Status / Progress)
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/assignments/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      triggerToast("Assignment Updated", `"${data.title}" status changed to ${data.status}.`, "success");
    },
  });

  // 5. Submit Assignment Mutation
  const submitWorkMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: FormData | { submittedAttachments: any[] } }) => {
      if (payload instanceof FormData) {
        const response = await api.post(`/assignments/${id}/submit`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
      }
      const response = await api.post(`/assignments/${id}/submit`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["mySubmissions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      triggerToast("Assignment Submitted", "Your work has been successfully uploaded for grading.", "success");
      setIsSubmitOpen(false);
      setSubmissionFiles(null);
      setFileName("");
      setFileUrl("");
    },
    onError: (err: any) => {
      triggerToast("Submission Failed", err.response?.data?.message || "An error occurred.", "destructive");
    },
  });

  // 6. Delete Assignment Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/assignments/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      triggerToast("Assignment Deleted", "The assignment was removed successfully.", "success");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSubject || !newDueDate) {
      triggerToast("Required Fields", "Please enter Title, Subject, and Due Date.", "destructive");
      return;
    }
    createMutation.mutate({
      title: newTitle,
      subject: newSubject,
      description: newDescription,
      dueDate: new Date(newDueDate),
      priority: newPriority,
    });
  };

  const handleAiGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic) {
      triggerToast("Missing Topic", "Please describe your assignment.", "destructive");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await api.post("/ai/assignment/generate", { topic: aiTopic }, { timeout: 120000 });
      const plan = response.data;

      setNewTitle(plan.title || "");
      setNewSubject(plan.subject || "");
      setNewDescription(plan.description || "");
      setNewPriority(plan.priority || "medium");

      setIsAiOpen(false);
      setAiTopic("");
      setIsAddOpen(true);

      triggerToast("Plan Generated", "Verify details, select a due date, and save.", "success");
    } catch (err: any) {
      console.error(err);
      triggerToast(
        "AI Generation Failed",
        err.response?.data?.message || "Verify Ollama is running locally with the llama3 model.",
        "destructive"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleStatus = (assignment: any) => {
    let nextStatus: "pending" | "in-progress" | "completed" = "pending";
    let nextProgress = 0;

    if (assignment.status === "pending") {
      nextStatus = "in-progress";
      nextProgress = 50;
    } else if (assignment.status === "in-progress") {
      nextStatus = "completed";
      nextProgress = 100;
    } else if (assignment.status === "completed") {
      nextStatus = "pending";
      nextProgress = 0;
    }

    updateMutation.mutate({
      id: assignment._id || assignment.id,
      data: { status: nextStatus, progress: nextProgress },
    });
  };

  const handleOpenSubmit = (assignment: any) => {
    setSubmittingAssignmentId(assignment._id || assignment.id);
    setFileName(`Submission_${assignment.title.replace(/\s+/g, "_")}.pdf`);
    setIsSubmitOpen(true);
  };

  const handleSubmitWork = (e: React.FormEvent) => {
    e.preventDefault();

    if (submissionFiles && submissionFiles.length > 0) {
      const fd = new FormData();
      for (let i = 0; i < submissionFiles.length; i++) {
        fd.append("files", submissionFiles[i]);
      }
      submitWorkMutation.mutate({
        id: submittingAssignmentId,
        payload: fd,
      });
      return;
    }

    if (fileUrl) {
      const actualFileName = fileName.trim() || "Submission.pdf";
      submitWorkMutation.mutate({
        id: submittingAssignmentId,
        payload: {
          submittedAttachments: [
            {
              fileName: actualFileName,
              url: fileUrl.trim(),
              fileType,
              fileSize: 1024,
              publicId: `upload_${Math.random().toString(36).substring(2, 9)}`,
            },
          ],
        },
      });
      return;
    }

    triggerToast("Validation Error", "Please select a file to upload or enter a document URL.", "destructive");
  };

  const isOverdue = (dueDateStr: string, status: string) => {
    if (status === "completed") return false;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return new Date(dueDateStr) < startOfToday;
  };

  const getAttachmentUrl = (attachmentPath: string) => {
    if (!attachmentPath) return "#";
    if (/^https?:\/\//i.test(attachmentPath)) return attachmentPath;

    const apiRoot = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");
    return `${apiRoot}${attachmentPath.startsWith("/") ? attachmentPath : `/${attachmentPath}`}`;
  };

  const filters = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "in-progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "overdue", label: "Overdue ⏰" },
    { value: "high", label: "High Priority 🔥" },
  ];

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 overflow-auto">
            <div className="p-8 space-y-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-bold mb-2">Assignment Tracker</h1>
                  <p className="text-muted-foreground">
                    Manage and track all your academic tasks
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => refetch()}
                    disabled={isLoading || isRefetching}
                    className="border-border/50 text-muted-foreground"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
                  </Button>

                  {/* AI Planner Dialog */}
                  {user?.role === "student" && (
                    <Dialog open={isAiOpen} onOpenChange={setIsAiOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-secondary to-purple-600 border border-secondary/35 text-white">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate with AI
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="border-border/50 bg-card/90 backdrop-blur-md max-w-md w-full">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-bold flex items-center">
                            <Sparkles className="w-5 h-5 text-secondary mr-2" />
                            AI Assignment Planner (Ollama)
                          </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAiGenerateSubmit} className="space-y-4 mt-2">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">Describe Assignment Topic / Question *</label>
                            <textarea
                              placeholder="e.g., Explain the difference between TCP and UDP, highlighting key characteristics and header structures."
                              value={aiTopic}
                              onChange={(e) => setAiTopic(e.target.value)}
                              disabled={isGenerating}
                              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary h-28 resize-none"
                              required
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsAiOpen(false)}
                              disabled={isGenerating}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={isGenerating}
                              className="bg-gradient-to-r from-secondary to-purple-600"
                            >
                              {isGenerating ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Planning...
                                </>
                              ) : (
                                "Generate Study Plan"
                              )}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}

                  {/* Teacher: Post Classroom Assignment Button */}
                  {user?.role === "teacher" && (
                    <Link
                      href="/teacher"
                      className="inline-flex items-center justify-center rounded-md text-sm font-semibold h-10 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Post Classroom Assignment
                    </Link>
                  )}

                  {/* Manual Assignment - personal tasks for students */}
                  {user?.role === "student" && (
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-primary to-secondary">
                          <Plus className="w-4 h-4 mr-2" />
                          New Assignment
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="border-border/50 bg-card/90 backdrop-blur-md max-w-md w-full">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-bold">Add New Personal Assignment</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateSubmit} className="space-y-4 mt-2">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">Assignment Title *</label>
                            <Input
                              placeholder="Data Structures Lab 3"
                              value={newTitle}
                              onChange={(e) => setNewTitle(e.target.value)}
                              disabled={createMutation.isPending}
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">Subject Code / Name *</label>
                            <Input
                              placeholder="CSE-201"
                              value={newSubject}
                              onChange={(e) => setNewSubject(e.target.value)}
                              disabled={createMutation.isPending}
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">Due Date *</label>
                            <Input
                              type="date"
                              value={newDueDate}
                              onChange={(e) => setNewDueDate(e.target.value)}
                              disabled={createMutation.isPending}
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">Priority</label>
                            <select
                              value={newPriority}
                              onChange={(e) => setNewPriority(e.target.value as any)}
                              disabled={createMutation.isPending}
                              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              <option value="low">Low Priority</option>
                              <option value="medium">Medium Priority</option>
                              <option value="high">High Priority</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">Description</label>
                            <textarea
                              placeholder="Implement binary search trees in C++..."
                              value={newDescription}
                              onChange={(e) => setNewDescription(e.target.value)}
                              disabled={createMutation.isPending}
                              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary h-20 resize-none"
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsAddOpen(false)}
                              disabled={createMutation.isPending}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={createMutation.isPending}
                              className="bg-gradient-to-r from-primary to-secondary"
                            >
                              {createMutation.isPending ? "Creating..." : "Save Assignment"}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  {filters.map((filter) => (
                    <Button
                      key={filter.value}
                      variant={statusFilter === filter.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter(filter.value)}
                      className="capitalize border-border/40"
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>

                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search assignments..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-card/40 border-border/60"
                  />
                </div>
              </div>

              {/* Assignments List */}
              <div className="space-y-4">
                {isLoading ? (
                  <>
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </>
                ) : !assignments || assignments.length === 0 ? (
                  <Card className="border-border/40 bg-card/40 backdrop-blur-sm p-12 text-center">
                    <CheckSquare className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No assignments found</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                      {search || statusFilter !== "all"
                        ? "No tasks match your filter criteria. Try clearing them or modifying your search query."
                        : "Track your tasks and deadlines by creating your first assignment now!"}
                    </p>
                    {!(search || statusFilter !== "all") && user?.role === "student" && (
                      <Button
                        onClick={() => setIsAddOpen(true)}
                        className="bg-gradient-to-r from-primary to-secondary"
                      >
                        Create First Assignment
                      </Button>
                    )}
                  </Card>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {assignments.map((assignment: any, index: number) => {
                      const overdue = isOverdue(assignment.dueDate, assignment.status);
                      const isClassroom = assignment.visibility === "classroom";

                      // Student cross-referencing submittals
                      const studentSubmission = mySubmissions?.find(
                        (sub: any) =>
                          sub.assignmentId?._id === assignment._id ||
                          sub.assignmentId === assignment._id
                      );

                      return (
                        <motion.div
                          key={assignment._id || assignment.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2, delay: index * 0.03 }}
                        >
                          <Card className={`border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-all ${overdue ? "border-destructive/30 shadow-destructive/5" : ""}`}>
                            <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                              {/* Left Info */}
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                                  <h3 className="text-lg font-semibold tracking-tight">{assignment.title}</h3>
                                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium">
                                    {assignment.subject}
                                  </span>

                                  {isClassroom ? (
                                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-secondary/15 border border-secondary/25 text-secondary font-bold flex items-center">
                                      <BookOpen className="w-3.5 h-3.5 mr-1" />
                                      CLASSROOM
                                    </span>
                                  ) : (
                                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-muted border border-border/60 text-muted-foreground font-semibold">
                                      PERSONAL
                                    </span>
                                  )}

                                  {overdue && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 border border-destructive/20 text-destructive font-bold flex items-center">
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      OVERDUE
                                    </span>
                                  )}
                                </div>
                                {assignment.description && (
                                  <p className="text-sm text-muted-foreground max-w-2xl whitespace-pre-line">
                                    {assignment.description}
                                  </p>
                                )}

                                {Array.isArray(assignment.attachments) && assignment.attachments.length > 0 && (
                                  <div className="space-y-2 pt-1">
                                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                                      Attachments
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {assignment.attachments.map((attachment: string, attachmentIndex: number) => {
                                        const attachmentUrl = getAttachmentUrl(attachment);
                                        const attachmentName = decodeURIComponent(
                                          attachment.split("/").pop() || `Attachment ${attachmentIndex + 1}`
                                        );

                                        return (
                                          <a
                                            key={`${attachment}-${attachmentIndex}`}
                                            href={attachmentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-xs text-foreground hover:border-primary/60 hover:text-primary transition-colors"
                                          >
                                            <Upload className="w-3.5 h-3.5" />
                                            <span className="max-w-[180px] truncate">{attachmentName}</span>
                                          </a>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-center text-xs text-muted-foreground space-x-4">
                                  <span className="flex items-center">
                                    <CalendarIcon className="w-3.5 h-3.5 mr-1" />
                                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                  </span>
                                  <span className="capitalize font-semibold">
                                    Priority: {assignment.priority}
                                  </span>
                                </div>
                              </div>

                              {/* Middle Progress or Submission status */}
                              {!isClassroom ? (
                                <div className="w-full md:w-48 space-y-2">
                                  <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-muted-foreground">Progress</span>
                                    <span>{assignment.progress}%</span>
                                  </div>
                                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className={`h-full transition-all duration-300 ${
                                        assignment.status === "completed"
                                          ? "bg-success"
                                          : "bg-gradient-to-r from-primary to-secondary"
                                      }`}
                                      style={{ width: `${assignment.progress}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="w-full md:w-48 text-left md:text-right space-y-1.5">
                                  <p className="text-xs font-semibold text-muted-foreground">Submission Tally</p>
                                  {user?.role === "student" ? (
                                    studentSubmission ? (
                                      studentSubmission.status === "graded" ? (
                                        <div className="inline-flex items-center space-x-1.5 bg-success/15 border border-success/35 px-2 py-0.5 rounded text-success font-bold text-xs">
                                          <span>Graded:</span>
                                          <strong>{studentSubmission.gradeLetter} ({studentSubmission.marks}/{studentSubmission.maxMarks})</strong>
                                        </div>
                                      ) : (
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold border capitalize ${
                                          studentSubmission.status === "late"
                                            ? "bg-destructive/15 border-destructive/25 text-destructive"
                                            : "bg-secondary/15 border-secondary/25 text-secondary"
                                        }`}>
                                          {studentSubmission.status}
                                        </span>
                                      )
                                    ) : (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/15 border border-slate-700/25 text-slate-400 font-bold">
                                        Pending Submit
                                      </span>
                                    )
                                  ) : (
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                                      assignment.assignmentStatus === "closed"
                                        ? "bg-destructive/15 border-destructive/25 text-destructive"
                                        : "bg-success/15 border-success/25 text-success"
                                    }`}>
                                      {assignment.assignmentStatus === "closed" ? "Closed 🔒" : "Active 🔓"}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Right Actions */}
                              <div className="flex items-center gap-2 justify-end">
                                {!isClassroom ? (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleToggleStatus(assignment)}
                                      className={`capitalize border-border/40 ${
                                        assignment.status === "completed"
                                          ? "bg-success/15 border-success/30 text-success hover:bg-success/20"
                                          : assignment.status === "in-progress"
                                          ? "bg-warning/15 border-warning/30 text-warning hover:bg-warning/20"
                                          : "hover:bg-muted"
                                      }`}
                                    >
                                      {assignment.status === "completed" && <Check className="w-4 h-4 mr-1.5" />}
                                      {assignment.status === "in-progress" ? "In Progress" : assignment.status}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        if (confirm("Are you sure you want to delete this assignment?")) {
                                          deleteMutation.mutate(assignment._id || assignment.id);
                                        }
                                      }}
                                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    {user?.role === "student" && (
                                      <>
                                        {assignment.assignmentStatus === "closed" ? (
                                          <span className="text-xs text-muted-foreground flex items-center bg-destructive/10 px-2 py-1 rounded border border-destructive/25 font-bold">
                                            <Lock className="w-3.5 h-3.5 mr-1" />
                                            Closed
                                          </span>
                                        ) : studentSubmission && studentSubmission.status === "graded" ? (
                                          <span className="text-xs text-success flex items-center font-bold">
                                            <Check className="w-4 h-4 mr-1" /> Graded
                                          </span>
                                        ) : (
                                          <Button
                                            variant="default"
                                            size="sm"
                                            onClick={() => handleOpenSubmit(assignment)}
                                            className="bg-gradient-to-r from-primary to-secondary text-xs h-8 font-semibold"
                                          >
                                            <Upload className="w-3.5 h-3.5 mr-1" />
                                            {studentSubmission ? "Resubmit Work" : "Submit Work"}
                                          </Button>
                                        )}
                                      </>
                                    )}

                                    {user?.role === "teacher" && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          if (confirm("Are you sure you want to delete this classroom assignment? It will delete all student submissions.")) {
                                            deleteMutation.mutate(assignment._id || assignment.id);
                                          }
                                        }}
                                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Student submit work dialog */}
      <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
        <DialogContent className="border-border/50 bg-card/90 backdrop-blur-md max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center">
              <Upload className="w-5 h-5 text-primary mr-2" />
              Submit Assignment Work
            </DialogTitle>
            <DialogDescription>
              Upload your completed PDF or documents directly for teacher review and grading.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitWork} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Upload PDF / Documents</span>
                <span className="text-[10px] text-primary font-normal">Direct Upload</span>
              </label>
              <Input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
                onChange={(e) => setSubmissionFiles(e.target.files)}
                className="file:mr-4 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30 cursor-pointer bg-background/50"
              />
              {submissionFiles && submissionFiles.length > 0 && (
                <p className="text-[11px] text-success font-medium">
                  ✓ {submissionFiles.length} file(s) selected for direct upload
                </p>
              )}
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-border/40"></div>
              <span className="flex-shrink mx-2 text-[10px] uppercase tracking-wider text-muted-foreground">Or Link Online Document</span>
              <div className="flex-grow border-t border-border/40"></div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Document / PDF URL (Optional)</label>
              <Input
                placeholder="https://drive.google.com/... or https://res.cloudinary.com/..."
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
              />
            </div>

            {fileUrl && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">File Name</label>
                  <Input
                    placeholder="Assignment_Work.pdf"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Type</label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="docx">Word Document</option>
                    <option value="zip">ZIP Archive</option>
                    <option value="png">PNG / JPG Image</option>
                  </select>
                </div>
              </div>
            )}

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsSubmitOpen(false);
                  setSubmissionFiles(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitWorkMutation.isPending}
                className="bg-gradient-to-r from-primary to-secondary"
              >
                {submitWorkMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Work"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}
