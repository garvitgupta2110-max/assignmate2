"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  Award,
  TrendingUp,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  BookOpen,
  MessageSquare,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BAR_COLORS = ["#5865F2", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function StudentGradesPage() {
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);

  // 1. Fetch Student's Submissions History (includes assignment details populated)
  const { data: submissions, isLoading } = useQuery({
    queryKey: ["studentSubmissions"],
    queryFn: async () => {
      const response = await api.get("/assignments/my-submissions");
      return response.data;
    },
  });

  const toggleExpandFeedback = (id: string) => {
    setExpandedSubId(expandedSubId === id ? null : id);
  };

  // Calculations on load
  const getStats = () => {
    if (!submissions || submissions.length === 0) {
      return { avgPct: 0, totalGraded: 0, perfectScores: 0, pendingGrading: 0 };
    }
    const gradedList = submissions.filter((s: any) => s.status === "graded" && s.percentage !== undefined);
    const totalGraded = gradedList.length;

    let totalPct = 0;
    let perfectScores = 0;
    gradedList.forEach((s: any) => {
      totalPct += s.percentage || 0;
      if (s.percentage === 100) perfectScores++;
    });

    const avgPct = totalGraded > 0 ? Math.round(totalPct / totalGraded) : 0;
    const pendingGrading = submissions.filter((s: any) => s.status === "submitted" || s.status === "late").length;

    return { avgPct, totalGraded, perfectScores, pendingGrading };
  };

  const stats = getStats();

  // Recharts Line Chart Grade Progress over Time
  const getProgressData = () => {
    if (!submissions || submissions.length === 0) return [];
    return submissions
      .filter((s: any) => s.status === "graded" && s.percentage !== undefined && s.submittedAt)
      .map((s: any) => ({
        date: new Date(s.submittedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        percentage: s.percentage,
        title: s.assignmentId?.title || "Assignment",
      }))
      .reverse(); // Chronological order
  };

  const progressData = getProgressData();

  // Recharts Bar Chart Grades by Subject
  const getSubjectData = () => {
    if (!submissions || submissions.length === 0) return [];
    const subjectScores: Record<string, { total: number; count: number }> = {};

    submissions.forEach((s: any) => {
      if (s.status === "graded" && s.percentage !== undefined && s.assignmentId?.subject) {
        const sub = s.assignmentId.subject;
        if (!subjectScores[sub]) {
          subjectScores[sub] = { total: 0, count: 0 };
        }
        subjectScores[sub].total += s.percentage;
        subjectScores[sub].count += 1;
      }
    });

    return Object.keys(subjectScores).map((subject) => ({
      subject,
      average: Math.round(subjectScores[subject].total / subjectScores[subject].count),
    }));
  };

  const subjectData = getSubjectData();

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 overflow-auto">
            <div className="p-8 space-y-8">
              {/* Header */}
              <div>
                <h1 className="text-4xl font-bold mb-2">My Grades & Performance</h1>
                <p className="text-muted-foreground">
                  Track your evaluation history, grade averages, and view teachers feedback notes.
                </p>
              </div>

              {/* Stats overview cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* GPA / Average Card */}
                <Card className="border-border/50 bg-card/60 backdrop-blur-sm relative overflow-hidden">
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground font-semibold">Cumulative Grade</p>
                      {isLoading ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        <h3 className="text-3xl font-bold text-primary">{stats.avgPct}%</h3>
                      )}
                      <p className="text-[10px] text-muted-foreground">Classroom assignments average</p>
                    </div>
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          fill="none"
                          stroke="rgba(255,255,255,0.05)"
                          strokeWidth="3.5"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          fill="none"
                          stroke="#5865F2"
                          strokeWidth="3.5"
                          strokeDasharray={`${stats.avgPct * 1.63} 163`}
                        />
                      </svg>
                      <span className="absolute text-[10px] font-bold">GPA</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Total Graded */}
                <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground font-semibold">Graded Items</p>
                      {isLoading ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        <h3 className="text-3xl font-bold text-success">{stats.totalGraded}</h3>
                      )}
                      <p className="text-[10px] text-muted-foreground">Evaluations completed</p>
                    </div>
                    <div className="p-3 bg-success/15 rounded-full border border-success/25 text-success">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                  </CardContent>
                </Card>

                {/* Perfect Scores */}
                <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground font-semibold">Perfect Scores</p>
                      {isLoading ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        <h3 className="text-3xl font-bold text-warning">{stats.perfectScores}</h3>
                      )}
                      <p className="text-[10px] text-muted-foreground">100% score records</p>
                    </div>
                    <div className="p-3 bg-warning/15 rounded-full border border-warning/25 text-warning">
                      <Award className="w-6 h-6" />
                    </div>
                  </CardContent>
                </Card>

                {/* Pending Grades */}
                <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground font-semibold">Pending Evaluation</p>
                      {isLoading ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        <h3 className="text-3xl font-bold text-slate-400">{stats.pendingGrading}</h3>
                      )}
                      <p className="text-[10px] text-muted-foreground">Awaiting grading reviews</p>
                    </div>
                    <div className="p-3 bg-slate-700/15 rounded-full border border-slate-700/25 text-slate-400">
                      <Clock className="w-6 h-6" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Charts */}
              {submissions && submissions.length > 0 && !isLoading && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Grade Progression Line Chart */}
                  <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-base font-bold flex items-center">
                        <TrendingUp className="w-5 h-5 text-primary mr-2" />
                        Grade Progression
                      </CardTitle>
                      <CardDescription>Visual timeline of your score percentages</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64">
                      {progressData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={progressData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                            <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.4)" fontSize={11} />
                            <ChartTooltip
                              content={({ active, payload }: any) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-slate-900 border border-border p-3 rounded-md shadow-lg text-xs space-y-1">
                                      <p className="font-bold text-foreground">{data.title}</p>
                                      <p className="text-muted-foreground font-medium">Date: {data.date}</p>
                                      <p className="text-primary font-bold">Score: {payload[0].value}%</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="percentage"
                              stroke="#5865F2"
                              strokeWidth={3}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
                          <AlertCircle className="w-8 h-8 opacity-45 mb-2" />
                          No graded progress records available
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Subject Comparison Bar Chart */}
                  <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-base font-bold flex items-center">
                        <BookOpen className="w-5 h-5 text-secondary mr-2" />
                        Averages by Subject
                      </CardTitle>
                      <CardDescription>Academic strength across different courses</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64">
                      {subjectData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={subjectData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="subject" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                            <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.4)" fontSize={11} />
                            <ChartTooltip
                              contentStyle={{
                                backgroundColor: "rgba(20, 20, 40, 0.95)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "8px",
                              }}
                            />
                            <Bar dataKey="average" fill="#8B5CF6" radius={[4, 4, 0, 0]}>
                              {subjectData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
                          <AlertCircle className="w-8 h-8 opacity-45 mb-2" />
                          No graded subject statistics
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Detailed Grades Log */}
              <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center">
                    <FileText className="w-5 h-5 text-primary mr-2" />
                    Academic Evaluation History
                  </CardTitle>
                  <CardDescription>Comprehensive details of all submitted and graded assignments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : !submissions || submissions.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <BookOpen className="w-12 h-12 opacity-30 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-1">No evaluations found</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        You have not enrolled in classrooms or submitted assignments yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {submissions.map((sub: any) => {
                        const isGraded = sub.status === "graded";
                        const isExpanded = expandedSubId === sub._id;
                        const assignment = sub.assignmentId || {};

                        return (
                          <div
                            key={sub._id}
                            className={`rounded-lg border transition-all duration-200 overflow-hidden ${
                              isGraded
                                ? "bg-card/50 border-border hover:border-primary/40"
                                : "bg-card/30 border-dashed border-border"
                            }`}
                          >
                            {/* Card summary row */}
                            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="space-y-1.5 flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs uppercase font-bold text-slate-500 font-mono tracking-wider">
                                    {assignment.subject || "General"}
                                  </span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border capitalize ${
                                    isGraded ? "bg-success/15 border-success/25 text-success" :
                                    sub.status === "late" ? "bg-destructive/15 border-destructive/25 text-destructive" :
                                    "bg-secondary/15 border-secondary/25 text-secondary"
                                  }`}>
                                    {sub.status}
                                  </span>
                                </div>
                                <h3 className="text-lg font-bold text-foreground leading-tight">
                                  {assignment.title || "Deleted Assignment"}
                                </h3>
                                <div className="flex items-center text-xs text-muted-foreground space-x-4">
                                  {sub.submittedAt && (
                                    <span className="flex items-center">
                                      <Calendar className="w-3.5 h-3.5 mr-1" />
                                      Submitted: {new Date(sub.submittedAt).toLocaleDateString()}
                                    </span>
                                  )}
                                  {isGraded && sub.gradedAt && (
                                    <span className="flex items-center">
                                      <CheckCircle className="w-3.5 h-3.5 mr-1 text-success" />
                                      Graded: {new Date(sub.gradedAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Grading indicator */}
                              <div className="flex items-center space-x-4 justify-between sm:justify-end">
                                <div className="text-left sm:text-right">
                                  {isGraded ? (
                                    <div className="flex items-center space-x-2.5">
                                      <div className="w-10 h-10 rounded bg-primary/10 border border-primary/20 flex items-center justify-center font-mono font-bold text-primary text-lg">
                                        {sub.gradeLetter}
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold text-foreground">
                                          {sub.marks} / {sub.maxMarks}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground font-bold font-mono">
                                          {sub.percentage}% Score
                                        </p>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-2 text-muted-foreground">
                                      <Clock className="w-4 h-4 text-warning" />
                                      <span className="text-xs font-semibold">Awaiting Grade</span>
                                    </div>
                                  )}
                                </div>

                                {isGraded && sub.feedbackHistory && sub.feedbackHistory.length > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 border border-border/30 hover:bg-muted"
                                    onClick={() => toggleExpandFeedback(sub._id)}
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Collapsible Feedback logs */}
                            <AnimatePresence initial={false}>
                              {isExpanded && isGraded && sub.feedbackHistory && sub.feedbackHistory.length > 0 && (
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: "auto" }}
                                  exit={{ height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="border-t border-border/40 bg-background/25"
                                >
                                  <div className="p-5 space-y-3.5">
                                    <div className="flex items-center text-xs font-bold text-muted-foreground space-x-1.5">
                                      <MessageSquare className="w-4 h-4 text-primary" />
                                      <span>Instructor Comments & Revision History</span>
                                    </div>
                                    <div className="space-y-2.5">
                                      {sub.feedbackHistory.map((item: any, idx: number) => (
                                        <div
                                          key={idx}
                                          className="p-3.5 rounded bg-card/85 border border-border/40 text-sm space-y-1 relative"
                                        >
                                          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-bold tracking-wider font-mono">
                                            <span>Feedback Version #{idx + 1}</span>
                                            <span>
                                              {new Date(item.createdAt).toLocaleString(undefined, {
                                                dateStyle: "medium",
                                                timeStyle: "short",
                                              })}
                                            </span>
                                          </div>
                                          <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                                            {item.feedback}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
