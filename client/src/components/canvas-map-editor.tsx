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
  Save, Download, Trash2, Navigation
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

interface CanvasMapEditorProps {
  floorId: number;
  buildingId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function CanvasMapEditor({ floorId, buildingId, isOpen, onClose }: CanvasMapEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [paths, setPaths] = useState<Path[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch floor data
  const { data: floor } = useQuery({
    queryKey: [`/api/floors/${floorId}`],
    queryFn: async () => {
      const authHeaders = getAuthHeaders();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (authHeaders.Authorization) {
        headers.Authorization = authHeaders.Authorization;
      }
      
      const response = await fetch(`/api/floors/${floorId}`, {
        headers,
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

  // Load floor data
  useEffect(() => {
    if (floor?.nodes) {
      setNodes(floor.nodes);
    }
    if (floor?.paths) {
      setPaths(floor.paths);
    }
  }, [floor]);

  // Render canvas
  useEffect(() => {
    renderCanvas();
  }, [nodes, paths, selectedNode]);

  const renderCanvas = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid(ctx, canvas.width, canvas.height);
    
    // Draw paths first (so they appear under nodes)
    paths.forEach(path => {
      const startNode = nodes.find(n => n.id === path.startNode);
      const endNode = nodes.find(n => n.id === path.endNode);
      
      if (startNode && endNode) {
        ctx.beginPath();
        ctx.moveTo(startNode.x, startNode.y);
        ctx.lineTo(endNode.x, endNode.y);
        ctx.strokeStyle = getPathColor(path.pathType);
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    });
    
    // Draw nodes
    nodes.forEach(node => {
      // Draw node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, 12, 0, 2 * Math.PI);
      ctx.fillStyle = getNodeColor(node.type);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Highlight selected node
      if (selectedNode && selectedNode.id === node.id) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 18, 0, 2 * Math.PI);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Draw label
      if (node.label) {
        ctx.fillStyle = '#1e293b';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + 30);
      }
    });
  };

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
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (selectedTool === 'node') {
      addNode(x, y);
      return;
    }

    // Find clicked node
    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
      return distance <= 15;
    });

    if (clickedNode) {
      if (isConnecting && connectionStart && connectionStart !== clickedNode.id) {
        connectNodes(connectionStart, clickedNode.id);
      } else {
        setSelectedNode(clickedNode);
      }
    } else {
      setSelectedNode(null);
    }
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool !== 'select') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
      return distance <= 15;
    });

    if (clickedNode) {
      setIsDragging(true);
      setSelectedNode(clickedNode);
      setDragOffset({
        x: x - clickedNode.x,
        y: y - clickedNode.y
      });
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedNode || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left - dragOffset.x;
    const y = event.clientY - rect.top - dragOffset.y;

    // Update node position
    const updatedNodes = nodes.map(node =>
      node.id === selectedNode.id ? { ...node, x, y } : node
    );
    setNodes(updatedNodes);
    setSelectedNode({ ...selectedNode, x, y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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

    setNodes([...nodes, newNode]);
  };

  const connectNodes = (nodeId1: string, nodeId2: string) => {
    const node1 = nodes.find(n => n.id === nodeId1);
    const node2 = nodes.find(n => n.id === nodeId2);
    
    if (!node1 || !node2) return;

    const distance = Math.sqrt((node1.x - node2.x) ** 2 + (node1.y - node2.y) ** 2);
    
    const newPath: Path = {
      id: `path_${Date.now()}`,
      startNode: nodeId1,
      endNode: nodeId2,
      pathType: 'corridor',
      distance
    };

    setPaths([...paths, newPath]);

    // Update node connections
    const updatedNodes = nodes.map(node => {
      if (node.id === nodeId1 && !node.connections.includes(nodeId2)) {
        return { ...node, connections: [...node.connections, nodeId2] };
      }
      if (node.id === nodeId2 && !node.connections.includes(nodeId1)) {
        return { ...node, connections: [...node.connections, nodeId1] };
      }
      return node;
    });

    setNodes(updatedNodes);
    setIsConnecting(false);
    setConnectionStart(null);
    toast({ title: "Nodes connected successfully" });
  };

  const startConnection = () => {
    if (!selectedNode) {
      toast({ title: "Please select a node first" });
      return;
    }
    setIsConnecting(true);
    setConnectionStart(selectedNode.id);
    toast({ title: "Click another node to connect" });
  };

  const deleteNode = () => {
    if (!selectedNode) return;

    // Remove paths connected to this node
    const filteredPaths = paths.filter(
      path => path.startNode !== selectedNode.id && path.endNode !== selectedNode.id
    );
    setPaths(filteredPaths);

    // Remove node
    const filteredNodes = nodes.filter(node => node.id !== selectedNode.id);
    setNodes(filteredNodes);
    setSelectedNode(null);
  };

  const saveMap = async () => {
    if (!canvasRef.current) return;

    const canvasData = canvasRef.current.toDataURL('image/png');
    
    const floorData = {
      nodes,
      paths,
      schematicImage: canvasData
    };

    saveFloorMutation.mutate(floorData);
  };

  const exportMap = () => {
    if (!canvasRef.current) return;

    const dataURL = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `floor_${floorId}_map.png`;
    link.href = dataURL;
    link.click();
  };

  const clearCanvas = () => {
    setNodes([]);
    setPaths([]);
    setSelectedNode(null);
  };

  const tools = [
    { id: 'select', icon: MousePointer, label: 'Select' },
    { id: 'node', icon: Circle, label: 'Add Node' },
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
                <Label className="text-sm font-medium">Tools</Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {tools.map(tool => (
                    <Button
                      key={tool.id}
                      variant={selectedTool === tool.id ? "default" : "outline"}
                      size="sm"
                      className="flex items-center gap-2 justify-start"
                      onClick={() => setSelectedTool(tool.id)}
                    >
                      <tool.icon className="h-4 w-4" />
                      {tool.label}
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
                    <div className="space-y-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={startConnection}
                        className="w-full"
                      >
                        Connect to Node
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={deleteNode}
                        className="w-full"
                      >
                        Delete Node
                      </Button>
                    </div>
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
              <div className="text-sm text-slate-600">
                Selected Tool: <Badge>{selectedTool}</Badge>
                {isConnecting && <Badge variant="outline" className="ml-2">Connecting Mode</Badge>}
              </div>
            </div>
            <canvas 
              ref={canvasRef} 
              width={800} 
              height={500}
              className="block cursor-crosshair"
              onClick={handleCanvasClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}