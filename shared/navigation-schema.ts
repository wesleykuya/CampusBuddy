// Enhanced navigation and indoor positioning schemas
import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Bluetooth beacons for indoor positioning
export const beacons = pgTable("beacons", {
  id: serial("id").primaryKey(),
  beaconId: text("beacon_id").notNull().unique(), // UUID or identifier
  buildingId: integer("building_id").notNull(),
  floorId: integer("floor_id"),
  major: integer("major").notNull(),
  minor: integer("minor").notNull(),
  coordinates: jsonb("coordinates").notNull(), // {x, y, z, lat, lng}
  transmissionPower: integer("transmission_power").default(-59), // dBm at 1 meter
  isActive: boolean("is_active").default(true),
  lastSeen: timestamp("last_seen"),
  batteryLevel: integer("battery_level"), // Percentage
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// WiFi access points for fingerprinting
export const wifiAccessPoints = pgTable("wifi_access_points", {
  id: serial("id").primaryKey(),
  ssid: text("ssid").notNull(),
  bssid: text("bssid").notNull().unique(), // MAC address
  buildingId: integer("building_id").notNull(),
  floorId: integer("floor_id"),
  coordinates: jsonb("coordinates").notNull(), // {x, y, z, lat, lng}
  frequency: integer("frequency"), // MHz
  channel: integer("channel"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Navigation nodes (enhanced)
export const navigationNodes = pgTable("navigation_nodes", {
  id: serial("id").primaryKey(),
  nodeId: text("node_id").notNull().unique(),
  buildingId: integer("building_id").notNull(),
  floorId: integer("floor_id"),
  type: text("type").notNull(), // 'room', 'junction', 'stairs', 'elevator', 'entrance', 'emergency_exit', 'bathroom', 'landmark'
  coordinates: jsonb("coordinates").notNull(), // {x, y, z, lat, lng}
  label: text("label").notNull(),
  description: text("description"),
  accessibility: boolean("accessibility").default(true),
  beaconId: text("beacon_id"), // Associated beacon
  landmarks: jsonb("landmarks").default([]), // Nearby landmarks for navigation instructions
  connections: jsonb("connections").default([]), // Connected node IDs
  metadata: jsonb("metadata").default({}), // Additional node-specific data
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Navigation paths (enhanced)
export const navigationPaths = pgTable("navigation_paths", {
  id: serial("id").primaryKey(),
  pathId: text("path_id").notNull().unique(),
  startNodeId: text("start_node_id").notNull(),
  endNodeId: text("end_node_id").notNull(),
  buildingId: integer("building_id").notNull(),
  pathType: text("path_type").notNull(), // 'corridor', 'stairs', 'elevator', 'escalator', 'outdoor'
  distance: decimal("distance", { precision: 8, scale: 2 }).notNull(), // meters
  estimatedTime: integer("estimated_time"), // seconds
  accessibility: boolean("accessibility").default(true),
  bidirectional: boolean("bidirectional").default(true),
  landmarks: jsonb("landmarks").default([]), // Landmarks along the path
  instructions: jsonb("instructions").default([]), // Turn-by-turn instructions
  metadata: jsonb("metadata").default({}), // Additional path data
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Emergency routes and evacuation plans
export const emergencyRoutes = pgTable("emergency_routes", {
  id: serial("id").primaryKey(),
  routeId: text("route_id").notNull().unique(),
  buildingId: integer("building_id").notNull(),
  floorId: integer("floor_id"),
  name: text("name").notNull(),
  description: text("description"),
  evacuationPoints: jsonb("evacuation_points").notNull(), // Array of safe exit points
  pathNodes: jsonb("path_nodes").notNull(), // Ordered array of navigation nodes
  estimatedTime: integer("estimated_time"), // seconds to evacuation
  capacity: integer("capacity"), // Max people for this route
  accessibility: boolean("accessibility").default(true),
  priority: integer("priority").default(1), // Route priority (1=highest)
  emergencyType: text("emergency_type"), // 'fire', 'earthquake', 'lockdown', 'general'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User location history for analytics
export const userLocationHistory = pgTable("user_location_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  buildingId: integer("building_id"),
  floorId: integer("floor_id"),
  coordinates: jsonb("coordinates").notNull(), // {x, y, z, lat, lng}
  accuracy: decimal("accuracy", { precision: 6, scale: 2 }), // meters
  positioningMethod: text("positioning_method"), // 'gps', 'beacon', 'wifi', 'hybrid'
  beaconData: jsonb("beacon_data"), // Nearby beacon information
  wifiData: jsonb("wifi_data"), // WiFi fingerprint data
  timestamp: timestamp("timestamp").defaultNow(),
});

// AR markers and points of interest
export const arMarkers = pgTable("ar_markers", {
  id: serial("id").primaryKey(),
  markerId: text("marker_id").notNull().unique(),
  buildingId: integer("building_id").notNull(),
  floorId: integer("floor_id"),
  type: text("type").notNull(), // 'info', 'navigation', 'emergency', 'poi', 'advertisement'
  coordinates: jsonb("coordinates").notNull(), // {x, y, z, lat, lng}
  content: jsonb("content").notNull(), // AR content data
  triggerDistance: decimal("trigger_distance", { precision: 6, scale: 2 }).default("5.0"), // meters
  visibility: text("visibility").default("public"), // 'public', 'student', 'staff', 'admin'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Navigation sessions for analytics
export const navigationSessions = pgTable("navigation_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  userId: integer("user_id"),
  startLocation: jsonb("start_location").notNull(),
  endLocation: jsonb("end_location").notNull(),
  actualPath: jsonb("actual_path"), // Path actually taken
  plannedPath: jsonb("planned_path"), // Path that was suggested
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // seconds
  distance: decimal("distance", { precision: 8, scale: 2 }), // meters
  completionStatus: text("completion_status"), // 'completed', 'abandoned', 'rerouted'
  feedback: jsonb("feedback"), // User feedback on navigation experience
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const beaconsRelations = relations(beacons, ({ one }) => ({
  building: one(buildings, {
    fields: [beacons.buildingId],
    references: [buildings.id],
  }),
  floor: one(floors, {
    fields: [beacons.floorId],
    references: [floors.id],
  }),
}));

export const wifiAccessPointsRelations = relations(wifiAccessPoints, ({ one }) => ({
  building: one(buildings, {
    fields: [wifiAccessPoints.buildingId],
    references: [buildings.id],
  }),
  floor: one(floors, {
    fields: [wifiAccessPoints.floorId],
    references: [floors.id],
  }),
}));

export const navigationNodesRelations = relations(navigationNodes, ({ one }) => ({
  building: one(buildings, {
    fields: [navigationNodes.buildingId],
    references: [buildings.id],
  }),
  floor: one(floors, {
    fields: [navigationNodes.floorId],
    references: [floors.id],
  }),
}));

export const navigationPathsRelations = relations(navigationPaths, ({ one }) => ({
  building: one(buildings, {
    fields: [navigationPaths.buildingId],
    references: [buildings.id],
  }),
  startNode: one(navigationNodes, {
    fields: [navigationPaths.startNodeId],
    references: [navigationNodes.nodeId],
  }),
  endNode: one(navigationNodes, {
    fields: [navigationPaths.endNodeId],
    references: [navigationNodes.nodeId],
  }),
}));

// Schema validation
export const insertBeaconSchema = createInsertSchema(beacons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWifiAccessPointSchema = createInsertSchema(wifiAccessPoints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNavigationNodeSchema = createInsertSchema(navigationNodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNavigationPathSchema = createInsertSchema(navigationPaths).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmergencyRouteSchema = createInsertSchema(emergencyRoutes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertArMarkerSchema = createInsertSchema(arMarkers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type Beacon = typeof beacons.$inferSelect;
export type InsertBeacon = z.infer<typeof insertBeaconSchema>;
export type WifiAccessPoint = typeof wifiAccessPoints.$inferSelect;
export type InsertWifiAccessPoint = z.infer<typeof insertWifiAccessPointSchema>;
export type NavigationNode = typeof navigationNodes.$inferSelect;
export type InsertNavigationNode = z.infer<typeof insertNavigationNodeSchema>;
export type NavigationPath = typeof navigationPaths.$inferSelect;
export type InsertNavigationPath = z.infer<typeof insertNavigationPathSchema>;
export type EmergencyRoute = typeof emergencyRoutes.$inferSelect;
export type InsertEmergencyRoute = z.infer<typeof insertEmergencyRouteSchema>;
export type ArMarker = typeof arMarkers.$inferSelect;
export type InsertArMarker = z.infer<typeof insertArMarkerSchema>;
export type UserLocationHistory = typeof userLocationHistory.$inferSelect;
export type NavigationSession = typeof navigationSessions.$inferSelect;