import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation, Building, Users, Calendar, Settings } from "lucide-react";

interface MapNode {
  id: string;
  type: 'building' | 'entrance' | 'junction' | 'landmark';
  x: number;
  y: number;
  label: string;
  buildingCode?: string;
  description?: string;
  connections: string[];
}

interface MapPath {
  id: string;
  startNode: string;
  endNode: string;
  type: 'walkway' | 'stairs' | 'elevator' | 'corridor';
  distance: number;
  accessibility?: boolean;
}

interface Building {
  id: string;
  name: string;
  code: string;
  type: 'academic' | 'residential' | 'administrative' | 'recreational';
  floors: number;
  capacity: number;
  departments: string[];
  coordinates: { x: number; y: number; width: number; height: number };
}

export function RealisticCampusMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pathfindingMode, setPathfindingMode] = useState(false);
  const [startLocation, setStartLocation] = useState<string>("");
  const [endLocation, setEndLocation] = useState<string>("");
  const [currentPath, setCurrentPath] = useState<string[]>([]);

  // Realistic university campus data
  const buildings: Building[] = [
    {
      id: "lib-001",
      name: "Central Library",
      code: "LIB",
      type: "academic",
      floors: 4,
      capacity: 800,
      departments: ["Library Sciences", "Study Spaces", "Archives"],
      coordinates: { x: 300, y: 200, width: 120, height: 80 }
    },
    {
      id: "sci-001",
      name: "Science Building",
      code: "SCI",
      type: "academic",
      floors: 5,
      capacity: 600,
      departments: ["Physics", "Chemistry", "Biology", "Mathematics"],
      coordinates: { x: 150, y: 120, width: 100, height: 90 }
    },
    {
      id: "eng-001",
      name: "Engineering Complex",
      code: "ENG",
      type: "academic",
      floors: 6,
      capacity: 1000,
      departments: ["Computer Science", "Electrical Engineering", "Mechanical Engineering"],
      coordinates: { x: 480, y: 150, width: 140, height: 100 }
    },
    {
      id: "stu-001",
      name: "Student Union",
      code: "SU",
      type: "recreational",
      floors: 3,
      capacity: 1200,
      departments: ["Dining", "Recreation", "Student Services"],
      coordinates: { x: 320, y: 350, width: 110, height: 70 }
    },
    {
      id: "res-001",
      name: "North Residence Hall",
      code: "NRH",
      type: "residential",
      floors: 8,
      capacity: 400,
      departments: ["Housing", "Residential Life"],
      coordinates: { x: 100, y: 300, width: 80, height: 120 }
    },
    {
      id: "adm-001",
      name: "Administration Building",
      code: "ADM",
      type: "administrative",
      floors: 3,
      capacity: 200,
      departments: ["Admissions", "Registrar", "Financial Aid"],
      coordinates: { x: 450, y: 320, width: 90, height: 60 }
    },
    {
      id: "gym-001",
      name: "Athletic Center",
      code: "GYM",
      type: "recreational",
      floors: 2,
      capacity: 800,
      departments: ["Athletics", "Fitness", "Recreation"],
      coordinates: { x: 200, y: 450, width: 130, height: 80 }
    }
  ];

  const mapNodes: MapNode[] = [
    // Building entrances
    { id: "lib-entrance", type: "entrance", x: 360, y: 240, label: "Library Main Entrance", buildingCode: "LIB", connections: ["central-plaza", "sci-walkway"] },
    { id: "sci-entrance", type: "entrance", x: 200, y: 165, label: "Science Building Entrance", buildingCode: "SCI", connections: ["lib-entrance", "parking-north"] },
    { id: "eng-entrance", type: "entrance", x: 550, y: 200, label: "Engineering Main Entrance", buildingCode: "ENG", connections: ["central-plaza", "east-gate"] },
    { id: "su-entrance", type: "entrance", x: 375, y: 385, label: "Student Union Entrance", buildingCode: "SU", connections: ["central-plaza", "south-walkway"] },
    { id: "res-entrance", type: "entrance", x: 140, y: 360, label: "North Residence Entrance", buildingCode: "NRH", connections: ["west-walkway", "dining-plaza"] },
    { id: "adm-entrance", type: "entrance", x: 495, y: 350, label: "Administration Entrance", buildingCode: "ADM", connections: ["east-walkway", "visitor-parking"] },
    { id: "gym-entrance", type: "entrance", x: 265, y: 490, label: "Athletic Center Entrance", buildingCode: "GYM", connections: ["south-walkway", "sports-complex"] },
    
    // Major junctions and plazas
    { id: "central-plaza", type: "junction", x: 400, y: 280, label: "Central Plaza", connections: ["lib-entrance", "eng-entrance", "su-entrance", "fountain-area"] },
    { id: "fountain-area", type: "landmark", x: 350, y: 300, label: "University Fountain", connections: ["central-plaza", "amphitheater"] },
    { id: "amphitheater", type: "landmark", x: 380, y: 320, label: "Outdoor Amphitheater", connections: ["fountain-area", "su-entrance"] },
    
    // Campus gates and parking
    { id: "main-gate", type: "entrance", x: 50, y: 250, label: "Main Campus Gate", connections: ["west-walkway", "visitor-center"] },
    { id: "east-gate", type: "entrance", x: 650, y: 200, label: "East Campus Gate", connections: ["eng-entrance", "graduate-housing"] },
    { id: "south-gate", type: "entrance", x: 350, y: 550, label: "South Campus Gate", connections: ["sports-complex", "south-parking"] },
    
    // Walkways and pathways
    { id: "west-walkway", type: "junction", x: 120, y: 280, label: "West Campus Walkway", connections: ["main-gate", "res-entrance", "dining-plaza"] },
    { id: "east-walkway", type: "junction", x: 520, y: 280, label: "East Campus Walkway", connections: ["eng-entrance", "adm-entrance", "graduate-housing"] },
    { id: "south-walkway", type: "junction", x: 320, y: 430, label: "South Campus Walkway", connections: ["su-entrance", "gym-entrance", "dining-plaza"] },
    { id: "sci-walkway", type: "junction", x: 250, y: 200, label: "Science Quad", connections: ["sci-entrance", "lib-entrance", "research-labs"] },
    
    // Specialized areas
    { id: "dining-plaza", type: "junction", x: 200, y: 380, label: "Dining Plaza", connections: ["res-entrance", "west-walkway", "south-walkway"] },
    { id: "sports-complex", type: "landmark", x: 280, y: 520, label: "Sports Complex", connections: ["gym-entrance", "south-gate", "athletic-fields"] },
    { id: "research-labs", type: "building", x: 180, y: 80, label: "Research Laboratories", connections: ["sci-walkway", "graduate-center"] },
    { id: "graduate-center", type: "building", x: 580, y: 120, label: "Graduate Student Center", connections: ["research-labs", "east-walkway"] },
    { id: "visitor-center", type: "building", x: 80, y: 200, label: "Visitor Information Center", connections: ["main-gate", "parking-west"] },
    
    // Parking areas
    { id: "parking-north", type: "junction", x: 150, y: 50, label: "North Parking", connections: ["sci-entrance", "research-labs"] },
    { id: "parking-west", type: "junction", x: 50, y: 180, label: "West Parking", connections: ["visitor-center", "main-gate"] },
    { id: "visitor-parking", type: "junction", x: 550, y: 350, label: "Visitor Parking", connections: ["adm-entrance", "east-walkway"] },
    { id: "south-parking", type: "junction", x: 400, y: 520, label: "South Parking", connections: ["south-gate", "sports-complex"] },
    { id: "graduate-housing", type: "building", x: 600, y: 250, label: "Graduate Housing", connections: ["east-gate", "east-walkway", "graduate-center"] },
    { id: "athletic-fields", type: "building", x: 250, y: 550, label: "Athletic Fields", connections: ["sports-complex", "south-parking"] }
  ];

  const mapPaths: MapPath[] = [
    // Main walkways
    { id: "path-1", startNode: "lib-entrance", endNode: "central-plaza", type: "walkway", distance: 120, accessibility: true },
    { id: "path-2", startNode: "central-plaza", endNode: "eng-entrance", type: "walkway", distance: 150, accessibility: true },
    { id: "path-3", startNode: "central-plaza", endNode: "su-entrance", type: "walkway", distance: 105, accessibility: true },
    { id: "path-4", startNode: "sci-entrance", endNode: "lib-entrance", type: "walkway", distance: 160, accessibility: true },
    { id: "path-5", startNode: "res-entrance", endNode: "west-walkway", type: "walkway", distance: 80, accessibility: true },
    { id: "path-6", startNode: "west-walkway", endNode: "main-gate", type: "walkway", distance: 70, accessibility: true },
    { id: "path-7", startNode: "east-walkway", endNode: "eng-entrance", type: "walkway", distance: 90, accessibility: true },
    { id: "path-8", startNode: "adm-entrance", endNode: "east-walkway", type: "walkway", distance: 75, accessibility: true },
    { id: "path-9", startNode: "su-entrance", endNode: "south-walkway", type: "walkway", distance: 95, accessibility: true },
    { id: "path-10", startNode: "gym-entrance", endNode: "south-walkway", type: "walkway", distance: 110, accessibility: true },
    
    // Secondary connections
    { id: "path-11", startNode: "fountain-area", endNode: "central-plaza", type: "walkway", distance: 50, accessibility: true },
    { id: "path-12", startNode: "amphitheater", endNode: "fountain-area", type: "walkway", distance: 40, accessibility: true },
    { id: "path-13", startNode: "dining-plaza", endNode: "res-entrance", type: "walkway", distance: 60, accessibility: true },
    { id: "path-14", startNode: "dining-plaza", endNode: "south-walkway", type: "walkway", distance: 120, accessibility: true },
    { id: "path-15", startNode: "sci-walkway", endNode: "sci-entrance", type: "walkway", distance: 50, accessibility: true },
    { id: "path-16", startNode: "sci-walkway", endNode: "research-labs", type: "walkway", distance: 130, accessibility: true },
    { id: "path-17", startNode: "research-labs", endNode: "graduate-center", type: "walkway", distance: 400, accessibility: true },
    { id: "path-18", startNode: "graduate-center", endNode: "east-walkway", type: "walkway", distance: 160, accessibility: true },
    
    // Campus perimeter and gates
    { id: "path-19", startNode: "east-gate", endNode: "eng-entrance", type: "walkway", distance: 100, accessibility: true },
    { id: "path-20", startNode: "east-gate", endNode: "graduate-housing", type: "walkway", distance: 80, accessibility: true },
    { id: "path-21", startNode: "south-gate", endNode: "sports-complex", type: "walkway", distance: 70, accessibility: true },
    { id: "path-22", startNode: "sports-complex", endNode: "gym-entrance", type: "walkway", distance: 45, accessibility: true },
    { id: "path-23", startNode: "visitor-center", endNode: "main-gate", type: "walkway", distance: 50, accessibility: true },
    { id: "path-24", startNode: "visitor-center", endNode: "parking-west", type: "walkway", distance: 40, accessibility: true },
    
    // Parking connections
    { id: "path-25", startNode: "parking-north", endNode: "sci-entrance", type: "walkway", distance: 120, accessibility: true },
    { id: "path-26", startNode: "visitor-parking", endNode: "adm-entrance", type: "walkway", distance: 55, accessibility: true },
    { id: "path-27", startNode: "south-parking", endNode: "sports-complex", type: "walkway", distance: 120, accessibility: true },
    { id: "path-28", startNode: "graduate-housing", endNode: "graduate-center", type: "walkway", distance: 130, accessibility: true },
    { id: "path-29", startNode: "athletic-fields", endNode: "sports-complex", type: "walkway", distance: 80, accessibility: true }
  ];

  useEffect(() => {
    drawCampusMap();
  }, [selectedBuilding, currentPath]);

  const drawCampusMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw campus background
    ctx.fillStyle = "#f0f8f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid for reference
    drawGrid(ctx);

    // Draw walkways/paths first (underneath buildings)
    drawWalkways(ctx);

    // Draw buildings
    drawBuildings(ctx);

    // Draw nodes and connections
    drawNodes(ctx);

    // Draw current path if exists
    if (currentPath.length > 0) {
      drawCurrentPath(ctx);
    }

    // Draw labels and legends
    drawLabels(ctx);
  };

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    ctx.strokeStyle = "#e0e8e0";
    ctx.lineWidth = 0.5;
    
    // Vertical lines
    for (let x = 0; x <= canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  };

  const drawWalkways = (ctx: CanvasRenderingContext2D) => {
    mapPaths.forEach(path => {
      const startNode = mapNodes.find(n => n.id === path.startNode);
      const endNode = mapNodes.find(n => n.id === path.endNode);
      
      if (startNode && endNode) {
        ctx.strokeStyle = path.accessibility ? "#d4d4aa" : "#c0c0c0";
        ctx.lineWidth = path.type === "walkway" ? 8 : 4;
        ctx.lineCap = "round";
        
        ctx.beginPath();
        ctx.moveTo(startNode.x, startNode.y);
        ctx.lineTo(endNode.x, endNode.y);
        ctx.stroke();
      }
    });
  };

  const drawBuildings = (ctx: CanvasRenderingContext2D) => {
    buildings.forEach(building => {
      const { x, y, width, height } = building.coordinates;
      const isSelected = selectedBuilding?.id === building.id;
      
      // Building shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(x + 3, y + 3, width, height);
      
      // Building base color based on type
      let buildingColor = "#e0e0e0";
      switch (building.type) {
        case "academic": buildingColor = "#4a90e2"; break;
        case "residential": buildingColor = "#7ed321"; break;
        case "administrative": buildingColor = "#f5a623"; break;
        case "recreational": buildingColor = "#d0021b"; break;
      }
      
      ctx.fillStyle = isSelected ? "#ff6b6b" : buildingColor;
      ctx.fillRect(x, y, width, height);
      
      // Building outline
      ctx.strokeStyle = isSelected ? "#ff4757" : "#2c3e50";
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeRect(x, y, width, height);
      
      // Building details (windows, doors)
      drawBuildingDetails(ctx, building);
      
      // Building label
      ctx.fillStyle = "#2c3e50";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(building.code, x + width/2, y + height/2);
      
      ctx.font = "10px Arial";
      ctx.fillText(building.name, x + width/2, y + height/2 + 15);
    });
  };

  const drawBuildingDetails = (ctx: CanvasRenderingContext2D, building: Building) => {
    const { x, y, width, height } = building.coordinates;
    
    // Draw windows
    ctx.fillStyle = "#87ceeb";
    const windowSize = 8;
    const windowSpacing = 15;
    
    for (let floor = 0; floor < building.floors; floor++) {
      const floorY = y + 10 + (floor * (height - 20) / building.floors);
      for (let i = 0; i < Math.floor(width / windowSpacing) - 1; i++) {
        const windowX = x + 10 + (i * windowSpacing);
        ctx.fillRect(windowX, floorY, windowSize, windowSize);
      }
    }
    
    // Draw main entrance
    ctx.fillStyle = "#8b4513";
    const doorWidth = 12;
    const doorHeight = 20;
    ctx.fillRect(x + width/2 - doorWidth/2, y + height - doorHeight, doorWidth, doorHeight);
  };

  const drawNodes = (ctx: CanvasRenderingContext2D) => {
    mapNodes.forEach(node => {
      let nodeColor = "#34495e";
      let nodeSize = 6;
      
      switch (node.type) {
        case "entrance": nodeColor = "#e74c3c"; nodeSize = 8; break;
        case "junction": nodeColor = "#3498db"; nodeSize = 6; break;
        case "landmark": nodeColor = "#9b59b6"; nodeSize = 10; break;
        case "building": nodeColor = "#2ecc71"; nodeSize = 8; break;
      }
      
      // Node outline
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize + 2, 0, 2 * Math.PI);
      ctx.fill();
      
      // Node
      ctx.fillStyle = nodeColor;
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  const drawCurrentPath = (ctx: CanvasRenderingContext2D) => {
    if (currentPath.length < 2) return;
    
    ctx.strokeStyle = "#ff6b6b";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.setLineDash([10, 5]);
    
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
    
    ctx.setLineDash([]); // Reset line dash
  };

  const drawLabels = (ctx: CanvasRenderingContext2D) => {
    // Draw legend
    const legendX = 20;
    const legendY = 20;
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillRect(legendX - 10, legendY - 10, 200, 120);
    ctx.strokeStyle = "#2c3e50";
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX - 10, legendY - 10, 200, 120);
    
    ctx.fillStyle = "#2c3e50";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Campus Map Legend", legendX, legendY + 10);
    
    const legendItems = [
      { color: "#4a90e2", label: "Academic Buildings" },
      { color: "#7ed321", label: "Residential" },
      { color: "#f5a623", label: "Administrative" },
      { color: "#d0021b", label: "Recreation" }
    ];
    
    legendItems.forEach((item, index) => {
      const y = legendY + 30 + (index * 20);
      ctx.fillStyle = item.color;
      ctx.fillRect(legendX, y - 8, 15, 15);
      
      ctx.fillStyle = "#2c3e50";
      ctx.font = "12px Arial";
      ctx.fillText(item.label, legendX + 25, y + 5);
    });
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
          // Reset and start over
          setStartLocation(clickedNode.id);
          setEndLocation("");
          setCurrentPath([]);
        }
      }
    }
  };

  const findPath = (start: string, end: string) => {
    // Simple pathfinding using Dijkstra's algorithm
    const distances: { [key: string]: number } = {};
    const previous: { [key: string]: string | null } = {};
    const unvisited = new Set<string>();

    // Initialize distances
    mapNodes.forEach(node => {
      distances[node.id] = node.id === start ? 0 : Infinity;
      previous[node.id] = null;
      unvisited.add(node.id);
    });

    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
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

      // Check all neighbors
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

    // Reconstruct path
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

  const filteredBuildings = buildings.filter(building =>
    building.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    building.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    building.departments.some(dept => 
      dept.toLowerCase().includes(searchQuery.toLowerCase())
    )
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
                Interactive Campus Map
              </CardTitle>
              <div className="flex items-center gap-2">
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
          </CardHeader>
          <CardContent>
            <canvas
              ref={canvasRef}
              width={700}
              height={600}
              className="border rounded-lg cursor-pointer bg-white"
              onClick={handleCanvasClick}
            />
          </CardContent>
        </Card>
      </div>

      {/* Side Panel */}
      <div className="w-full lg:w-80 space-y-4">
        {/* Search */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Find Buildings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="search">Search by name, code, or department</Label>
              <Input
                id="search"
                placeholder="e.g. Library, SCI, Physics..."
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
                <span className="font-medium">Start:</span> {startLocation || "Click on map"}
              </div>
              <div className="text-sm">
                <span className="font-medium">Destination:</span> {endLocation || "Click on map"}
              </div>
              {currentPath.length > 0 && (
                <div className="text-sm">
                  <span className="font-medium">Route found:</span> {currentPath.length} steps
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
              <div className="flex items-center gap-2">
                <Badge variant="outline">{selectedBuilding.code}</Badge>
                <Badge variant="secondary">{selectedBuilding.type}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Floors:</span> {selectedBuilding.floors}
                </div>
                <div>
                  <span className="font-medium">Capacity:</span> {selectedBuilding.capacity}
                </div>
              </div>
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
                    <Badge variant="outline" className="text-xs">
                      {building.type}
                    </Badge>
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