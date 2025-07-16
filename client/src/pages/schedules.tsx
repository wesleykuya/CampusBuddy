import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth, getAuthHeaders } from "@/lib/auth";
import { NavigationHeader } from "@/components/navigation-header";
import { ScheduleModal } from "@/components/schedule-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, Clock, MapPin, Edit, Trash2, BookOpen } from "lucide-react";
import { useState } from "react";

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
    color: string;
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

export default function SchedulesPage() {
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showOtherCourse, setShowOtherCourse] = useState(false);
  const [newCourseData, setNewCourseData] = useState({
    name: "",
    code: "",
    instructor: "",
    color: "#000000",
  });

  const { data: schedules, isLoading } = useQuery({
    queryKey: ["/api/schedules"],
  });

  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
  });

  const { data: buildings } = useQuery({
    queryKey: ["/api/buildings"],
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (scheduleData: any) => {
      return await apiRequest("POST", "/api/schedules", scheduleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setIsCreateDialogOpen(false);
      setShowOtherCourse(false);
      setNewCourseData({
        name: "",
        code: "",
        instructor: "",
        color: "#000000",
      });
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
      return await apiRequest("PUT", `/api/schedules/${id}`, scheduleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
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
      return await apiRequest("DELETE", `/api/schedules/${scheduleId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
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

  const handleCreateSchedule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    let courseId = parseInt(formData.get("courseId") as string);

    if (showOtherCourse) {
      // First create the new course
      try {
        const newCourseResponse = await apiRequest("POST", "/api/courses", newCourseData);
        courseId = newCourseResponse.id;

        // Refresh courses data
        queryClient.invalidateQueries({ queryKey: ["/api/courses"] });

        toast({
          title: "Success",
          description: "New course created successfully",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to create course",
          variant: "destructive",
        });
        return;
      }
    }

    const scheduleData = {
      courseId: courseId,
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading schedules...</div>
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
          <h1 className="text-3xl font-bold">My Schedules</h1>
          <p className="text-muted-foreground">Manage your class schedules</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Schedule</DialogTitle>
              <DialogDescription>
                Add a new class schedule to your timetable.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="courseId">Course</Label>
                <Select name="courseId" required onValueChange={(value) => setShowOtherCourse(value === "other")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses?.map((course: any) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.code} - {course.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="other">Other (Create New Course)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {showOtherCourse && (
                <div className="space-y-4 p-4 border rounded-md bg-slate-50">
                  <h4 className="font-medium text-sm">Create New Course</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="newCourseName">Course Name</Label>
                      <Input 
                        id="newCourseName"
                        placeholder="e.g., Introduction to Biology"
                        value={newCourseData.name}
                        onChange={(e) => setNewCourseData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newCourseCode">Course Code</Label>
                      <Input 
                        id="newCourseCode"
                        placeholder="e.g., BIO101"
                        value={newCourseData.code}
                        onChange={(e) => setNewCourseData(prev => ({ ...prev, code: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="newCourseInstructor">Instructor (Optional)</Label>
                      <Input 
                        id="newCourseInstructor"
                        placeholder="e.g., Dr. Smith"
                        value={newCourseData.instructor}
                        onChange={(e) => setNewCourseData(prev => ({ ...prev, instructor: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newCourseColor">Color</Label>
                      <Input 
                        id="newCourseColor"
                        type="color"
                        value={newCourseData.color}
                        onChange={(e) => setNewCourseData(prev => ({ ...prev, color: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}
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
                  <Label htmlFor="roomId">Room (Optional)</Label>
                  <Input id="roomId" name="roomId" placeholder="Room number" />
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

      <div className="grid gap-4">
        {schedules?.map((schedule: Schedule) => (
          <Card key={schedule.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: schedule.course.color }}
                  />
                  <div>
                    <h3 className="font-semibold">{schedule.course.name}</h3>
                    <p className="text-sm text-muted-foreground">{schedule.course.code}</p>
                  </div>
                  <Badge variant="outline">
                    <Calendar className="w-3 h-3 mr-1" />
                    {dayNames[schedule.dayOfWeek]}
                  </Badge>
                  <Badge variant="outline">
                    <Clock className="w-3 h-3 mr-1" />
                    {schedule.startTime} - {schedule.endTime}
                  </Badge>
                  {schedule.room && (
                    <Badge variant="outline">
                      <MapPin className="w-3 h-3 mr-1" />
                      {schedule.room.building.name} - {schedule.room.number}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSchedule(schedule);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                    disabled={deleteScheduleMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Schedule Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
            <DialogDescription>
              Update schedule information.
            </DialogDescription>
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
                    {courses?.map((course: any) => (
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
                  <Input 
                    id="edit-roomId" 
                    name="roomId" 
                    defaultValue={selectedSchedule.roomId?.toString() || ""}
                    placeholder="Room number" 
                  />
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