import { storage } from "./storage";
import { WebSocketServer } from "ws";
import type { Server } from "http";

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

class NotificationService {
  private notifications: Map<number, Notification[]> = new Map();
  private wss: WebSocketServer | null = null;
  private clients: Map<number, Set<any>> = new Map();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws/notifications' });
    
    this.wss.on('connection', (ws, req) => {
      let userId: number | null = null;
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          
          if (data.type === 'authenticate' && data.token) {
            // In a real implementation, you'd verify the JWT token here
            userId = data.userId;
            
            if (userId) {
              if (!this.clients.has(userId)) {
                this.clients.set(userId, new Set());
              }
              this.clients.get(userId)!.add(ws);
              
              // Send existing notifications to the newly connected client
              const userNotifications = this.notifications.get(userId) || [];
              ws.send(JSON.stringify({
                type: 'notifications',
                data: userNotifications
              }));
            }
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });
      
      ws.on('close', () => {
        if (userId) {
          const userClients = this.clients.get(userId);
          if (userClients) {
            userClients.delete(ws);
            if (userClients.size === 0) {
              this.clients.delete(userId);
            }
          }
        }
      });
    });

    // Start checking for upcoming classes
    this.startScheduleWatcher();
  }

  private startScheduleWatcher() {
    // Check every minute for upcoming classes
    setInterval(async () => {
      try {
        await this.checkUpcomingClasses();
      } catch (error) {
        console.error('Error checking upcoming classes:', error);
      }
    }, 60000); // 1 minute
  }

  private async checkUpcomingClasses() {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes
    
    // Get all users
    const users = await storage.getAllUsers();
    
    for (const user of users) {
      try {
        // Get user's schedules for today
        const schedules = await storage.getSchedulesByDay(user.id, currentDay);
        
        for (const schedule of schedules) {
          const [hours, minutes] = schedule.startTime.split(':').map(Number);
          const scheduleTime = hours * 60 + minutes;
          
          // Check if class starts in 15 minutes
          const timeDiff = scheduleTime - currentTime;
          
          if (timeDiff > 0 && timeDiff <= 15) {
            // Check if we've already sent this notification
            const existingNotifications = this.notifications.get(user.id) || [];
            const alreadySent = existingNotifications.some(n => 
              n.type === 'class_reminder' && 
              n.data?.scheduleId === schedule.id &&
              new Date(n.timestamp).toDateString() === now.toDateString()
            );
            
            if (!alreadySent) {
              await this.sendNotification(user.id, {
                type: 'class_reminder',
                title: 'Class Reminder',
                message: `Your ${schedule.course.name} class starts in ${timeDiff} minutes in ${schedule.room.building.name}, Room ${schedule.room.number}.`,
                data: {
                  scheduleId: schedule.id,
                  courseId: schedule.course.id,
                  roomId: schedule.room.id,
                  buildingId: schedule.room.building.id,
                  startTime: schedule.startTime,
                  endTime: schedule.endTime
                }
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error checking schedules for user ${user.id}:`, error);
      }
    }
  }

  async sendNotification(userId: number, notification: Omit<Notification, 'id' | 'userId' | 'timestamp' | 'read'>) {
    const fullNotification: Notification = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      timestamp: new Date(),
      read: false,
      ...notification
    };

    // Store notification
    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }
    
    const userNotifications = this.notifications.get(userId)!;
    userNotifications.unshift(fullNotification);
    
    // Keep only last 50 notifications per user
    if (userNotifications.length > 50) {
      userNotifications.splice(50);
    }

    // Send to connected clients
    const userClients = this.clients.get(userId);
    if (userClients) {
      const message = JSON.stringify({
        type: 'notification',
        data: fullNotification
      });
      
      userClients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(message);
        }
      });
    }
  }

  getNotifications(userId: number): Notification[] {
    return this.notifications.get(userId) || [];
  }

  markAsRead(userId: number, notificationId: string): boolean {
    const userNotifications = this.notifications.get(userId);
    if (userNotifications) {
      const notification = userNotifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        return true;
      }
    }
    return false;
  }

  getUnreadCount(userId: number): number {
    const userNotifications = this.notifications.get(userId);
    return userNotifications ? userNotifications.filter(n => !n.read).length : 0;
  }
}

export const notificationService = new NotificationService();