import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerAuthRoutes, authenticateToken, requireRole } from "./auth-routes";
import { 
  insertCourseSchema, insertScheduleSchema, insertBuildingSchema, 
  insertRoomSchema, insertFloorSchema, insertSystemCourseSchema
} from "@shared/schema";
import multer from "multer";
import { parseCoursesFromFile } from "./file-parser";
import { notificationService } from "./notification-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only PDF, Word, Excel, and CSV files are allowed.'));
      }
    },
  });

  // Register authentication routes
  registerAuthRoutes(app);

  // Buildings routes
  app.get("/api/buildings", async (req, res) => {
    try {
      const buildings = await storage.getAllBuildings();
      res.json(buildings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/buildings", authenticateToken, requireRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const buildingData = insertBuildingSchema.parse(req.body);
      const building = await storage.createBuilding(buildingData);
      res.json(building);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/buildings/:id", authenticateToken, requireRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const buildingId = parseInt(req.params.id);
      const buildingData = insertBuildingSchema.partial().parse(req.body);
      const building = await storage.updateBuilding(buildingId, buildingData);
      
      if (!building) {
        return res.status(404).json({ message: "Building not found" });
      }
      
      res.json(building);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/buildings/:id", authenticateToken, requireRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const buildingId = parseInt(req.params.id);
      const success = await storage.deleteBuilding(buildingId);
      
      if (!success) {
        return res.status(404).json({ message: "Building not found" });
      }
      
      res.json({ message: "Building deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/buildings/:id/rooms", async (req, res) => {
    try {
      const buildingId = parseInt(req.params.id);
      const rooms = await storage.getRoomsByBuilding(buildingId);
      res.json(rooms);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Floor routes
  app.get("/api/buildings/:id/floors", async (req, res) => {
    try {
      const buildingId = parseInt(req.params.id);
      const floors = await storage.getFloorsByBuilding(buildingId);
      res.json(floors);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/floors/:id", async (req, res) => {
    try {
      const floorId = parseInt(req.params.id);
      const floor = await storage.getFloor(floorId);
      if (!floor) {
        return res.status(404).json({ message: "Floor not found" });
      }
      res.json(floor);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/floors", authenticateToken, async (req, res) => {
    try {
      // Check if user is admin
      const user = await storage.getUser(req.user.id);
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const floorData = insertFloorSchema.parse(req.body);
      const floor = await storage.createFloor(floorData);
      res.json(floor);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/floors/:id", authenticateToken, async (req, res) => {
    try {
      // Check if user is admin
      const user = await storage.getUser(req.user.id);
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const floorId = parseInt(req.params.id);
      const floorData = insertFloorSchema.partial().parse(req.body);
      const floor = await storage.updateFloor(floorId, floorData);

      if (!floor) {
        return res.status(404).json({ message: "Floor not found" });
      }

      res.json(floor);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/floors/:id", authenticateToken, async (req, res) => {
    try {
      // Check if user is admin
      const user = await storage.getUser(req.user.id);
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const floorId = parseInt(req.params.id);
      const deleted = await storage.deleteFloor(floorId);

      if (deleted) {
        res.json({ message: "Floor deleted successfully" });
      } else {
        res.status(404).json({ message: "Floor not found" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Courses routes
  app.get("/api/courses", authenticateToken, async (req, res) => {
    try {
      const courses = await storage.getCoursesByUser(req.user.id);
      res.json(courses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/courses", authenticateToken, async (req, res) => {
    try {
      const courseData = insertCourseSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      const course = await storage.createCourse(courseData);
      res.json(course);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/courses/:id", authenticateToken, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const courseData = insertCourseSchema.partial().parse(req.body);

      // Verify course belongs to user
      const existingCourse = await storage.getCourse(courseId);
      if (!existingCourse || existingCourse.userId !== req.user.id) {
        return res.status(404).json({ message: "Course not found" });
      }

      const course = await storage.updateCourse(courseId, courseData);
      res.json(course);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/courses/:id", authenticateToken, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);

      // Verify course belongs to user
      const existingCourse = await storage.getCourse(courseId);
      if (!existingCourse || existingCourse.userId !== req.user.id) {
        return res.status(404).json({ message: "Course not found" });
      }

      const deleted = await storage.deleteCourse(courseId);
      if (deleted) {
        res.json({ message: "Course deleted successfully" });
      } else {
        res.status(404).json({ message: "Course not found" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Schedules routes
  app.get("/api/schedules", authenticateToken, async (req, res) => {
    try {
      const schedules = await storage.getSchedulesByUser(req.user.id);
      res.json(schedules);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/schedules/today", authenticateToken, async (req, res) => {
    try {
      const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
      const schedules = await storage.getSchedulesByDay(req.user.id, today);
      res.json(schedules);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/schedules", authenticateToken, async (req, res) => {
    try {
      const scheduleData = insertScheduleSchema.parse(req.body);

      // Verify course exists
      const course = await storage.getCourse(scheduleData.courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // If it's a personal course, verify it belongs to the user
      if (!course.isSystemCourse && course.userId !== req.user.id) {
        return res.status(403).json({ message: "Invalid course" });
      }

      const schedule = await storage.createSchedule(scheduleData);
      
      // Fetch the complete schedule with course and room details
      const completeSchedule = await storage.getScheduleWithDetails(schedule.id);
      res.json(completeSchedule);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/schedules/:id", authenticateToken, async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      const scheduleData = insertScheduleSchema.partial().parse(req.body);

      const schedule = await storage.updateSchedule(scheduleId, scheduleData);
      res.json(schedule);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/schedules/:id", authenticateToken, async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      const deleted = await storage.deleteSchedule(scheduleId);

      if (deleted) {
        res.json({ message: "Schedule deleted successfully" });
      } else {
        res.status(404).json({ message: "Schedule not found" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // System Courses routes (Admin only)
  app.get("/api/admin/system-courses", authenticateToken, requireRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const courses = await storage.getAllSystemCourses();
      res.json(courses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/system-courses", authenticateToken, requireRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const courseData = insertSystemCourseSchema.parse(req.body);
      const course = await storage.createSystemCourse(courseData);
      res.json(course);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/admin/system-courses/:id", authenticateToken, requireRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const courseData = insertSystemCourseSchema.partial().parse(req.body);
      const course = await storage.updateSystemCourse(courseId, courseData);

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      res.json(course);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/system-courses/:id", authenticateToken, requireRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const deleted = await storage.deleteSystemCourse(courseId);

      if (deleted) {
        res.json({ message: "Course deleted successfully" });
      } else {
        res.status(404).json({ message: "Course not found" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  

  // Public route to get system courses for students
  app.get("/api/system-courses", async (req, res) => {
    try {
      const courses = await storage.getAllSystemCourses();
      res.json(courses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Course import route (Admin only)
  app.post("/api/admin/import-courses", authenticateToken, requireRole(["admin", "super_admin"]), upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const courses = await parseCoursesFromFile(req.file);
      
      if (courses.length === 0) {
        return res.status(400).json({ message: "No valid courses found in the file" });
      }

      // Save courses to database
      const savedCourses = [];
      for (const courseData of courses) {
        try {
          const validatedCourse = insertSystemCourseSchema.parse(courseData);
          const savedCourse = await storage.createSystemCourse(validatedCourse);
          savedCourses.push(savedCourse);
        } catch (error) {
          console.warn(`Skipping invalid course: ${JSON.stringify(courseData)}`);
        }
      }

      res.json({
        message: `Successfully imported ${savedCourses.length} courses`,
        count: savedCourses.length,
        courses: savedCourses
      });
    } catch (error: any) {
      console.error("Course import error:", error);
      res.status(500).json({ message: error.message || "Failed to import courses" });
    }
  });

  // Admin user management routes (Super Admin only)
  app.get("/api/admin/users", authenticateToken, requireRole(["super_admin"]), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Buildings CRUD operations
  app.put("/api/buildings/:id", authenticateToken, requireRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const buildingId = parseInt(req.params.id);
      const buildingData = insertBuildingSchema.partial().parse(req.body);
      const building = await storage.updateBuilding(buildingId, buildingData);

      if (!building) {
        return res.status(404).json({ message: "Building not found" });
      }

      res.json(building);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/buildings/:id", authenticateToken, requireRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const buildingId = parseInt(req.params.id);
      const deleted = await storage.deleteBuilding(buildingId);

      if (deleted) {
        res.json({ message: "Building deleted successfully" });
      } else {
        res.status(404).json({ message: "Building not found" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Pathfinding route
  app.post("/api/floors/:id/pathfinding", async (req, res) => {
    try {
      const floorId = parseInt(req.params.id);
      const { startNode, endNode } = req.body;

      const floor = await storage.getFloor(floorId);
      if (!floor) {
        return res.status(404).json({ message: "Floor not found" });
      }

      const { createPathfindingService } = await import("./pathfinding");
      const pathfinder = createPathfindingService(floor);
      const result = pathfinder.findPath(startNode, endNode);

      if (!result) {
        return res.status(404).json({ message: "No path found" });
      }

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin user management routes (Super Admin only)
  app.get("/api/admin/users", authenticateToken, requireRole(["super_admin"]), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/admin/users/:id", authenticateToken, requireRole(["super_admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const userData = req.body;
      
      const user = await storage.updateUser(userId, userData);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/users/:id", authenticateToken, requireRole(["super_admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const success = await storage.deleteUser(userId);
      
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin schedule management routes
  app.get("/api/admin/schedules", authenticateToken, requireRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const schedules = await storage.getAllSchedules();
      res.json(schedules);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/schedules", authenticateToken, requireRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const scheduleData = insertScheduleSchema.parse(req.body);
      const schedule = await storage.createSchedule(scheduleData);
      
      // Fetch the complete schedule with course and room details
      const completeSchedule = await storage.getScheduleWithDetails(schedule.id);
      res.json(completeSchedule);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/admin/schedules/:id", authenticateToken, requireRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      const scheduleData = insertScheduleSchema.partial().parse(req.body);
      const schedule = await storage.updateSchedule(scheduleId, scheduleData);
      
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      res.json(schedule);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/schedules/:id", authenticateToken, requireRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      const deleted = await storage.deleteSchedule(scheduleId);

      if (deleted) {
        res.json({ message: "Schedule deleted successfully" });
      } else {
        res.status(404).json({ message: "Schedule not found" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Rooms API for admin
  app.get("/api/rooms", async (req, res) => {
    try {
      const rooms = await storage.getAllRooms();
      res.json(rooms);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Notification routes
  app.get("/api/notifications", authenticateToken, async (req, res) => {
    try {
      const notifications = notificationService.getNotifications(req.user.id);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/notifications/:id/read", authenticateToken, async (req, res) => {
    try {
      const notificationId = req.params.id;
      const success = notificationService.markAsRead(req.user.id, notificationId);
      
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json({ message: "Notification marked as read" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/notifications/unread-count", authenticateToken, async (req, res) => {
    try {
      const count = notificationService.getUnreadCount(req.user.id);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize notification service
  notificationService.initialize(httpServer);
  
  return httpServer;
}