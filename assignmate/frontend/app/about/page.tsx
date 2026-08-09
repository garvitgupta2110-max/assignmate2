"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Sparkles, 
  Target, 
  Heart, 
  Users2, 
  ShieldCheck, 
  ArrowRight, 
  Github, 
  Linkedin, 
  Mail,
  GraduationCap
} from "lucide-react";
import { motion } from "framer-motion";

export default function AboutPage() {
  const values = [
    {
      icon: Target,
      title: "Student Empowerment",
      description: "We design tools to make academic life simpler, allowing students to focus on learning and building their careers.",
    },
    {
      icon: Heart,
      title: "Built with Passion",
      description: "Our features are crafted with deep care for visual excellence, micro-animations, and rich user experience.",
    },
    {
      icon: ShieldCheck,
      title: "Privacy & Integrity",
      description: "We respect your data. Your assignments, timetables, and documents are kept secure and encrypted.",
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
            <Link href="/features">
              <Button variant="ghost" size="sm">
                Features
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" size="sm">
                Pricing
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
            <Users2 className="w-3.5 h-3.5" />
            <span>Our Story</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            About CVSync
          </h1>
          <p className="text-lg text-muted-foreground">
            We are on a mission to build the ultimate, AI-driven digital workspaces for college students worldwide.
          </p>
        </motion.div>
      </div>

      {/* Vision & Mission Card */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-border/50 bg-card/30 backdrop-blur-md overflow-hidden p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-bold mb-4">The Student Workspace of Tomorrow</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  College students juggle dozens of tasks daily—drafting resumes, preparing presentations, tracking deadlines, and managing calendars. CVSync consolidates all these functions into a single, cohesive dashboard, enriched with Google Gemini AI power.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We believe that productivity tools should not only be functional but beautiful and responsive, providing micro-interactions that inspire and simplify work.
                </p>
              </div>
              <div className="flex justify-center relative">
                {/* Visual Gradient Box */}
                <div className="w-64 h-64 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20 relative overflow-hidden">
                  <GraduationCap className="w-24 h-24 text-white opacity-80" />
                  <div className="absolute inset-0 bg-white/10 opacity-30 hover:opacity-10 transition-opacity duration-300" />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Founder Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold">Meet the Founders</h2>
          <p className="text-muted-foreground mt-2 text-sm">The creators behind the CVSync dashboard.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Garvit Gupta */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="border-border/50 bg-card/60 backdrop-blur-md overflow-hidden h-full p-8 hover:border-primary/40 transition-all duration-300">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Profile image placeholder with name initial */}
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-3xl font-extrabold text-white shadow-lg shadow-primary/25 flex-shrink-0">
                  GG
                </div>
                <div className="space-y-3 text-center sm:text-left">
                  <div>
                    <h3 className="text-xl font-bold">Garvit Gupta</h3>
                    <p className="text-sm text-primary font-semibold">Founder & Lead Architect</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Garvit is a software engineer and visionary designer who founded CVSync to solve the fragmentation of college workflow tools. With a strong passion for developer experience, web aesthetics, and AI orchestration, he architected CVSync to serve as an all-in-one productivity hub for college campuses.
                  </p>
                  <div className="flex items-center justify-center sm:justify-start space-x-4 pt-2">
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      <Github className="w-4 h-4" />
                    </a>
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      <Linkedin className="w-4 h-4" />
                    </a>
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      <Mail className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Dhruv Gupta */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="border-border/50 bg-card/60 backdrop-blur-md overflow-hidden h-full p-8 hover:border-primary/40 transition-all duration-300">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Profile image placeholder with name initial */}
                <div className="w-24 h-24 bg-gradient-to-br from-secondary to-primary rounded-full flex items-center justify-center text-3xl font-extrabold text-white shadow-lg shadow-primary/25 flex-shrink-0">
                  DG
                </div>
                <div className="space-y-3 text-center sm:text-left">
                  <div>
                    <h3 className="text-xl font-bold">Dhruv Gupta</h3>
                    <p className="text-sm text-secondary font-semibold">Co-Founder & Lead Engineer</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Dhruv is a software engineer and systems architect who co-founded CVSync to empower students through advanced productivity systems. With deep expertise in backend infrastructure, database optimization, and cloud operations, he handles scaling and intelligence orchestration for the platform.
                  </p>
                  <div className="flex items-center justify-center sm:justify-start space-x-4 pt-2">
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      <Github className="w-4 h-4" />
                    </a>
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      <Linkedin className="w-4 h-4" />
                    </a>
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      <Mail className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Core Values */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold">Our Core Values</h2>
          <p className="text-muted-foreground mt-2 text-sm">The principles driving our growth and product development.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {values.map((val, idx) => {
            const Icon = val.icon;
            return (
              <motion.div
                key={val.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card className="border-border/50 bg-card/20 h-full">
                  <CardContent className="pt-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold mb-2 text-base">{val.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{val.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-32 text-center">
        <Card className="border-border/50 bg-card/60 p-12">
          <h2 className="text-3xl font-bold mb-4">Join our growing userbase</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Take control of your studies, resume creations, and class presentations with CVSync.
          </p>
          <Link href="/dashboard">
            <Button animation="shine" size="lg" className="bg-gradient-to-r from-primary to-secondary">
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
