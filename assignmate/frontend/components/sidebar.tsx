"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  Presentation,
  CheckSquare,
  Calendar,
  Clock,
  Bell,
  Settings,
  LogOut,
  Sparkles,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  ];

  if (mounted && user) {
    if (user.role === "teacher") {
      menuItems.push(
        { icon: CheckSquare, label: "Assignments", href: "/assignments" },
        { icon: GraduationCap, label: "Teacher Portal", href: "/teacher" },
        { icon: BookOpen, label: "My Classrooms", href: "/classrooms" }
      );
    } else {
      menuItems.push(
        { icon: CheckSquare, label: "Assignments", href: "/assignments" },
        { icon: BookOpen, label: "My Classrooms", href: "/classrooms" },
        { icon: GraduationCap, label: "My Grades", href: "/grades" },
        { icon: Calendar, label: "Timetable", href: "/timetable" },
        { icon: Presentation, label: "Presentations", href: "/presentations" },
        { icon: FileText, label: "Resume Builder", href: "/resume" },
        { icon: Clock, label: "Calendar", href: "/calendar" }
      );
    }
  }

  menuItems.push({ icon: Bell, label: "Notifications", href: "/notifications" });

  return (
    <aside className="w-64 bg-card border-r border-border h-screen flex flex-col sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">CVSync</span>
        </Link>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-auto p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-4 py-2.5 rounded-md transition-colors duration-200",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-card/80 hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-border p-4 space-y-2">
        <Link
          href="/settings"
          className={cn(
            "flex items-center space-x-3 px-4 py-2.5 rounded-md transition-colors duration-200",
            pathname === "/settings"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-card/80 hover:text-foreground"
          )}
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">Settings</span>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => logout()}
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="text-sm font-medium">Logout</span>
        </Button>
      </div>
    </aside>
  );
}

