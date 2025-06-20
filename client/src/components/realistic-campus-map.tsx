
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation, Building, Users, Calendar, Settings, Shield, Edit, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface MapNode {
  id: string;
  type: 'building' | 'entrance' | 'junction' | 'landmark' | 'parking' | 'amenity';
  x: number;
  y: number;
  label: string;
  buildingCode?: string;
  description?: string;
  connections: string[];
  capacity?: number;
  accessibility?: boolean;
}

interface MapPath {
  id: string;
  startNode: string;
  endNode: string;
  type: 'walkway' | 'road' | 'pathway' | 'covered';
  distance: number;
  accessibility?: boolean;
  travelTime?: number;
}

interface Building {
  id: string;
  name: string;
  code: string;
  type: 'academic' | 'residential' | 'administrative' | 'recreational' | 'dining' | 'medical' | 'library';
  floors: number;
  capacity: number;
  departments: string[];
  coordinates: { x: number; y: number; width: number; height: number };
  isAccessible: boolean;
  openingHours?: string;
  facilities?: string[];
}

export function RealisticCampusMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pathfindingMode, setPathfindingMode] = useState(false);
  const [startLocation, setStartLocation] = useState<string>("");
  const [endLocation, setEndLocation] = useState<string>("");
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');
  const [isEditMode, setIsEditMode] = useState(false);

  // Comprehensive university campus data - realistic diagrammatic layout
  const buildings: Building[] = [
    {
      id: "lib-001",
      name: "Central Library",
      code: "LIB",
      type: "library",
      floors: 5,
      capacity: 1200,
      departments: ["Library Sciences", "Study Spaces", "Archives", "Digital Resources"],
      coordinates: { x: 350, y: 180, width: 140, height: 100 },
      isAccessible: true,
      openingHours: "24/7",
      facilities: ["WiFi", "Study Rooms", "Computer Lab", "Printing Services", "Café"]
    },
    {
      id: "sci-001",
      name: "Science & Technology Building",
      code: "SCI",
      type: "academic",
      floors: 6,
      capacity: 800,
      departments: ["Physics", "Chemistry", "Biology", "Mathematics", "Computer Science"],
      coordinates: { x: 120, y: 100, width: 120, height: 110 },
      isAccessible: true,
      openingHours: "6:00 AM - 10:00 PM",
      facilities: ["Laboratories", "Lecture Halls", "Research Centers"]
    },
    {
      id: "eng-001",
      name: "Engineering Complex",
      code: "ENG",
      type: "academic",
      floors: 7,
      capacity: 1000,
      departments: ["Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "Software Engineering"],
      coordinates: { x: 520, y: 120, width: 160, height: 120 },
      isAccessible: true,
      openingHours: "6:00 AM - 11:00 PM",
      facilities: ["Engineering Labs", "Workshop", "Design Studios", "Project Rooms"]
    },
    {
      id: "admin-001",
      name: "Administration Building",
      code: "ADM",
      type: "administrative",
      floors: 4,
      capacity: 300,
      departments: ["Admissions", "Registrar", "Financial Aid", "Student Services", "Chancellor's Office"],
      coordinates: { x: 300, y: 50, width: 120, height: 80 },
      isAccessible: true,
      openingHours: "8:00 AM - 5:00 PM",
      facilities: ["Reception", "Meeting Rooms", "Student Services Counter"]
    },
    {
      id: "student-union",
      name: "Student Union Building",
      code: "SUB",
      type: "recreational",
      floors: 3,
      capacity: 1500,
      departments: ["Student Activities", "Recreation", "Student Government", "Clubs & Organizations"],
      coordinates: { x: 350, y: 320, width: 140, height: 90 },
      isAccessible: true,
      openingHours: "6:00 AM - 12:00 AM",
      facilities: ["Game Room", "Meeting Spaces", "Event Halls", "Lounge Areas"]
    },
    {
      id: "dining-001",
      name: "Main Dining Hall",
      code: "DINE",
      type: "dining",
      floors: 2,
      capacity: 800,
      departments: ["Food Services", "Catering", "Nutrition Services"],
      coordinates: { x: 180, y: 350, width: 120, height: 80 },
      isAccessible: true,
      openingHours: "6:00 AM - 10:00 PM",
      facilities: ["Multiple Cuisines", "Grab & Go", "Dietary Options", "Outdoor Seating"]
    },
    {
      id: "dorm-north",
      name: "North Residence Hall",
      code: "NRH",
      type: "residential",
      floors: 8,
      capacity: 600,
      departments: ["Housing Services", "Residential Life"],
      coordinates: { x: 80, y: 250, width: 100, height: 140 },
      isAccessible: true,
      openingHours: "24/7",
      facilities: ["Study Lounges", "Laundry", "Recreation Room", "Kitchenette"]
    },
    {
      id: "dorm-south",
      name: "South Residence Hall",
      code: "SRH",
      type: "residential",
      floors: 10,
      capacity: 800,
      departments: ["Housing Services", "Residential Life"],
      coordinates: { x: 520, y: 350, width: 120, height: 160 },
      isAccessible: true,
      openingHours: "24/7",
      facilities: ["Study Lounges", "Laundry", "Recreation Room", "Kitchenette", "Fitness Room"]
    },
    {
      id: "medical-001",
      name: "Health & Wellness Center",
      code: "MED",
      type: "medical",
      floors: 2,
      capacity: 200,
      departments: ["Student Health", "Counseling Services", "Wellness Programs"],
      coordinates: { x: 420, y: 280, width: 90, height: 60 },
      isAccessible: true,
      openingHours: "8:00 AM - 6:00 PM",
      facilities: ["Clinic", "Pharmacy", "Counseling Rooms", "Wellness Center"]
    },
    {
      id: "sports-001",
      name: "Athletic Center",
      code: "GYM",
      type: "recreational",
      floors: 3,
      capacity: 1000,
      departments: ["Athletics", "Recreation", "Fitness", "Intramural Sports"],
      coordinates: { x: 250, y: 480, width: 150, height: 100 },
      isAccessible: true,
      openingHours: "5:00 AM - 11:00 PM",
      facilities: ["Gym", "Pool", "Courts", "Fitness Center", "Locker Rooms"]
    }
  ];

  const mapNodes: MapNode[] = [
    // Building entrances
    { id: "lib-main", type: "entrance", x: 420, y: 230, label: "Library Main Entrance", buildingCode: "LIB", connections: ["central-quad", "academic-walk"], accessibility: true },
    { id: "sci-main", type: "entrance", x: 180, y: 155, label: "Science Building Entrance", buildingCode: "SCI", connections: ["north-quad", "research-path"], accessibility: true },
    { id: "eng-main", type: "entrance", x: 600, y: 180, label: "Engineering Main Entrance", buildingCode: "ENG", connections: ["east-plaza", "tech-corridor"], accessibility: true },
    { id: "admin-main", type: "entrance", x: 360, y: 90, label: "Administration Entrance", buildingCode: "ADM", connections: ["main-entrance", "visitor-path"], accessibility: true },
    { id: "sub-main", type: "entrance", x: 420, y: 365, label: "Student Union Entrance", buildingCode: "SUB", connections: ["central-quad", "student-plaza"], accessibility: true },
    { id: "dining-main", type: "entrance", x: 240, y: 390, label: "Dining Hall Entrance", buildingCode: "DINE", connections: ["west-walk", "student-plaza"], accessibility: true },
    { id: "nrh-main", type: "entrance", x: 130, y: 320, label: "North Residence Entrance", buildingCode: "NRH", connections: ["west-walk", "residential-area"], accessibility: true },
    { id: "srh-main", type: "entrance", x: 580, y: 430, label: "South Residence Entrance", buildingCode: "SRH", connections: ["east-residential", "south-plaza"], accessibility: true },
    { id: "med-main", type: "entrance", x: 465, y: 310, label: "Health Center Entrance", buildingCode: "MED", connections: ["wellness-walk", "central-quad"], accessibility: true },
    { id: "gym-main", type: "entrance", x: 325, y: 530, label: "Athletic Center Entrance", buildingCode: "GYM", connections: ["sports-complex", "recreation-path"], accessibility: true },

    // Major campus areas and plazas
    { id: "main-entrance", type: "landmark", x: 400, y: 30, label: "University Main Gate", connections: ["admin-main", "visitor-path", "ceremonial-drive"], accessibility: true },
    { id: "central-quad", type: "junction", x: 420, y: 280, label: "Central Quadrangle", connections: ["lib-main", "sub-main", "med-main", "academic-walk"], accessibility: true },
    { id: "north-quad", type: "junction", x: 240, y: 160, label: "North Academic Quad", connections: ["sci-main", "research-path", "academic-walk"], accessibility: true },
    { id: "east-plaza", type: "junction", x: 560, y: 220, label: "East Plaza", connections: ["eng-main", "tech-corridor", "east-residential"], accessibility: true },
    { id: "student-plaza", type: "junction", x: 330, y: 400, label: "Student Activity Plaza", connections: ["sub-main", "dining-main", "recreation-path"], accessibility: true },
    { id: "west-walk", type: "junction", x: 200, y: 300, label: "West Campus Walk", connections: ["dining-main", "nrh-main", "residential-area"], accessibility: true },

    // Specialized pathways
    { id: "academic-walk", type: "junction", x: 350, y: 220, label: "Academic Promenade", connections: ["lib-main", "central-quad", "north-quad"], accessibility: true },
    { id: "tech-corridor", type: "junction", x: 600, y: 250, label: "Technology Corridor", connections: ["eng-main", "east-plaza", "innovation-hub"], accessibility: true },
    { id: "wellness-walk", type: "junction", x: 450, y: 340, label: "Wellness Walkway", connections: ["med-main", "student-plaza", "recreation-path"], accessibility: true },
    { id: "residential-area", type: "junction", x: 150, y: 350, label: "Residential Commons", connections: ["nrh-main", "west-walk", "community-center"], accessibility: true },
    { id: "east-residential", type: "junction", x: 580, y: 300, label: "East Residential Area", connections: ["srh-main", "east-plaza", "south-plaza"], accessibility: true },

    // Parking and transportation
    { id: "north-parking", type: "parking", x: 150, y: 80, label: "North Parking Lot A", connections: ["visitor-path", "north-quad"], capacity: 200, accessibility: true },
    { id: "east-parking", type: "parking", x: 650, y: 180, label: "East Parking Garage", connections: ["tech-corridor", "visitor-entrance"], capacity: 500, accessibility: true },
    { id: "south-parking", type: "parking", x: 400, y: 550, label: "South Parking Lot B", connections: ["sports-complex", "recreation-path"], capacity: 300, accessibility: true },
    { id: "west-parking", type: "parking", x: 50, y: 300, label: "West Parking Lot C", connections: ["residential-area", "west-entrance"], capacity: 250, accessibility: true },

    // Campus amenities
    { id: "innovation-hub", type: "amenity", x: 680, y: 280, label: "Innovation & Startup Hub", connections: ["tech-corridor", "research-path"], accessibility: true },
    { id: "community-center", type: "amenity", x: 120, y: 400, label: "Community Center", connections: ["residential-area", "west-walk"], accessibility: true },
    { id: "outdoor-theater", type: "amenity", x: 300, y: 250, label: "Outdoor Amphitheater", connections: ["central-quad", "academic-walk"], accessibility: true },
    { id: "botanical-garden", type: "amenity", x: 500, y: 350, label: "Botanical Garden", connections: ["wellness-walk", "east-residential"], accessibility: true },
    { id: "sports-complex", type: "amenity", x: 350, y: 500, label: "Sports Complex", connections: ["gym-main", "south-parking", "recreation-path"], accessibility: true },

    // Additional pathways
    { id: "ceremonial-drive", type: "junction", x: 360, y: 120, label: "Ceremonial Drive", connections: ["main-entrance", "admin-main", "visitor-path"], accessibility: true },
    { id: "visitor-path", type: "junction", x: 280, y: 90, label: "Visitor Pathway", connections: ["main-entrance", "admin-main", "north-parking"], accessibility: true },
    { id: "research-path", type: "junction", x: 200, y: 200, label: "Research Corridor", connections: ["sci-main", "north-quad", "innovation-hub"], accessibility: true },
    { id: "recreation-path", type: "junction", x: 300, y: 450, label: "Recreation Path", connections: ["student-plaza", "gym-main", "sports-complex"], accessibility: true },
    { id: "south-plaza", type: "junction", x: 500, y: 480, label: "South Plaza", connections: ["srh-main", "east-residential", "botanical-garden"], accessibility: true }
  ];

  const mapPaths: MapPath[] = [
    // Primary campus circulation
    { id: "path-1", startNode: "main-entrance", endNode: "ceremonial-drive", type: "road", distance: 90, accessibility: true, travelTime: 2 },
    { id: "path-2", startNode: "ceremonial-drive", endNode: "admin-main", type: "walkway", distance: 80, accessibility: true, travelTime: 1 },
    { id: "path-3", startNode: "central-quad", endNode: "lib-main", type: "walkway", distance: 100, accessibility: true, travelTime: 2 },
    { id: "path-4", startNode: "central-quad", endNode: "academic-walk", type: "walkway", distance: 70, accessibility: true, travelTime: 1 },
    { id: "path-5", startNode: "academic-walk", endNode: "north-quad", type: "covered", distance: 110, accessibility: true, travelTime: 2 },
    { id: "path-6", startNode: "north-quad", endNode: "sci-main", type: "walkway", distance: 60, accessibility: true, travelTime: 1 },
    { id: "path-7", startNode: "east-plaza", endNode: "eng-main", type: "walkway", distance: 90, accessibility: true, travelTime: 2 },
    { id: "path-8", startNode: "tech-corridor", endNode: "east-plaza", type: "walkway", distance: 50, accessibility: true, travelTime: 1 },
    { id: "path-9", startNode: "student-plaza", endNode: "sub-main", type: "walkway", distance: 90, accessibility: true, travelTime: 2 },
    { id: "path-10", startNode: "student-plaza", endNode: "dining-main", type: "walkway", distance: 110, accessibility: true, travelTime: 2 },

    // Residential connections
    { id: "path-11", startNode: "west-walk", endNode: "nrh-main", type: "walkway", distance: 80, accessibility: true, travelTime: 1 },
    { id: "path-12", startNode: "east-residential", endNode: "srh-main", type: "walkway", distance: 60, accessibility: true, travelTime: 1 },
    { id: "path-13", startNode: "residential-area", endNode: "west-walk", type: "pathway", distance: 70, accessibility: true, travelTime: 1 },

    // Medical and wellness
    { id: "path-14", startNode: "wellness-walk", endNode: "med-main", type: "walkway", distance: 40, accessibility: true, travelTime: 1 },
    { id: "path-15", startNode: "central-quad", endNode: "wellness-walk", type: "walkway", distance: 80, accessibility: true, travelTime: 2 },

    // Recreation and sports
    { id: "path-16", startNode: "recreation-path", endNode: "gym-main", type: "walkway", distance: 70, accessibility: true, travelTime: 1 },
    { id: "path-17", startNode: "sports-complex", endNode: "recreation-path", type: "walkway", distance: 50, accessibility: true, travelTime: 1 },

    // Parking connections
    { id: "path-18", startNode: "north-parking", endNode: "visitor-path", type: "walkway", distance: 130, accessibility: true, travelTime: 3 },
    { id: "path-19", startNode: "east-parking", endNode: "tech-corridor", type: "walkway", distance: 50, accessibility: true, travelTime: 1 },
    { id: "path-20", startNode: "south-parking", endNode: "sports-complex", type: "walkway", distance: 80, accessibility: true, travelTime: 2 },
    { id: "path-21", startNode: "west-parking", endNode: "residential-area", type: "walkway", distance: 100, accessibility: true, travelTime: 2 },

    // Amenity connections
    { id: "path-22", startNode: "innovation-hub", endNode: "tech-corridor", type: "walkway", distance: 80, accessibility: true, travelTime: 2 },
    { id: "path-23", startNode: "community-center", endNode: "residential-area", type: "walkway", distance: 50, accessibility: true, travelTime: 1 },
    { id: "path-24", startNode: "outdoor-theater", endNode: "central-quad", type: "pathway", distance: 120, accessibility: true, travelTime: 2 },
    { id: "path-25", startNode: "botanical-garden", endNode: "wellness-walk", type: "pathway", distance: 60, accessibility: true, travelTime: 1 },

    // Cross-campus connections
    { id: "path-26", startNode: "north-quad", endNode: "research-path", type: "covered", distance: 90, accessibility: true, travelTime: 2 },
    { id: "path-27", startNode: "research-path", endNode: "innovation-hub", type: "walkway", distance: 480, accessibility: true, travelTime: 8 },
    { id: "path-28", startNode: "east-plaza", endNode: "east-residential", type: "walkway", distance: 80, accessibility: true, travelTime: 2 },
    { id: "path-29", startNode: "south-plaza", endNode: "east-residential", type: "walkway", distance: 180, accessibility: true, travelTime: 3 },
    { id: "path-30", startNode: "student-plaza", endNode: "south-plaza", type: "walkway", distance: 170, accessibility: true, travelTime: 3 }
  ];

  useEffect(() => {
    drawCampusMap();
  }, [selectedBuilding, currentPath, viewMode, isEditMode]);

  const drawCampusMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw campus background with terrain
    drawBackground(ctx);

    // Draw paths first (underneath buildings)
    drawPaths(ctx);

    // Draw buildings with architectural details
    drawBuildings(ctx);

    // Draw nodes and landmarks
    drawNodes(ctx);

    // Draw current path if exists
    if (currentPath.length > 0) {
      drawCurrentPath(ctx);
    }

    // Draw campus features
    drawCampusFeatures(ctx);

    // Draw legend and compass
    drawLegend(ctx);
    drawCompass(ctx);
  };

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Create gradient background for realistic terrain
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#e8f5e8");
    gradient.addColorStop(0.5, "#f0f8f0");
    gradient.addColorStop(1, "#e0f0e0");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw landscaping areas
    drawLandscaping(ctx);
  };

  const drawLandscaping = (ctx: CanvasRenderingContext2D) => {
    // Draw green spaces and landscaped areas
    ctx.fillStyle = "#90EE90";
    ctx.globalAlpha = 0.3;
    
    // Central quad green space
    ctx.fillRect(380, 240, 80, 80);
    
    // North academic lawn
    ctx.fillRect(200, 140, 100, 60);
    
    // East plaza gardens
    ctx.fillRect(520, 200, 80, 60);
    
    // Botanical garden area
    ctx.fillRect(480, 330, 60, 60);
    
    ctx.globalAlpha = 1.0;
  };

  const drawPaths = (ctx: CanvasRenderingContext2D) => {
    mapPaths.forEach(path => {
      const startNode = mapNodes.find(n => n.id === path.startNode);
      const endNode = mapNodes.find(n => n.id === path.endNode);
      
      if (startNode && endNode) {
        // Different path styles
        let pathColor = "#d4d4aa";
        let pathWidth = 6;
        
        switch (path.type) {
          case "road":
            pathColor = "#708090";
            pathWidth = 12;
            break;
          case "covered":
            pathColor = "#8FBC8F";
            pathWidth = 8;
            break;
          case "pathway":
            pathColor = "#DEB887";
            pathWidth = 4;
            break;
          default:
            pathColor = "#D2B48C";
            pathWidth = 6;
        }
        
        if (!path.accessibility) {
          pathColor = "#C0C0C0";
        }
        
        ctx.strokeStyle = pathColor;
        ctx.lineWidth = pathWidth;
        ctx.lineCap = "round";
        
        // Add shadow for depth
        ctx.shadowColor = "rgba(0,0,0,0.2)";
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        ctx.beginPath();
        ctx.moveTo(startNode.x, startNode.y);
        ctx.lineTo(endNode.x, endNode.y);
        ctx.stroke();
        
        // Reset shadow
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw covered walkway indicators
        if (path.type === "covered") {
          ctx.strokeStyle = "#556B2F";
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(startNode.x, startNode.y);
          ctx.lineTo(endNode.x, endNode.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    });
  };

  const drawBuildings = (ctx: CanvasRenderingContext2D) => {
    buildings.forEach(building => {
      const { x, y, width, height } = building.coordinates;
      const isSelected = selectedBuilding?.id === building.id;
      
      // Building shadow for depth
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      ctx.fillRect(x + 4, y + 4, width, height);
      
      // Building base color based on type with more realistic colors
      let buildingColor = "#e0e0e0";
      let accentColor = "#c0c0c0";
      
      switch (building.type) {
        case "academic":
          buildingColor = "#8B4513";
          accentColor = "#A0522D";
          break;
        case "library":
          buildingColor = "#2F4F4F";
          accentColor = "#708090";
          break;
        case "residential":
          buildingColor = "#CD853F";
          accentColor = "#DEB887";
          break;
        case "administrative":
          buildingColor = "#4682B4";
          accentColor = "#87CEEB";
          break;
        case "recreational":
          buildingColor = "#228B22";
          accentColor = "#32CD32";
          break;
        case "dining":
          buildingColor = "#FF6347";
          accentColor = "#FF7F50";
          break;
        case "medical":
          buildingColor = "#DC143C";
          accentColor = "#F08080";
          break;
      }
      
      if (isSelected) {
        buildingColor = "#FFD700";
        accentColor = "#FFA500";
      }
      
      // Main building structure
      ctx.fillStyle = buildingColor;
      ctx.fillRect(x, y, width, height);
      
      // Building outline with proper architectural styling
      ctx.strokeStyle = isSelected ? "#FF4500" : "#2F2F2F";
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeRect(x, y, width, height);
      
      // Draw architectural details
      drawBuildingDetails(ctx, building);
      
      // Building code label
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;
      ctx.strokeText(building.code, x + width/2, y + height/2);
      ctx.fillText(building.code, x + width/2, y + height/2);
      
      // Building name (smaller text)
      ctx.font = "10px Arial";
      ctx.strokeText(building.name, x + width/2, y + height/2 + 18);
      ctx.fillText(building.name, x + width/2, y + height/2 + 18);
      
      // Accessibility indicator
      if (building.isAccessible) {
        ctx.fillStyle = "#0066CC";
        ctx.font = "12px Arial";
        ctx.fillText("♿", x + width - 15, y + 15);
      }
    });
  };

  const drawBuildingDetails = (ctx: CanvasRenderingContext2D, building: Building) => {
    const { x, y, width, height } = building.coordinates;
    
    // Draw windows in a realistic pattern
    ctx.fillStyle = "#87CEEB";
    const windowWidth = 8;
    const windowHeight = 12;
    const windowSpacingX = 16;
    const windowSpacingY = 20;
    
    // Calculate window grid based on building floors
    const floorsToShow = Math.min(building.floors, 6);
    for (let floor = 0; floor < floorsToShow; floor++) {
      const floorY = y + 15 + (floor * windowSpacingY);
      for (let col = 0; col < Math.floor((width - 20) / windowSpacingX); col++) {
        const windowX = x + 10 + (col * windowSpacingX);
        if (floorY + windowHeight < y + height - 10) {
          // Window frame
          ctx.fillStyle = "#4682B4";
          ctx.fillRect(windowX, floorY, windowWidth, windowHeight);
          // Window glass
          ctx.fillStyle = "#87CEEB";
          ctx.fillRect(windowX + 1, floorY + 1, windowWidth - 2, windowHeight - 2);
        }
      }
    }
    
    // Main entrance
    const entranceWidth = Math.min(20, width * 0.2);
    const entranceHeight = 25;
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(x + width/2 - entranceWidth/2, y + height - entranceHeight, entranceWidth, entranceHeight);
    
    // Entrance details
    ctx.fillStyle = "#654321";
    ctx.fillRect(x + width/2 - 2, y + height - entranceHeight, 4, entranceHeight);
    
    // Roof details for larger buildings
    if (width > 100) {
      ctx.strokeStyle = "#696969";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + width, y);
      ctx.stroke();
    }
  };

  const drawNodes = (ctx: CanvasRenderingContext2D) => {
    mapNodes.forEach(node => {
      let nodeColor = "#2F4F4F";
      let nodeSize = 8;
      let nodeShape = "circle";
      
      switch (node.type) {
        case "entrance":
          nodeColor = "#DC143C";
          nodeSize = 10;
          break;
        case "junction":
          nodeColor = "#4169E1";
          nodeSize = 8;
          break;
        case "landmark":
          nodeColor = "#9932CC";
          nodeSize = 12;
          nodeShape = "star";
          break;
        case "parking":
          nodeColor = "#696969";
          nodeSize = 10;
          nodeShape = "square";
          break;
        case "amenity":
          nodeColor = "#228B22";
          nodeSize = 10;
          nodeShape = "diamond";
          break;
      }
      
      // Node shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      if (nodeShape === "circle") {
        ctx.beginPath();
        ctx.arc(node.x + 1, node.y + 1, nodeSize + 1, 0, 2 * Math.PI);
        ctx.fill();
      }
      
      // Node outline
      ctx.fillStyle = "#FFFFFF";
      if (nodeShape === "circle") {
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeSize + 2, 0, 2 * Math.PI);
        ctx.fill();
      } else if (nodeShape === "square") {
        ctx.fillRect(node.x - nodeSize - 2, node.y - nodeSize - 2, (nodeSize + 2) * 2, (nodeSize + 2) * 2);
      }
      
      // Main node
      ctx.fillStyle = nodeColor;
      if (nodeShape === "circle") {
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI);
        ctx.fill();
      } else if (nodeShape === "square") {
        ctx.fillRect(node.x - nodeSize, node.y - nodeSize, nodeSize * 2, nodeSize * 2);
      } else if (nodeShape === "diamond") {
        ctx.beginPath();
        ctx.moveTo(node.x, node.y - nodeSize);
        ctx.lineTo(node.x + nodeSize, node.y);
        ctx.lineTo(node.x, node.y + nodeSize);
        ctx.lineTo(node.x - nodeSize, node.y);
        ctx.closePath();
        ctx.fill();
      } else if (nodeShape === "star") {
        drawStar(ctx, node.x, node.y, 5, nodeSize, nodeSize/2);
      }
      
      // Accessibility indicator
      if (node.accessibility) {
        ctx.fillStyle = "#0066CC";
        ctx.font = "8px Arial";
        ctx.textAlign = "center";
        ctx.fillText("♿", node.x, node.y - nodeSize - 8);
      }
    });
  };

  const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  };

  const drawCurrentPath = (ctx: CanvasRenderingContext2D) => {
    if (currentPath.length < 2) return;
    
    ctx.strokeStyle = "#FF1493";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.setLineDash([15, 8]);
    ctx.shadowColor = "rgba(255, 20, 147, 0.3)";
    ctx.shadowBlur = 4;
    
    for (let i = 0; i < currentPath.length - 1; i++) {
      const currentNode = mapNodes.find(n => n.id === currentPath[i]);
      const nextNode = mapNodes.find(n => n.id === currentPath[i + 1]);
      
      if (currentNode && nextNode) {
        ctx.beginPath();
        ctx.moveTo(currentNode.x, currentNode.y);
        ctx.lineTo(nextNode.x, nextNode.y);
        ctx.stroke();
      }
    }
    
    ctx.setLineDash([]);
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
  };

  const drawCampusFeatures = (ctx: CanvasRenderingContext2D) => {
    // Draw campus name
    ctx.fillStyle = "#2F4F4F";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 4;
    ctx.strokeText("UNIVERSITY CAMPUS", 400, 30);
    ctx.fillText("UNIVERSITY CAMPUS", 400, 30);
  };

  const drawLegend = (ctx: CanvasRenderingContext2D) => {
    const legendX = 20;
    const legendY = 400;
    const legendWidth = 180;
    const legendHeight = 180;
    
    // Legend background
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.fillRect(legendX, legendY, legendWidth, legendHeight);
    ctx.strokeStyle = "#2F4F4F";
    ctx.lineWidth = 2;
    ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);
    
    ctx.fillStyle = "#2F4F4F";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Campus Legend", legendX + 10, legendY + 20);
    
    const legendItems = [
      { color: "#8B4513", label: "Academic Buildings", type: "building" },
      { color: "#2F4F4F", label: "Library", type: "building" },
      { color: "#CD853F", label: "Residential", type: "building" },
      { color: "#4682B4", label: "Administrative", type: "building" },
      { color: "#228B22", label: "Recreation", type: "building" },
      { color: "#DC143C", label: "Entrance", type: "node" },
      { color: "#4169E1", label: "Junction", type: "node" },
      { color: "#696969", label: "Parking", type: "node" }
    ];
    
    legendItems.forEach((item, index) => {
      const y = legendY + 40 + (index * 16);
      ctx.fillStyle = item.color;
      
      if (item.type === "building") {
        ctx.fillRect(legendX + 10, y - 6, 12, 12);
      } else {
        ctx.beginPath();
        ctx.arc(legendX + 16, y, 6, 0, 2 * Math.PI);
        ctx.fill();
      }
      
      ctx.fillStyle = "#2F4F4F";
      ctx.font = "11px Arial";
      ctx.fillText(item.label, legendX + 30, y + 4);
    });
  };

  const drawCompass = (ctx: CanvasRenderingContext2D) => {
    const compassX = 720;
    const compassY = 80;
    const compassSize = 40;
    
    // Compass background
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.beginPath();
    ctx.arc(compassX, compassY, compassSize, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = "#2F4F4F";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // North arrow
    ctx.fillStyle = "#DC143C";
    ctx.beginPath();
    ctx.moveTo(compassX, compassY - compassSize + 10);
    ctx.lineTo(compassX - 8, compassY);
    ctx.lineTo(compassX + 8, compassY);
    ctx.closePath();
    ctx.fill();
    
    // North label
    ctx.fillStyle = "#2F4F4F";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("N", compassX, compassY - compassSize + 25);
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if clicked on a building
    const clickedBuilding = buildings.find(building => {
      const { x: bx, y: by, width, height } = building.coordinates;
      return x >= bx && x <= bx + width && y >= by && y <= by + height;
    });

    if (clickedBuilding) {
      setSelectedBuilding(clickedBuilding);
    } else {
      setSelectedBuilding(null);
    }

    // Check if clicked on a node for pathfinding
    if (pathfindingMode) {
      const clickedNode = mapNodes.find(node => {
        const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
        return distance <= 15;
      });

      if (clickedNode) {
        if (!startLocation) {
          setStartLocation(clickedNode.id);
        } else if (!endLocation) {
          setEndLocation(clickedNode.id);
          findPath(startLocation, clickedNode.id);
        } else {
          setStartLocation(clickedNode.id);
          setEndLocation("");
          setCurrentPath([]);
        }
      }
    }
  };

  const findPath = (start: string, end: string) => {
    const distances: { [key: string]: number } = {};
    const previous: { [key: string]: string | null } = {};
    const unvisited = new Set<string>();

    mapNodes.forEach(node => {
      distances[node.id] = node.id === start ? 0 : Infinity;
      previous[node.id] = null;
      unvisited.add(node.id);
    });

    while (unvisited.size > 0) {
      let currentNode: string | null = null;
      let minDistance = Infinity;
      
      unvisited.forEach(nodeId => {
        if (distances[nodeId] < minDistance) {
          minDistance = distances[nodeId];
          currentNode = nodeId;
        }
      });

      if (!currentNode || distances[currentNode] === Infinity) break;

      unvisited.delete(currentNode);

      const currentNodeData = mapNodes.find(n => n.id === currentNode);
      if (currentNodeData) {
        currentNodeData.connections.forEach(neighborId => {
          if (unvisited.has(neighborId)) {
            const path = mapPaths.find(p => 
              (p.startNode === currentNode && p.endNode === neighborId) ||
              (p.startNode === neighborId && p.endNode === currentNode)
            );
            
            if (path) {
              const alt = distances[currentNode!] + path.distance;
              if (alt < distances[neighborId]) {
                distances[neighborId] = alt;
                previous[neighborId] = currentNode;
              }
            }
          }
        });
      }
    }

    const path: string[] = [];
    let currentNode: string | null = end;
    
    while (currentNode !== null) {
      path.unshift(currentNode);
      currentNode = previous[currentNode];
    }

    if (path[0] === start) {
      setCurrentPath(path);
    }
  };

  const canEdit = user?.role === 'admin' || user?.role === 'super_admin';

  const filteredBuildings = buildings.filter(building =>
    building.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    building.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    building.departments.some(dept => 
      dept.toLowerCase().includes(searchQuery.toLowerCase())
    ) ||
    building.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-4 p-4">
      {/* Map Canvas */}
      <div className="flex-1">
        <Card className="h-full">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Interactive University Campus Map
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={viewMode} onValueChange={(value: 'overview' | 'detailed') => setViewMode(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overview">Overview</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                  </SelectContent>
                </Select>
                {canEdit && (
                  <Button
                    variant={isEditMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsEditMode(!isEditMode)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {isEditMode ? "Exit Edit" : "Edit Map"}
                  </Button>
                )}
                <Button
                  variant={pathfindingMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setPathfindingMode(!pathfindingMode);
                    setStartLocation("");
                    setEndLocation("");
                    setCurrentPath([]);
                  }}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  {pathfindingMode ? "Exit Navigation" : "Find Route"}
                </Button>
                {pathfindingMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStartLocation("");
                      setEndLocation("");
                      setCurrentPath([]);
                    }}
                  >
                    Clear Route
                  </Button>
                )}
              </div>
            </div>
            {pathfindingMode && (
              <div className="text-sm text-muted-foreground">
                Click on map points to set start and destination for navigation
              </div>
            )}
            {isEditMode && canEdit && (
              <div className="text-sm text-orange-600 font-medium">
                Edit Mode Active - Click buildings and nodes to modify
              </div>
            )}
          </CardHeader>
          <CardContent>
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="border rounded-lg cursor-pointer bg-white shadow-lg"
              onClick={handleCanvasClick}
            />
          </CardContent>
        </Card>
      </div>

      {/* Side Panel */}
      <div className="w-full lg:w-80 space-y-4">
        {/* User Role Display */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5" />
              Access Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={user?.role === 'super_admin' ? 'destructive' : user?.role === 'admin' ? 'default' : 'secondary'}>
                {user?.role?.replace('_', ' ').toUpperCase()}
              </Badge>
              {canEdit && (
                <Badge variant="outline">
                  Map Editor
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {user?.fullName}
            </p>
          </CardContent>
        </Card>

        {/* Search */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Find Buildings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="search">Search by name, code, type, or department</Label>
              <Input
                id="search"
                placeholder="e.g. Library, SCI, academic, Physics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Navigation Status */}
        {pathfindingMode && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Navigation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Start:</span> {
                  startLocation ? mapNodes.find(n => n.id === startLocation)?.label || "Unknown" : "Click on map"
                }
              </div>
              <div className="text-sm">
                <span className="font-medium">Destination:</span> {
                  endLocation ? mapNodes.find(n => n.id === endLocation)?.label || "Unknown" : "Click on map"
                }
              </div>
              {currentPath.length > 0 && (
                <div className="text-sm">
                  <span className="font-medium">Route found:</span> {currentPath.length} waypoints
                  <br />
                  <span className="text-xs text-muted-foreground">
                    Estimated walking time: {Math.ceil(currentPath.length * 1.5)} minutes
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Selected Building Info */}
        {selectedBuilding && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                {selectedBuilding.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{selectedBuilding.code}</Badge>
                <Badge variant="secondary">{selectedBuilding.type}</Badge>
                {selectedBuilding.isAccessible && (
                  <Badge variant="outline" className="text-blue-600">♿ Accessible</Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Floors:</span> {selectedBuilding.floors}
                </div>
                <div>
                  <span className="font-medium">Capacity:</span> {selectedBuilding.capacity}
                </div>
              </div>
              {selectedBuilding.openingHours && (
                <div className="text-sm">
                  <span className="font-medium">Hours:</span> {selectedBuilding.openingHours}
                </div>
              )}
              <div>
                <span className="font-medium">Departments:</span>
                <div className="mt-1 space-y-1">
                  {selectedBuilding.departments.map((dept, index) => (
                    <Badge key={index} variant="outline" className="mr-1 mb-1">
                      {dept}
                    </Badge>
                  ))}
                </div>
              </div>
              {selectedBuilding.facilities && selectedBuilding.facilities.length > 0 && (
                <div>
                  <span className="font-medium">Facilities:</span>
                  <div className="mt-1 space-y-1">
                    {selectedBuilding.facilities.map((facility, index) => (
                      <Badge key={index} variant="secondary" className="mr-1 mb-1">
                        {facility}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Building List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Campus Buildings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredBuildings.map((building) => (
                <div
                  key={building.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedBuilding?.id === building.id
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedBuilding(building)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{building.code}</div>
                      <div className="text-sm text-muted-foreground">
                        {building.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        {building.type}
                      </Badge>
                      {building.isAccessible && (
                        <span className="text-blue-600">♿</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
