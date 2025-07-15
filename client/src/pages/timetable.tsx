
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { NavigationHeader } from "@/components/navigation-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, BookOpen } from "lucide-react";

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
const timeSlots = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

export default function TimetablePage() {
  const { user } = useAuth();

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["/api/schedules"],
  });

  const getScheduleForSlot = (day: number, time: string) => {
    return schedules.find((schedule: Schedule) => 
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavigationHeader />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading timetable...</div>
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
              My Timetable
            </h1>
            <p className="text-muted-foreground">Your weekly class schedule</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Classes</p>
            <p className="text-2xl font-bold">{schedules.length}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Weekly Schedule
            </CardTitle>
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
                                className="h-full min-h-16 rounded-lg p-3 border-l-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                style={{ 
                                  backgroundColor: `${schedule.course.color}15`,
                                  borderLeftColor: schedule.course.color
                                }}
                              >
                                <div className="font-medium text-sm" style={{ color: schedule.course.color }}>
                                  {schedule.course.code}
                                </div>
                                <div className="text-xs text-slate-600 font-medium mt-1">
                                  {schedule.course.name}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                                  <Clock className="w-3 h-3" />
                                  {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                </div>
                                {schedule.room && (
                                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                    <MapPin className="w-3 h-3" />
                                    {schedule.room.building.name} - {schedule.room.number}
                                  </div>
                                )}
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

        {/* Course Legend */}
        <Card>
          <CardHeader>
            <CardTitle>Course Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from(new Set(schedules.map((s: Schedule) => s.course.code))).map((courseCode) => {
                const schedule = schedules.find((s: Schedule) => s.course.code === courseCode) as Schedule;
                return (
                  <div key={courseCode} className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: schedule.course.color }}
                    />
                    <div>
                      <div className="font-medium text-sm">{schedule.course.code}</div>
                      <div className="text-xs text-slate-600">{schedule.course.name}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
