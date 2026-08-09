"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Next.js App Router error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-border/50 backdrop-blur-sm bg-card/60">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Something went wrong!</CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            An unexpected error occurred during rendering.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground bg-black/20 p-4 rounded-md mx-6 border border-white/5">
          {error.message || "Unknown Application Error"}
        </CardContent>
        <CardFooter className="flex justify-center gap-4 mt-6">
          <Button
            onClick={() => window.location.href = "/"}
            variant="outline"
          >
            Go to Home
          </Button>
          <Button
            onClick={() => reset()}
            className="bg-gradient-to-r from-primary to-secondary"
          >
            Try again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
