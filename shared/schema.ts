import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("student"), // student, admin, super_admin
  department: text("department"),
  studentId: text("student_id"),
  profileImage: text("profile_image"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLogin: timestamp("last_login"),
});

export const buildings = pgTable("buildings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  type: text("type").notNull(), // 'academic', 'amenity', 'dormitory'
  amenities: jsonb("amenities").default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const floors = pgTable("floors", {
  id: serial("id").primaryKey(),
  buildingId: integer("building_id").references(() => buildings.id).notNull(),
  level: integer("level").notNull(),
  name: text("name"), // e.g., "Ground Floor", "1st Floor"
  schematicImage: text("schematic_image"), // Base64 or URL
  nodes: jsonb("nodes").default([]), // {id, type, x, y, connections[], label}
  paths: jsonb("paths").default([]), // {id, startNode, endNode, pathType, distance}
  canvasData: jsonb("canvas_data"), // Fabric.js canvas state
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  buildingId: integer("building_id").references(() => buildings.id).notNull(),
  number: text("number").notNull(),
  name: text("name"),
  capacity: integer("capacity"),
  type: text("type"), // 'lecture', 'lab', 'office'
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  code: text("code").notNull(),
  instructor: text("instructor"),
  color: text("color").default("#2563EB"),
  description: text("description"),
  department: text("department"),
  credits: integer("credits"),
  isSystemCourse: boolean("is_system_course").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  roomId: integer("room_id").references(() => rooms.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(), // HH:MM format
  isActive: boolean("is_active").default(true),
});

export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  scheduleId: integer("schedule_id").references(() => schedules.id).notNull(),
  minutesBefore: integer("minutes_before").default(15),
  isEnabled: boolean("is_enabled").default(true),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  courses: many(courses),
  reminders: many(reminders),
}));

export const buildingsRelations = relations(buildings, ({ many }) => ({
  rooms: many(rooms),
  floors: many(floors),
}));

export const floorsRelations = relations(floors, ({ one }) => ({
  building: one(buildings, {
    fields: [floors.buildingId],
    references: [buildings.id],
  }),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  building: one(buildings, {
    fields: [rooms.buildingId],
    references: [buildings.id],
  }),
  schedules: many(schedules),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  user: one(users, {
    fields: [courses.userId],
    references: [users.id],
  }),
  schedules: many(schedules),
}));

export const schedulesRelations = relations(schedules, ({ one }) => ({
  course: one(courses, {
    fields: [schedules.courseId],
    references: [courses.id],
  }),
  room: one(rooms, {
    fields: [schedules.roomId],
    references: [rooms.id],
  }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  user: one(users, {
    fields: [reminders.userId],
    references: [users.id],
  }),
  schedule: one(schedules, {
    fields: [reminders.scheduleId],
    references: [schedules.id],
  }),
}));



// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email address"),
});

export const insertBuildingSchema = createInsertSchema(buildings).omit({
  id: true,
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true,
});

export const insertReminderSchema = createInsertSchema(reminders).omit({
  id: true,
});

export const insertFloorSchema = createInsertSchema(floors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSystemCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  isSystemCourse: z.boolean().default(true),
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// User role schema
export const userRoleSchema = z.enum(["student", "admin", "super_admin"]);

// Create user schema for super admin
export const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(2, "Full name is required"),
  role: userRoleSchema,
  department: z.string().optional(),
  studentId: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertBuilding = z.infer<typeof insertBuildingSchema>;
export type Building = typeof buildings.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type Schedule = typeof schedules.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Reminder = typeof reminders.$inferSelect;
export type InsertFloor = z.infer<typeof insertFloorSchema>;
export type Floor = typeof floors.$inferSelect;
export type InsertSystemCourse = z.infer<typeof insertSystemCourseSchema>;
export type SystemCourse = Course;
export type LoginCredentials = z.infer<typeof loginSchema>;

// Extended types with relations
export type CourseWithSchedules = Course & {
  schedules: (Schedule & {
    room: Room & {
      building: Building;
    };
  })[];
};

export type ScheduleWithDetails = Schedule & {
  course: Course;
  room: Room & {
    building: Building;
  };
};
