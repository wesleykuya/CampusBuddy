import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { 
  Building, 
  MapPin, 
  Navigation, 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Download, 
  Wifi, 
  Bluetooth, 
  Shield, 
  Eye, 
  Settings,
  AlertTriangle,
  Users,
  BarChart3,
  Camera
} from "lucide-react";
import { useAuth } from "@/lib/auth";

interface BeaconData {
  id: string;
  beaconId: string;
  buildingId: number;
  floorId?: number;
  major: number;
  minor: number;
  coordinates: { x: number; y: number; z?: number; lat?: number; lng?: number };
  transmissionPower: number;
  isActive: boolean;
  batteryLevel?: number;
  lastSeen?: Date;
}

interface NavigationNodeData {
  id: string;
  nodeId: string;
  buildingId: number;
  floorId?: number;
  type: 'room' | 'junction' | 'stairs' | 'elevator' | 'entrance' | 'emergency_exit' | 'bathroom' | 'landmark';
  coordinates: { x: number; y: number; z?: number; lat?: number; lng?: number };
  label: string;
  description?: string;
  accessibility: boolean;
  beaconId?: string;
  landmarks: string[];
  connections: string[];
}

interface PathData {
  id: string;
  pathId: string;
  startNodeId: string;
  endNodeId: string;
  buildingId: number;
  pathType: 'corridor' | 'stairs' | 'elevator' | 'escalator' | 'outdoor';
  distance: number;
  estimatedTime?: number;
  accessibility: boolean;
  bidirectional: boolean;
  landmarks: string[];
  instructions: string[];
}

interface ArMarkerData {
  id: string;
  markerId: string;
  buildingId: number;
  floorId?: number;
  type: 'info' | 'navigation' | 'emergency' | 'poi' | 'advertisement';
  coordinates: { x: number; y: number; z?: number; lat?: number; lng?: number };
  content: {
    title: string;
    description: string;
    mediaUrl?: string;
    interactive?: boolean;
  };
  triggerDistance: number;
  visibility: 'public' | 'student' | 'staff' | 'admin';
  isActive: boolean;
}

export function AdminNavigationPanel() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  
  // Modal states
  const [showBeaconDialog, setShowBeaconDialog] = useState(false);
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [showPathDialog, setShowPathDialog] = useState(false);
  const [showArMarkerDialog, setShowArMarkerDialog] = useState(false);
  
  // Form states
  const [newBeacon, setNewBeacon] = useState<Partial<BeaconData>>({});
  const [newNode, setNewNode] = useState<Partial<NavigationNodeData>>({});
  const [newPath, setNewPath] = useState<Partial<PathData>>({});
  const [newArMarker, setNewArMarker] = useState<Partial<ArMarkerData>>({});

  // Sample data (in real implementation, fetch from API)
  const beacons: BeaconData[] = [
    {
      id: "1",
      beaconId: "beacon-001",
      buildingId: 1,
      floorId: 1,
      major: 1,
      minor: 1,
      coordinates: { x: 100, y: 200, lat: 40.7589, lng: -73.9851 },
      transmissionPower: -59,
      isActive: true,
      batteryLevel: 85,
      lastSeen: new Date()
    }
  ];

  const navigationNodes: NavigationNodeData[] = [
    {
      id: "1",
      nodeId: "node-001",
      buildingId: 1,
      floorId: 1,
      type: "entrance",
      coordinates: { x: 50, y: 300, lat: 40.7589, lng: -73.9851 },
      label: "Main Entrance",
      accessibility: true,
      beaconId: "beacon-001",
      landmarks: ["Information Desk"],
      connections: ["node-002"]
    }
  ];

  const paths: PathData[] = [
    {
      id: "1",
      pathId: "path-001",
      startNodeId: "node-001",
      endNodeId: "node-002",
      buildingId: 1,
      pathType: "corridor",
      distance: 15.5,
      estimatedTime: 20,
      accessibility: true,
      bidirectional: true,
      landmarks: ["Water Fountain"],
      instructions: ["Head straight down the main corridor"]
    }
  ];

  const arMarkers: ArMarkerData[] = [
    {
      id: "1",
      markerId: "ar-001",
      buildingId: 1,
      floorId: 1,
      type: "info",
      coordinates: { x: 100, y: 200, z: 2, lat: 40.7589, lng: -73.9851 },
      content: {
        title: "Campus Library",
        description: "Main campus library with study spaces and resources",
        interactive: true
      },
      triggerDistance: 5.0,
      visibility: "public",
      isActive: true
    }
  ];

  // Check admin permissions
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-600">You need administrator privileges to access this panel.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleCreateBeacon = () => {
    // In real implementation, make API call
    console.log("Creating beacon:", newBeacon);
    setShowBeaconDialog(false);
    setNewBeacon({});
  };

  const handleCreateNode = () => {
    // In real implementation, make API call
    console.log("Creating navigation node:", newNode);
    setShowNodeDialog(false);
    setNewNode({});
  };

  const handleCreatePath = () => {
    // In real implementation, make API call
    console.log("Creating navigation path:", newPath);
    setShowPathDialog(false);
    setNewPath({});
  };

  const handleCreateArMarker = () => {
    // In real implementation, make API call
    console.log("Creating AR marker:", newArMarker);
    setShowArMarkerDialog(false);
    setNewArMarker({});
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Navigation System Administration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Building</Label>
              <Select value={selectedBuilding?.toString() || ""} onValueChange={(value) => setSelectedBuilding(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select building" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Central Library</SelectItem>
                  <SelectItem value="2">Engineering Complex</SelectItem>
                  <SelectItem value="3">Student Center</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Floor</Label>
              <Select value={selectedFloor?.toString() || ""} onValueChange={(value) => setSelectedFloor(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select floor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Ground Floor</SelectItem>
                  <SelectItem value="1">Floor 1</SelectItem>
                  <SelectItem value="2">Floor 2</SelectItem>
                  <SelectItem value="3">Floor 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-1" />
                Import Data
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export Data
              </Button>
            </div>
            <div className="flex items-end">
              <Button variant="outline" size="sm" className="w-full">
                <BarChart3 className="h-4 w-4 mr-1" />
                Analytics
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="beacons">Beacons</TabsTrigger>
          <TabsTrigger value="nodes">Navigation Nodes</TabsTrigger>
          <TabsTrigger value="paths">Paths</TabsTrigger>
          <TabsTrigger value="ar">AR Markers</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Beacons</p>
                    <p className="text-2xl font-bold">42</p>
                  </div>
                  <Bluetooth className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Navigation Nodes</p>
                    <p className="text-2xl font-bold">156</p>
                  </div>
                  <MapPin className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Navigation Paths</p>
                    <p className="text-2xl font-bold">234</p>
                  </div>
                  <Navigation className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">AR Markers</p>
                    <p className="text-2xl font-bold">89</p>
                  </div>
                  <Camera className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Beacon</Badge>
                  <span className="text-sm">Beacon beacon-045 battery low (15%)</span>
                  <span className="text-xs text-gray-500 ml-auto">2 hours ago</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">Path</Badge>
                  <span className="text-sm">New navigation path created: Library to Cafeteria</span>
                  <span className="text-xs text-gray-500 ml-auto">4 hours ago</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="default">AR</Badge>
                  <span className="text-sm">AR marker updated: Student Services Info</span>
                  <span className="text-xs text-gray-500 ml-auto">1 day ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Beacons Tab */}
        <TabsContent value="beacons" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Bluetooth Beacons</h3>
            <Dialog open={showBeaconDialog} onOpenChange={setShowBeaconDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Beacon
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Beacon</DialogTitle>
                  <DialogDescription>Configure a new Bluetooth beacon for indoor positioning.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="beacon-id">Beacon ID</Label>
                      <Input
                        id="beacon-id"
                        value={newBeacon.beaconId || ""}
                        onChange={(e) => setNewBeacon({ ...newBeacon, beaconId: e.target.value })}
                        placeholder="UUID or identifier"
                      />
                    </div>
                    <div>
                      <Label htmlFor="transmission-power">Transmission Power (dBm)</Label>
                      <Input
                        id="transmission-power"
                        type="number"
                        value={newBeacon.transmissionPower || -59}
                        onChange={(e) => setNewBeacon({ ...newBeacon, transmissionPower: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="major">Major</Label>
                      <Input
                        id="major"
                        type="number"
                        value={newBeacon.major || ""}
                        onChange={(e) => setNewBeacon({ ...newBeacon, major: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="minor">Minor</Label>
                      <Input
                        id="minor"
                        type="number"
                        value={newBeacon.minor || ""}
                        onChange={(e) => setNewBeacon({ ...newBeacon, minor: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="x-coord">X Coordinate</Label>
                      <Input
                        id="x-coord"
                        type="number"
                        value={newBeacon.coordinates?.x || ""}
                        onChange={(e) => setNewBeacon({ 
                          ...newBeacon, 
                          coordinates: { ...newBeacon.coordinates, x: parseFloat(e.target.value) } 
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="y-coord">Y Coordinate</Label>
                      <Input
                        id="y-coord"
                        type="number"
                        value={newBeacon.coordinates?.y || ""}
                        onChange={(e) => setNewBeacon({ 
                          ...newBeacon, 
                          coordinates: { ...newBeacon.coordinates, y: parseFloat(e.target.value) } 
                        })}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowBeaconDialog(false)}>Cancel</Button>
                  <Button onClick={handleCreateBeacon}>Create Beacon</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Beacon ID</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Signal</TableHead>
                    <TableHead>Battery</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {beacons.map((beacon) => (
                    <TableRow key={beacon.id}>
                      <TableCell className="font-mono">{beacon.beaconId}</TableCell>
                      <TableCell>
                        Building {beacon.buildingId}, Floor {beacon.floorId}
                        <br />
                        <span className="text-xs text-gray-500">
                          ({beacon.coordinates.x}, {beacon.coordinates.y})
                        </span>
                      </TableCell>
                      <TableCell>{beacon.transmissionPower} dBm</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {beacon.batteryLevel}%
                          <div className={`w-2 h-2 rounded-full ${
                            (beacon.batteryLevel || 0) > 50 ? 'bg-green-500' : 
                            (beacon.batteryLevel || 0) > 20 ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={beacon.isActive ? "default" : "secondary"}>
                          {beacon.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Navigation Nodes Tab */}
        <TabsContent value="nodes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Navigation Nodes</h3>
            <Dialog open={showNodeDialog} onOpenChange={setShowNodeDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Node
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Navigation Node</DialogTitle>
                  <DialogDescription>Create a new navigation point for indoor wayfinding.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="node-id">Node ID</Label>
                      <Input
                        id="node-id"
                        value={newNode.nodeId || ""}
                        onChange={(e) => setNewNode({ ...newNode, nodeId: e.target.value })}
                        placeholder="Unique node identifier"
                      />
                    </div>
                    <div>
                      <Label htmlFor="node-type">Type</Label>
                      <Select value={newNode.type} onValueChange={(value: any) => setNewNode({ ...newNode, type: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="room">Room</SelectItem>
                          <SelectItem value="junction">Junction</SelectItem>
                          <SelectItem value="stairs">Stairs</SelectItem>
                          <SelectItem value="elevator">Elevator</SelectItem>
                          <SelectItem value="entrance">Entrance</SelectItem>
                          <SelectItem value="emergency_exit">Emergency Exit</SelectItem>
                          <SelectItem value="bathroom">Bathroom</SelectItem>
                          <SelectItem value="landmark">Landmark</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="node-label">Label</Label>
                    <Input
                      id="node-label"
                      value={newNode.label || ""}
                      onChange={(e) => setNewNode({ ...newNode, label: e.target.value })}
                      placeholder="Display name for this node"
                    />
                  </div>
                  <div>
                    <Label htmlFor="node-description">Description</Label>
                    <Textarea
                      id="node-description"
                      value={newNode.description || ""}
                      onChange={(e) => setNewNode({ ...newNode, description: e.target.value })}
                      placeholder="Optional description"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="node-accessibility"
                      checked={newNode.accessibility || false}
                      onCheckedChange={(checked) => setNewNode({ ...newNode, accessibility: checked })}
                    />
                    <Label htmlFor="node-accessibility">Wheelchair Accessible</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNodeDialog(false)}>Cancel</Button>
                  <Button onClick={handleCreateNode}>Create Node</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Node ID</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Accessibility</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {navigationNodes.map((node) => (
                    <TableRow key={node.id}>
                      <TableCell className="font-mono">{node.nodeId}</TableCell>
                      <TableCell>{node.label}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{node.type}</Badge>
                      </TableCell>
                      <TableCell>
                        Building {node.buildingId}, Floor {node.floorId}
                        <br />
                        <span className="text-xs text-gray-500">
                          ({node.coordinates.x}, {node.coordinates.y})
                        </span>
                      </TableCell>
                      <TableCell>
                        {node.accessibility ? (
                          <Badge variant="default">Accessible</Badge>
                        ) : (
                          <Badge variant="secondary">Not Accessible</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AR Markers Tab */}
        <TabsContent value="ar" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Augmented Reality Markers</h3>
            <Dialog open={showArMarkerDialog} onOpenChange={setShowArMarkerDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-1" />
                  Add AR Marker
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add AR Marker</DialogTitle>
                  <DialogDescription>Create a new augmented reality marker for enhanced navigation.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="marker-id">Marker ID</Label>
                      <Input
                        id="marker-id"
                        value={newArMarker.markerId || ""}
                        onChange={(e) => setNewArMarker({ ...newArMarker, markerId: e.target.value })}
                        placeholder="Unique marker identifier"
                      />
                    </div>
                    <div>
                      <Label htmlFor="marker-type">Type</Label>
                      <Select value={newArMarker.type} onValueChange={(value: any) => setNewArMarker({ ...newArMarker, type: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">Information</SelectItem>
                          <SelectItem value="navigation">Navigation</SelectItem>
                          <SelectItem value="emergency">Emergency</SelectItem>
                          <SelectItem value="poi">Point of Interest</SelectItem>
                          <SelectItem value="advertisement">Advertisement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="marker-title">Title</Label>
                    <Input
                      id="marker-title"
                      value={newArMarker.content?.title || ""}
                      onChange={(e) => setNewArMarker({ 
                        ...newArMarker, 
                        content: { ...newArMarker.content, title: e.target.value } 
                      })}
                      placeholder="AR marker title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="marker-description">Description</Label>
                    <Textarea
                      id="marker-description"
                      value={newArMarker.content?.description || ""}
                      onChange={(e) => setNewArMarker({ 
                        ...newArMarker, 
                        content: { ...newArMarker.content, description: e.target.value } 
                      })}
                      placeholder="AR marker description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="trigger-distance">Trigger Distance (m)</Label>
                      <Input
                        id="trigger-distance"
                        type="number"
                        step="0.1"
                        value={newArMarker.triggerDistance || 5.0}
                        onChange={(e) => setNewArMarker({ ...newArMarker, triggerDistance: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="marker-visibility">Visibility</Label>
                      <Select value={newArMarker.visibility} onValueChange={(value: any) => setNewArMarker({ ...newArMarker, visibility: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="student">Students Only</SelectItem>
                          <SelectItem value="staff">Staff Only</SelectItem>
                          <SelectItem value="admin">Admin Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowArMarkerDialog(false)}>Cancel</Button>
                  <Button onClick={handleCreateArMarker}>Create AR Marker</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Marker ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {arMarkers.map((marker) => (
                    <TableRow key={marker.id}>
                      <TableCell className="font-mono">{marker.markerId}</TableCell>
                      <TableCell>{marker.content.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{marker.type}</Badge>
                      </TableCell>
                      <TableCell>
                        Building {marker.buildingId}, Floor {marker.floorId}
                        <br />
                        <span className="text-xs text-gray-500">
                          Trigger: {marker.triggerDistance}m
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{marker.visibility}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={marker.isActive ? "default" : "secondary"}>
                          {marker.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emergency Tab */}
        <TabsContent value="emergency" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Emergency Management
            </h3>
            <Button variant="destructive">
              <Plus className="h-4 w-4 mr-1" />
              Add Emergency Route
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Emergency Routes</p>
                    <p className="text-2xl font-bold">24</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Emergency Exits</p>
                    <p className="text-2xl font-bold">18</p>
                  </div>
                  <Shield className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Assembly Points</p>
                    <p className="text-2xl font-bold">6</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Emergency Route Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <h4 className="font-medium">Fire Evacuation - Library</h4>
                    <p className="text-sm text-gray-600">Primary route from all floors to Assembly Point A</p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <h4 className="font-medium">Earthquake Shelter - Engineering</h4>
                    <p className="text-sm text-gray-600">Safe zone locations within building structure</p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <h4 className="font-medium">Lockdown Routes - All Buildings</h4>
                    <p className="text-sm text-gray-600">Secure room locations and procedures</p>
                  </div>
                  <Badge variant="secondary">Under Review</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}