import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Navigation, Clock, MapPin, Coffee, Book, Utensils } from "lucide-react";
import { getAuthHeaders } from "@/lib/auth";

export function Sidebar() {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch today's schedules
  const { data: todaySchedules = [], isLoading } = useQuery({
    queryKey: ["/api/schedules/today"],
    queryFn: async () => {
      const response = await fetch("/api/schedules/today", {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch schedules");
      return response.json();
    },
  });

  const getCurrentDate = () => {
    const today = new Date();
    return today.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getTimeUntilClass = (startTime: string) => {
    const now = new Date();
    const [hours, minutes] = startTime.split(":");
    const classTime = new Date();
    classTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const diff = classTime.getTime() - now.getTime();
    const minutesUntil = Math.round(diff / (1000 * 60));
    
    if (minutesUntil < 0) return "Started";
    if (minutesUntil < 60) return `in ${minutesUntil} min`;
    const hoursUntil = Math.floor(minutesUntil / 60);
    return `in ${hoursUntil}h ${minutesUntil % 60}m`;
  };

  const getNextClass = () => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    for (const schedule of todaySchedules) {
      const [hours, minutes] = schedule.startTime.split(":");
      const classTime = parseInt(hours) * 60 + parseInt(minutes);
      
      if (classTime > currentTime) {
        return schedule;
      }
    }
    return null;
  };

  const nextClass = getNextClass();

  return (
    <div className="w-full lg:w-80 bg-white border-r border-slate-200 flex flex-col">
      {/* Search Section */}
      <div className="p-4 border-b border-slate-200">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search buildings, rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button className="flex items-center justify-center space-x-2 bg-primary text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm">
            <Plus className="h-4 w-4" />
            <span>Add Class</span>
          </Button>
          <Button variant="outline" className="flex items-center justify-center space-x-2 bg-slate-100 text-slate-700 py-2 px-3 rounded-lg hover:bg-slate-200 transition-colors text-sm">
            <Navigation className="h-4 w-4" />
            <span>Directions</span>
          </Button>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">Today's Schedule</h3>
          <span className="text-xs text-slate-500">{getCurrentDate()}</span>
        </div>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-200 animate-pulse rounded-lg h-20"></div>
            ))}
          </div>
        ) : todaySchedules.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No classes scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todaySchedules.map((schedule: any) => {
              const isNext = nextClass?.id === schedule.id;
              
              return (
                <div
                  key={schedule.id}
                  className={`border rounded-lg p-3 hover:shadow-sm transition-shadow cursor-pointer ${
                    isNext
                      ? "bg-blue-50 border-blue-200"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-800">
                        {schedule.course?.name || "Unnamed Course"}
                      </h4>
                      <p className="text-sm text-slate-600 mt-1">
                        {schedule.room?.building?.name} - Room {schedule.room?.number}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{schedule.startTime} - {schedule.endTime}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>200m away</span>
                        </span>
                      </div>
                    </div>
                    {isNext && (
                      <div className="flex flex-col items-end space-y-1">
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                          Next
                        </span>
                        <span className="text-xs text-slate-500">
                          {getTimeUntilClass(schedule.startTime)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Campus Amenities */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Nearby Amenities</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <Coffee className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-slate-700">Campus Café</span>
              </div>
              <span className="text-xs text-slate-500">50m</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <Book className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-slate-700">Main Library</span>
              </div>
              <span className="text-xs text-slate-500">120m</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <Utensils className="h-4 w-4 text-green-600" />
                <span className="text-sm text-slate-700">Dining Hall</span>
              </div>
              <span className="text-xs text-slate-500">200m</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
