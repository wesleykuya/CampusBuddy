import { db } from "./db";
import { 
  users, courses, schedules, reminders, buildings, rooms, floors
} from "@shared/schema";
import type { 
  InsertUser, InsertCourse, InsertSchedule, InsertBuilding, InsertRoom, InsertFloor, InsertSystemCourse,
  User, Course, Schedule, Building, Room, Floor, SystemCourse, CourseWithSchedules, ScheduleWithDetails
} from "@shared/schema";
import { eq, and, or } from "drizzle-orm";
import bcrypt from "bcrypt";


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
  getScheduleWithDetails(id: number): Promise<ScheduleWithDetails | undefined>;

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

    // System Courses
  createSystemCourse(courseData: InsertSystemCourse): Promise<SystemCourse>;
  getAllSystemCourses(): Promise<SystemCourse[]>;
  getSystemCourse(id: number): Promise<SystemCourse | undefined>;
  updateSystemCourse(id: number, courseData: Partial<InsertSystemCourse>): Promise<SystemCourse | undefined>;
  deleteSystemCourse(id: number): Promise<SystemCourse | undefined>;

  //Admin schedule management
  getAllSchedules(): Promise<any[]>;
  getAllRooms(): Promise<any[]>;
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
    try {
      return await db.select().from(buildings).where(eq(buildings.isActive, true));
    } catch (error) {
      console.error("Error in getAllBuildings:", error);
      // Fallback query without timestamp columns if they don't exist
      return await db.select({
        id: buildings.id,
        name: buildings.name,
        code: buildings.code,
        description: buildings.description,
        latitude: buildings.latitude,
        longitude: buildings.longitude,
        type: buildings.type,
        amenities: buildings.amenities,
        isActive: buildings.isActive
      }).from(buildings).where(eq(buildings.isActive, true));
    }
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
    const allCourses = await db.query.courses.findMany({
      where: and(
        eq(courses.isActive, true),
        // Get both user's personal courses and all system courses
        or(eq(courses.userId, userId), eq(courses.isSystemCourse, true))
      ),
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
    return allCourses as CourseWithSchedules[];
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
    return userSchedules.filter(schedule => schedule.course.userId === userId) as ScheduleWithDetails[];
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
    return daySchedules.filter(schedule => schedule.course.userId === userId) as ScheduleWithDetails[];
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

  async getScheduleWithDetails(id: number): Promise<ScheduleWithDetails | undefined> {
    const schedule = await db.query.schedules.findFirst({
      where: eq(schedules.id, id),
      with: {
        course: true,
        room: {
          with: {
            building: true
          }
        }
      }
    });
    return schedule as ScheduleWithDetails | undefined;
  }

  async getAllSchedules(): Promise<any[]> {
    const result = await db
      .select()
      .from(schedules)
      .leftJoin(courses, eq(schedules.courseId, courses.id))
      .leftJoin(rooms, eq(schedules.roomId, rooms.id))
      .leftJoin(buildings, eq(rooms.buildingId, buildings.id))
      .orderBy(schedules.dayOfWeek, schedules.startTime);

    return result.map(row => ({
      ...row.schedules,
      course: row.courses,
      room: row.rooms ? {
        ...row.rooms,
        building: row.buildings
      } : null
    }));
  }

  async getAllRooms(): Promise<any[]> {
    const result = await db
      .select()
      .from(rooms)
      .leftJoin(buildings, eq(rooms.buildingId, buildings.id))
      .orderBy(buildings.name, rooms.number);

    return result.map(row => ({
      ...row.rooms,
      building: row.buildings
    }));
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

  async deleteBuilding(buildingId: number): Promise<boolean> {
    const [updated] = await db.update(buildings)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(buildings.id, buildingId))
      .returning();
    return !!updated;
  }

  // System Courses
  async createSystemCourse(courseData: InsertSystemCourse): Promise<SystemCourse> {
    const [course] = await db.insert(courses).values({
      ...courseData,
      isSystemCourse: true,
      userId: null // System courses don't belong to a specific user
    }).returning();
    return course;
  }

  async getAllSystemCourses(): Promise<SystemCourse[]> {
    return await db.select().from(courses).where(
      and(eq(courses.isSystemCourse, true), eq(courses.isActive, true))
    ).orderBy(courses.code);
  }

  async getSystemCourse(id: number): Promise<SystemCourse | undefined> {
    const [course] = await db.select().from(courses).where(
      and(eq(courses.id, id), eq(courses.isSystemCourse, true))
    );
    return course || undefined;
  }

  async updateSystemCourse(id: number, courseData: Partial<InsertSystemCourse>): Promise<SystemCourse | undefined> {
    const [course] = await db.update(courses)
      .set({ ...courseData, updatedAt: new Date() })
      .where(and(eq(courses.id, id), eq(courses.isSystemCourse, true)))
      .returning();
    return course || undefined;
  }

  async deleteSystemCourse(id: number): Promise<SystemCourse | undefined> {
    const [deleted] = await db.delete(courses).where(
      and(eq(courses.id, id), eq(courses.isSystemCourse, true))
    ).returning();
    return deleted;
  }
}

export const storage = new DatabaseStorage();