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
import { Plus, Presentation, Download, Trash2, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { exportPresentation } from "@/lib/print-export";

const templates = [
  { value: "academic", label: "Academic" },
  { value: "business", label: "Business" },
  { value: "minimal", label: "Minimalist" },
  { value: "modern", label: "Modern Dark" },
];

export default function Presentations() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("academic");

  // AI State Variables
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiTitle, setAiTitle] = useState("");
  const [aiSubject, setAiSubject] = useState("");
  const [aiTemplate, setAiTemplate] = useState("academic");
  const [aiTopic, setAiTopic] = useState("");
  const [aiSlideCount, setAiSlideCount] = useState("5");
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

  // 1. Fetch Presentations Query
  const { data: presentations, isLoading } = useQuery({
    queryKey: ["presentations"],
    queryFn: async () => {
      const response = await api.get("/presentations");
      return response.data;
    },
  });

  // 2. Create Presentation Mutation
  const createMutation = useMutation({
    mutationFn: async (newPres: any) => {
      const response = await api.post("/presentations", newPres);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["presentations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      triggerToast("Presentation Created", `Successfully created "${data.title}"`, "success");
      setIsAddOpen(false);
      setTitle("");
      setSubject("");
    },
  });

  // 3. Delete Presentation Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/presentations/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presentations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      triggerToast("Presentation Deleted", "The presentation has been deleted.", "success");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subject) {
      triggerToast("Missing Fields", "Please enter a title and subject.", "destructive");
      return;
    }
    createMutation.mutate({
      title,
      subject,
      template: selectedTemplate,
    });
  };

  const handleDownload = (presentation: any) => {
    triggerToast("Generating PDF", `Your PDF download for "${presentation.title}" will start shortly...`, "success");
    exportPresentation(presentation);
  };

  const handleAiCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTitle || !aiSubject || !aiTopic) {
      triggerToast("Missing Fields", "Please enter a title, subject, and topic.", "destructive");
      return;
    }

    setIsGenerating(true);
    try {
      const aiResponse = await api.post("/ai/presentation/generate", {
        topic: aiTopic,
        slideCount: Number(aiSlideCount),
      }, { timeout: 120000 });
      const generatedData = aiResponse.data;

      await createMutation.mutateAsync({
        title: aiTitle,
        subject: aiSubject,
        template: aiTemplate,
        slides: generatedData.slides || [],
      });

      setAiTitle("");
      setAiSubject("");
      setAiTopic("");
      setAiSlideCount("5");
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
                  <h1 className="text-4xl font-bold mb-2">Presentation Maker</h1>
                  <p className="text-muted-foreground">
                    Create stunning presentations with AI assistance
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
                          AI Slide Generator (Ollama)
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAiCreateSubmit} className="space-y-4 mt-2">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">Presentation Title *</label>
                          <Input
                            placeholder="e.g., Quantum Computing Fundamentals"
                            value={aiTitle}
                            onChange={(e) => setAiTitle(e.target.value)}
                            disabled={isGenerating}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">Subject Code / Name *</label>
                          <Input
                            placeholder="e.g., PHY-402"
                            value={aiSubject}
                            onChange={(e) => setAiSubject(e.target.value)}
                            disabled={isGenerating}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">Slide Template</label>
                            <select
                              value={aiTemplate}
                              onChange={(e) => setAiTemplate(e.target.value)}
                              disabled={isGenerating}
                              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              {templates.map((tpl) => (
                                <option key={tpl.value} value={tpl.value}>
                                  {tpl.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">Slide Count</label>
                            <Input
                              type="number"
                              min="3"
                              max="15"
                              value={aiSlideCount}
                              onChange={(e) => setAiSlideCount(e.target.value)}
                              disabled={isGenerating}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">Describe Presentation Topic *</label>
                          <textarea
                            placeholder="e.g., Introduce what quantum bits are, superposition, and quantum computing applications."
                            value={aiTopic}
                            onChange={(e) => setAiTopic(e.target.value)}
                            disabled={isGenerating}
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary h-24 resize-none"
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
                              "Generate Slides"
                            )}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-primary to-secondary" size="lg">
                        <Plus className="w-4 h-4 mr-2" />
                        New Presentation
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="border-border/50 bg-card/90 backdrop-blur-md max-w-md w-full">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold">New Presentation Details</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateSubmit} className="space-y-4 mt-2">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground">Presentation Title *</label>
                        <Input
                          placeholder="e.g., Quantum Computing Fundamentals"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          disabled={createMutation.isPending}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground">Subject Code / Name *</label>
                        <Input
                          placeholder="e.g., PHY-402"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          disabled={createMutation.isPending}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground">Slide Template</label>
                        <select
                          value={selectedTemplate}
                          onChange={(e) => setSelectedTemplate(e.target.value)}
                          disabled={createMutation.isPending}
                          className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {templates.map((tpl) => (
                            <option key={tpl.value} value={tpl.value}>
                              {tpl.label}
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
                          {createMutation.isPending ? "Creating..." : "Create Presentation"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

              {/* Your Presentations */}
              <div>
                <h2 className="text-2xl font-bold mb-4 font-semibold tracking-tight">Your Presentations</h2>
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-44 w-full" />
                    <Skeleton className="h-44 w-full" />
                    <Skeleton className="h-44 w-full" />
                  </div>
                ) : !presentations || presentations.length === 0 ? (
                  <Card className="border-border/40 bg-card/40 backdrop-blur-sm p-12 text-center">
                    <Presentation className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No presentations created</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                      Design stunning slides with AI assistance. Get started by creating your first presentation draft.
                    </p>
                    <Button
                      onClick={() => setIsAddOpen(true)}
                      className="bg-gradient-to-r from-primary to-secondary"
                    >
                      Create First Presentation
                    </Button>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                      {presentations.map((presentation: any, index: number) => (
                        <motion.div
                          key={presentation._id || presentation.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.15, delay: index * 0.05 }}
                        >
                          <Card className="border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/50 cursor-pointer transition-all group overflow-hidden">
                            <CardContent className="p-0">
                              <div className="bg-gradient-to-br from-primary/20 to-secondary/20 h-36 flex items-center justify-center group-hover:from-primary/30 group-hover:to-secondary/30 transition-all border-b border-border/40">
                                <Presentation className="w-12 h-12 text-primary opacity-60" />
                              </div>
                              <div className="p-5 space-y-3">
                                <div>
                                  <h3 className="font-semibold text-lg truncate">{presentation.title}</h3>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {presentation.subject} • {presentation.slides?.length || 0} slides
                                  </p>
                                </div>
                                <div className="flex gap-2 justify-between items-center pt-2">
                                  <span className="text-[10px] text-muted-foreground capitalize">
                                    Template: {presentation.template}
                                  </span>
                                  <div className="flex space-x-1">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleDownload(presentation)}
                                      className="border-border/40 hover:bg-muted w-8 h-8"
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      disabled={deleteMutation.isPending}
                                      onClick={() => {
                                        if (confirm(`Delete presentation "${presentation.title}"?`)) {
                                          deleteMutation.mutate(presentation._id || presentation.id);
                                        }
                                      }}
                                      className="border-border/40 hover:text-destructive hover:bg-destructive/10 w-8 h-8"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
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
