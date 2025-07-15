import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, X, Navigation } from "lucide-react";
import { useAuth, getAuthHeaders } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";

interface Notification {
  id: string;
  userId: number;
  type: 'class_reminder' | 'schedule_change' | 'system_announcement';
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  read: boolean;
}

export function NotificationToast() {
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const { user } = useAuth();

  // Fetch initial notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const response = await fetch("/api/notifications", {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch notifications");
      return response.json();
    },
    enabled: !!user,
  });

  // Set up WebSocket connection for real-time notifications
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/notifications`;
    
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
      console.log("Notification WebSocket connected");
      // Authenticate with the server
      websocket.send(JSON.stringify({
        type: 'authenticate',
        userId: user.id,
        token: localStorage.getItem('token')
      }));
    };
    
    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'notification') {
          // Show new notification
          setVisibleNotifications(prev => [data.data, ...prev].slice(0, 5)); // Keep only 5 visible
        } else if (data.type === 'notifications') {
          // Initial notifications load
          const unreadNotifications = data.data.filter((n: Notification) => !n.read).slice(0, 5);
          setVisibleNotifications(unreadNotifications);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    websocket.onclose = () => {
      console.log("Notification WebSocket disconnected");
    };
    
    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    setWs(websocket);
    
    return () => {
      websocket.close();
    };
  }, [user]);

  // Load unread notifications on mount
  useEffect(() => {
    if (notifications.length > 0) {
      const unreadNotifications = notifications.filter((n: Notification) => !n.read).slice(0, 5);
      setVisibleNotifications(unreadNotifications);
    }
  }, [notifications]);

  const dismissNotification = async (id: string) => {
    // Mark as read on server
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: "include",
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
    
    // Remove from visible notifications
    setVisibleNotifications(prev => prev.filter(n => n.id !== id));
  };

  const dismissAll = () => {
    setVisibleNotifications([]);
  };

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {visibleNotifications.map((notification, index) => (
        <Card
          key={notification.id}
          className={`bg-white border-l-4 shadow-lg p-4 transform transition-all duration-300 ${
            notification.type === 'class_reminder' 
              ? 'border-amber-500' 
              : notification.type === 'schedule_change' 
                ? 'border-red-500' 
                : 'border-blue-500'
          }`}
          style={{
            transform: `translateX(${index === 0 ? '0' : '100%'})`,
            animation: index === 0 ? 'slideIn 0.3s ease-out' : 'none',
          }}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Bell className={`h-5 w-5 ${
                notification.type === 'class_reminder' 
                  ? 'text-amber-500' 
                  : notification.type === 'schedule_change' 
                    ? 'text-red-500' 
                    : 'text-blue-500'
              }`} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-slate-800">
                {notification.title}
              </h4>
              <p className="text-sm text-slate-600 mt-1">
                {notification.message}
              </p>
              <div className="mt-3 flex space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-primary hover:text-blue-700 font-medium p-0 h-auto"
                >
                  <Navigation className="h-3 w-3 mr-1" />
                  Get Directions
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-slate-500 hover:text-slate-700 p-0 h-auto"
                  onClick={() => dismissNotification(notification.id)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 p-1 h-auto"
              onClick={() => dismissNotification(notification.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}

      <style jsx="true" global="true">{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}