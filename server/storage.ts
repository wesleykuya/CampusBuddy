import { 
  users, buildings, rooms, courses, schedules, reminders,
  type User, type InsertUser, type Building, type InsertBuilding,
  type Room, type InsertRoom, type Course, type InsertCourse,
  type Schedule, type InsertSchedule, type Reminder, type InsertReminder,
  type CourseWithSchedules, type ScheduleWithDetails
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Building methods
  getAllBuildings(): Promise<Building[]>;
  getBuilding(id: number): Promise<Building | undefined>;
  createBuilding(building: InsertBuilding): Promise<Building>;
  updateBuilding(id: number, building: Partial<InsertBuilding>): Promise<Building | undefined>;
  
  // Room methods
  getRoomsByBuilding(buildingId: number): Promise<Room[]>;
  getRoom(id: number): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  
  // Course methods
  getCoursesByUser(userId: number): Promise<CourseWithSchedules[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;
  
  // Schedule methods
  getSchedulesByUser(userId: number): Promise<ScheduleWithDetails[]>;
  getSchedulesByDay(userId: number, dayOfWeek: number): Promise<ScheduleWithDetails[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule | undefined>;
  deleteSchedule(id: number): Promise<boolean>;
  
  // Reminder methods
  getRemindersByUser(userId: number): Promise<Reminder[]>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminder(id: number, reminder: Partial<InsertReminder>): Promise<Reminder | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllBuildings(): Promise<Building[]> {
    return await db.select().from(buildings).where(eq(buildings.isActive, true));
  }

  async getBuilding(id: number): Promise<Building | undefined> {
    const [building] = await db.select().from(buildings).where(eq(buildings.id, id));
    return building || undefined;
  }

  async createBuilding(building: InsertBuilding): Promise<Building> {
    const [newBuilding] = await db.insert(buildings).values(building).returning();
    return newBuilding;
  }

  async updateBuilding(id: number, building: Partial<InsertBuilding>): Promise<Building | undefined> {
    const [updated] = await db.update(buildings)
      .set(building)
      .where(eq(buildings.id, id))
      .returning();
    return updated || undefined;
  }

  async getRoomsByBuilding(buildingId: number): Promise<Room[]> {
    return await db.select().from(rooms).where(eq(rooms.buildingId, buildingId));
  }

  async getRoom(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room || undefined;
  }

  async createRoom(room: InsertRoom): Promise<Room> {
    const [newRoom] = await db.insert(rooms).values(room).returning();
    return newRoom;
  }

  async getCoursesByUser(userId: number): Promise<CourseWithSchedules[]> {
    return await db.query.courses.findMany({
      where: eq(courses.userId, userId),
      with: {
        schedules: {
          with: {
            room: {
              with: {
                building: true,
              },
            },
          },
        },
      },
    });
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course || undefined;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined> {
    const [updated] = await db.update(courses)
      .set(course)
      .where(eq(courses.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCourse(id: number): Promise<boolean> {
    const result = await db.delete(courses).where(eq(courses.id, id));
    return result.rowCount > 0;
  }

  async getSchedulesByUser(userId: number): Promise<ScheduleWithDetails[]> {
    return await db.query.schedules.findMany({
      where: eq(schedules.isActive, true),
      with: {
        course: {
          where: eq(courses.userId, userId),
        },
        room: {
          with: {
            building: true,
          },
        },
      },
    });
  }

  async getSchedulesByDay(userId: number, dayOfWeek: number): Promise<ScheduleWithDetails[]> {
    return await db.query.schedules.findMany({
      where: and(
        eq(schedules.dayOfWeek, dayOfWeek),
        eq(schedules.isActive, true)
      ),
      with: {
        course: {
          where: eq(courses.userId, userId),
        },
        room: {
          with: {
            building: true,
          },
        },
      },
    });
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const [newSchedule] = await db.insert(schedules).values(schedule).returning();
    return newSchedule;
  }

  async updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule | undefined> {
    const [updated] = await db.update(schedules)
      .set(schedule)
      .where(eq(schedules.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSchedule(id: number): Promise<boolean> {
    const result = await db.delete(schedules).where(eq(schedules.id, id));
    return result.rowCount > 0;
  }

  async getRemindersByUser(userId: number): Promise<Reminder[]> {
    return await db.select().from(reminders).where(eq(reminders.userId, userId));
  }

  async createReminder(reminder: InsertReminder): Promise<Reminder> {
    const [newReminder] = await db.insert(reminders).values(reminder).returning();
    return newReminder;
  }

  async updateReminder(id: number, reminder: Partial<InsertReminder>): Promise<Reminder | undefined> {
    const [updated] = await db.update(reminders)
      .set(reminder)
      .where(eq(reminders.id, id))
      .returning();
    return updated || undefined;
  }
}

export const storage = new DatabaseStorage();
