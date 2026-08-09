"use client";

import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import api from "@/lib/api";

function SessionValidator({ children }: { children: React.ReactNode }) {
  const { token, logout } = useAuthStore();

  useEffect(() => {
    const checkSession = async () => {
      if (!token) return;

      try {
        const response = await api.get("/users/me");
        const user = response.data;
        useAuthStore.getState().updateUser({
          id: user._id || user.id,
          email: user.email,
          name: user.name,
          college: user.college,
          branch: user.branch,
          semester: user.semester,
          profileImage: user.profileImage,
        });
      } catch (error) {
        console.error("Token validation failed on refresh, logging out:", error);
        logout();
      }
    };

    checkSession();
  }, [token, logout]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
            staleTime: 60000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionValidator>{children}</SessionValidator>
    </QueryClientProvider>
  );
}
