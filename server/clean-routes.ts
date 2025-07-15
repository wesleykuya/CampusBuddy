import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerAuthRoutes, authenticateToken, requireRole } from "./auth-routes";
import { 
  insertCourseSchema, insertScheduleSchema, insertBuildingSchema, 
  insertRoomSchema, insertFloorSchema, insertSystemCourseSchema
} from "@shared/schema";
import { createPathfindingService } from "./pathfinding";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register authentication routes
  registerAuthRoutes(app);

  // Building routes (admin/super_admin only)
  app.get("/api/buildings", async (req, res) => {
    try {
      const buildings = await storage.getAllBuildings();
      res.json(buildings);
    } catch (error) {
      console.error("Get buildings error:", error);
      res.status(500).json({ message: "Failed to get buildings" });
    }
  });

  app.post("/api/buildings", authenticateToken, requireRole(["admin", "super_admin"]), async (req: any, res) => {
    try {
      const buildingData = insertBuildingSchema.parse(req.body);
      const building = await storage.createBuilding(buildingData);
      res.status(201).json(building);
    } catch (error) {
      console.error("Create building error:", error);
      res.status(500).json({ message: "Failed to create building" });
    }
  });

  app.put("/api/buildings/:id", authenticateToken, requireRole(["admin", "super_admin"]), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const buildingData = req.body;
      const building = await storage.updateBuilding(id, buildingData);
      if (!building) {
        return res.status(404).json({ message: "Building not found" });
      }
      res.json(building);
    } catch (error) {
      console.error("Update building error:", error);
      res.status(500).json({ message: "Failed to update building" });
    }
  });

  // Floor routes (admin/super_admin only)
  app.get("/api/buildings/:buildingId/floors", async (req, res) => {
    try {
      const buildingId = parseInt(req.params.buildingId);
      const floors = await storage.getFloorsByBuilding(buildingId);
      res.json(floors);
    } catch (error) {
      console.error("Get floors error:", error);
      res.status(500).json({ message: "Failed to get floors" });
    }
  });

  app.post("/api/buildings/:buildingId/floors", authenticateToken, requireRole(["admin", "super_admin"]), async (req: any, res) => {
    try {
      const buildingId = parseInt(req.params.buildingId);
      const floorData = insertFloorSchema.parse({
        ...req.body,
        buildingId
      });
      const floor = await storage.createFloor(floorData);
      res.status(201).json(floor);
    } catch (error) {
      console.error("Create floor error:", error);
      res.status(500).json({ message: "Failed to create floor" });
    }
  });

  app.put("/api/floors/:id", authenticateToken, requireRole(["admin", "super_admin"]), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const floorData = insertFloorSchema.parse(req.body);
      const floor = await storage.updateFloor(id, floorData);
      if (!floor) {
        return res.status(404).json({ message: "Floor not found" });
      }
      res.json(floor);
    } catch (error) {
      console.error("Update floor error:", error);
      res.status(500).json({ message: "Failed to update floor" });
    }
  });

  app.delete("/api/floors/:id", authenticateToken, requireRole(["admin", "super_admin"]), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteFloor(id);
      if (!success) {
        return res.status(404).json({ message: "Floor not found" });
      }
      res.json({ message: "Floor deleted successfully" });
    } catch (error) {
      console.error("Delete floor error:", error);
      res.status(500).json({ message: "Failed to delete floor" });
    }
  });

  // Room routes
  app.get("/api/buildings/:buildingId/rooms", async (req, res) => {
    try {
      const buildingId = parseInt(req.params.buildingId);
      const rooms = await storage.getRoomsByBuilding(buildingId);
      res.json(rooms);
    } catch (error) {
      console.error("Get rooms error:", error);
      res.status(500).json({ message: "Failed to get rooms" });
    }
  });

  // Course routes (authenticated users)
  app.get("/api/courses", authenticateToken, async (req: any, res) => {
    try {
      const courses = await storage.getCoursesByUser(req.user.id);
      res.json(courses);
    } catch (error) {
      console.error("Get courses error:", error);
      res.status(500).json({ message: "Failed to get courses" });
    }
  });

  app.post("/api/courses", authenticateToken, async (req: any, res) => {
    try {
      const courseData = insertCourseSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      const course = await storage.createCourse(courseData);
      res.status(201).json(course);
    } catch (error) {
      console.error("Create course error:", error);
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.put("/api/courses/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const courseData = insertCourseSchema.parse(req.body);
      const course = await storage.updateCourse(id, courseData);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      console.error("Update course error:", error);
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  app.delete("/api/courses/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCourse(id);
      if (!success) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json({ message: "Course deleted successfully" });
    } catch (error) {
      console.error("Delete course error:", error);
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  // Schedule routes (authenticated users)
  app.get("/api/schedules", authenticateToken, async (req: any, res) => {
    try {
      const schedules = await storage.getSchedulesByUser(req.user.id);
      res.json(schedules);
    } catch (error) {
      console.error("Get schedules error:", error);
      res.status(500).json({ message: "Failed to get schedules" });
    }
  });

  app.get("/api/schedules/day/:day", authenticateToken, async (req: any, res) => {
    try {
      const day = parseInt(req.params.day);
      const schedules = await storage.getSchedulesByDay(req.user.id, day);
      res.json(schedules);
    } catch (error) {
      console.error("Get schedules by day error:", error);
      res.status(500).json({ message: "Failed to get schedules" });
    }
  });

  app.post("/api/schedules", authenticateToken, async (req: any, res) => {
    try {
      const scheduleData = insertScheduleSchema.parse(req.body);
      const schedule = await storage.createSchedule(scheduleData);
      res.status(201).json(schedule);
    } catch (error) {
      console.error("Create schedule error:", error);
      res.status(500).json({ message: "Failed to create schedule" });
    }
  });

  app.put("/api/schedules/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const scheduleData = insertScheduleSchema.parse(req.body);
      const schedule = await storage.updateSchedule(id, scheduleData);
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      res.json(schedule);
    } catch (error) {
      console.error("Update schedule error:", error);
      res.status(500).json({ message: "Failed to update schedule" });
    }
  });

  app.delete("/api/schedules/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSchedule(id);
      if (!success) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      res.json({ message: "Schedule deleted successfully" });
    } catch (error) {
      console.error("Delete schedule error:", error);
      res.status(500).json({ message: "Failed to delete schedule" });
    }
  });

  // Pathfinding routes
  app.post("/api/pathfinding", async (req, res) => {
    try {
      const { startNode, endNode, floorData } = req.body;
      
      if (!startNode || !endNode || !floorData) {
        return res.status(400).json({ message: "Missing required pathfinding data" });
      }

      const pathfindingService = createPathfindingService(floorData);
      const result = pathfindingService.findPath(startNode, endNode);
      
      if (!result) {
        return res.status(404).json({ message: "No path found" });
      }
      
      res.json(result);
    } catch (error) {
      console.error("Pathfinding error:", error);
      res.status(500).json({ message: "Failed to find path" });
    }
  });

  // Reminder routes
  app.get("/api/reminders", authenticateToken, async (req: any, res) => {
    try {
      const reminders = await storage.getRemindersByUser(req.user.id);
      res.json(reminders);
    } catch (error) {
      console.error("Get reminders error:", error);
      res.status(500).json({ message: "Failed to get reminders" });
    }
  });

  app.post("/api/reminders", authenticateToken, async (req: any, res) => {
    try {
      const reminderData = { ...req.body, userId: req.user.id };
      const reminder = await storage.createReminder(reminderData);
      res.status(201).json(reminder);
    } catch (error) {
      console.error("Create reminder error:", error);
      res.status(500).json({ message: "Failed to create reminder" });
    }
  });

  app.put("/api/reminders/:id", authenticateToken, async (req: any, res) => {
    try {
      const reminderId = parseInt(req.params.id);
      const reminder = await storage.updateReminder(reminderId, req.body);
      res.json(reminder);
    } catch (error) {
      console.error("Update reminder error:", error);
      res.status(500).json({ message: "Failed to update reminder" });
    }
  });

  app.delete("/api/reminders/:id", authenticateToken, async (req: any, res) => {
    try {
      const reminderId = parseInt(req.params.id);
      const deleted = await storage.deleteReminder(reminderId);
      if (deleted) {
        res.json({ message: "Reminder deleted successfully" });
      } else {
        res.status(404).json({ message: "Reminder not found" });
      }
    } catch (error) {
      console.error("Delete reminder error:", error);
      res.status(500).json({ message: "Failed to delete reminder" });
    }
  });

  // Profile routes
  app.put("/api/auth/profile", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { fullName, email, department, studentId } = req.body;
      
      const updatedUser = await storage.updateUser(userId, {
        fullName,
        email,
        department,
        studentId,
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.put("/api/auth/change-password", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const bcrypt = require('bcrypt');
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(userId, { password: hashedNewPassword });
      
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Admin routes for system courses
  app.get("/api/admin/system-courses", authenticateToken, requireRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const courses = await storage.getAllSystemCourses();
      res.json(courses);
    } catch (error: any) {
      console.error("Get system courses error:", error);
      res.status(500).json({ message: "Failed to get system courses" });
    }
  });

  app.post("/api/admin/system-courses", authenticateToken, requireRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const courseData = insertSystemCourseSchema.parse(req.body);
      const course = await storage.createSystemCourse(courseData);
      res.status(201).json(course);
    } catch (error: any) {
      console.error("Create system course error:", error);
      res.status(500).json({ message: "Failed to create system course" });
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
      console.error("Update system course error:", error);
      res.status(500).json({ message: "Failed to update system course" });
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
      console.error("Delete system course error:", error);
      res.status(500).json({ message: "Failed to delete system course" });
    }
  });

  // Admin user management routes (Super Admin only)
  app.get("/api/admin/users", authenticateToken, requireRole(["super_admin"]), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.put("/api/admin/users/:id", authenticateToken, requireRole(["super_admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const userData = req.body;
      
      const updatedUser = await storage.updateUser(userId, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error: any) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
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
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Public route for students to get system courses
  app.get("/api/system-courses", async (req, res) => {
    try {
      const courses = await storage.getAllSystemCourses();
      res.json(courses);
    } catch (error: any) {
      console.error("Get system courses error:", error);
      res.status(500).json({ message: "Failed to get system courses" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}