"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { LandingPage } from "@/components/landing/landing-page";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && token) {
      router.replace("/dashboard");
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, token, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <LandingPage />;
}
