import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { 
  insertUserSchema, loginSchema, insertCourseSchema, 
  insertScheduleSchema, insertBuildingSchema, insertRoomSchema 
} from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "campus-buddy-secret-key";

// Middleware to verify JWT token
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username) || 
                          await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          isAdmin: user.isAdmin,
        },
        token,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(credentials.username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(credentials.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          isAdmin: user.isAdmin,
        },
        token,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        isAdmin: user.isAdmin,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

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

  const httpServer = createServer(app);
  return httpServer;
}
