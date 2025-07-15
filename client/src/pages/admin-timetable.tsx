
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { NavigationHeader } from "@/components/navigation-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Plus, Edit, Trash2, MapPin, Users } from "lucide-react";

interface Schedule {
  id: number;
  courseId: number;
  roomId?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  course: {
    name: string;
    code: string;
    color?: string;
  };
  room?: {
    number: string;
    name: string;
    building: {
      name: string;
    };
  };
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const timeSlots = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

export default function AdminTimetablePage() {
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allSchedules = [], isLoading } = useQuery({
    queryKey: ["/api/admin/schedules"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/schedules");
      return response.json();
    },
  });

  const { data: systemCourses = [] } = useQuery({
    queryKey: ["/api/admin/system-courses"],
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ["/api/buildings"],
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["/api/rooms"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/rooms");
      return response.json();
    },
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (scheduleData: any) => {
      return await apiRequest("POST", "/api/admin/schedules", scheduleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/schedules"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Schedule created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create schedule",
        variant: "destructive",
      });
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async ({ id, ...scheduleData }: any) => {
      return await apiRequest("PUT", `/api/admin/schedules/${id}`, scheduleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/schedules"] });
      setIsEditDialogOpen(false);
      setSelectedSchedule(null);
      toast({
        title: "Success",
        description: "Schedule updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update schedule",
        variant: "destructive",
      });
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (scheduleId: number) => {
      return await apiRequest("DELETE", `/api/admin/schedules/${scheduleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/schedules"] });
      toast({
        title: "Success",
        description: "Schedule deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete schedule",
        variant: "destructive",
      });
    },
  });

  const handleCreateSchedule = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const scheduleData = {
      courseId: parseInt(formData.get("courseId") as string),
      roomId: formData.get("roomId") ? parseInt(formData.get("roomId") as string) : undefined,
      dayOfWeek: parseInt(formData.get("dayOfWeek") as string),
      startTime: formData.get("startTime"),
      endTime: formData.get("endTime"),
    };
    createScheduleMutation.mutate(scheduleData);
  };

  const handleUpdateSchedule = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSchedule) return;

    const formData = new FormData(e.currentTarget);
    const scheduleData = {
      id: selectedSchedule.id,
      courseId: parseInt(formData.get("courseId") as string),
      roomId: formData.get("roomId") ? parseInt(formData.get("roomId") as string) : undefined,
      dayOfWeek: parseInt(formData.get("dayOfWeek") as string),
      startTime: formData.get("startTime"),
      endTime: formData.get("endTime"),
    };
    updateScheduleMutation.mutate(scheduleData);
  };

  const getScheduleForSlot = (day: number, time: string) => {
    return allSchedules.find((schedule: Schedule) => 
      schedule.dayOfWeek === day && 
      schedule.startTime <= time && 
      schedule.endTime > time
    );
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getScheduleDuration = (schedule: Schedule) => {
    const start = new Date(`1970-01-01T${schedule.startTime}`);
    const end = new Date(`1970-01-01T${schedule.endTime}`);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
    return Math.round(duration);
  };

  const filteredSchedules = selectedDay !== null 
    ? allSchedules.filter((s: Schedule) => s.dayOfWeek === selectedDay)
    : allSchedules;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavigationHeader />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading timetable management...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavigationHeader />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="w-8 h-8" />
              Course Timetable Management
            </h1>
            <p className="text-muted-foreground">Manage university-wide course schedules</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedDay?.toString() || ""} onValueChange={(value) => setSelectedDay(value ? parseInt(value) : null)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Days</SelectItem>
                {dayNames.map((day, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Schedule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Schedule</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateSchedule} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="courseId">Course</Label>
                    <Select name="courseId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {systemCourses.map((course: any) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.code} - {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dayOfWeek">Day</Label>
                      <Select name="dayOfWeek" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {dayNames.map((day, index) => (
                            <SelectItem key={index} value={index.toString()}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="roomId">Room</Label>
                      <Select name="roomId">
                        <SelectTrigger>
                          <SelectValue placeholder="Select room" />
                        </SelectTrigger>
                        <SelectContent>
                          {rooms.map((room: any) => (
                            <SelectItem key={room.id} value={room.id.toString()}>
                              {room.building.name} - {room.number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input id="startTime" name="startTime" type="time" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input id="endTime" name="endTime" type="time" required />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createScheduleMutation.isPending}>
                      Create Schedule
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Master Timetable</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-slate-600 min-w-20">Time</th>
                      {dayNames.slice(1, 6).map((day) => (
                        <th key={day} className="text-center p-3 font-medium text-slate-600 min-w-32">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map((time) => (
                      <tr key={time} className="border-b hover:bg-slate-50">
                        <td className="p-3 font-medium text-slate-700 border-r">
                          {formatTime(time)}
                        </td>
                        {[1, 2, 3, 4, 5].map((day) => {
                          const schedule = getScheduleForSlot(day, time);
                          
                          if (schedule && schedule.startTime === time) {
                            const duration = getScheduleDuration(schedule);
                            return (
                              <td 
                                key={day} 
                                className="p-1 align-top"
                                rowSpan={duration}
                              >
                                <div 
                                  className="h-full min-h-16 rounded-lg p-2 border shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group"
                                  style={{ backgroundColor: `${schedule.course.color || '#2563EB'}15` }}
                                >
                                  <div className="font-medium text-sm text-slate-800">
                                    {schedule.course.code}
                                  </div>
                                  <div className="text-xs text-slate-600 mt-1">
                                    {schedule.course.name}
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                  </div>
                                  {schedule.room && (
                                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                      <MapPin className="w-3 h-3" />
                                      {schedule.room.building.name} - {schedule.room.number}
                                    </div>
                                  )}
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                        onClick={() => {
                                          setSelectedSchedule(schedule);
                                          setIsEditDialogOpen(true);
                                        }}
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                        onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            );
                          } else if (!schedule || schedule.startTime !== time) {
                            return <td key={day} className="p-3 h-16"></td>;
                          }
                          return null;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schedule Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{allSchedules.length}</div>
                <div className="text-sm text-slate-600">Total Schedules</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{new Set(allSchedules.map((s: Schedule) => s.courseId)).size}</div>
                <div className="text-sm text-slate-600">Unique Courses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{new Set(allSchedules.map((s: Schedule) => s.roomId)).size}</div>
                <div className="text-sm text-slate-600">Rooms Used</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Schedule Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Schedule</DialogTitle>
            </DialogHeader>
            {selectedSchedule && (
              <form onSubmit={handleUpdateSchedule} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-courseId">Course</Label>
                  <Select name="courseId" defaultValue={selectedSchedule.courseId.toString()} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {systemCourses.map((course: any) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.code} - {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-dayOfWeek">Day</Label>
                    <Select name="dayOfWeek" defaultValue={selectedSchedule.dayOfWeek.toString()} required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dayNames.map((day, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-roomId">Room</Label>
                    <Select name="roomId" defaultValue={selectedSchedule.roomId?.toString() || ""}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((room: any) => (
                          <SelectItem key={room.id} value={room.id.toString()}>
                            {room.building.name} - {room.number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-startTime">Start Time</Label>
                    <Input 
                      id="edit-startTime" 
                      name="startTime" 
                      type="time"
                      defaultValue={selectedSchedule.startTime}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-endTime">End Time</Label>
                    <Input 
                      id="edit-endTime" 
                      name="endTime" 
                      type="time"
                      defaultValue={selectedSchedule.endTime}
                      required 
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setSelectedSchedule(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateScheduleMutation.isPending}>
                    Update Schedule
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
