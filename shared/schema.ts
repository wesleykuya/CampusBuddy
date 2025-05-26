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
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
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
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  instructor: text("instructor"),
  color: text("color").default("#2563EB"),
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

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
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
