"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { X, HelpCircle, Sparkles, ArrowRight, Zap, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: "Free",
      description: "Essential tools for individual students to get started.",
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        "Create up to 1 Resume",
        "Generate 3 AI Presentations",
        "Track up to 15 active assignments",
        "Standard templates",
        "Community support",
      ],
      unavailable: [
        "Unlimited AI slide generation",
        "Advanced PDF & DOCX export",
        "Classroom & Teacher portal access",
        "Priority grading & analytics",
      ],
      cta: "Get Started Free",
      href: "/dashboard",
      popular: false,
      animation: "scale" as const,
    },
    {
      name: "Pro Student",
      description: "Ace your studies with unlimited AI power and templates.",
      monthlyPrice: 4.99,
      annualPrice: 3.99,
      features: [
        "Create unlimited Resumes",
        "Unlimited AI Presentations",
        "Track unlimited assignments",
        "Premium presentation templates",
        "Advanced PDF & DOCX export options",
        "Detailed deadline alerts & AI analytics",
        "24/7 Priority email support",
      ],
      unavailable: [
        "Classroom & Teacher portal access",
        "Bulk student grading tools",
      ],
      cta: "Go Pro Now",
      href: "/dashboard",
      popular: true,
      animation: "shine" as const,
    },
    {
      name: "Classroom / Teacher",
      description: "Best for educators and student groups collaborating.",
      monthlyPrice: 19.99,
      annualPrice: 15.99,
      features: [
        "Everything in Pro Student",
        "Full Teacher Portal access",
        "Create and manage classrooms",
        "Accept student submissions",
        "Built-in grading & leaderboard tools",
        "Student progress dashboard & reports",
        "Dedicated account manager support",
      ],
      unavailable: [],
      cta: "Upgrade to Classroom",
      href: "/dashboard",
      popular: false,
      animation: "lift" as const,
    },
  ];

  const faqs = [
    {
      q: "Can I cancel my subscription anytime?",
      a: "Yes! You can cancel your Pro or Classroom subscription at any time from your settings page. You will retain access to your plan until the end of your billing cycle.",
    },
    {
      q: "Do you offer any discounts for students?",
      a: "Our Pro plan is already heavily discounted for student budgets, but we also run seasonal university promotions. Keep an eye on your email for updates!",
    },
    {
      q: "What payment methods do you accept?",
      a: "We accept all major credit cards (Visa, Mastercard, American Express), Google Pay, and PayPal.",
    },
    {
      q: "How does the AI presentation generator work?",
      a: "Our AI generates complete presentation structures, text content, and layouts based on your inputs and prompts using advanced Gemini language models, saving you hours of manual slide building.",
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
                Back to Home
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
      <div className="pt-32 pb-12 px-4 sm:px-6 lg:px-8 text-center max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 text-xs text-primary font-semibold mb-4">
            <Zap className="w-3.5 h-3.5" />
            <span>Pricing Plans</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Flexible Plans for Future Leaders
          </h1>
          <p className="text-lg text-muted-foreground">
            Get access to AI resume building, presentation generation, and smart academic trackers. Choose the plan that fits your goals.
          </p>
        </motion.div>

        {/* Toggle */}
        <div className="flex items-center justify-center space-x-4 mt-8">
          <span className={`text-sm font-medium ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
            Monthly Billing
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-12 h-6 bg-muted border border-border rounded-full p-0.5 flex items-center transition-colors focus:outline-none"
            aria-label="Toggle annual billing"
          >
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className={`w-5 h-5 rounded-full ${isAnnual ? "bg-primary ml-auto" : "bg-muted-foreground"}`}
            />
          </button>
          <span className={`text-sm font-medium ${isAnnual ? "text-foreground" : "text-muted-foreground"} flex items-center`}>
            Annual Billing
            <span className="ml-2 bg-success/20 border border-success/30 text-success text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
              Save 20%
            </span>
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-8 mt-6 items-stretch">
        {plans.map((plan, idx) => {
          const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
          return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className="h-full flex"
            >
              <Card
                className={`border-border/50 bg-card/40 backdrop-blur-md relative h-full flex flex-col justify-between overflow-hidden transition-all duration-300 w-full ${
                  plan.popular
                    ? "border-primary/60 ring-2 ring-primary/20 shadow-2xl shadow-primary/5 scale-100 md:scale-[1.03]"
                    : "hover:border-border"
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-primary to-secondary text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-bl-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Most Popular
                  </div>
                )}

                <div>
                  <CardHeader className="pb-6">
                    <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                    <CardDescription className="min-h-10 mt-1.5">{plan.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div className="flex items-baseline">
                      <span className="text-5xl font-extrabold">$</span>
                      <span className="text-5xl font-extrabold tracking-tight">
                        {price % 1 === 0 ? price : price.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground text-sm ml-2 font-medium">
                        / {isAnnual ? "month (billed annually)" : "month"}
                      </span>
                    </div>

                    <div className="space-y-4 border-t border-border/40 pt-6">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Features included:</p>
                      <ul className="space-y-3">
                        {plan.features.map((feat) => (
                          <li key={feat} className="flex items-start text-sm">
                            <CheckCircle2 className="w-4 h-4 text-success mr-2.5 mt-0.5 flex-shrink-0" />
                            <span className="text-foreground/90">{feat}</span>
                          </li>
                        ))}
                        {plan.unavailable.map((feat) => (
                          <li key={feat} className="flex items-start text-sm opacity-50">
                            <X className="w-4 h-4 text-muted-foreground mr-2.5 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground line-through">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="pt-6">
                  <Link href={plan.href} className="w-full">
                    <Button
                      animation={plan.animation}
                      className={`w-full font-semibold ${
                        plan.popular
                          ? "bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white shadow-lg shadow-primary/25"
                          : "border-border/60 hover:bg-muted"
                      }`}
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-32">
        <h2 className="text-3xl font-bold text-center mb-10 flex items-center justify-center gap-2">
          <HelpCircle className="w-7 h-7 text-primary" />
          Frequently Asked Questions
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          {faqs.map((faq, idx) => (
            <motion.div
              key={faq.q}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -15 : 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-card/30 border border-border/40 p-6 rounded-lg backdrop-blur-sm"
            >
              <h3 className="font-bold text-base mb-2 text-foreground/95">{faq.q}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
