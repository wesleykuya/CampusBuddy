import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { NavigationHeader } from "@/components/navigation-header";
import { Sidebar } from "@/components/sidebar";
import { MapContainer } from "@/components/map-container";
import { ScheduleModal } from "@/components/schedule-modal";
import { NotificationToast } from "@/components/notification-toast";

export default function Home() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Campus Buddy...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="font-sans bg-slate-50 text-slate-800 min-h-screen">
      <NavigationHeader />
      
      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
        <Sidebar />
        <MapContainer />
      </div>

      <ScheduleModal />
      <NotificationToast />

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40">
        <div className="grid grid-cols-4 h-16">
          <button className="flex flex-col items-center justify-center space-y-1 text-primary">
            <i className="fas fa-map text-lg"></i>
            <span className="text-xs">Map</span>
          </button>
          <button className="flex flex-col items-center justify-center space-y-1 text-slate-600 hover:text-primary transition-colors">
            <i className="fas fa-calendar text-lg"></i>
            <span className="text-xs">Schedule</span>
          </button>
          <button className="flex flex-col items-center justify-center space-y-1 text-slate-600 hover:text-primary transition-colors">
            <i className="fas fa-bell text-lg"></i>
            <span className="text-xs">Alerts</span>
          </button>
          <button className="flex flex-col items-center justify-center space-y-1 text-slate-600 hover:text-primary transition-colors">
            <i className="fas fa-user text-lg"></i>
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
