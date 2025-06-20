import type { Express } from "express";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { 
  insertUserSchema, loginSchema, createUserSchema
} from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "campus-buddy-secret-key";

// Middleware to verify JWT token
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Role-based access control middleware
function requireRole(allowedRoles: string[]) {
  return async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'User not found or inactive' });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      req.user = { ...req.user, role: user.role, fullUser: user };
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
}

export function registerAuthRoutes(app: Express) {
  // Register user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(409).json({ message: "Email already exists" });
      }

      const user = await storage.createUser(userData);
      
      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          department: user.department,
          studentId: user.studentId,
        },
        token,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Login user
  app.post("/api/auth/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(credentials.username);
      if (!user || !user.isActive) {
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
          role: user.role,
          department: user.department,
          studentId: user.studentId,
        },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get current user info
  app.get("/api/auth/user", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Super Admin Routes - User Management
  app.get("/api/admin/users", authenticateToken, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.post("/api/admin/users", authenticateToken, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const validatedData = createUserSchema.parse(req.body);
      const newUser = await storage.createUser(validatedData);
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/admin/users/:id", authenticateToken, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updateData = req.body;
      
      // Don't allow super admin to change their own role
      if (userId === req.user.id && updateData.role) {
        return res.status(400).json({ message: "Cannot change your own role" });
      }

      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", authenticateToken, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Don't allow super admin to delete themselves
      if (userId === req.user.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      const success = await storage.deleteUser(userId);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.get("/api/admin/users/role/:role", authenticateToken, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const users = await storage.getUsersByRole(req.params.role);
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get users by role error:", error);
      res.status(500).json({ message: "Failed to get users by role" });
    }
  });
}

export { authenticateToken, requireRole };