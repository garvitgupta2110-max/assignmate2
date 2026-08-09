"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToastStore } from "@/store/toast-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Clock, Trash2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const timeSlots = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
];

const colors = [
  { value: "from-primary to-primary", label: "Purple (Primary)" },
  { value: "from-secondary to-secondary", label: "Violet (Secondary)" },
  { value: "from-accent to-accent", label: "Orange (Accent)" },
  { value: "from-success to-success", label: "Green (Success)" },
  { value: "from-blue-500 to-blue-500", label: "Blue" },
  { value: "from-pink-500 to-pink-500", label: "Pink" },
];

interface ScheduleItem {
  day: number;
  time: number;
  subject: string;
  color: string;
  room?: string;
}

export default function Timetable() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);

  // Form states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [dayIndex, setDayIndex] = useState(0);
  const [timeIndex, setTimeIndex] = useState(0);
  const [colorClass, setColorClass] = useState("from-primary to-primary");
  const [room, setRoom] = useState("");

  const triggerToast = (title: string, description: string, variant: "default" | "destructive" | "success") => {
    addToast({
      id: Math.random().toString(36).substring(2, 9),
      title,
      description,
      variant,
      open: true,
    });
  };

  // 1. Fetch Timetable Query
  const { data: timetable, isLoading } = useQuery({
    queryKey: ["timetable"],
    queryFn: async () => {
      const response = await api.get("/timetable");
      return response.data;
    },
  });

  // 2. Save/Update Timetable Mutation
  const saveMutation = useMutation({
    mutationFn: async (updatedSchedule: ScheduleItem[]) => {
      const response = await api.put("/timetable", { schedule: updatedSchedule });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable"] });
      triggerToast("Schedule Updated", "Successfully saved your class schedule.", "success");
      setIsAddOpen(false);
      // Reset form
      setSubject("");
      setRoom("");
    },
  });

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject) {
      triggerToast("Missing Subject", "Please enter a subject name.", "destructive");
      return;
    }

    const currentSchedule: ScheduleItem[] = timetable?.schedule || [];
    
    // Check if slot is already occupied
    const isOccupied = currentSchedule.some(
      (s) => s.day === Number(dayIndex) && s.time === Number(timeIndex)
    );

    if (isOccupied) {
      if (!confirm("This slot is already occupied. Do you want to replace it?")) {
        return;
      }
    }

    // Filter out previous occupied slot if replacing, then append new slot
    const filteredSchedule = currentSchedule.filter(
      (s) => !(s.day === Number(dayIndex) && s.time === Number(timeIndex))
    );

    const newClass: ScheduleItem = {
      day: Number(dayIndex),
      time: Number(timeIndex),
      subject,
      color: colorClass,
      room: room || undefined,
    };

    saveMutation.mutate([...filteredSchedule, newClass]);
  };

  const handleRemoveClass = (day: number, time: number, subjectName: string) => {
    if (confirm(`Remove "${subjectName}" from your schedule?`)) {
      const currentSchedule: ScheduleItem[] = timetable?.schedule || [];
      const updatedSchedule = currentSchedule.filter(
        (s) => !(s.day === day && s.time === time)
      );
      saveMutation.mutate(updatedSchedule);
    }
  };

  const scheduleList: ScheduleItem[] = timetable?.schedule || [];

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 overflow-auto">
            <div className="p-8 space-y-8">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2">Timetable Planner</h1>
                  <p className="text-muted-foreground">
                    Organize your weekly study schedule
                  </p>
                </div>
                
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-primary to-secondary" size="lg">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Class
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-border/50 bg-card/90 backdrop-blur-md max-w-md w-full">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold">Add Class to Schedule</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddClass} className="space-y-4 mt-2">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground">Subject Name *</label>
                        <Input
                          placeholder="Mathematics III"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          disabled={saveMutation.isPending}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">Select Day</label>
                          <select
                            value={dayIndex}
                            onChange={(e) => setDayIndex(Number(e.target.value))}
                            disabled={saveMutation.isPending}
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            {days.map((day, idx) => (
                              <option key={idx} value={idx}>{day}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">Select Time</label>
                          <select
                            value={timeIndex}
                            onChange={(e) => setTimeIndex(Number(e.target.value))}
                            disabled={saveMutation.isPending}
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            {timeSlots.map((time, idx) => (
                              <option key={idx} value={idx}>{time}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">Color Code</label>
                          <select
                            value={colorClass}
                            onChange={(e) => setColorClass(e.target.value)}
                            disabled={saveMutation.isPending}
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            {colors.map((color, idx) => (
                              <option key={idx} value={color.value}>{color.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">Classroom / Location</label>
                          <Input
                            placeholder="Room 402-A"
                            value={room}
                            onChange={(e) => setRoom(e.target.value)}
                            disabled={saveMutation.isPending}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddOpen(false)}
                          disabled={saveMutation.isPending}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={saveMutation.isPending}
                          className="bg-gradient-to-r from-primary to-secondary"
                        >
                          {saveMutation.isPending ? "Adding..." : "Add to Schedule"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Timetable Grid */}
              <Card className="border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-6">
                  {isLoading ? (
                    <Skeleton className="h-[500px] w-full" />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[800px]">
                        <thead>
                          <tr>
                            <th className="w-24 text-left text-sm font-semibold text-muted-foreground pb-4">
                              Time
                            </th>
                            {days.map((day, index) => (
                              <th
                                key={index}
                                className="flex-1 text-center text-sm font-semibold text-foreground pb-4"
                              >
                                {day}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {timeSlots.map((time, tIndex) => (
                            <tr key={tIndex} className="border-t border-border/50">
                              <td className="text-sm font-medium text-muted-foreground p-4">
                                {time}
                              </td>
                              {days.map((_, dIndex) => {
                                const classItem = scheduleList.find(
                                  (s) => s.day === dIndex && s.time === tIndex
                                );
                                return (
                                  <td
                                    key={dIndex}
                                    className="text-center p-2 h-24"
                                  >
                                    <AnimatePresence mode="wait">
                                      {classItem ? (
                                        <motion.div
                                          initial={{ opacity: 0, scale: 0.9 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          exit={{ opacity: 0, scale: 0.9 }}
                                          onClick={() => handleRemoveClass(dIndex, tIndex, classItem.subject)}
                                          className={`group h-full rounded-lg bg-gradient-to-br ${classItem.color} p-3 text-white text-xs font-semibold flex flex-col items-center justify-center text-center relative cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all`}
                                        >
                                          <span className="truncate w-full">{classItem.subject}</span>
                                          {classItem.room && (
                                            <span className="text-[10px] opacity-75 mt-1 block">
                                              Room: {classItem.room}
                                            </span>
                                          )}
                                          <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Trash2 className="w-5 h-5 text-destructive" />
                                          </div>
                                        </motion.div>
                                      ) : (
                                        <div className="h-full border border-dashed border-border/20 rounded-lg bg-black/5" />
                                      )}
                                    </AnimatePresence>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Features Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Timetable Helper</CardTitle>
                    <CardDescription>
                      Maintain an organized weekly academic life
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p className="text-muted-foreground">
                      * **Adding a Class**: Click the "Add Class" button, enter your subject details, select the day, time slot, and preferred card color.
                    </p>
                    <p className="text-muted-foreground">
                      * **Removing a Class**: Hover over any scheduled class inside the grid and click the trash overlay indicator to delete it.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Daily Status</CardTitle>
                    <CardDescription>
                      Today's schedule status
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 flex items-center justify-center h-28 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-primary" />
                      <span>
                        {scheduleList.filter((s) => s.day === new Date().getDay() - 1).length > 0
                          ? `You have ${scheduleList.filter((s) => s.day === new Date().getDay() - 1).length} classes scheduled for today.`
                          : "No classes scheduled for today. Enjoy your break!"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
