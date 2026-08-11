"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<"student" | "teacher">;
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const { token, isAuthenticated, user } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  const hasHydrated = useAuthStore.persist?.hasHydrated?.() ?? true;

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!token || !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
      router.push(user.role === "teacher" ? "/teacher" : "/dashboard");
      return;
    }

    setIsReady(true);
  }, [hasHydrated, token, isAuthenticated, user?.role, router, allowedRoles]);

  if (!hasHydrated || !isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
