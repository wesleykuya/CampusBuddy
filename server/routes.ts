import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerAuthRoutes, authenticateToken, requireRole } from "./auth-routes";
import { 
  insertCourseSchema, insertScheduleSchema, insertBuildingSchema, 
  insertRoomSchema, insertFloorSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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

  app.post("/api/buildings", authenticateToken, async (req, res) => {
    try {
      // Check if user is admin
      const user = await storage.getUser(req.user.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const buildingData = insertBuildingSchema.parse(req.body);
      const building = await storage.createBuilding(buildingData);
      res.json(building);
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
      if (!user?.isAdmin) {
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
      if (!user?.isAdmin) {
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
      if (!user?.isAdmin) {
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
      
      // Verify course belongs to user
      const course = await storage.getCourse(scheduleData.courseId);
      if (!course || course.userId !== req.user.id) {
        return res.status(403).json({ message: "Invalid course" });
      }

      const schedule = await storage.createSchedule(scheduleData);
      res.json(schedule);
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

  const httpServer = createServer(app);
  return httpServer;
}
