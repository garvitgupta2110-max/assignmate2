"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FileText, Download, Trash2, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { exportResume } from "@/lib/print-export";

const templates = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean and contemporary design",
    category: "Modern",
  },
  {
    id: "ats-friendly",
    name: "ATS Friendly",
    description: "Optimized for Applicant Tracking Systems",
    category: "Professional",
  },
  {
    id: "professional",
    name: "Professional",
    description: "Classic corporate style",
    category: "Professional",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Simple and elegant layout",
    category: "Modern",
  },
];

export default function ResumeBuilder() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const { user } = useAuthStore();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("modern");

  // AI state variables
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiTitle, setAiTitle] = useState("");
  const [aiTemplate, setAiTemplate] = useState("modern");
  const [aiDesc, setAiDesc] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const triggerToast = (title: string, description: string, variant: "default" | "destructive" | "success") => {
    addToast({
      id: Math.random().toString(36).substring(2, 9),
      title,
      description,
      variant,
      open: true,
    });
  };

  // 1. Fetch Resumes Query
  const { data: resumes, isLoading } = useQuery({
    queryKey: ["resumes"],
    queryFn: async () => {
      const response = await api.get("/resumes");
      return response.data;
    },
  });

  // 2. Create Resume Mutation
  const createMutation = useMutation({
    mutationFn: async (newResume: any) => {
      const response = await api.post("/resumes", newResume);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      triggerToast("Resume Created", `Successfully initialized "${data.title}"`, "success");
      setIsAddOpen(false);
      setTitle("");
    },
  });

  // 3. Delete Resume Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/resumes/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      triggerToast("Resume Deleted", "The resume has been deleted.", "success");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      triggerToast("Missing Title", "Please enter a resume title.", "destructive");
      return;
    }
    createMutation.mutate({
      title,
      template: selectedTemplate,
      content: {},
    });
  };

  const handleDownload = (resume: any) => {
    triggerToast("Generating PDF", `Your PDF download for "${resume.title}" will start shortly...`, "success");
    exportResume(resume, user);
  };

  const handleAiCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTitle || !aiDesc) {
      triggerToast("Missing Fields", "Please enter a title and description.", "destructive");
      return;
    }

    setIsGenerating(true);
    try {
      const aiResponse = await api.post("/ai/resume/generate", { description: aiDesc }, { timeout: 120000 });
      const generatedContent = aiResponse.data;

      await createMutation.mutateAsync({
        title: aiTitle,
        template: aiTemplate,
        content: generatedContent,
      });

      setAiTitle("");
      setAiDesc("");
      setIsAiOpen(false);
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

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 overflow-auto">
            <div className="p-8 space-y-8">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2">Resume Builder</h1>
                  <p className="text-muted-foreground">
                    Create professional resumes with AI assistance
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {/* AI Dialog */}
                  <Dialog open={isAiOpen} onOpenChange={setIsAiOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-secondary to-purple-600 border border-secondary/35 text-white" size="lg">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Build with AI
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="border-border/50 bg-card/90 backdrop-blur-md max-w-md w-full">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center">
                          <Sparkles className="w-5 h-5 text-secondary mr-2" />
                          AI Resume Builder (Ollama)
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAiCreateSubmit} className="space-y-4 mt-2">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">Resume Title *</label>
                          <Input
                            placeholder="e.g., Software Engineering Resume 2026"
                            value={aiTitle}
                            onChange={(e) => setAiTitle(e.target.value)}
                            disabled={isGenerating}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">Choose Template</label>
                          <select
                            value={aiTemplate}
                            onChange={(e) => setAiTemplate(e.target.value)}
                            disabled={isGenerating}
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            {templates.map((template) => (
                              <option key={template.id} value={template.id}>
                                {template.name} ({template.category})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">Describe your background & experience *</label>
                          <textarea
                            placeholder="e.g., I am a CS major. I build web apps in React. I worked at TechCorp for 3 months writing Python."
                            value={aiDesc}
                            onChange={(e) => setAiDesc(e.target.value)}
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
                                Generating...
                              </>
                            ) : (
                              "Generate Resume"
                            )}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>

                  {/* Manual Dialog */}
                  <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-primary to-secondary" size="lg">
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Resume
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="border-border/50 bg-card/90 backdrop-blur-md max-w-md w-full">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold">New Resume Details</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateSubmit} className="space-y-4 mt-2">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">Resume Title *</label>
                          <Input
                            placeholder="e.g., Software Engineering Resume 2026"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={createMutation.isPending}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">Choose Template</label>
                          <select
                            value={selectedTemplate}
                            onChange={(e) => setSelectedTemplate(e.target.value)}
                            disabled={createMutation.isPending}
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            {templates.map((template) => (
                              <option key={template.id} value={template.id}>
                                {template.name} ({template.category})
                              </option>
                            ))}
                          </select>
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
                            {createMutation.isPending ? "Creating..." : "Create Resume"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Templates Selection */}
              <div>
                <h2 className="text-2xl font-bold mb-4 font-semibold tracking-tight">Available Templates</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {templates.map((template, index) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card
                        onClick={() => {
                          setSelectedTemplate(template.id);
                          setIsAddOpen(true);
                        }}
                        className="border-border/50 bg-card/50 hover:border-primary/50 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg"
                      >
                        <CardContent className="p-6">
                          <div className="bg-gradient-to-br from-primary/10 to-secondary/15 rounded-lg h-40 mb-4 flex items-center justify-center border border-white/5">
                            <FileText className="w-12 h-12 text-primary opacity-60" />
                          </div>
                          <h3 className="font-semibold text-lg">{template.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Recent Resumes */}
              <div>
                <h2 className="text-2xl font-bold mb-4 font-semibold tracking-tight">My Resumes</h2>
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                  </div>
                ) : !resumes || resumes.length === 0 ? (
                  <Card className="border-border/40 bg-card/40 backdrop-blur-sm p-12 text-center">
                    <FileText className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No resumes built yet</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                      Get started by selecting one of our templates above or creating a blank resume template.
                    </p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                      {resumes.map((resume: any, index: number) => (
                        <motion.div
                          key={resume._id || resume.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.15, delay: index * 0.05 }}
                        >
                          <Card className="border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-colors">
                            <CardContent className="p-6 space-y-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-semibold text-lg">{resume.title}</h3>
                                  <p className="text-xs text-muted-foreground capitalize mt-1">
                                    Template: {resume.template}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground mt-1">
                                    Created: {new Date(resume.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDownload(resume)}
                                    className="text-muted-foreground hover:text-foreground"
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={deleteMutation.isPending}
                                    onClick={() => {
                                      if (confirm(`Delete resume "${resume.title}"?`)) {
                                        deleteMutation.mutate(resume._id || resume.id);
                                      }
                                    }}
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
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
