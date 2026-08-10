"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Brain,
  HeartPulse,
  ShieldCheck,
  Cpu,
  Sparkles,
  Zap,
  ArrowRight,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";

export default function FeaturesPage() {
  const categorySections = [
    {
      icon: Brain,
      title: "AI/ML",
      description: "Smart tools and workflows for artificial intelligence and machine learning tasks.",
      color: "from-blue-500/20 to-cyan-500/10",
      iconColor: "text-blue-400",
      subsections: [
        { title: "Section 1", description: "AI model exploration and learning resources." },
        { title: "Section 2", description: "Automated predictions, classification, and analysis support." },
        { title: "Section 3", description: "Data-driven recommendations for student projects and study plans." },
        { title: "Section 4", description: "Built-in AI explainability and learning guidance." },
      ],
    },
    {
      icon: HeartPulse,
      title: "AIDS",
      description: "Awareness, support, and academic resources for AIDS-related learning.",
      color: "from-rose-500/20 to-pink-500/10",
      iconColor: "text-rose-400",
      subsections: [
        { title: "Section 1", description: "Educational content and awareness materials." },
        { title: "Section 2", description: "Community support tools and health guidance." },
        { title: "Section 3", description: "Research summaries and academic assistance." },
        { title: "Section 4", description: "Access to counseling and preventative study plans." },
      ],
    },
    {
      icon: ShieldCheck,
      title: "Cyber Security",
      description: "Protective features, secure study practices, and privacy-aware learning modules.",
      color: "from-emerald-500/20 to-teal-500/10",
      iconColor: "text-emerald-400",
      subsections: [
        { title: "Section 1", description: "Secure login and data safety best practices." },
        { title: "Section 2", description: "Network security fundamentals and study notes." },
        { title: "Section 3", description: "Threat detection, privacy, and incident response guidance." },
        { title: "Section 4", description: "Secure document handling and encrypted collaboration." },
      ],
    },
    {
      icon: Cpu,
      title: "General",
      description: "General-purpose academic tools and platform utilities for everyday use.",
      color: "from-slate-500/20 to-slate-300/10",
      iconColor: "text-slate-400",
      subsections: [
        { title: "Section 1", description: "General dashboards and user-friendly navigation." },
        { title: "Section 2", description: "Standard study templates, notes, and planning aids." },
        { title: "Section 3", description: "Analytics, progress tracking, and summary reports." },
        { title: "Section 4", description: "Cross-category integration and workflow simplification." },
      ],
    },
  ];

  const additionalHighlights = [
    {
      icon: Brain,
      title: "Gemini-Powered AI",
      description: "Utilizes advanced Google Gemini intelligence to draft text, summarize documents, and suggest enhancements.",
    },
    {
      icon: ShieldCheck,
      title: "Secure & Encrypted",
      description: "Your academic papers, credentials, and details are kept safe with top-tier database encryption.",
    },
    {
      icon: Clock,
      title: "Real-Time Sync",
      description: "Access your dashboard from your phone, laptop, or tablet. Your data stays in sync instantly.",
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden pb-20">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-sm bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">CVSync</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                Home
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" size="sm">
                Pricing
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="ghost" size="sm">
                About
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                size="sm"
                className="bg-gradient-to-r from-primary to-secondary"
              >
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 text-center max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 text-xs text-primary font-semibold mb-4">
            <Zap className="w-3.5 h-3.5" />
            <span>Core Features</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Powering Student Success
          </h1>
          <p className="text-lg text-muted-foreground">
            Explore the advanced tools designed to help you create resumes, generate presentations, and organize your schedules.
          </p>
        </motion.div>
      </div>

      {/* Main Features List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {categorySections.map((category) => {
          const Icon = category.icon;
          return (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <Card className={`border-border/50 bg-gradient-to-r ${category.color} backdrop-blur-md overflow-hidden relative`}>
                <CardContent className="p-8 md:p-12 grid md:grid-cols-3 gap-8 items-start">
                  <div className="md:col-span-1 space-y-4">
                    <div className={`w-14 h-14 rounded-2xl bg-card border border-border/80 flex items-center justify-center ${category.iconColor}`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold">{category.title}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">{category.description}</p>
                  </div>

                  <div className="md:col-span-2 space-y-6 md:border-l md:border-border/40 md:pl-10">
                    {category.subsections.map((section, index) => (
                      <div key={section.title} className="rounded-3xl bg-card/80 border border-border/70 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm uppercase font-semibold tracking-widest text-muted-foreground">
                            Section {index + 1}
                          </span>
                          <span className="text-xs font-medium text-primary">{section.title}</span>
                        </div>
                        <p className="mt-3 text-sm text-foreground/90">{section.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Highlights Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold">Built for Peak Productivity</h2>
          <p className="text-muted-foreground mt-2 text-sm">CVSync offers smart features to ensure you stay ahead of the class.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {additionalHighlights.map((hl, idx) => {
            const Icon = hl.icon;
            return (
              <motion.div
                key={hl.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card className="border-border/50 bg-card/25 h-full hover:border-border/80 transition-all duration-300">
                  <CardContent className="pt-6">
                    <Icon className="w-7 h-7 text-primary mb-4" />
                    <h3 className="font-semibold mb-2 text-base">{hl.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{hl.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Call to Action */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-32 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <Card className="border-border/50 bg-card/60 backdrop-blur-sm p-12">
            <h2 className="text-3xl font-bold mb-4">Start accelerating your studies</h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Get access to all these tools for free. Sign up in under a minute.
            </p>
            <Link href="/dashboard">
              <Button animation="shine" size="lg" className="bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/20">
                Unlock Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
