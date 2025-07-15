import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCourseSchema, insertScheduleSchema } from "@shared/schema";
import { getAuthHeaders } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";
import { z } from "zod";

const daysOfWeek = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const timeSlots = Array.from({ length: 14 }, (_, i) => {
  const hour = i + 7; // 7 AM to 8 PM
  return {
    value: `${hour.toString().padStart(2, "0")}:00`,
    label: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? "PM" : "AM"}`,
  };
});

export function ScheduleModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch courses and schedules
  const { data: courses = [] } = useQuery({
    queryKey: ["/api/courses"],
    queryFn: async () => {
      const response = await fetch("/api/courses", {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch courses");
      return response.json();
    },
  });

  const { data: systemCourses = [] } = useQuery({
    queryKey: ["/api/system-courses"],
    queryFn: async () => {
      const response = await fetch("/api/system-courses", {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch system courses");
      return response.json();
    },
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ["/api/schedules"],
    queryFn: async () => {
      const response = await fetch("/api/schedules", {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch schedules");
      return response.json();
    },
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ["/api/buildings"],
  });

  // Course form
  const courseForm = useForm({
    resolver: zodResolver(insertCourseSchema.omit({ userId: true })),
    defaultValues: {
      name: "",
      code: "",
      instructor: "",
      color: "#2563EB",
    },
  });

  // Schedule form
  const scheduleForm = useForm({
    resolver: zodResolver(insertScheduleSchema),
    defaultValues: {
      courseId: 0,
      roomId: undefined,
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "10:30",
    },
  });

  // Mutations
  const createCourseMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/courses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Course created successfully" });
      setShowAddCourse(false);
      courseForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/schedules", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/schedules/today"] });
      toast({ title: "Schedule created successfully" });
      setShowAddSchedule(false);
      scheduleForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Get rooms for selected building
  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);
  const { data: rooms = [] } = useQuery({
    queryKey: ["/api/buildings", selectedBuilding, "rooms"],
    queryFn: async () => {
      if (!selectedBuilding) return [];
      const response = await fetch(`/api/buildings/${selectedBuilding}/rooms`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch rooms");
      return response.json();
    },
    enabled: !!selectedBuilding,
  });

  // Listen for global schedule modal toggle
  useEffect(() => {
    const handleToggleModal = () => setIsOpen(!isOpen);

    // This would be called from other components
    (window as any).toggleScheduleModal = handleToggleModal;

    return () => {
      delete (window as any).toggleScheduleModal;
    };
  }, [isOpen]);

  const getScheduleGrid = () => {
    const grid: any = {};

    schedules.forEach((schedule: any) => {
      const key = `${schedule.dayOfWeek}-${schedule.startTime}`;
      grid[key] = schedule;
    });

    return grid;
  };

  const scheduleGrid = getScheduleGrid();

  return (
    <>
      {/* Trigger button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 lg:hidden bg-primary text-white rounded-full w-14 h-14 shadow-lg z-40"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Weekly Schedule</h2>
                <p className="text-sm text-slate-600 mt-1">Manage your class schedule</p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddCourse(true)}
                >
                  Add Course
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowAddSchedule(true)}
                >
                  Add Schedule
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Schedule Grid */}
          <div className="overflow-auto max-h-[60vh] p-4">
            <div className="grid grid-cols-8 gap-2 mb-4">
              <div className="text-xs font-medium text-slate-600 p-2">Time</div>
              {daysOfWeek.map((day) => (
                <div key={day.value} className="text-xs font-medium text-slate-600 p-2 text-center">
                  {day.label.slice(0, 3)}
                </div>
              ))}
            </div>

            <div className="space-y-1">
              {timeSlots.map((timeSlot) => (
                <div key={timeSlot.value} className="grid grid-cols-8 gap-2 min-h-[60px]">
                  <div className="text-xs text-slate-600 p-2 border-r border-slate-200">
                    {timeSlot.label}
                  </div>
                  {daysOfWeek.map((day) => {
                    const scheduleKey = `${day.value}-${timeSlot.value}`;
                    const schedule = scheduleGrid[scheduleKey];

                    return (
                      <div
                        key={`${day.value}-${timeSlot.value}`}
                        className={`border rounded p-2 transition-colors ${
                          schedule
                            ? "border-solid cursor-pointer hover:shadow-sm"
                            : "border-dashed border-slate-200 hover:border-slate-300"
                        }`}
                        style={schedule ? { backgroundColor: `${schedule.course?.color}20`, borderColor: schedule.course?.color } : {}}
                      >
                        {schedule && (
                          <div>
                            <div className="text-xs font-medium" style={{ color: schedule.course?.color }}>
                              {schedule.course?.code}
                            </div>
                            <div className="text-xs text-slate-600">
                              {schedule.room ? `Room ${schedule.room.number}` : "No room"}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Course Modal */}
      <Dialog open={showAddCourse} onOpenChange={setShowAddCourse}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Course</DialogTitle>
          </DialogHeader>
          <Form {...courseForm}>
            <form onSubmit={courseForm.handleSubmit((data) => createCourseMutation.mutate(data))} className="space-y-4">
              <FormField
                control={courseForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Computer Science 101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={courseForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., CS101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={courseForm.control}
                name="instructor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructor</FormLabel>
                    <FormControl>
                      <Input placeholder="Professor name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={courseForm.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <Input type="color" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddCourse(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCourseMutation.isPending}>
                  {createCourseMutation.isPending ? "Creating..." : "Create Course"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Schedule Modal */}
      <Dialog open={showAddSchedule} onOpenChange={setShowAddSchedule}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Class Schedule</DialogTitle>
          </DialogHeader>
          <Form {...scheduleForm}>
            <form onSubmit={scheduleForm.handleSubmit((data) => createScheduleMutation.mutate(data))} className="space-y-4">
              <FormField
                control={scheduleForm.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                      </FormControl>
                      
                      <SelectContent>
                      {systemCourses?.map((course: any) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.code} - {course.name}
                        </SelectItem>
                      ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={scheduleForm.control}
                name="dayOfWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day of Week</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {daysOfWeek.map((day) => (
                          <SelectItem key={day.value} value={day.value.toString()}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={scheduleForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Start time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timeSlots.map((slot) => (
                            <SelectItem key={slot.value} value={slot.value}>
                              {slot.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={scheduleForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="End time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timeSlots.map((slot) => (
                            <SelectItem key={slot.value} value={slot.value}>
                              {slot.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Building and Room Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Building</Label>
                  <Select onValueChange={(value) => setSelectedBuilding(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select building" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings.map((building: any) => (
                        <SelectItem key={building.id} value={building.id.toString()}>
                          {building.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <FormField
                  control={scheduleForm.control}
                  name="roomId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select room" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {rooms.map((room: any) => (
                            <SelectItem key={room.id} value={room.id.toString()}>
                              Room {room.number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddSchedule(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createScheduleMutation.isPending}>
                  {createScheduleMutation.isPending ? "Creating..." : "Create Schedule"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}