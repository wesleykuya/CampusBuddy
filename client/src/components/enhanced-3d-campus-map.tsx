import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Navigation, Building, Users, Calendar, Settings, Shield, Edit, Plus, Trash2, Navigation2, MapPin2, Layers, Compass, Target } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";

interface GeolocationPosition {
  lat: number;
  lng: number;
  accuracy: number;
  heading?: number;
  speed?: number;
}

interface MapNode {
  id: string;
  type: 'building' | 'entrance' | 'junction' | 'landmark' | 'parking' | 'amenity' | 'emergency';
  x: number;
  y: number;
  z?: number; // For 3D positioning
  floor?: number;
  lat?: number; // Real GPS coordinates
  lng?: number;
  label: string;
  buildingCode?: string;
  description?: string;
  connections: string[];
  capacity?: number;
  accessibility?: boolean;
  indoorPositioning?: {
    beaconId?: string;
    wifiFingerprint?: string;
  };
}

interface NavigationStep {
  id: string;
  instruction: string;
  distance: number;
  direction: 'straight' | 'left' | 'right' | 'up' | 'down';
  landmark?: string;
  estimatedTime: number;
}

interface PathfindingResult {
  path: string[];
  distance: number;
  estimatedTime: number;
  steps: NavigationStep[];
  accessibility: boolean;
}

interface Building3D {
  id: string;
  name: string;
  code: string;
  type: 'academic' | 'residential' | 'administrative' | 'recreational' | 'dining' | 'medical' | 'library';
  floors: number;
  capacity: number;
  departments: string[];
  coordinates: { 
    x: number; 
    y: number; 
    width: number; 
    height: number;
    lat: number; // Real GPS
    lng: number;
  };
  model3D?: {
    url?: string;
    scale: number;
    rotation: { x: number; y: number; z: number };
  };
  isAccessible: boolean;
  openingHours?: string;
  facilities?: string[];
  emergencyExits?: MapNode[];
}

export function Enhanced3DCampusMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();
  
  // State management
  const [selectedBuilding, setSelectedBuilding] = useState<Building3D | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [pathfindingMode, setPathfindingMode] = useState(false);
  const [startLocation, setStartLocation] = useState<string>("");
  const [endLocation, setEndLocation] = useState<string>("");
  const [currentPath, setCurrentPath] = useState<PathfindingResult | null>(null);
  const [viewMode, setViewMode] = useState<'2d' | '3d' | 'ar'>('2d');
  const [isEditMode, setIsEditMode] = useState(false);
  const [userPosition, setUserPosition] = useState<GeolocationPosition | null>(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [indoorPositioning, setIndoorPositioning] = useState<boolean>(false);
  
  // Real-time geolocation tracking
  useEffect(() => {
    let watchId: number;
    
    if (isTrackingLocation && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserPosition({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Fallback to indoor positioning
          setIndoorPositioning(true);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    }
    
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isTrackingLocation]);

  // Indoor positioning simulation (would integrate with actual beacons/WiFi)
  useEffect(() => {
    if (indoorPositioning) {
      // Simulate beacon/WiFi positioning
      const handleBeaconUpdate = (beaconData: any) => {
        // Convert beacon data to coordinates
        const coordinates = convertBeaconToCoordinates(beaconData);
        setUserPosition(coordinates);
      };
      
      // In real implementation, this would connect to beacon/WiFi positioning service
      const simulateIndoorPosition = () => {
        setUserPosition({
          lat: 40.7589,
          lng: -73.9851,
          accuracy: 3,
        });
      };
      
      const interval = setInterval(simulateIndoorPosition, 5000);
      return () => clearInterval(interval);
    }
  }, [indoorPositioning]);

  // Enhanced buildings data with 3D models and GPS coordinates
  const buildings: Building3D[] = [
    {
      id: "lib-001",
      name: "Central Library",
      code: "LIB",
      type: "library",
      floors: 5,
      capacity: 1200,
      departments: ["Library Sciences", "Study Spaces", "Archives", "Digital Resources"],
      coordinates: { 
        x: 350, y: 180, width: 140, height: 100,
        lat: 40.7589, lng: -73.9851 
      },
      model3D: {
        scale: 1.0,
        rotation: { x: 0, y: 0, z: 0 }
      },
      isAccessible: true,
      openingHours: "24/7",
      facilities: ["WiFi", "Study Rooms", "Computer Lab", "Printing Services", "Café"],
      emergencyExits: [
        { id: "lib-exit-1", type: "emergency", x: 320, y: 180, label: "North Exit", connections: [] },
        { id: "lib-exit-2", type: "emergency", x: 490, y: 250, label: "South Exit", connections: [] }
      ]
    },
    {
      id: "eng-001",
      name: "Engineering Complex",
      code: "ENG",
      type: "academic",
      floors: 8,
      capacity: 2500,
      departments: ["Computer Science", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering"],
      coordinates: { 
        x: 150, y: 320, width: 180, height: 120,
        lat: 40.7575, lng: -73.9865 
      },
      model3D: {
        scale: 1.2,
        rotation: { x: 0, y: 45, z: 0 }
      },
      isAccessible: true,
      openingHours: "6:00 AM - 10:00 PM",
      facilities: ["WiFi", "Labs", "Workshop", "3D Printing", "Robotics Lab"],
      emergencyExits: [
        { id: "eng-exit-1", type: "emergency", x: 150, y: 350, label: "West Exit", connections: [] },
        { id: "eng-exit-2", type: "emergency", x: 300, y: 320, label: "East Exit", connections: [] }
      ]
    }
  ];

  // Enhanced navigation graph with 3D pathfinding
  const navigationGraph = {
    nodes: [
      { id: 'entrance-main', floor: 0, coords: [400, 500], gps: [40.7580, -73.9860], links: ['junction-1'] },
      { id: 'junction-1', floor: 0, coords: [400, 400], gps: [40.7585, -73.9860], links: ['entrance-main', 'lib-001', 'eng-001'] },
      { id: 'lib-001', floor: 0, coords: [420, 230], gps: [40.7589, -73.9851], links: ['junction-1', 'lib-floor-1'] },
      { id: 'lib-floor-1', floor: 1, coords: [420, 230], gps: [40.7589, -73.9851], links: ['lib-001', 'lib-room-101'] },
      { id: 'lib-room-101', floor: 1, coords: [380, 200], gps: [40.7590, -73.9853], links: ['lib-floor-1'] },
      { id: 'eng-001', floor: 0, coords: [230, 380], gps: [40.7575, -73.9865], links: ['junction-1', 'eng-floor-1'] },
      { id: 'eng-floor-1', floor: 1, coords: [230, 380], gps: [40.7575, -73.9865], links: ['eng-001', 'eng-lab-101'] },
      { id: 'eng-lab-101', floor: 1, coords: [200, 350], gps: [40.7573, -73.9867], links: ['eng-floor-1'] }
    ]
  };

  // Advanced pathfinding algorithm (A* with 3D support)
  const findOptimalPath = (start: string, end: string, options: {
    accessibleOnly?: boolean;
    avoidStairs?: boolean;
    preferElevator?: boolean;
  } = {}): PathfindingResult | null => {
    // Implement A* pathfinding with accessibility constraints
    const startNode = navigationGraph.nodes.find(n => n.id === start);
    const endNode = navigationGraph.nodes.find(n => n.id === end);
    
    if (!startNode || !endNode) return null;
    
    // Simplified pathfinding result
    const path = [start, end];
    const distance = calculateDistance(startNode.coords, endNode.coords);
    const estimatedTime = Math.ceil(distance / 80); // 80 meters per minute walking speed
    
    const steps: NavigationStep[] = [
      {
        id: '1',
        instruction: `Head towards ${endNode.id}`,
        distance: distance,
        direction: 'straight',
        estimatedTime: estimatedTime
      }
    ];
    
    return {
      path,
      distance,
      estimatedTime,
      steps,
      accessibility: true
    };
  };

  // Helper function to calculate distance between two points
  const calculateDistance = (point1: number[], point2: number[]): number => {
    const dx = point2[0] - point1[0];
    const dy = point2[1] - point1[1];
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Convert beacon data to coordinates (placeholder implementation)
  const convertBeaconToCoordinates = (beaconData: any): GeolocationPosition => {
    // In real implementation, this would use trilateration from multiple beacons
    return {
      lat: 40.7589 + (Math.random() - 0.5) * 0.001,
      lng: -73.9851 + (Math.random() - 0.5) * 0.001,
      accuracy: 2
    };
  };

  // Handle pathfinding request
  const handleFindPath = () => {
    if (startLocation && endLocation) {
      const result = findOptimalPath(startLocation, endLocation, {
        accessibleOnly: user?.role === 'student' // Assume students need accessible routes
      });
      setCurrentPath(result);
    }
  };

  // Canvas drawing functions (enhanced for 3D visualization)
  const drawCampus = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    drawBackground(ctx);
    
    // Draw buildings with 3D effect
    if (viewMode === '3d') {
      drawBuildings3D(ctx);
    } else {
      drawBuildings2D(ctx);
    }
    
    // Draw navigation paths
    if (currentPath) {
      drawNavigationPath(ctx);
    }
    
    // Draw user position
    if (userPosition) {
      drawUserPosition(ctx);
    }
    
    // Draw floor-specific elements if a building is selected
    if (selectedBuilding && selectedFloor > 0) {
      drawFloorPlan(ctx);
    }
  };

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    // Campus ground texture
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(0, 0, 800, 600);
    
    // Pathways
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(50, 500);
    ctx.lineTo(750, 500);
    ctx.moveTo(400, 50);
    ctx.lineTo(400, 550);
    ctx.stroke();
  };

  const drawBuildings2D = (ctx: CanvasRenderingContext2D) => {
    buildings.forEach(building => {
      const { x, y, width, height } = building.coordinates;
      
      // Building shadow for depth
      ctx.fillStyle = '#374151';
      ctx.fillRect(x + 4, y + 4, width, height);
      
      // Main building
      const color = getBuildingColor(building.type);
      ctx.fillStyle = color;
      ctx.fillRect(x, y, width, height);
      
      // Building outline
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
      
      // Building label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(building.code, x + width/2, y + height/2);
      ctx.fillText(building.name, x + width/2, y + height/2 + 15);
    });
  };

  const drawBuildings3D = (ctx: CanvasRenderingContext2D) => {
    buildings.forEach(building => {
      const { x, y, width, height } = building.coordinates;
      const floors = building.floors;
      const floorHeight = 8;
      
      // Draw each floor with perspective
      for (let floor = 0; floor < floors; floor++) {
        const offsetX = floor * 2;
        const offsetY = floor * 2;
        const currentY = y - offsetY;
        const currentX = x + offsetX;
        
        // Floor shadow
        ctx.fillStyle = `rgba(55, 65, 81, ${0.3 - floor * 0.05})`;
        ctx.fillRect(currentX + 4, currentY + 4, width, height);
        
        // Floor
        const color = getBuildingColor(building.type);
        const alpha = 1 - floor * 0.1;
        ctx.fillStyle = adjustColorAlpha(color, alpha);
        ctx.fillRect(currentX, currentY, width, height);
        
        // Floor outline
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 1;
        ctx.strokeRect(currentX, currentY, width, height);
      }
      
      // Building label on top floor
      const topFloor = floors - 1;
      const labelX = x + topFloor * 2 + width/2;
      const labelY = y - topFloor * 2 + height/2;
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(building.code, labelX, labelY);
    });
  };

  const drawNavigationPath = (ctx: CanvasRenderingContext2D) => {
    if (!currentPath) return;
    
    // Draw path line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    
    // Draw path based on navigation graph
    currentPath.path.forEach((nodeId, index) => {
      const node = navigationGraph.nodes.find(n => n.id === nodeId);
      if (node) {
        if (index === 0) {
          ctx.moveTo(node.coords[0], node.coords[1]);
        } else {
          ctx.lineTo(node.coords[0], node.coords[1]);
        }
      }
    });
    
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw turn-by-turn markers
    currentPath.steps.forEach((step, index) => {
      const node = navigationGraph.nodes.find(n => n.id === currentPath.path[index]);
      if (node) {
        // Step marker
        ctx.fillStyle = '#1d4ed8';
        ctx.beginPath();
        ctx.arc(node.coords[0], node.coords[1], 8, 0, 2 * Math.PI);
        ctx.fill();
        
        // Step number
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText((index + 1).toString(), node.coords[0], node.coords[1] + 3);
      }
    });
  };

  const drawUserPosition = (ctx: CanvasRenderingContext2D) => {
    if (!userPosition) return;
    
    // Convert GPS to canvas coordinates (simplified)
    const canvasX = 400 + (userPosition.lng + 73.9856) * 10000;
    const canvasY = 300 - (userPosition.lat - 40.7580) * 10000;
    
    // Accuracy circle
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, userPosition.accuracy * 2, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // User position marker
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Direction indicator if available
    if (userPosition.heading !== undefined) {
      const headingRad = (userPosition.heading * Math.PI) / 180;
      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(canvasX, canvasY);
      ctx.lineTo(
        canvasX + Math.sin(headingRad) * 20,
        canvasY - Math.cos(headingRad) * 20
      );
      ctx.stroke();
    }
  };

  const drawFloorPlan = (ctx: CanvasRenderingContext2D) => {
    if (!selectedBuilding) return;
    
    // Draw floor plan overlay
    const building = selectedBuilding;
    const { x, y, width, height } = building.coordinates;
    
    // Floor background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(x, y, width, height);
    
    // Room outlines (example rooms)
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    
    // Example rooms for the floor
    const rooms = [
      { x: x + 10, y: y + 10, width: 40, height: 30, label: '101' },
      { x: x + 60, y: y + 10, width: 40, height: 30, label: '102' },
      { x: x + 10, y: y + 50, width: 40, height: 30, label: '103' },
      { x: x + 60, y: y + 50, width: 40, height: 30, label: '104' }
    ];
    
    rooms.forEach(room => {
      ctx.strokeRect(room.x, room.y, room.width, room.height);
      ctx.fillStyle = '#374151';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(room.label, room.x + room.width/2, room.y + room.height/2);
    });
  };

  const getBuildingColor = (type: string): string => {
    const colors = {
      academic: '#3b82f6',
      library: '#8b5cf6',
      residential: '#10b981',
      dining: '#f59e0b',
      administrative: '#ef4444',
      recreational: '#06b6d4',
      medical: '#ec4899'
    };
    return colors[type as keyof typeof colors] || '#6b7280';
  };

  const adjustColorAlpha = (color: string, alpha: number): string => {
    // Simple color alpha adjustment
    return color + Math.round(alpha * 255).toString(16).padStart(2, '0');
  };

  // Redraw canvas when dependencies change
  useEffect(() => {
    drawCampus();
  }, [viewMode, selectedBuilding, selectedFloor, currentPath, userPosition]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Enhanced Header with 3D Controls */}
      <Card className="m-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Enhanced Campus Navigation
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
                <TabsList>
                  <TabsTrigger value="2d">2D</TabsTrigger>
                  <TabsTrigger value="3d">3D</TabsTrigger>
                  <TabsTrigger value="ar">AR</TabsTrigger>
                </TabsList>
              </Tabs>
              
              {/* Location Tracking */}
              <Button
                variant={isTrackingLocation ? "default" : "outline"}
                size="sm"
                onClick={() => setIsTrackingLocation(!isTrackingLocation)}
              >
                <Target className="h-4 w-4 mr-1" />
                {isTrackingLocation ? 'Tracking' : 'Track Me'}
              </Button>
              
              {user?.role === 'admin' && (
                <Button
                  variant={isEditMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsEditMode(!isEditMode)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  {isEditMode ? 'Exit Edit' : 'Edit'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Enhanced Search and Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="search">Search Location</Label>
              <Input
                id="search"
                placeholder="Search buildings, rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="start">From</Label>
              <Select value={startLocation} onValueChange={setStartLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Starting point" />
                </SelectTrigger>
                <SelectContent>
                  {navigationGraph.nodes.map(node => (
                    <SelectItem key={node.id} value={node.id}>
                      {node.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="end">To</Label>
              <Select value={endLocation} onValueChange={setEndLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Destination" />
                </SelectTrigger>
                <SelectContent>
                  {navigationGraph.nodes.map(node => (
                    <SelectItem key={node.id} value={node.id}>
                      {node.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleFindPath} className="w-full">
                <Navigation className="h-4 w-4 mr-1" />
                Get Directions
              </Button>
            </div>
          </div>
          
          {/* Position and Status Indicators */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {userPosition && (
              <Badge variant="outline" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Lat: {userPosition.lat.toFixed(6)}, Lng: {userPosition.lng.toFixed(6)}
                <span className="text-gray-400">±{userPosition.accuracy}m</span>
              </Badge>
            )}
            {indoorPositioning && (
              <Badge variant="secondary">Indoor Positioning Active</Badge>
            )}
            {currentPath && (
              <Badge variant="default">
                Route: {currentPath.distance.toFixed(0)}m, {currentPath.estimatedTime}min
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-1 gap-4 mx-4 mb-4">
        {/* Enhanced Canvas Map */}
        <div className="flex-1">
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="w-full h-full cursor-crosshair"
                onClick={(e) => {
                  // Handle canvas clicks for navigation
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  
                  // Check if clicked on a building
                  buildings.forEach(building => {
                    const { x: bx, y: by, width, height } = building.coordinates;
                    const scale = rect.width / 800; // Canvas scaling
                    
                    if (x >= bx * scale && x <= (bx + width) * scale &&
                        y >= by * scale && y <= (by + height) * scale) {
                      setSelectedBuilding(building);
                      setSelectedFloor(1);
                    }
                  });
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Side Panel */}
        <div className="w-80">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Navigation Panel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Building Details */}
              {selectedBuilding && (
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold">{selectedBuilding.name}</h3>
                    <p className="text-sm text-gray-600">{selectedBuilding.code}</p>
                  </div>
                  
                  {/* Floor Selector */}
                  <div>
                    <Label>Floor</Label>
                    <Select value={selectedFloor.toString()} onValueChange={(value) => setSelectedFloor(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Ground Floor</SelectItem>
                        {Array.from({ length: selectedBuilding.floors }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            Floor {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Building Info */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Capacity:</span>
                      <span>{selectedBuilding.capacity}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Accessibility:</span>
                      <span>{selectedBuilding.isAccessible ? '✓ Yes' : '✗ No'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Hours:</span>
                      <span>{selectedBuilding.openingHours}</span>
                    </div>
                  </div>
                  
                  {/* Facilities */}
                  <div>
                    <Label>Facilities</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedBuilding.facilities?.map(facility => (
                        <Badge key={facility} variant="secondary" className="text-xs">
                          {facility}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Turn-by-Turn Directions */}
              {currentPath && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Navigation2 className="h-4 w-4" />
                    Directions
                  </h3>
                  <div className="space-y-2">
                    {currentPath.steps.map((step, index) => (
                      <div key={step.id} className="p-2 bg-gray-50 rounded text-sm">
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                            {index + 1}
                          </span>
                          <span>{step.instruction}</span>
                        </div>
                        <div className="text-xs text-gray-500 ml-7">
                          {step.distance.toFixed(0)}m · {step.estimatedTime}min
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Quick Actions */}
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full">
                  <MapPin className="h-4 w-4 mr-1" />
                  Save Location
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  <Users className="h-4 w-4 mr-1" />
                  Share Location
                </Button>
                {viewMode === 'ar' && (
                  <Button variant="outline" size="sm" className="w-full">
                    <Compass className="h-4 w-4 mr-1" />
                    Launch AR Mode
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}