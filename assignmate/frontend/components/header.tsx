"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Search, User, LogOut } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";

export function Header() {
  const { user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex-1 flex items-center space-x-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <Bell className="w-5 h-5" />
          </Button>
          <Link href="/settings">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2 border border-border/40 hover:bg-muted"
            >
              <User className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline text-sm font-medium">
                {mounted && user ? user.name : "Profile"}
              </span>
            </Button>
          </Link>
          {mounted && user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout()}
              className="flex items-center space-x-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">Logout</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
