"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  CheckSquare,
  Clock,
  FileText,
  Presentation,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useToastStore } from "@/store/toast-store";
import { useEffect } from "react";
import { sendNotification } from "@/lib/notifications";

// Fallback chart data if live database doesn't have weekly tracking yet
const getChartData = (completed: number, upcoming: number) => {
  const total = completed + upcoming;
  return [
    { day: "Mon", completed: Math.round(completed * 0.1), total: Math.round(total * 0.15) },
    { day: "Tue", completed: Math.round(completed * 0.2), total: Math.round(total * 0.2) },
    { day: "Wed", completed: Math.round(completed * 0.15), total: Math.round(total * 0.15) },
    { day: "Thu", completed: Math.round(completed * 0.3), total: Math.round(total * 0.2) },
    { day: "Fri", completed: Math.round(completed * 0.25), total: Math.round(total * 0.3) },
    { day: "Sat", completed: Math.round(completed * 0.0), total: Math.round(total * 0.0) },
    { day: "Sun", completed: completed - Math.round(completed * 0.1 + completed * 0.2 + completed * 0.15 + completed * 0.3 + completed * 0.25), total: upcoming },
  ];
};

export default function Dashboard() {
  const addToast = useToastStore((state) => state.addToast);

  // Fetch live stats from backend
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const response = await api.get("/dashboard/stats");
      return response.data;
    },
  });

  // Display due date warnings on load
  useEffect(() => {
    if (stats?.dueCategories) {
      const { overdue, today, tomorrow } = stats.dueCategories;
      if (overdue > 0) {
        addToast({
          id: "overdue-warning",
          title: "Overdue Tasks!",
          description: `You have ${overdue} assignment${overdue > 1 ? "s" : ""} past the deadline. Please review them!`,
          variant: "destructive",
          open: true,
        });
        sendNotification(
          "Overdue Tasks Warning! ⏰",
          `You have ${overdue} assignment${overdue > 1 ? "s" : ""} past the deadline. Please review them!`
        );
      } else if (today > 0) {
        addToast({
          id: "today-warning",
          title: "Due Today",
          description: `You have ${today} assignment${today > 1 ? "s" : ""} due today. Finish strong!`,
          variant: "default",
          open: true,
        });
        sendNotification(
          "Tasks Due Today! ⏰",
          `You have ${today} assignment${today > 1 ? "s" : ""} due today. Finish strong!`
        );
      } else if (tomorrow > 0) {
        addToast({
          id: "tomorrow-warning",
          title: "Due Tomorrow",
          description: `You have ${tomorrow} assignment${tomorrow > 1 ? "s" : ""} due tomorrow. Keep going!`,
          variant: "default",
          open: true,
        });
        sendNotification(
          "Tasks Due Tomorrow 📅",
          `You have ${tomorrow} assignment${tomorrow > 1 ? "s" : ""} due tomorrow. Keep going!`
        );
      }
    }
  }, [stats, addToast]);

  const statsData = [
    {
      icon: CheckSquare,
      label: "Total Assignments",
      value: isLoading ? null : `${stats?.assignments ?? 0}`,
      change: "All uploaded tasks",
    },
    {
      icon: Clock,
      label: "Upcoming Tasks",
      value: isLoading ? null : `${stats?.upcoming ?? 0}`,
      change: stats?.dueCategories?.today ? `${stats.dueCategories.today} due today` : "Active tasks",
    },
    {
      icon: Presentation,
      label: "Presentations",
      value: isLoading ? null : `${stats?.presentations ?? 0}`,
      change: "Presentations made",
    },
    {
      icon: FileText,
      label: "Resumes Built",
      value: isLoading ? null : `${stats?.resumes ?? 0}`,
      change: "Active resumes",
    },
  ];

  const chartData = stats
    ? getChartData(stats.completed, stats.upcoming)
    : [];

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 overflow-auto">
            <div className="p-8 space-y-8">
              {/* Welcome Header */}
              <div>
                <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
                <p className="text-muted-foreground">
                  Welcome back! Here's your academic overview.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsData.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <Icon className="w-8 h-8 text-primary" />
                            {!isLoading && (
                              <span className="text-xs text-muted-foreground">
                                {stat.change}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">
                              {stat.label}
                            </p>
                            {isLoading ? (
                              <Skeleton className="h-9 w-16" />
                            ) : (
                              <p className="text-3xl font-bold">{stat.value}</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Weekly Progress */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="lg:col-span-2"
                >
                  <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Weekly Progress</CardTitle>
                      <CardDescription>
                        Assignments completed this week
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <Skeleton className="h-[300px] w-full" />
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" />
                            <YAxis stroke="rgba(255,255,255,0.4)" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "rgba(20, 20, 40, 0.95)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "8px",
                              }}
                            />
                            <Bar dataKey="completed" fill="#5865F2" name="Completed" radius={[6, 6, 0, 0]} />
                            <Bar
                              dataKey="total"
                              fill="rgba(88, 101, 242, 0.15)"
                              name="Total Target"
                              radius={[6, 6, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Productivity Score */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card className="border-border/50 bg-card/60 backdrop-blur-sm h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-success" />
                        <span>Productivity Score</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="space-y-6 flex flex-col items-center py-6">
                          <Skeleton className="w-24 h-24 rounded-full" />
                          <Skeleton className="h-6 w-32" />
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="flex items-center justify-center">
                            <div className="relative w-24 h-24">
                              <svg className="w-full h-full transform -rotate-90">
                                <circle
                                  cx="48"
                                  cy="48"
                                  r="40"
                                  fill="none"
                                  stroke="rgba(255,255,255,0.05)"
                                  strokeWidth="4"
                                />
                                <circle
                                  cx="48"
                                  cy="48"
                                  r="40"
                                  fill="none"
                                  stroke="#5865F2"
                                  strokeWidth="4"
                                  strokeDasharray={`${(stats?.productivity ?? 0) * 2.512} 251.2`}
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl font-bold">{stats?.productivity ?? 0}%</span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between border-b border-border/40 pb-2">
                              <span className="text-muted-foreground">Tasks Completed</span>
                              <span className="font-semibold">{stats?.completed ?? 0} / {stats?.assignments ?? 0}</span>
                            </div>
                            <div className="flex justify-between border-b border-border/40 pb-2">
                              <span className="text-muted-foreground">Completion Rate</span>
                              <span className="font-semibold">{stats?.productivity ?? 0}%</span>
                            </div>
                            {stats?.dueCategories?.overdue > 0 && (
                              <div className="flex justify-between text-destructive">
                                <span>Overdue Tasks</span>
                                <span className="font-semibold flex items-center">
                                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                                  {stats.dueCategories.overdue}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upcoming Deadlines */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="lg:col-span-2"
                >
                  <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Upcoming Deadlines</CardTitle>
                      <CardDescription>
                        Your next assignments due
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {isLoading ? (
                        <>
                          <Skeleton className="h-16 w-full" />
                          <Skeleton className="h-16 w-full" />
                          <Skeleton className="h-16 w-full" />
                        </>
                      ) : !stats?.upcomingDeadlines || stats.upcomingDeadlines.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground text-sm">
                          🎉 No upcoming deadlines! You are all caught up.
                        </div>
                      ) : (
                        stats.upcomingDeadlines.map((deadline: any) => (
                          <div
                            key={deadline._id || deadline.id}
                            className="flex items-start justify-between p-4 rounded-lg bg-card/50 border border-border/50 hover:border-primary/50 transition-colors"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{deadline.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {deadline.subject}
                              </p>
                            </div>
                            <div className="text-right">
                              <p
                                className={`text-sm font-semibold capitalize ${
                                  deadline.priority === "high"
                                    ? "text-destructive"
                                    : deadline.priority === "medium"
                                    ? "text-warning"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {deadline.priority} Priority
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Due: {new Date(deadline.dueDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Link href="/resume" className="block w-full">
                        <Button className="w-full justify-start border border-border/40" variant="outline">
                          <FileText className="w-4 h-4 mr-2 text-primary" />
                          Create Resume
                        </Button>
                      </Link>
                      <Link href="/presentations" className="block w-full">
                        <Button className="w-full justify-start border border-border/40" variant="outline">
                          <Presentation className="w-4 h-4 mr-2 text-secondary" />
                          New Presentation
                        </Button>
                      </Link>
                      <Link href="/assignments" className="block w-full">
                        <Button className="w-full justify-start border border-border/40" variant="outline">
                          <CheckSquare className="w-4 h-4 mr-2 text-success" />
                          Add Assignment
                        </Button>
                      </Link>
                      <Link href="/timetable" className="block w-full">
                        <Button className="w-full justify-start border border-border/40" variant="outline">
                          <Clock className="w-4 h-4 mr-2 text-warning" />
                          Plan Schedule
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
