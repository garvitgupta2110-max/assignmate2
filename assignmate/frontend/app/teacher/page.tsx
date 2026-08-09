"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToastStore } from "@/store/toast-store";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  CheckSquare,
  FileSpreadsheet,
  TrendingUp,
  Award,
  Activity,
  FileIcon,
  PlusCircle,
  Calendar,
  AlertTriangle,
  FolderOpen,
  Loader2,
  Clock,
  Unlock,
  Lock,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const CHART_COLORS = ["#5865F2", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function TeacherDashboard() {
  const queryClient = useQueryClient();

  const addToast = useToastStore((state) => state.addToast);

  const [selectedClassroomId, setSelectedClassroomId] = useState<string>("");
  const [isGradingOpen, setIsGradingOpen] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<any>(null);

  // Grade Form state
  const [marks, setMarks] = useState<string>("");
  const [maxMarks, setMaxMarks] = useState<string>("100");
  const [feedback, setFeedback] = useState<string>("");

  // Create Assignment Form state
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high">("medium");

  const triggerToast = (title: string, description: string, variant: "default" | "destructive" | "success") => {
    addToast({
      id: Math.random().toString(36).substring(2, 9),
      title,
      description,
      variant,
      open: true,
    });
  };

  // 1. Fetch Teacher Classrooms
  const { data: classrooms, isLoading: classroomsLoading } = useQuery({
    queryKey: ["teacherClassrooms"],
    queryFn: async () => {
      const response = await api.get("/classrooms");
      return response.data;
    },
  });

  // Auto-select first classroom
  useEffect(() => {
    if (classrooms && classrooms.length > 0 && !selectedClassroomId) {
      setSelectedClassroomId(classrooms[0]._id || classrooms[0].id);
    }
  }, [classrooms, selectedClassroomId]);

  // 2. Fetch Selected Classroom Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["classroomStats", selectedClassroomId],
    queryFn: async () => {
      if (!selectedClassroomId) return null;
      const response = await api.get(`/submissions/stats/${selectedClassroomId}`);
      return response.data;
    },
    enabled: !!selectedClassroomId,
  });

  // 3. Fetch Selected Classroom Submissions
  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ["classroomSubmissions", selectedClassroomId],
    queryFn: async () => {
      if (!selectedClassroomId) return [];
      const response = await api.get(`/submissions/classroom/${selectedClassroomId}`);
      return response.data;
    },
    enabled: !!selectedClassroomId,
  });

  // 4. Fetch Classroom Assignments (for closing/opening)
  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ["classroomAssignments", selectedClassroomId],
    queryFn: async () => {
      if (!selectedClassroomId) return [];
      const response = await api.get("/assignments", {
        params: { classroomId: selectedClassroomId }
      });
      return response.data;
    },
    enabled: !!selectedClassroomId,
  });

  // 5. Grade Submission Mutation
  const gradeMutation = useMutation({
    mutationFn: async ({ submissionId, data }: { submissionId: string; data: any }) => {
      const response = await api.put(`/submissions/${submissionId}/grade`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classroomStats", selectedClassroomId] });
      queryClient.invalidateQueries({ queryKey: ["classroomSubmissions", selectedClassroomId] });
      triggerToast("Submission Graded", "The marks and feedback have been sent to the student.", "success");
      setIsGradingOpen(false);
      setMarks("");
      setFeedback("");
    },
    onError: (err: any) => {
      triggerToast("Grading Failed", err.response?.data?.message || "An error occurred.", "destructive");
    },
  });

  // 6. Create Assignment Mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (assignmentData: any) => {
      const response = await api.post("/assignments", assignmentData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classroomAssignments", selectedClassroomId] });
      queryClient.invalidateQueries({ queryKey: ["classroomSubmissions", selectedClassroomId] });
      queryClient.invalidateQueries({ queryKey: ["classroomStats", selectedClassroomId] });
      triggerToast("Assignment Posted", "The classroom assignment was created and students notified.", "success");
      setIsCreateAssignmentOpen(false);
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

  // 7. Toggle Assignment Status Mutation
  const toggleAssignmentStatusMutation = useMutation({
    mutationFn: async ({ assignmentId, status }: { assignmentId: string; status: "active" | "closed" }) => {
      const response = await api.put(`/assignments/${assignmentId}`, { assignmentStatus: status });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["classroomAssignments", selectedClassroomId] });
      queryClient.invalidateQueries({ queryKey: ["classroomSubmissions", selectedClassroomId] });
      triggerToast(
        "Assignment Updated",
        `Submissions for "${data.title}" are now ${data.assignmentStatus}.`,
        "success"
      );
    },
    onError: (err: any) => {
      triggerToast("Failed to Toggle Status", err.response?.data?.message || "An error occurred.", "destructive");
    },
  });

  const handleOpenGrading = (submission: any) => {
    setActiveSubmission(submission);
    setMarks(submission.marks !== undefined ? submission.marks.toString() : "");
    setMaxMarks(submission.maxMarks !== undefined ? submission.maxMarks.toString() : "100");
    setFeedback("");
    setIsGradingOpen(true);
  };

  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!marks || !maxMarks) {
      triggerToast("Validation Error", "Please enter marks and maximum marks.", "destructive");
      return;
    }
    gradeMutation.mutate({
      submissionId: activeSubmission._id,
      data: {
        marks: Number(marks),
        maxMarks: Number(maxMarks),
        feedback,
      },
    });
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSubject || !newDueDate) {
      triggerToast("Validation Error", "Title, Subject and Due Date are required.", "destructive");
      return;
    }
    createAssignmentMutation.mutate({
      title: newTitle,
      subject: newSubject,
      description: newDescription,
      dueDate: new Date(newDueDate),
      priority: newPriority,
      visibility: "classroom",
      classroomId: selectedClassroomId,
    });
  };

  const handleToggleAssignmentStatus = (assignment: any) => {
    const nextStatus = assignment.assignmentStatus === "active" ? "closed" : "active";
    toggleAssignmentStatusMutation.mutate({
      assignmentId: assignment._id || assignment.id,
      status: nextStatus,
    });
  };

  // Generate Leaderboard on-the-fly based on graded submissions
  const getLeaderboard = () => {
    if (!submissions || submissions.length === 0) return [];
    const studentGradesMap: Record<string, { name: string; email: string; totalPct: number; count: number }> = {};

    submissions.forEach((sub: any) => {
      if (sub.status === "graded" && sub.percentage !== undefined) {
        const studentId = sub.studentId._id || sub.studentId.id;
        if (!studentGradesMap[studentId]) {
          studentGradesMap[studentId] = {
            name: sub.studentId.name,
            email: sub.studentId.email,
            totalPct: 0,
            count: 0,
          };
        }
        studentGradesMap[studentId].totalPct += sub.percentage;
        studentGradesMap[studentId].count += 1;
      }
    });

    return Object.values(studentGradesMap)
      .map((student) => ({
        name: student.name,
        email: student.email,
        average: Math.round(student.totalPct / student.count),
      }))
      .sort((a, b) => b.average - a.average)
      .slice(0, 5);
  };

  const leaderboard = getLeaderboard();

  // Recharts Grade Distribution data
  const gradeDistributionData = stats?.gradeDistribution
    ? Object.keys(stats.gradeDistribution).map((key) => ({
        name: `${key} Grade`,
        count: stats.gradeDistribution[key] || 0,
      }))
    : [];

  // Recharts Submission status details
  const getSubmissionStatusData = () => {
    if (!stats) return [];
    const pending = stats.pendingReviews || 0;
    const graded = stats.totalSubmissions - stats.pendingReviews;
    const unsubmitted = (stats.totalStudents || 0) - (stats.totalSubmissions || 0);

    return [
      { name: "Graded", value: graded },
      { name: "Pending Review", value: pending },
      { name: "Not Submitted", value: Math.max(0, unsubmitted) },
    ];
  };

  const submissionStatusData = getSubmissionStatusData();
  const isClassroomSelected = !!selectedClassroomId;


  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 overflow-auto">
            <div className="p-8 space-y-8">
              {/* Top Selector & Add */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-4xl font-bold mb-2">Teacher Portal</h1>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground font-semibold">Selected Course:</span>
                    {classroomsLoading ? (
                      <Skeleton className="h-9 w-48" />
                    ) : classrooms && classrooms.length > 0 ? (
                      <Select value={selectedClassroomId} onValueChange={setSelectedClassroomId}>
                        <SelectTrigger className="w-56 bg-card border-border/60">
                          <SelectValue placeholder="Select Classroom" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {classrooms.map((c: any) => (
                            <SelectItem key={c._id} value={c._id}>
                              {c.name} ({c.subject})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm text-destructive">No classrooms found. Create one first!</span>
                    )}
                  </div>
                </div>

                {isClassroomSelected && (
                  <Dialog open={isCreateAssignmentOpen} onOpenChange={setIsCreateAssignmentOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-primary to-secondary">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Post Classroom Assignment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="border-border/50 bg-card/90 backdrop-blur-md max-w-md w-full">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center">
                          <CheckSquare className="w-5 h-5 text-primary mr-2" />
                          Post New Classroom Assignment
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateAssignment} className="space-y-4 mt-2">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">Assignment Title *</label>
                          <Input
                            placeholder="e.g. Midterm Lab Assignment"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">Subject Code *</label>
                          <Input
                            placeholder="e.g. CSE-402"
                            value={newSubject}
                            onChange={(e) => setNewSubject(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">Due Date *</label>
                          <Input
                            type="date"
                            value={newDueDate}
                            onChange={(e) => setNewDueDate(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">Priority</label>
                          <select
                            value={newPriority}
                            onChange={(e) => setNewPriority(e.target.value as any)}
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="low">Low Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="high">High Priority</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">Description / Prompt</label>
                          <textarea
                            placeholder="Describe what students need to upload and grade requirements..."
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary h-20 resize-none"
                          />
                        </div>
                        <DialogFooter className="pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCreateAssignmentOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={createAssignmentMutation.isPending}
                            className="bg-gradient-to-r from-primary to-secondary"
                          >
                            {createAssignmentMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Posting...
                              </>
                            ) : (
                              "Create & Notify"
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              {/* Stats Cards Section */}
              {isClassroomSelected && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                    <CardContent className="pt-6 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground font-semibold">Students Enrolled</p>
                        {statsLoading ? (
                          <Skeleton className="h-8 w-16" />
                        ) : (
                          <h3 className="text-3xl font-bold">{stats?.totalStudents ?? 0}</h3>
                        )}
                        <p className="text-[10px] text-muted-foreground">Active in classroom</p>
                      </div>
                      <div className="p-3 bg-primary/10 rounded-full border border-primary/20 text-primary">
                        <Users className="w-6 h-6" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                    <CardContent className="pt-6 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground font-semibold">Submission Rate</p>
                        {statsLoading ? (
                          <Skeleton className="h-8 w-16" />
                        ) : (
                          <h3 className="text-3xl font-bold">
                            {stats?.totalStudents && stats.totalStudents > 0
                              ? `${Math.round((stats.totalSubmissions / stats.totalStudents) * 100)}%`
                              : "0%"}
                          </h3>
                        )}
                        <p className="text-[10px] text-muted-foreground">
                          {stats?.totalSubmissions ?? 0} / {stats?.totalStudents ?? 0} submissions
                        </p>
                      </div>
                      <div className="p-3 bg-secondary/10 rounded-full border border-secondary/20 text-secondary">
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                    <CardContent className="pt-6 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground font-semibold">Pending Review</p>
                        {statsLoading ? (
                          <Skeleton className="h-8 w-16" />
                        ) : (
                          <h3 className="text-3xl font-bold text-warning">{stats?.pendingReviews ?? 0}</h3>
                        )}
                        <p className="text-[10px] text-muted-foreground">
                          {stats?.lateSubmissions ?? 0} late submissions
                        </p>
                      </div>
                      <div className="p-3 bg-warning/10 rounded-full border border-warning/20 text-warning">
                        <Clock className="w-6 h-6" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                    <CardContent className="pt-6 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground font-semibold">Classroom Avg</p>
                        {statsLoading ? (
                          <Skeleton className="h-8 w-16" />
                        ) : (
                          <h3 className="text-3xl font-bold text-success">{stats?.avgScore ?? 0}%</h3>
                        )}
                        <p className="text-[10px] text-muted-foreground">
                          Highest: {stats?.highestScore ?? 0}% | Lowest: {stats?.lowestScore ?? 0}%
                        </p>
                      </div>
                      <div className="p-3 bg-success/10 rounded-full border border-success/20 text-success">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Charts & Leaderboard section */}
              {isClassroomSelected && !statsLoading && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Grade distribution */}
                  <Card className="border-border/50 bg-card/60 backdrop-blur-sm lg:col-span-1">
                    <CardHeader>
                      <CardTitle className="text-base font-bold flex items-center">
                        <Award className="w-5 h-5 text-secondary mr-2" />
                        Grade Distribution
                      </CardTitle>
                      <CardDescription>Overall student grades tally</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64">
                      {gradeDistributionData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={gradeDistributionData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                            <ChartTooltip
                              contentStyle={{
                                backgroundColor: "rgba(20, 20, 40, 0.95)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "8px",
                              }}
                            />
                            <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]}>
                              {gradeDistributionData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
                          <AlertTriangle className="w-8 h-8 opacity-40 mb-2" />
                          No graded submissions yet
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Submission status breakdown */}
                  <Card className="border-border/50 bg-card/60 backdrop-blur-sm lg:col-span-1">
                    <CardHeader>
                      <CardTitle className="text-base font-bold flex items-center">
                        <Activity className="w-5 h-5 text-primary mr-2" />
                        Submission Status
                      </CardTitle>
                      <CardDescription>Enrollment and submissions overview</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64 flex flex-col justify-center">
                      {stats && stats.totalStudents > 0 ? (
                        <div className="relative w-full h-full flex flex-col justify-center">
                          <ResponsiveContainer width="100%" height={170}>
                            <PieChart>
                              <Pie
                                data={submissionStatusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={60}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {submissionStatusData.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <ChartTooltip
                                contentStyle={{
                                  backgroundColor: "rgba(20, 20, 40, 0.95)",
                                  border: "1px solid rgba(255,255,255,0.1)",
                                  borderRadius: "8px",
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex justify-center flex-wrap gap-x-4 gap-y-1 text-xs mt-2">
                            {submissionStatusData.map((item, idx) => (
                              <div key={item.name} className="flex items-center space-x-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[idx] }} />
                                <span className="text-muted-foreground font-medium">
                                  {item.name}: <strong className="text-foreground">{item.value}</strong>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
                          <Users className="w-8 h-8 opacity-40 mb-2" />
                          No students in classroom
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Leaderboard */}
                  <Card className="border-border/50 bg-card/60 backdrop-blur-sm lg:col-span-1">
                    <CardHeader>
                      <CardTitle className="text-base font-bold flex items-center text-warning">
                        <Award className="w-5 h-5 mr-2" />
                        Student Leaderboard
                      </CardTitle>
                      <CardDescription>Top performing students by GPA</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {leaderboard.length > 0 ? (
                        <div className="space-y-4">
                          {leaderboard.map((student, index) => (
                            <div key={student.email} className="flex items-center justify-between border-b border-border/30 pb-2 last:border-0 last:pb-0">
                              <div className="flex items-center space-x-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  index === 0 ? "bg-amber-500/20 text-amber-500 border border-amber-500/30" :
                                  index === 1 ? "bg-slate-300/20 text-slate-300 border border-slate-300/30" :
                                  index === 2 ? "bg-amber-700/20 text-amber-700 border border-amber-700/30" :
                                  "bg-muted text-muted-foreground"
                                }`}>
                                  {index + 1}
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-sm font-semibold">{student.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{student.email}</p>
                                </div>
                              </div>
                              <span className="text-sm font-bold text-success bg-success/15 px-2 py-0.5 rounded-full border border-success/35">
                                {student.average}%
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-muted-foreground text-sm">
                          <Users className="w-8 h-8 opacity-40 mb-2" />
                          No graded rankings yet
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Classroom Assignments & Visibility Locker */}
              {isClassroomSelected && (
                <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center">
                      <CheckSquare className="w-5 h-5 text-primary mr-2" />
                      Classroom Assignments ({assignments?.length || 0})
                    </CardTitle>
                    <CardDescription>Open or close assignment submissions for grading deadlines</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {assignmentsLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : !assignments || assignments.length === 0 ? (
                      <div className="py-6 text-center text-muted-foreground text-sm">
                        No assignments posted in this classroom. Click "Post Classroom Assignment" above to create one.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border/40">
                            <TableHead>Title</TableHead>
                            <TableHead>Subject Code</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assignments.map((assignment: any) => (
                            <TableRow key={assignment._id} className="border-border/30">
                              <TableCell className="font-semibold">{assignment.title}</TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground">{assignment.subject}</TableCell>
                              <TableCell className="text-xs">{new Date(assignment.dueDate).toLocaleDateString()}</TableCell>
                              <TableCell className="capitalize text-xs font-medium">
                                <span className={
                                  assignment.priority === "high" ? "text-destructive" :
                                  assignment.priority === "medium" ? "text-warning" : "text-muted-foreground"
                                }>
                                  {assignment.priority}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                                  assignment.assignmentStatus === "closed"
                                    ? "bg-destructive/15 border-destructive/25 text-destructive"
                                    : "bg-success/15 border-success/25 text-success"
                                }`}>
                                  {assignment.assignmentStatus === "closed" ? "Closed 🔒" : "Active 🔓"}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleAssignmentStatus(assignment)}
                                  className="h-8 border-border/40 hover:bg-muted text-xs"
                                >
                                  {assignment.assignmentStatus === "closed" ? (
                                    <>
                                      <Unlock className="w-3.5 h-3.5 mr-1 text-success" />
                                      Open Submissions
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="w-3.5 h-3.5 mr-1 text-destructive" />
                                      Close Submissions
                                    </>
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Submissions Table & Grading Actions */}
              {isClassroomSelected && (
                <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center">
                      <FolderOpen className="w-5 h-5 text-secondary mr-2" />
                      Pending & Evaluated Submissions
                    </CardTitle>
                    <CardDescription>View attachments, check delays, and input marks and feedbacks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {submissionsLoading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ) : !submissions || submissions.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground text-sm">
                        No student submissions recorded for this classroom.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border/40">
                            <TableHead>Student</TableHead>
                            <TableHead>Assignment</TableHead>
                            <TableHead>Submitted Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {submissions.map((sub: any) => {
                            const isLate = sub.status === "late";
                            const isGraded = sub.status === "graded";
                            const isPending = sub.status === "pending";

                            return (
                              <TableRow key={sub._id} className="border-border/30">
                                <TableCell>
                                  <div className="space-y-0.5">
                                    <p className="font-semibold text-sm">{sub.studentId?.name || "Deleted Student"}</p>
                                    <p className="text-[10px] text-muted-foreground">{sub.studentId?.email}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <p className="font-medium text-sm">{sub.assignmentId?.title || "Deleted Assignment"}</p>
                                </TableCell>
                                <TableCell className="text-xs">
                                  {sub.submittedAt ? (
                                    <span className="flex items-center space-x-1">
                                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                      <span>{new Date(sub.submittedAt).toLocaleString()}</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 font-medium">Unsubmitted</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                                    isGraded ? "bg-success/15 border-success/25 text-success" :
                                    isLate ? "bg-destructive/15 border-destructive/25 text-destructive" :
                                    isPending ? "bg-slate-700/15 border-slate-700/25 text-slate-400" :
                                    "bg-secondary/15 border-secondary/25 text-secondary"
                                  }`}>
                                    {sub.status}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {isGraded ? (
                                    <span className="font-mono font-bold text-sm bg-primary/10 border border-primary/20 px-2 py-0.5 rounded text-primary">
                                      {sub.marks}/{sub.maxMarks} ({sub.gradeLetter})
                                    </span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">Unevaluated</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    disabled={isPending}
                                    onClick={() => handleOpenGrading(sub)}
                                    className={`h-8 text-xs ${isGraded ? "bg-card border border-border/40 text-foreground hover:bg-muted" : "bg-gradient-to-r from-primary to-secondary"}`}
                                  >
                                    {isGraded ? "Review Grade" : "Evaluate"}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Grading slide-out drawer or dialog */}
      <Dialog open={isGradingOpen} onOpenChange={setIsGradingOpen}>
        <DialogContent className="border-border/50 bg-card/90 backdrop-blur-md max-w-lg w-full max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center">
              <Award className="w-5 h-5 text-primary mr-2" />
              Evaluate Student Work
            </DialogTitle>
          </DialogHeader>

          {activeSubmission && (
            <div className="space-y-5 mt-2">
              {/* Submission details block */}
              <div className="p-4 rounded-lg bg-background/50 border border-border/50 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground font-semibold uppercase tracking-wider block">Student</span>
                    <strong className="text-sm font-semibold">{activeSubmission.studentId?.name}</strong>
                    <span className="text-[10px] text-muted-foreground block">{activeSubmission.studentId?.email}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-semibold uppercase tracking-wider block">Assignment</span>
                    <strong className="text-sm font-semibold">{activeSubmission.assignmentId?.title}</strong>
                    <span className="text-[10px] text-muted-foreground block">Subject: {activeSubmission.assignmentId?.subject}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40 text-xs flex justify-between">
                  <span>
                    Status: <strong className="capitalize">{activeSubmission.status}</strong>
                  </span>
                  {activeSubmission.submittedAt && (
                    <span>
                      Submitted: {new Date(activeSubmission.submittedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground block">Submitted Files & Attachments</label>
                {activeSubmission.submittedAttachments && activeSubmission.submittedAttachments.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {activeSubmission.submittedAttachments.map((file: any, index: number) => (
                      <a
                        key={index}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2.5 rounded border border-border bg-card hover:bg-muted/50 hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center space-x-2.5 overflow-hidden">
                          <FileIcon className="w-5 h-5 text-primary flex-shrink-0" />
                          <div className="overflow-hidden">
                            <p className="text-xs font-semibold truncate text-foreground">{file.fileName}</p>
                            <p className="text-[9px] text-slate-500 uppercase tracking-wide">
                              {file.fileType} {file.fileSize ? `| ${(file.fileSize / 1024).toFixed(1)} KB` : ""}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 px-2 font-semibold text-[10px] hover:text-primary">
                          Open File
                        </Button>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-warning flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1.5" />
                    No file attachments uploaded
                  </p>
                )}
              </div>

              {/* Feedback History Log */}
              {activeSubmission.feedbackHistory && activeSubmission.feedbackHistory.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground block">Grading & Comments History</label>
                  <div className="max-h-28 overflow-y-auto space-y-2 p-2.5 rounded border border-border/50 bg-background/30">
                    {activeSubmission.feedbackHistory.map((item: any, idx: number) => (
                      <div key={idx} className="text-xs p-2 rounded bg-card/60 border border-border/30">
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                          <span>Review #{idx + 1}</span>
                          <span>{new Date(item.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-foreground whitespace-pre-wrap">{item.feedback}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grading Form */}
              <form onSubmit={handleGradeSubmit} className="space-y-4 pt-3 border-t border-border/40">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Marks Obtained *</label>
                    <Input
                      type="number"
                      placeholder="e.g. 85"
                      min={0}
                      value={marks}
                      onChange={(e) => setMarks(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Maximum Marks *</label>
                    <Input
                      type="number"
                      placeholder="e.g. 100"
                      min={1}
                      value={maxMarks}
                      onChange={(e) => setMaxMarks(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Instructor Feedback</label>
                  <textarea
                    placeholder="Enter grading notes, points of improvement, or corrections..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary h-20 resize-none"
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsGradingOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={gradeMutation.isPending}
                    className="bg-gradient-to-r from-primary to-secondary"
                  >
                    {gradeMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Grade & Notify"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}
