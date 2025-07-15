import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, X, Navigation } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'reminder' | 'alert' | 'info';
  timestamp: Date;
}

export function NotificationToast() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);

  // Simulate notifications (in a real app, these would come from the backend)
  useEffect(() => {
    const simulateNotifications = () => {
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'Class Reminder',
          message: 'Your CS101 class starts in 15 minutes in Building A, Room 205.',
          type: 'reminder',
          timestamp: new Date(),
        },
      ];

      // Show notification after 3 seconds
      setTimeout(() => {
        setNotifications(mockNotifications);
        setVisibleNotifications(mockNotifications);
      }, 3000);
    };

    simulateNotifications();
  }, []);

  const dismissNotification = (id: string) => {
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
            notification.type === 'reminder' 
              ? 'border-amber-500' 
              : notification.type === 'alert' 
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
                notification.type === 'reminder' 
                  ? 'text-amber-500' 
                  : notification.type === 'alert' 
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