
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Edit, Bell, BellOff, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Reminder {
  id: number;
  userId: number;
  scheduleId: number;
  minutesBefore: number;
  isEnabled: boolean;
  schedule: {
    course: {
      name: string;
      code: string;
    };
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  };
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function RemindersPage() {
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reminders, isLoading } = useQuery({
    queryKey: ["/api/reminders"],
  });

  const { data: schedules } = useQuery({
    queryKey: ["/api/schedules"],
  });

  const createReminderMutation = useMutation({
    mutationFn: async (reminderData: any) => {
      return await apiRequest("POST", "/api/reminders", reminderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Reminder created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create reminder",
        variant: "destructive",
      });
    },
  });

  const updateReminderMutation = useMutation({
    mutationFn: async ({ id, ...reminderData }: any) => {
      return await apiRequest("PUT", `/api/reminders/${id}`, reminderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      setIsEditDialogOpen(false);
      setSelectedReminder(null);
      toast({
        title: "Success",
        description: "Reminder updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update reminder",
        variant: "destructive",
      });
    },
  });

  const deleteReminderMutation = useMutation({
    mutationFn: async (reminderId: number) => {
      return await apiRequest("DELETE", `/api/reminders/${reminderId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({
        title: "Success",
        description: "Reminder deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete reminder",
        variant: "destructive",
      });
    },
  });

  const toggleReminderMutation = useMutation({
    mutationFn: async ({ id, isEnabled }: { id: number; isEnabled: boolean }) => {
      return await apiRequest("PUT", `/api/reminders/${id}`, { isEnabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({
        title: "Success",
        description: "Reminder updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update reminder",
        variant: "destructive",
      });
    },
  });

  const handleCreateReminder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const reminderData = {
      scheduleId: parseInt(formData.get("scheduleId") as string),
      minutesBefore: parseInt(formData.get("minutesBefore") as string),
      isEnabled: true,
    };
    createReminderMutation.mutate(reminderData);
  };

  const handleUpdateReminder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedReminder) return;
    
    const formData = new FormData(e.currentTarget);
    const reminderData = {
      id: selectedReminder.id,
      scheduleId: parseInt(formData.get("scheduleId") as string),
      minutesBefore: parseInt(formData.get("minutesBefore") as string),
    };
    updateReminderMutation.mutate(reminderData);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading reminders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Class Reminders</h1>
          <p className="text-muted-foreground">Manage your class notification reminders</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Reminder</DialogTitle>
              <DialogDescription>
                Set up a notification reminder for your classes.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateReminder} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scheduleId">Schedule</Label>
                <Select name="scheduleId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    {schedules?.map((schedule: any) => (
                      <SelectItem key={schedule.id} value={schedule.id.toString()}>
                        {schedule.course.code} - {dayNames[schedule.dayOfWeek]} {schedule.startTime}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="minutesBefore">Minutes Before Class</Label>
                <Select name="minutesBefore" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createReminderMutation.isPending}>
                  Create Reminder
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {reminders?.map((reminder: Reminder) => (
          <Card key={reminder.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {reminder.isEnabled ? (
                      <Bell className="w-5 h-5 text-green-600" />
                    ) : (
                      <BellOff className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{reminder.schedule.course.name}</h3>
                    <p className="text-sm text-muted-foreground">{reminder.schedule.course.code}</p>
                  </div>
                  <Badge variant="outline">
                    {dayNames[reminder.schedule.dayOfWeek]} {reminder.schedule.startTime}
                  </Badge>
                  <Badge variant="outline">
                    <Clock className="w-3 h-3 mr-1" />
                    {reminder.minutesBefore} min before
                  </Badge>
                </div>
                <div className="flex items-center space-x-4">
                  <Switch
                    checked={reminder.isEnabled}
                    onCheckedChange={(checked) => 
                      toggleReminderMutation.mutate({ id: reminder.id, isEnabled: checked })
                    }
                  />
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedReminder(reminder);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteReminderMutation.mutate(reminder.id)}
                      disabled={deleteReminderMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Reminder Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Reminder</DialogTitle>
            <DialogDescription>
              Update reminder settings.
            </DialogDescription>
          </DialogHeader>
          {selectedReminder && (
            <form onSubmit={handleUpdateReminder} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-scheduleId">Schedule</Label>
                <Select name="scheduleId" defaultValue={selectedReminder.scheduleId.toString()} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {schedules?.map((schedule: any) => (
                      <SelectItem key={schedule.id} value={schedule.id.toString()}>
                        {schedule.course.code} - {dayNames[schedule.dayOfWeek]} {schedule.startTime}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-minutesBefore">Minutes Before Class</Label>
                <Select name="minutesBefore" defaultValue={selectedReminder.minutesBefore.toString()} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedReminder(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateReminderMutation.isPending}>
                  Update Reminder
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
