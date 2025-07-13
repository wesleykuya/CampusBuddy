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

export class MemoryStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private buildings: Map<number, Building> = new Map();
  private rooms: Map<number, Room> = new Map();
  private courses: Map<number, Course> = new Map();
  private schedules: Map<number, Schedule> = new Map();
  private reminders: Map<number, Reminder> = new Map();
  private floors: Map<number, Floor> = new Map();
  
  private nextUserId = 1;
  private nextBuildingId = 1;
  private nextRoomId = 1;
  private nextCourseId = 1;
  private nextScheduleId = 1;
  private nextReminderId = 1;
  private nextFloorId = 1;

  constructor() {
    this.seedData();
  }

  private async seedData() {
    // Create admin user
    const adminUser: User = {
      id: this.nextUserId++,
      username: "admin",
      email: "admin@campus.edu",
      password: await bcrypt.hash("password", 10),
      fullName: "System Administrator",
      role: "super_admin",
      department: "IT",
      studentId: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(adminUser.id, adminUser);

    // Create test student
    const studentUser: User = {
      id: this.nextUserId++,
      username: "student",
      email: "student@campus.edu",
      password: await bcrypt.hash("password", 10),
      fullName: "Test Student",
      role: "student",
      department: "Computer Science",
      studentId: "CS2024001",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(studentUser.id, studentUser);

    // Create test building
    const building: Building = {
      id: this.nextBuildingId++,
      name: "Computer Science Building",
      code: "CS",
      address: "123 Campus Drive",
      description: "Main computer science building",
      floors: 3,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.buildings.set(building.id, building);

    // Create test floor
    const floor: Floor = {
      id: this.nextFloorId++,
      buildingId: building.id,
      floorNumber: 1,
      name: "First Floor",
      mapData: JSON.stringify({
        nodes: [
          { id: "entrance", type: "entrance", x: 100, y: 100, connections: ["junction1"], label: "Main Entrance" },
          { id: "junction1", type: "junction", x: 200, y: 100, connections: ["entrance", "room101"], label: "" },
          { id: "room101", type: "room", x: 300, y: 100, connections: ["junction1"], label: "Room 101" }
        ],
        paths: [
          { id: "path1", startNode: "entrance", endNode: "junction1", pathType: "corridor", distance: 10 },
          { id: "path2", startNode: "junction1", endNode: "room101", pathType: "corridor", distance: 10 }
        ]
      }),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.floors.set(floor.id, floor);

    // Create test room
    const room: Room = {
      id: this.nextRoomId++,
      buildingId: building.id,
      roomNumber: "101",
      name: "Lecture Hall A",
      roomType: "classroom",
      capacity: 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.rooms.set(room.id, room);

    // Create test course
    const course: Course = {
      id: this.nextCourseId++,
      userId: studentUser.id,
      name: "Introduction to Computer Science",
      code: "CS101",
      description: "Fundamentals of computer science and programming",
      credits: 3,
      instructor: "Dr. Smith",
      semester: "Fall 2024",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.courses.set(course.id, course);

    // Create test schedule
    const schedule: Schedule = {
      id: this.nextScheduleId++,
      courseId: course.id,
      roomId: room.id,
      dayOfWeek: 1, // Monday
      startTime: "09:00",
      endTime: "10:30",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.schedules.set(schedule.id, schedule);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username && user.isActive);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email && user.isActive);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = {
      id: this.nextUserId++,
      ...insertUser,
      password: hashedPassword,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(user.id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.isActive);
  }

  async updateUser(id: number, userData: Partial<InsertUser & { isActive?: boolean }>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updateData: any = { ...userData, updatedAt: new Date() };
    if (userData.password) {
      updateData.password = await bcrypt.hash(userData.password, 10);
    }

    const updatedUser = { ...user, ...updateData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    
    const updated = { ...user, isActive: false, updatedAt: new Date() };
    this.users.set(id, updated);
    return true;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role && user.isActive);
  }

  // Building methods
  async getAllBuildings(): Promise<Building[]> {
    return Array.from(this.buildings.values()).filter(building => building.isActive);
  }

  async getBuilding(id: number): Promise<Building | undefined> {
    return this.buildings.get(id);
  }

  async createBuilding(insertBuilding: InsertBuilding): Promise<Building> {
    const building: Building = {
      id: this.nextBuildingId++,
      ...insertBuilding,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.buildings.set(building.id, building);
    return building;
  }

  async updateBuilding(id: number, buildingData: Partial<InsertBuilding>): Promise<Building | undefined> {
    const building = this.buildings.get(id);
    if (!building) return undefined;

    const updated = { ...building, ...buildingData, updatedAt: new Date() };
    this.buildings.set(id, updated);
    return updated;
  }

  // Room methods
  async getRoomsByBuilding(buildingId: number): Promise<Room[]> {
    return Array.from(this.rooms.values()).filter(room => room.buildingId === buildingId && room.isActive);
  }

  async getRoom(id: number): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const room: Room = {
      id: this.nextRoomId++,
      ...insertRoom,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.rooms.set(room.id, room);
    return room;
  }

  // Course methods
  async getCoursesByUser(userId: number): Promise<CourseWithSchedules[]> {
    const userCourses = Array.from(this.courses.values()).filter(course => course.userId === userId && course.isActive);
    
    return userCourses.map(course => ({
      ...course,
      schedules: Array.from(this.schedules.values())
        .filter(schedule => schedule.courseId === course.id && schedule.isActive)
        .map(schedule => {
          const room = this.rooms.get(schedule.roomId);
          const building = room ? this.buildings.get(room.buildingId) : undefined;
          return {
            ...schedule,
            room: room ? {
              ...room,
              building: building!
            } : {} as any
          };
        })
    }));
  }

  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const course: Course = {
      id: this.nextCourseId++,
      ...insertCourse,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.courses.set(course.id, course);
    return course;
  }

  async updateCourse(id: number, courseData: Partial<InsertCourse>): Promise<Course | undefined> {
    const course = this.courses.get(id);
    if (!course) return undefined;

    const updated = { ...course, ...courseData, updatedAt: new Date() };
    this.courses.set(id, updated);
    return updated;
  }

  async deleteCourse(id: number): Promise<boolean> {
    const course = this.courses.get(id);
    if (!course) return false;
    
    const updated = { ...course, isActive: false, updatedAt: new Date() };
    this.courses.set(id, updated);
    return true;
  }

  // Schedule methods
  async getSchedulesByUser(userId: number): Promise<ScheduleWithDetails[]> {
    const userCourses = Array.from(this.courses.values()).filter(course => course.userId === userId && course.isActive);
    const courseIds = userCourses.map(course => course.id);
    
    return Array.from(this.schedules.values())
      .filter(schedule => courseIds.includes(schedule.courseId) && schedule.isActive)
      .map(schedule => {
        const course = this.courses.get(schedule.courseId)!;
        const room = this.rooms.get(schedule.roomId);
        const building = room ? this.buildings.get(room.buildingId) : undefined;
        return {
          ...schedule,
          course,
          room: room ? {
            ...room,
            building: building!
          } : {} as any
        };
      });
  }

  async getSchedulesByDay(userId: number, dayOfWeek: number): Promise<ScheduleWithDetails[]> {
    const userSchedules = await this.getSchedulesByUser(userId);
    return userSchedules.filter(schedule => schedule.dayOfWeek === dayOfWeek);
  }

  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const schedule: Schedule = {
      id: this.nextScheduleId++,
      ...insertSchedule,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.schedules.set(schedule.id, schedule);
    return schedule;
  }

  async updateSchedule(id: number, scheduleData: Partial<InsertSchedule>): Promise<Schedule | undefined> {
    const schedule = this.schedules.get(id);
    if (!schedule) return undefined;

    const updated = { ...schedule, ...scheduleData, updatedAt: new Date() };
    this.schedules.set(id, updated);
    return updated;
  }

  async deleteSchedule(id: number): Promise<boolean> {
    const schedule = this.schedules.get(id);
    if (!schedule) return false;
    
    const updated = { ...schedule, isActive: false, updatedAt: new Date() };
    this.schedules.set(id, updated);
    return true;
  }

  // Reminder methods
  async getRemindersByUser(userId: number): Promise<Reminder[]> {
    return Array.from(this.reminders.values()).filter(reminder => reminder.userId === userId && reminder.isActive);
  }

  async createReminder(insertReminder: InsertReminder): Promise<Reminder> {
    const reminder: Reminder = {
      id: this.nextReminderId++,
      ...insertReminder,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.reminders.set(reminder.id, reminder);
    return reminder;
  }

  async updateReminder(id: number, reminderData: Partial<InsertReminder>): Promise<Reminder | undefined> {
    const reminder = this.reminders.get(id);
    if (!reminder) return undefined;

    const updated = { ...reminder, ...reminderData, updatedAt: new Date() };
    this.reminders.set(id, updated);
    return updated;
  }

  // Floor methods
  async getFloorsByBuilding(buildingId: number): Promise<Floor[]> {
    return Array.from(this.floors.values()).filter(floor => floor.buildingId === buildingId && floor.isActive);
  }

  async getFloor(id: number): Promise<Floor | undefined> {
    return this.floors.get(id);
  }

  async createFloor(insertFloor: InsertFloor): Promise<Floor> {
    const floor: Floor = {
      id: this.nextFloorId++,
      ...insertFloor,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.floors.set(floor.id, floor);
    return floor;
  }

  async updateFloor(id: number, floorData: Partial<InsertFloor>): Promise<Floor | undefined> {
    const floor = this.floors.get(id);
    if (!floor) return undefined;

    const updated = { ...floor, ...floorData, updatedAt: new Date() };
    this.floors.set(id, updated);
    return updated;
  }

  async deleteFloor(id: number): Promise<boolean> {
    const floor = this.floors.get(id);
    if (!floor) return false;
    
    const updated = { ...floor, isActive: false, updatedAt: new Date() };
    this.floors.set(id, updated);
    return true;
  }
}

export const storage = new MemoryStorage();