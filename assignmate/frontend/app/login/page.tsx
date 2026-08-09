"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useToastStore } from "@/store/toast-store";
import api from "@/lib/api";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [college, setCollege] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const triggerToast = (title: string, description: string, variant: "default" | "destructive" | "success") => {
    addToast({
      id: Math.random().toString(36).substring(2, 9),
      title,
      description,
      variant,
      open: true,
    });
  };

  const handleGoogleLogin = async () => {
    if (!auth || !googleProvider) {
      triggerToast(
        "Firebase Config Required",
        "Please add your Firebase keys (NEXT_PUBLIC_FIREBASE_*) to your frontend/.env.local file to enable Google Sign-In.",
        "destructive"
      );
      return;
    }
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (!user.email) {
        triggerToast("Authentication Failed", "Failed to retrieve email from Google.", "destructive");
        return;
      }

      const response = await api.post("/auth/google", {
        email: user.email,
        name: user.displayName || "Google User",
        profileImage: user.photoURL || undefined,
      });

      const { token, user: backendUser } = response.data;

      setAuth({
        id: backendUser._id || backendUser.id,
        email: backendUser.email,
        name: backendUser.name,
        college: backendUser.college,
        branch: backendUser.branch,
        semester: backendUser.semester,
        profileImage: backendUser.profileImage,
        role: backendUser.role || "student",
      }, token);

      triggerToast("Welcome!", `Signed in successfully with Google as ${backendUser.name}.`, "success");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Google login failed:", error);
      if (error.code !== "auth/popup-closed-by-user") {
        triggerToast("Login Failed", error.message || "An error occurred during Google sign-in.", "destructive");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      triggerToast("Validation Error", "Please fill in all required fields.", "destructive");
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        // Sign In
        const response = await api.post("/auth/login", { email, password });
        const { token, user } = response.data;
        
        // Save auth state
        setAuth({
          id: user._id || user.id,
          email: user.email,
          name: user.name,
          college: user.college,
          branch: user.branch,
          semester: user.semester,
          profileImage: user.profileImage,
          role: user.role,
        }, token);

        triggerToast("Welcome Back!", `Signed in successfully as ${user.name}.`, "success");
        router.push("/dashboard");
      } else {
        // Sign Up
        const response = await api.post("/auth/signup", {
          email,
          name,
          password,
          college: college || undefined,
          branch: branch || undefined,
          semester: semester ? Number(semester) : undefined,
          role,
        });
        const { token, user } = response.data;

        setAuth({
          id: user._id || user.id,
          email: user.email,
          name: user.name,
          college: user.college,
          branch: user.branch,
          semester: user.semester,
          profileImage: user.profileImage,
          role: user.role,
        }, token);

        triggerToast("Account Created", "Your AssignMate account has been set up successfully.", "success");
        router.push("/dashboard");
      }
    } catch (error: any) {
      // Errors are already partially handled by interceptor, but we catch to stop loader
      console.error("Auth error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-secondary/15 -z-10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Brand Header */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-2xl tracking-wide bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            AssignMate
          </span>
        </div>

        <Card className="border-border/50 backdrop-blur-md bg-card/40 shadow-2xl relative overflow-hidden">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              {isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground mt-1">
              {isLogin
                ? "Enter your academic credentials to log in"
                : "Register to organize your study schedule and tasks"}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={isLogin ? "login" : "signup"}
                  initial={{ opacity: 0, x: isLogin ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isLogin ? 10 : -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {!isLogin && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Full Name *</label>
                      <Input
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isLoading}
                        className="bg-background/50 border-border/60 focus:border-primary"
                        required={!isLogin}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Email Address *</label>
                    <Input
                      type="email"
                      placeholder="student@college.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="bg-background/50 border-border/60 focus:border-primary"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Password *</label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="bg-background/50 border-border/60 focus:border-primary"
                      required
                    />
                  </div>

                  {!isLogin && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">I am a *</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setRole("student")}
                            disabled={isLoading}
                            className={`py-2 rounded-md border text-sm font-semibold transition-all ${
                              role === "student"
                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                : "bg-background/40 text-muted-foreground border-border/60 hover:bg-background/60"
                            }`}
                          >
                            Student
                          </button>
                          <button
                            type="button"
                            onClick={() => setRole("teacher")}
                            disabled={isLoading}
                            className={`py-2 rounded-md border text-sm font-semibold transition-all ${
                              role === "teacher"
                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                : "bg-background/40 text-muted-foreground border-border/60 hover:bg-background/60"
                            }`}
                          >
                            Teacher
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">College Name</label>
                        <Input
                          type="text"
                          placeholder="State University"
                          value={college}
                          onChange={(e) => setCollege(e.target.value)}
                          disabled={isLoading}
                          className="bg-background/50 border-border/60"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Branch / Major</label>
                        <Input
                          type="text"
                          placeholder="Computer Science"
                          value={branch}
                          onChange={(e) => setBranch(e.target.value)}
                          disabled={isLoading}
                          className="bg-background/50 border-border/60"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Semester</label>
                        <Input
                          type="number"
                          placeholder="4"
                          min="1"
                          max="16"
                          value={semester}
                          onChange={(e) => setSemester(e.target.value)}
                          disabled={isLoading}
                          className="bg-background/50 border-border/60"
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 mt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isLogin ? "Signing in..." : "Creating Account..."}
                  </>
                ) : (
                  <>
                    {isLogin ? "Sign In" : "Register"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <div className="relative my-2 w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/40" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={handleGoogleLogin}
                className="w-full border-border/60 hover:bg-muted text-foreground font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Sign In with Google
              </Button>

              <div className="text-sm text-center text-muted-foreground">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  disabled={isLoading}
                  className="text-primary hover:underline font-semibold bg-transparent border-none p-0 cursor-pointer"
                >
                  {isLogin ? "Sign Up" : "Log In"}
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
