import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getAuthHeaders } from "@/lib/auth";
import { 
  Square, Circle, Minus, MousePointer, Move, 
  Save, Download, Upload, Trash2, MapPin, Navigation,
  Undo, Redo, ZoomIn, ZoomOut
} from "lucide-react";

interface Node {
  id: string;
  type: 'room' | 'junction' | 'stairs' | 'entrance';
  x: number;
  y: number;
  connections: string[];
  label?: string;
}

interface Path {
  id: string;
  startNode: string;
  endNode: string;
  pathType: 'corridor' | 'stairs' | 'elevator';
  distance: number;
}

interface MapEditorProps {
  floorId: number;
  buildingId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function MapEditor({ floorId, buildingId, isOpen, onClose }: MapEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [paths, setPaths] = useState<Path[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch floor data
  const { data: floor } = useQuery({
    queryKey: [`/api/floors/${floorId}`],
    queryFn: async () => {
      const response = await fetch(`/api/floors/${floorId}`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch floor");
      return response.json();
    },
    enabled: isOpen && floorId > 0,
  });

  // Save floor mutation
  const saveFloorMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", `/api/floors/${floorId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/floors/${floorId}`] });
      toast({ title: "Floor saved successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || !isOpen) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#f8fafc',
    });

    fabricCanvasRef.current = canvas;

    // Load existing floor data
    if (floor?.canvasData) {
      canvas.loadFromJSON(floor.canvasData, () => {
        canvas.renderAll();
      });
    }

    if (floor?.nodes) {
      setNodes(floor.nodes);
      renderNodes(canvas, floor.nodes);
    }

    if (floor?.paths) {
      setPaths(floor.paths);
    }

    // Canvas event handlers
    canvas.on('mouse:down', (options) => {
      if (selectedTool === 'node') {
        addNode(options.e.offsetX, options.e.offsetY);
      }
    });

    canvas.on('object:selected', (options) => {
      const obj = options.target;
      if (obj && obj.data && obj.data.nodeId) {
        const node = nodes.find(n => n.id === obj.data.nodeId);
        if (node) {
          setSelectedNode(node);
        }
      }
    });

    return () => {
      canvas.dispose();
    };
  }, [isOpen, floor]);

  const renderNodes = (canvas: fabric.Canvas, nodeList: Node[]) => {
    nodeList.forEach(node => {
      const circle = new fabric.Circle({
        left: node.x - 10,
        top: node.y - 10,
        radius: 10,
        fill: getNodeColor(node.type),
        stroke: '#1e293b',
        strokeWidth: 2,
        selectable: true,
        data: { nodeId: node.id, type: 'node' }
      });

      const text = new fabric.Text(node.label || node.id, {
        left: node.x,
        top: node.y + 15,
        fontSize: 12,
        textAlign: 'center',
        originX: 'center',
        selectable: false,
        data: { nodeId: node.id, type: 'label' }
      });

      canvas.add(circle, text);
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

  const addNode = (x: number, y: number) => {
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type: 'junction',
      x,
      y,
      connections: [],
      label: `Node ${nodes.length + 1}`
    };

    const updatedNodes = [...nodes, newNode];
    setNodes(updatedNodes);

    if (fabricCanvasRef.current) {
      renderNodes(fabricCanvasRef.current, [newNode]);
    }
  };

  const addWall = () => {
    if (!fabricCanvasRef.current) return;

    const wall = new fabric.Rect({
      left: 100,
      top: 100,
      width: 200,
      height: 20,
      fill: '#374151',
      selectable: true,
      data: { type: 'wall' }
    });

    fabricCanvasRef.current.add(wall);
  };

  const addRoom = () => {
    if (!fabricCanvasRef.current) return;

    const room = new fabric.Rect({
      left: 150,
      top: 150,
      width: 100,
      height: 80,
      fill: 'rgba(59, 130, 246, 0.2)',
      stroke: '#3b82f6',
      strokeWidth: 2,
      selectable: true,
      data: { type: 'room' }
    });

    fabricCanvasRef.current.add(room);
  };

  const connectNodes = (nodeId: string) => {
    if (!isConnecting) {
      setIsConnecting(true);
      setConnectionStart(nodeId);
      toast({ title: "Select second node to connect" });
    } else if (connectionStart && connectionStart !== nodeId) {
      // Create connection
      const newPath: Path = {
        id: `path_${Date.now()}`,
        startNode: connectionStart,
        endNode: nodeId,
        pathType: 'corridor',
        distance: calculateDistance(connectionStart, nodeId)
      };

      setPaths([...paths, newPath]);

      // Update node connections
      const updatedNodes = nodes.map(node => {
        if (node.id === connectionStart && !node.connections.includes(nodeId)) {
          return { ...node, connections: [...node.connections, nodeId] };
        }
        if (node.id === nodeId && !node.connections.includes(connectionStart)) {
          return { ...node, connections: [...node.connections, connectionStart] };
        }
        return node;
      });

      setNodes(updatedNodes);
      setIsConnecting(false);
      setConnectionStart(null);
      toast({ title: "Nodes connected successfully" });
    }
  };

  const calculateDistance = (nodeId1: string, nodeId2: string): number => {
    const node1 = nodes.find(n => n.id === nodeId1);
    const node2 = nodes.find(n => n.id === nodeId2);
    
    if (!node1 || !node2) return 0;
    
    const dx = node1.x - node2.x;
    const dy = node1.y - node2.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const saveMap = async () => {
    if (!fabricCanvasRef.current) return;

    const canvasData = fabricCanvasRef.current.toJSON();
    
    const floorData = {
      nodes,
      paths,
      canvasData,
      schematicImage: fabricCanvasRef.current.toDataURL('image/png')
    };

    saveFloorMutation.mutate(floorData);
  };

  const exportMap = () => {
    if (!fabricCanvasRef.current) return;

    const dataURL = fabricCanvasRef.current.toDataURL({
      format: 'png',
      quality: 1.0,
      multiplier: 2
    });

    const link = document.createElement('a');
    link.download = `floor_${floorId}_map.png`;
    link.href = dataURL;
    link.click();
  };

  const clearCanvas = () => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.clear();
    setNodes([]);
    setPaths([]);
    setSelectedNode(null);
  };

  const tools = [
    { id: 'select', icon: MousePointer, label: 'Select' },
    { id: 'move', icon: Move, label: 'Pan' },
    { id: 'wall', icon: Minus, label: 'Wall' },
    { id: 'room', icon: Square, label: 'Room' },
    { id: 'node', icon: Circle, label: 'Node' },
    { id: 'connect', icon: Navigation, label: 'Connect' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Floor Map Editor</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 h-[70vh]">
          {/* Toolbar */}
          <Card className="w-64 overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-lg">Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Drawing Tools */}
              <div>
                <Label className="text-sm font-medium">Drawing Tools</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {tools.map(tool => (
                    <Button
                      key={tool.id}
                      variant={selectedTool === tool.id ? "default" : "outline"}
                      size="sm"
                      className="flex flex-col items-center gap-1 h-16"
                      onClick={() => {
                        setSelectedTool(tool.id);
                        if (tool.id === 'wall') addWall();
                        if (tool.id === 'room') addRoom();
                      }}
                    >
                      <tool.icon className="h-4 w-4" />
                      <span className="text-xs">{tool.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Node Properties */}
              {selectedNode && (
                <div>
                  <Label className="text-sm font-medium">Node Properties</Label>
                  <div className="space-y-2 mt-2">
                    <div>
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={selectedNode.type}
                        onValueChange={(value) => {
                          const updatedNodes = nodes.map(n =>
                            n.id === selectedNode.id ? { ...n, type: value as any } : n
                          );
                          setNodes(updatedNodes);
                          setSelectedNode({ ...selectedNode, type: value as any });
                        }}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="room">Room</SelectItem>
                          <SelectItem value="junction">Junction</SelectItem>
                          <SelectItem value="stairs">Stairs</SelectItem>
                          <SelectItem value="entrance">Entrance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Label</Label>
                      <Input
                        value={selectedNode.label || ''}
                        onChange={(e) => {
                          const updatedNodes = nodes.map(n =>
                            n.id === selectedNode.id ? { ...n, label: e.target.value } : n
                          );
                          setNodes(updatedNodes);
                          setSelectedNode({ ...selectedNode, label: e.target.value });
                        }}
                        className="h-8"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => connectNodes(selectedNode.id)}
                      className="w-full"
                    >
                      {isConnecting ? 'Connecting...' : 'Connect to Node'}
                    </Button>
                  </div>
                </div>
              )}

              <Separator />

              {/* Actions */}
              <div>
                <Label className="text-sm font-medium">Actions</Label>
                <div className="space-y-2 mt-2">
                  <Button onClick={saveMap} size="sm" className="w-full" disabled={saveFloorMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {saveFloorMutation.isPending ? 'Saving...' : 'Save Map'}
                  </Button>
                  <Button onClick={exportMap} size="sm" variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export PNG
                  </Button>
                  <Button onClick={clearCanvas} size="sm" variant="destructive" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Canvas
                  </Button>
                </div>
              </div>

              {/* Statistics */}
              <div>
                <Label className="text-sm font-medium">Statistics</Label>
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between text-xs">
                    <span>Nodes:</span>
                    <Badge variant="secondary">{nodes.length}</Badge>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Paths:</span>
                    <Badge variant="secondary">{paths.length}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Canvas Area */}
          <div className="flex-1 border rounded-lg overflow-hidden bg-white">
            <div className="p-2 border-b flex justify-between items-center">
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Undo className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Redo className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-slate-600">
                Selected Tool: <Badge>{selectedTool}</Badge>
              </div>
            </div>
            <canvas ref={canvasRef} className="block" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}