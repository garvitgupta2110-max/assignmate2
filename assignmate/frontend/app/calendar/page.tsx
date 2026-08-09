"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";

export default function Calendar() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="p-8 space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Calendar</h1>
              <p className="text-muted-foreground">
                View all your assignments, classes, and events
              </p>
            </div>

            <Card className="border-border/50">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">
                  Interactive calendar coming soon
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
