"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore } from "@/store/toast-store";
import api from "@/lib/api";
import {
  Bell,
  Check,
  CheckCheck,
  BookOpen,
  Award,
  FileText,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);

  const triggerToast = (title: string, description: string, variant: "default" | "destructive" | "success") => {
    addToast({
      id: Math.random().toString(36).substring(2, 9),
      title,
      description,
      variant,
      open: true,
    });
  };

  // 1. Fetch Notifications Query
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await api.get("/notifications");
      return response.data;
    },
  });

  // 2. Mark Notification as Read Mutation
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.put(`/notifications/${id}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // 3. Mark All as Read Mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const response = await api.put("/notifications/read/all");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      triggerToast("All Read", "Marked all notifications as read.", "success");
    },
  });

  // Icon selector based on title keywords
  const getNotificationIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("grade") || t.includes("mark")) {
      return <Award className="w-5 h-5 text-success" />;
    }
    if (t.includes("submit") || t.includes("upload")) {
      return <FileText className="w-5 h-5 text-primary" />;
    }
    if (t.includes("classroom") || t.includes("join") || t.includes("post")) {
      return <BookOpen className="w-5 h-5 text-secondary" />;
    }
    return <Bell className="w-5 h-5 text-muted-foreground" />;
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 overflow-auto">
            <div className="p-8 space-y-8 max-w-4xl mx-auto w-full">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-bold mb-2 flex items-center">
                    <Bell className="w-8 h-8 mr-3 text-primary" />
                    Notifications
                  </h1>
                  <p className="text-muted-foreground">
                    Stay up-to-date with your submissions, classroom joins, and grading feedback.
                  </p>
                </div>

                {notifications && notifications.filter((n: any) => !n.read).length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAllReadMutation.mutate()}
                    disabled={markAllReadMutation.isPending}
                    className="border-border/40 hover:bg-muted font-semibold"
                  >
                    <CheckCheck className="w-4 h-4 mr-2" />
                    Mark all as read
                  </Button>
                )}
              </div>

              {/* Notifications container */}
              <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                <CardHeader className="pb-3 border-b border-border/45 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold">Inbox</CardTitle>
                    <CardDescription>
                      {notifications?.filter((n: any) => !n.read).length || 0} unread notifications
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="p-6 space-y-3">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : !notifications || notifications.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                      <Bell className="w-12 h-12 opacity-25 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-1">Clean inbox!</h3>
                      <p className="text-sm text-muted-foreground">
                        You have no notifications yet. We will alert you here as actions happen.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/40">
                      <AnimatePresence initial={false}>
                        {notifications.map((notif: any) => (
                          <motion.div
                            key={notif._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={`p-5 flex items-start justify-between gap-4 transition-colors ${
                              notif.read ? "bg-card/25" : "bg-primary/5 hover:bg-primary/10"
                            }`}
                          >
                            <div className="flex items-start space-x-4">
                              <div className={`p-2.5 rounded-lg border ${
                                notif.read
                                  ? "bg-muted/50 border-border/40 text-muted-foreground"
                                  : "bg-primary/10 border-primary/20 text-primary"
                              }`}>
                                {getNotificationIcon(notif.title)}
                              </div>
                              <div className="space-y-1">
                                <p className={`text-sm ${notif.read ? "text-foreground/85" : "font-bold text-foreground"}`}>
                                  {notif.title}
                                </p>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {notif.message}
                                </p>
                                <p className="text-[10px] text-slate-500 flex items-center font-mono">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {new Date(notif.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>

                            {!notif.read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/30"
                                onClick={() => markReadMutation.mutate(notif._id)}
                                disabled={markReadMutation.isPending}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
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
