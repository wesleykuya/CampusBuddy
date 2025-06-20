import { db } from "./db";
import { users, buildings, rooms, courses, schedules, reminders, floors } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcrypt";
import type { 
  User, InsertUser, Building, InsertBuilding, Room, InsertRoom,
  Course, InsertCourse, CourseWithSchedules, Schedule, InsertSchedule, 
  ScheduleWithDetails, Reminder, InsertReminder, Floor, InsertFloor
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getUsersByRole(role: string): Promise<User[]>;

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

  // Floor methods
  getFloorsByBuilding(buildingId: number): Promise<Floor[]>;
  getFloor(id: number): Promise<Floor | undefined>;
  createFloor(floor: InsertFloor): Promise<Floor>;
  updateFloor(id: number, floor: Partial<InsertFloor>): Promise<Floor | undefined>;
  deleteFloor(id: number): Promise<boolean>;
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
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isActive, true));
  }

  async updateUser(id: number, userData: Partial<InsertUser & { isActive?: boolean }>): Promise<User | undefined> {
    const updateData: any = { ...userData, updatedAt: new Date() };

    if (userData.password) {
      updateData.password = await bcrypt.hash(userData.password, 10);
    }
    if (userData.isActive !== undefined) {
      updateData.isActive = userData.isActive;
    }

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<boolean> {
    const [user] = await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return !!user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users)
      .where(and(eq(users.role, role), eq(users.isActive, true)));
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
    const userCourses = await db.query.courses.findMany({
      where: eq(courses.userId, userId),
      with: {
        schedules: {
          with: {
            room: {
              with: {
                building: true
              }
            }
          }
        }
      }
    });
    return userCourses;
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
    return (result.rowCount ?? 0) > 0;
  }

  async getSchedulesByUser(userId: number): Promise<ScheduleWithDetails[]> {
    const userSchedules = await db.query.schedules.findMany({
      where: eq(schedules.isActive, true),
      with: {
        course: true,
        room: {
          with: {
            building: true
          }
        }
      }
    });

    // Filter by userId through course relationship
    return userSchedules.filter(schedule => schedule.course.userId === userId);
  }

  async getSchedulesByDay(userId: number, dayOfWeek: number): Promise<ScheduleWithDetails[]> {
    const daySchedules = await db.query.schedules.findMany({
      where: and(
        eq(schedules.dayOfWeek, dayOfWeek),
        eq(schedules.isActive, true)
      ),
      with: {
        course: true,
        room: {
          with: {
            building: true
          }
        }
      }
    });

    // Filter by userId through course relationship
    return daySchedules.filter(schedule => schedule.course.userId === userId);
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
    return (result.rowCount ?? 0) > 0;
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

  async getFloorsByBuilding(buildingId: number): Promise<Floor[]> {
    return await db.select().from(floors).where(eq(floors.buildingId, buildingId));
  }

  async getFloor(id: number): Promise<Floor | undefined> {
    const [floor] = await db.select().from(floors).where(eq(floors.id, id));
    return floor || undefined;
  }

  async createFloor(floor: InsertFloor): Promise<Floor> {
    const [newFloor] = await db.insert(floors).values(floor).returning();
    return newFloor;
  }

  async updateFloor(id: number, floor: Partial<InsertFloor>): Promise<Floor | undefined> {
    const [updated] = await db.update(floors)
      .set(floor)
      .where(eq(floors.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteFloor(id: number): Promise<boolean> {
    const result = await db.delete(floors).where(eq(floors.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Reminder methods
  async getRemindersByUser(userId: number) {
    return await db
      .select()
      .from(reminders)
      .leftJoin(schedules, eq(reminders.scheduleId, schedules.id))
      .leftJoin(courses, eq(schedules.courseId, courses.id))
      .where(eq(reminders.userId, userId));
  }

  async createReminder(data: any) {
    const [reminder] = await db.insert(reminders).values(data).returning();
    return reminder;
  }

  async updateReminder(id: number, data: any) {
    const [reminder] = await db
      .update(reminders)
      .set(data)
      .where(eq(reminders.id, id))
      .returning();
    return reminder;
  }

  async deleteReminder(id: number): Promise<boolean> {
    const result = await db.delete(reminders).where(eq(reminders.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();