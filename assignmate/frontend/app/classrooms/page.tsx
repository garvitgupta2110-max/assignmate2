"use client";

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
import { Plus, BookOpen, Users, Copy, Check, Loader2 } from "lucide-react";
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
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
