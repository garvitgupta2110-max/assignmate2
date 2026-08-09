"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/auth-store";
import { useToastStore } from "@/store/toast-store";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Loader2, Bell, Shield, User as UserIcon, Check } from "lucide-react";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendNotification,
} from "@/lib/notifications";

export default function Settings() {
  const { user, updateUser } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  // Profile Form States
  const [name, setName] = useState(user?.name || "");
  const [college, setCollege] = useState(user?.college || "");
  const [branch, setBranch] = useState(user?.branch || "");
  const [semester, setSemester] = useState(user?.semester?.toString() || "");
  const [isSaving, setIsSaving] = useState(false);

  // Notification states
  const [permStatus, setPermStatus] = useState<string>("default");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setCollege(user.college || "");
      setBranch(user.branch || "");
      setSemester(user.semester?.toString() || "");
    }
  }, [user]);

  useEffect(() => {
    setPermStatus(getNotificationPermission());
  }, []);

  const triggerToast = (title: string, description: string, variant: "default" | "destructive" | "success") => {
    addToast({
      id: Math.random().toString(36).substring(2, 9),
      title,
      description,
      variant,
      open: true,
    });
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      triggerToast("Validation Error", "Name is required.", "destructive");
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.put("/users", {
        name,
        college: college || undefined,
        branch: branch || undefined,
        semester: semester ? Number(semester) : undefined,
      });

      const updated = response.data;
      updateUser({
        name: updated.name,
        college: updated.college,
        branch: updated.branch,
        semester: updated.semester,
      });

      triggerToast("Settings Saved", "Profile updated successfully.", "success");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleNotifications = async () => {
    if (!isNotificationSupported()) {
      triggerToast("Not Supported", "Your browser does not support push notifications.", "destructive");
      return;
    }

    const currentPerm = getNotificationPermission();
    if (currentPerm === "granted") {
      triggerToast("Notifications Active", "Push notifications are already enabled in your browser.", "success");
      sendNotification("AssignMate Alert", "Browser push notifications are active! 🚀");
      return;
    }

    if (currentPerm === "denied") {
      triggerToast("Permission Blocked", "Notifications are blocked. Please reset your browser site settings to enable them.", "destructive");
      return;
    }

    const newPerm = await requestNotificationPermission();
    setPermStatus(newPerm);

    if (newPerm === "granted") {
      triggerToast("Permission Granted", "Notifications enabled successfully!", "success");
      sendNotification("Notifications Active", "Push notifications are now active on AssignMate! 🚀");
    } else {
      triggerToast("Permission Denied", "Notifications were blocked.", "destructive");
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 overflow-auto">
            <div className="p-8 space-y-8 max-w-2xl">
              <div>
                <h1 className="text-4xl font-bold mb-2">Settings</h1>
                <p className="text-muted-foreground">
                  Manage your account and preferences
                </p>
              </div>

              {/* Profile Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <UserIcon className="w-5 h-5 text-primary" />
                      <span>Profile Information</span>
                    </CardTitle>
                    <CardDescription>
                      Update your personal details
                    </CardDescription>
                  </CardHeader>
                  <form onSubmit={handleProfileSave}>
                    <CardContent className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">Email (read-only)</label>
                        <Input
                          value={user?.email || ""}
                          disabled
                          className="bg-muted/30 border-border/60 text-muted-foreground"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">Name *</label>
                        <Input
                          placeholder="Your Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={isSaving}
                          className="bg-background/50 border-border/60"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">College</label>
                        <Input
                          placeholder="State University"
                          value={college}
                          onChange={(e) => setCollege(e.target.value)}
                          disabled={isSaving}
                          className="bg-background/50 border-border/60"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-muted-foreground">Branch</label>
                          <Input
                            placeholder="Computer Science"
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            disabled={isSaving}
                            className="bg-background/50 border-border/60"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-muted-foreground">Semester</label>
                          <Input
                            type="number"
                            placeholder="4"
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                            disabled={isSaving}
                            className="bg-background/50 border-border/60"
                          />
                        </div>
                      </div>
                      <div className="pt-2">
                        <Button
                          type="submit"
                          disabled={isSaving}
                          className="bg-gradient-to-r from-primary to-secondary font-semibold"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Changes"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </form>
                </Card>
              </motion.div>

              {/* Preferences Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="w-5 h-5 text-secondary" />
                      <span>Preferences</span>
                    </CardTitle>
                    <CardDescription>
                      Customize your notifications and UI experience
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-card/50 border border-border/40 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Browser Push Notifications</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {permStatus === "granted"
                            ? "Active: Native alerts will display for upcoming deadlines."
                            : permStatus === "denied"
                            ? "Blocked: Reset browser permission to enable alerts."
                            : "Inactive: Toggle switch to grant native notification rights."}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant={permStatus === "granted" ? "default" : "outline"}
                        size="sm"
                        onClick={handleToggleNotifications}
                        className={`capitalize border-border/40 font-semibold ${
                          permStatus === "granted"
                            ? "bg-success hover:bg-success text-white"
                            : permStatus === "denied"
                            ? "text-destructive border-destructive/30 bg-destructive/10"
                            : ""
                        }`}
                      >
                        {permStatus === "granted" && <Check className="w-4 h-4 mr-1.5" />}
                        {permStatus === "granted" ? "Active" : permStatus === "denied" ? "Blocked" : "Enable"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Security Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-accent" />
                      <span>Security</span>
                    </CardTitle>
                    <CardDescription>
                      Manage your account security settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-start border-border/40">
                      Change Password
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-border/40">
                      Enable Two-Factor Authentication
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
