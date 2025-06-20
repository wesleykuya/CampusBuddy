import { db } from "./db";
import { buildings, floors } from "@shared/schema";
import { storage } from "./storage";

export async function seedTestData() {
  try {
    // Check if data already exists
    const existingBuildings = await storage.getAllBuildings();
    if (existingBuildings.length > 0) {
      console.log("Test data already exists, skipping seed");
      return;
    }

    // Create sample buildings
    const building1 = await storage.createBuilding({
      name: "Science Hall",
      code: "SCI",
      type: "Academic",
      description: "Main science and mathematics building",
      latitude: "40.7589",
      longitude: "-73.9851",
      amenities: ["WiFi", "Cafeteria", "Library"]
    });

    const building2 = await storage.createBuilding({
      name: "Engineering Complex",
      code: "ENG",
      type: "Academic", 
      description: "Engineering and computer science building",
      latitude: "40.7599",
      longitude: "-73.9841",
      amenities: ["WiFi", "Lab Access", "Study Rooms"]
    });

    // Create sample floors with navigation data
    const floor1 = await storage.createFloor({
      buildingId: building1.id,
      level: 1,
      name: "Ground Floor",
      nodes: [
        {
          id: "entrance_main",
          type: "entrance",
          x: 100,
          y: 300,
          connections: ["junction_1"],
          label: "Main Entrance"
        },
        {
          id: "junction_1", 
          type: "junction",
          x: 200,
          y: 300,
          connections: ["entrance_main", "room_101", "stairs_1"],
          label: "Main Junction"
        },
        {
          id: "room_101",
          type: "room",
          x: 300,
          y: 200,
          connections: ["junction_1"],
          label: "Physics Lab"
        },
        {
          id: "stairs_1",
          type: "stairs",
          x: 200,
          y: 400,
          connections: ["junction_1"],
          label: "Stairs to Floor 2"
        }
      ],
      paths: [
        {
          id: "path_1",
          startNode: "entrance_main",
          endNode: "junction_1", 
          pathType: "corridor",
          distance: 100
        },
        {
          id: "path_2",
          startNode: "junction_1",
          endNode: "room_101",
          pathType: "corridor", 
          distance: 140
        },
        {
          id: "path_3",
          startNode: "junction_1",
          endNode: "stairs_1",
          pathType: "corridor",
          distance: 100
        }
      ],
      schematicImage: null
    });

    const floor2 = await storage.createFloor({
      buildingId: building1.id,
      level: 2,
      name: "Second Floor",
      nodes: [
        {
          id: "stairs_2_1",
          type: "stairs",
          x: 200,
          y: 400,
          connections: ["junction_2_1"],
          label: "Stairs from Floor 1"
        },
        {
          id: "junction_2_1",
          type: "junction", 
          x: 200,
          y: 300,
          connections: ["stairs_2_1", "room_201", "room_202"],
          label: "Floor 2 Junction"
        },
        {
          id: "room_201",
          type: "room",
          x: 100,
          y: 200,
          connections: ["junction_2_1"],
          label: "Chemistry Lab"
        },
        {
          id: "room_202",
          type: "room",
          x: 300,
          y: 200,
          connections: ["junction_2_1"],
          label: "Biology Lab"
        }
      ],
      paths: [
        {
          id: "path_2_1",
          startNode: "stairs_2_1",
          endNode: "junction_2_1",
          pathType: "corridor",
          distance: 100
        },
        {
          id: "path_2_2", 
          startNode: "junction_2_1",
          endNode: "room_201",
          pathType: "corridor",
          distance: 140
        },
        {
          id: "path_2_3",
          startNode: "junction_2_1", 
          endNode: "room_202",
          pathType: "corridor",
          distance: 140
        }
      ],
      schematicImage: null
    });

    console.log("Test data seeded successfully:");
    console.log(`- Created ${2} buildings`);
    console.log(`- Created ${2} floors with navigation data`);

  } catch (error) {
    console.error("Error seeding test data:", error);
  }
}