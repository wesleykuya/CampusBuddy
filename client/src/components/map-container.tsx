import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CanvasMapEditor } from "@/components/canvas-map-editor";
import { useAuth } from "@/hooks/use-auth";
import { getAuthHeaders } from "@/lib/auth";
import { 
  Plus, Minus, Navigation2, Edit, Building, Layers,
  MapPin, Route, Users, Settings
} from "lucide-react";

interface Node {
  id: string;
  type: 'room' | 'junction' | 'stairs' | 'entrance';
  x: number;
  y: number;
  connections: string[];
  label?: string;
}

export function MapContainer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [showMapEditor, setShowMapEditor] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showDirections, setShowDirections] = useState(false);
  const [pathfindingResult, setPathfindingResult] = useState<any>(null);
  const { user } = useAuth();

  // Fetch buildings data
  const { data: buildings = [] } = useQuery({
    queryKey: ["/api/buildings"],
    queryFn: async () => {
      const response = await fetch("/api/buildings", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch buildings");
      return response.json();
    },
  });

  // Fetch floors for selected building
  const { data: floors = [] } = useQuery({
    queryKey: [`/api/buildings/${selectedBuilding}/floors`],
    queryFn: async () => {
      const response = await fetch(`/api/buildings/${selectedBuilding}/floors`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch floors");
      return response.json();
    },
    enabled: !!selectedBuilding,
  });

  // Fetch selected floor data
  const { data: currentFloor } = useQuery({
    queryKey: [`/api/floors/${selectedFloor}`],
    queryFn: async () => {
      const authHeaders = getAuthHeaders();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (authHeaders.Authorization) {
        headers.Authorization = authHeaders.Authorization;
      }
      
      const response = await fetch(`/api/floors/${selectedFloor}`, {
        headers,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch floor");
      return response.json();
    },
    enabled: !!selectedFloor,
  });

  // Set default building and floor
  useEffect(() => {
    if (buildings.length > 0 && !selectedBuilding) {
      setSelectedBuilding(buildings[0].id);
    }
  }, [buildings]);

  useEffect(() => {
    if (floors.length > 0 && !selectedFloor) {
      setSelectedFloor(floors[0].id);
    }
  }, [floors]);

  // Render canvas map
  useEffect(() => {
    if (!canvasRef.current || !currentFloor) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply zoom and pan transformations
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(pan.x, pan.y);

    // Draw schematic image if available
    if (currentFloor.schematicImage) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width / zoom, canvas.height / zoom);
        drawNodes(ctx);
        drawPaths(ctx);
      };
      img.src = currentFloor.schematicImage;
    } else {
      // Draw basic grid background
      drawGrid(ctx, canvas.width / zoom, canvas.height / zoom);
      drawNodes(ctx);
      drawPaths(ctx);
    }

    ctx.restore();
  }, [currentFloor, zoom, pan]);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    
    const gridSize = 20;
    
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const drawNodes = (ctx: CanvasRenderingContext2D) => {
    if (!currentFloor?.nodes) return;

    currentFloor.nodes.forEach((node: Node) => {
      // Draw node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI);
      ctx.fillStyle = getNodeColor(node.type);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw label
      if (node.label) {
        ctx.fillStyle = '#1e293b';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + 25);
      }

      // Highlight selected node
      if (selectedNode && selectedNode.id === node.id) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 12, 0, 2 * Math.PI);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    });
  };

  const drawPaths = (ctx: CanvasRenderingContext2D) => {
    if (!currentFloor?.paths || !currentFloor?.nodes) return;

    currentFloor.paths.forEach((path: any) => {
      const startNode = currentFloor.nodes.find((n: Node) => n.id === path.startNode);
      const endNode = currentFloor.nodes.find((n: Node) => n.id === path.endNode);
      
      if (startNode && endNode) {
        ctx.beginPath();
        ctx.moveTo(startNode.x, startNode.y);
        ctx.lineTo(endNode.x, endNode.y);
        ctx.strokeStyle = getPathColor(path.pathType);
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    });
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'room': return '#3b82f6';
      case 'junction': return '#10b981';
      case 'stairs': return '#f59e0b';
      case 'entrance': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPathColor = (type: string) => {
    switch (type) {
      case 'stairs': return '#f59e0b';
      case 'elevator': return '#8b5cf6';
      default: return '#64748b';
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !currentFloor?.nodes) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left - pan.x) / zoom;
    const y = (event.clientY - rect.top - pan.y) / zoom;

    // Find clicked node
    const clickedNode = currentFloor.nodes.find((node: Node) => {
      const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
      return distance <= 12;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode);
    } else {
      setSelectedNode(null);
    }
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (event.button === 0) { // Left mouse button
      setIsDragging(true);
      setLastPanPoint({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      const deltaX = event.clientX - lastPanPoint.x;
      const deltaY = event.clientY - lastPanPoint.y;
      
      setPan(prev => ({
        x: prev.x + deltaX / zoom,
        y: prev.y + deltaY / zoom
      }));
      
      setLastPanPoint({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const zoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const zoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.3));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="flex-1 relative">
      {/* Building and Floor Selector */}
      <Card className="absolute top-4 left-4 z-10 p-4 min-w-64">
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium">Building</Label>
            <Select value={selectedBuilding?.toString()} onValueChange={(value) => setSelectedBuilding(parseInt(value))}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select building" />
              </SelectTrigger>
              <SelectContent>
                {buildings.map((building: any) => (
                  <SelectItem key={building.id} value={building.id.toString()}>
                    {building.code} - {building.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {floors.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Floor</Label>
              <Select value={selectedFloor?.toString()} onValueChange={(value) => setSelectedFloor(parseInt(value))}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select floor" />
                </SelectTrigger>
                <SelectContent>
                  {floors.map((floor: any) => (
                    <SelectItem key={floor.id} value={floor.id.toString()}>
                      {floor.name || `Level ${floor.level}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {user?.isAdmin && selectedBuilding && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowMapEditor(true)}
              className="w-full"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Map
            </Button>
          )}
        </div>
      </Card>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 space-y-2">
        <Card className="overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 rounded-none border-b"
            onClick={zoomIn}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 rounded-none"
            onClick={zoomOut}
          >
            <Minus className="h-4 w-4" />
          </Button>
        </Card>
        
        <Button
          variant="outline"
          size="sm"
          className="bg-white shadow-lg border-slate-200"
          onClick={resetView}
        >
          <Navigation2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Node Info Panel */}
      {selectedNode && (
        <Card className="absolute bottom-4 right-4 z-10 p-4 max-w-xs">
          <h4 className="font-semibold text-slate-800 mb-2 text-sm">
            {selectedNode.label || selectedNode.id}
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: getNodeColor(selectedNode.type) }}
              ></div>
              <span className="text-slate-700 capitalize">{selectedNode.type}</span>
            </div>
            <div className="text-slate-600">
              Position: ({Math.round(selectedNode.x)}, {Math.round(selectedNode.y)})
            </div>
            <div className="text-slate-600">
              Connections: {selectedNode.connections.length}
            </div>
          </div>
        </Card>
      )}

      {/* Map Legend */}
      <Card className="absolute bottom-4 left-4 z-10 p-4 max-w-xs">
        <h4 className="font-semibold text-slate-800 mb-3 text-sm">Navigation Legend</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-slate-700">Rooms</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-slate-700">Junctions</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span className="text-slate-700">Stairs</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-slate-700">Entrances</span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200">
            <p className="text-slate-600">Click nodes to select and get directions</p>
          </div>
        </div>
      </Card>

      {/* Canvas Map */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full h-full cursor-move"
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Map Editor Modal */}
      {showMapEditor && selectedFloor && selectedBuilding && (
        <CanvasMapEditor
          floorId={selectedFloor}
          buildingId={selectedBuilding}
          isOpen={showMapEditor}
          onClose={() => setShowMapEditor(false)}
        />
      )}
    </div>
  );
}
