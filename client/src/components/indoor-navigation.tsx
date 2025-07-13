import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation, Stairs, Elevator, Wifi, Bluetooth, Target } from "lucide-react";

interface BeaconData {
  id: string;
  rssi: number;
  major: number;
  minor: number;
  distance: number;
}

interface WifiFingerprint {
  ssid: string;
  rssi: number;
  mac: string;
}

interface IndoorPosition {
  x: number;
  y: number;
  floor: number;
  accuracy: number;
  method: 'beacon' | 'wifi' | 'hybrid';
}

interface IndoorPath {
  id: string;
  startNode: string;
  endNode: string;
  pathType: 'corridor' | 'stairs' | 'elevator' | 'escalator';
  distance: number;
  accessibility: boolean;
  landmarks: string[];
}

interface IndoorNode {
  id: string;
  type: 'room' | 'junction' | 'stairs' | 'elevator' | 'entrance' | 'emergency_exit' | 'bathroom' | 'landmark';
  x: number;
  y: number;
  floor: number;
  label: string;
  accessibility: boolean;
  beaconId?: string;
  connections: string[];
}

export function IndoorNavigation({ buildingId, selectedFloor }: { buildingId: string; selectedFloor: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [userPosition, setUserPosition] = useState<IndoorPosition | null>(null);
  const [isPositioning, setIsPositioning] = useState(false);
  const [beacons, setBeacons] = useState<BeaconData[]>([]);
  const [wifiNetworks, setWifiNetworks] = useState<WifiFingerprint[]>([]);
  const [selectedPath, setSelectedPath] = useState<IndoorPath[]>([]);
  const [positioningMethod, setPositioningMethod] = useState<'beacon' | 'wifi' | 'hybrid'>('hybrid');

  // Sample indoor navigation data
  const indoorNodes: IndoorNode[] = [
    // Floor 1 nodes
    { id: 'entrance-1', type: 'entrance', x: 50, y: 300, floor: 1, label: 'Main Entrance', accessibility: true, beaconId: 'beacon-001', connections: ['junction-1-1'] },
    { id: 'junction-1-1', type: 'junction', x: 150, y: 300, floor: 1, label: 'Main Corridor', accessibility: true, beaconId: 'beacon-002', connections: ['entrance-1', 'room-101', 'stairs-1', 'elevator-1'] },
    { id: 'room-101', type: 'room', x: 250, y: 200, floor: 1, label: 'Lecture Hall 101', accessibility: true, beaconId: 'beacon-003', connections: ['junction-1-1'] },
    { id: 'room-102', type: 'room', x: 250, y: 400, floor: 1, label: 'Computer Lab 102', accessibility: true, beaconId: 'beacon-004', connections: ['junction-1-1'] },
    { id: 'stairs-1', type: 'stairs', x: 400, y: 300, floor: 1, label: 'Stairs A', accessibility: false, beaconId: 'beacon-005', connections: ['junction-1-1', 'stairs-2'] },
    { id: 'elevator-1', type: 'elevator', x: 450, y: 300, floor: 1, label: 'Elevator A', accessibility: true, beaconId: 'beacon-006', connections: ['junction-1-1', 'elevator-2'] },
    { id: 'bathroom-1', type: 'bathroom', x: 350, y: 200, floor: 1, label: 'Restroom', accessibility: true, beaconId: 'beacon-007', connections: ['junction-1-1'] },
    
    // Floor 2 nodes
    { id: 'stairs-2', type: 'stairs', x: 400, y: 300, floor: 2, label: 'Stairs A', accessibility: false, beaconId: 'beacon-008', connections: ['stairs-1', 'junction-2-1'] },
    { id: 'elevator-2', type: 'elevator', x: 450, y: 300, floor: 2, label: 'Elevator A', accessibility: true, beaconId: 'beacon-009', connections: ['elevator-1', 'junction-2-1'] },
    { id: 'junction-2-1', type: 'junction', x: 300, y: 300, floor: 2, label: 'Floor 2 Corridor', accessibility: true, beaconId: 'beacon-010', connections: ['stairs-2', 'elevator-2', 'room-201', 'room-202'] },
    { id: 'room-201', type: 'room', x: 200, y: 200, floor: 2, label: 'Conference Room 201', accessibility: true, beaconId: 'beacon-011', connections: ['junction-2-1'] },
    { id: 'room-202', type: 'room', x: 200, y: 400, floor: 2, label: 'Office 202', accessibility: true, beaconId: 'beacon-012', connections: ['junction-2-1'] }
  ];

  const indoorPaths: IndoorPath[] = [
    { id: 'path-1', startNode: 'entrance-1', endNode: 'junction-1-1', pathType: 'corridor', distance: 10, accessibility: true, landmarks: ['Information Desk'] },
    { id: 'path-2', startNode: 'junction-1-1', endNode: 'room-101', pathType: 'corridor', distance: 15, accessibility: true, landmarks: ['Water Fountain'] },
    { id: 'path-3', startNode: 'junction-1-1', endNode: 'stairs-1', pathType: 'corridor', distance: 20, accessibility: true, landmarks: [] },
    { id: 'path-4', startNode: 'stairs-1', endNode: 'stairs-2', pathType: 'stairs', distance: 8, accessibility: false, landmarks: ['Floor Indicator'] },
    { id: 'path-5', startNode: 'elevator-1', endNode: 'elevator-2', pathType: 'elevator', distance: 8, accessibility: true, landmarks: [] },
    { id: 'path-6', startNode: 'stairs-2', endNode: 'junction-2-1', pathType: 'corridor', distance: 12, accessibility: true, landmarks: ['Emergency Exit Sign'] }
  ];

  // Simulate beacon scanning
  useEffect(() => {
    if (isPositioning) {
      const scanBeacons = () => {
        // Simulate nearby beacons with varying signal strength
        const simulatedBeacons: BeaconData[] = [
          { id: 'beacon-002', rssi: -45, major: 1, minor: 2, distance: 2.5 },
          { id: 'beacon-003', rssi: -65, major: 1, minor: 3, distance: 8.2 },
          { id: 'beacon-005', rssi: -70, major: 1, minor: 5, distance: 12.1 }
        ];
        setBeacons(simulatedBeacons);
        
        // Calculate position using trilateration
        const position = calculateIndoorPosition(simulatedBeacons);
        setUserPosition(position);
      };

      const interval = setInterval(scanBeacons, 2000);
      return () => clearInterval(interval);
    }
  }, [isPositioning]);

  // Simulate WiFi scanning
  useEffect(() => {
    if (isPositioning && (positioningMethod === 'wifi' || positioningMethod === 'hybrid')) {
      const scanWifi = () => {
        const simulatedWifi: WifiFingerprint[] = [
          { ssid: 'Campus-WiFi-Floor1', rssi: -40, mac: '00:11:22:33:44:55' },
          { ssid: 'Campus-WiFi-Main', rssi: -55, mac: '00:11:22:33:44:56' },
          { ssid: 'Campus-Guest', rssi: -70, mac: '00:11:22:33:44:57' }
        ];
        setWifiNetworks(simulatedWifi);
      };

      const interval = setInterval(scanWifi, 5000);
      return () => clearInterval(interval);
    }
  }, [isPositioning, positioningMethod]);

  // Calculate indoor position using trilateration
  const calculateIndoorPosition = (beaconData: BeaconData[]): IndoorPosition => {
    if (beaconData.length < 3) {
      // Fallback to single beacon positioning
      const closestBeacon = beaconData.reduce((closest, beacon) => 
        beacon.distance < closest.distance ? beacon : closest
      );
      
      const beaconNode = indoorNodes.find(node => node.beaconId === closestBeacon.id);
      if (beaconNode) {
        return {
          x: beaconNode.x + (Math.random() - 0.5) * 10,
          y: beaconNode.y + (Math.random() - 0.5) * 10,
          floor: beaconNode.floor,
          accuracy: closestBeacon.distance,
          method: 'beacon'
        };
      }
    }

    // Simplified trilateration (in real implementation, use proper algorithms)
    const beaconNodes = beaconData.map(beacon => ({
      beacon,
      node: indoorNodes.find(node => node.beaconId === beacon.id)
    })).filter(item => item.node);

    if (beaconNodes.length >= 2) {
      const avgX = beaconNodes.reduce((sum, item) => sum + item.node!.x, 0) / beaconNodes.length;
      const avgY = beaconNodes.reduce((sum, item) => sum + item.node!.y, 0) / beaconNodes.length;
      const avgFloor = Math.round(beaconNodes.reduce((sum, item) => sum + item.node!.floor, 0) / beaconNodes.length);
      const avgAccuracy = beaconNodes.reduce((sum, item) => sum + item.beacon.distance, 0) / beaconNodes.length;

      return {
        x: avgX,
        y: avgY,
        floor: avgFloor,
        accuracy: avgAccuracy,
        method: 'beacon'
      };
    }

    // Default position
    return {
      x: 150,
      y: 300,
      floor: 1,
      accuracy: 5,
      method: 'beacon'
    };
  };

  // Find path between two indoor nodes
  const findIndoorPath = (startNodeId: string, endNodeId: string, accessibleOnly: boolean = false): IndoorPath[] => {
    // Simplified pathfinding - in real implementation, use A* or Dijkstra
    const startNode = indoorNodes.find(n => n.id === startNodeId);
    const endNode = indoorNodes.find(n => n.id === endNodeId);
    
    if (!startNode || !endNode) return [];

    // If on same floor, find direct path
    if (startNode.floor === endNode.floor) {
      return indoorPaths.filter(path => 
        (path.startNode === startNodeId && path.endNode === endNodeId) ||
        (path.startNode === endNodeId && path.endNode === startNodeId)
      ).filter(path => !accessibleOnly || path.accessibility);
    }

    // Multi-floor navigation - find elevator or stairs
    const connectionType = accessibleOnly ? 'elevator' : 'stairs';
    const verticalConnection = indoorNodes.find(node => 
      node.type === connectionType && node.floor === startNode.floor
    );

    if (verticalConnection) {
      // Return simplified multi-floor path
      return indoorPaths.filter(path => 
        path.startNode === startNodeId || path.endNode === endNodeId ||
        path.startNode === verticalConnection.id || path.endNode === verticalConnection.id
      ).filter(path => !accessibleOnly || path.accessibility);
    }

    return [];
  };

  // Draw indoor floor plan
  const drawIndoorMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw floor background
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Filter nodes for current floor
    const currentFloorNodes = indoorNodes.filter(node => node.floor === selectedFloor);

    // Draw paths
    indoorPaths.forEach(path => {
      const startNode = currentFloorNodes.find(n => n.id === path.startNode);
      const endNode = currentFloorNodes.find(n => n.id === path.endNode);
      
      if (startNode && endNode) {
        ctx.strokeStyle = getPathColor(path.pathType);
        ctx.lineWidth = path.accessibility ? 4 : 2;
        ctx.setLineDash(path.accessibility ? [] : [5, 5]);
        
        ctx.beginPath();
        ctx.moveTo(startNode.x, startNode.y);
        ctx.lineTo(endNode.x, endNode.y);
        ctx.stroke();
        
        ctx.setLineDash([]);
      }
    });

    // Draw selected path
    if (selectedPath.length > 0) {
      selectedPath.forEach(path => {
        const startNode = currentFloorNodes.find(n => n.id === path.startNode);
        const endNode = currentFloorNodes.find(n => n.id === path.endNode);
        
        if (startNode && endNode) {
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 6;
          ctx.setLineDash([10, 5]);
          
          ctx.beginPath();
          ctx.moveTo(startNode.x, startNode.y);
          ctx.lineTo(endNode.x, endNode.y);
          ctx.stroke();
          
          ctx.setLineDash([]);
        }
      });
    }

    // Draw nodes
    currentFloorNodes.forEach(node => {
      drawNode(ctx, node);
    });

    // Draw user position
    if (userPosition && userPosition.floor === selectedFloor) {
      drawUserPosition(ctx, userPosition);
    }

    // Draw beacon signals
    if (isPositioning) {
      beacons.forEach(beacon => {
        const beaconNode = currentFloorNodes.find(n => n.beaconId === beacon.id);
        if (beaconNode) {
          drawBeaconSignal(ctx, beaconNode, beacon);
        }
      });
    }
  };

  const drawNode = (ctx: CanvasRenderingContext2D, node: IndoorNode) => {
    const { x, y, type, accessibility } = node;
    
    // Node background
    ctx.fillStyle = getNodeColor(type);
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, 2 * Math.PI);
    ctx.fill();

    // Accessibility indicator
    if (!accessibility) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Node icon
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const icon = getNodeIcon(type);
    ctx.fillText(icon, x, y);

    // Node label
    ctx.fillStyle = '#374151';
    ctx.font = '10px Arial';
    ctx.fillText(node.label, x, y + 25);
  };

  const drawUserPosition = (ctx: CanvasRenderingContext2D, position: IndoorPosition) => {
    const { x, y, accuracy } = position;

    // Accuracy circle
    ctx.strokeStyle = '#60a5fa';
    ctx.fillStyle = 'rgba(96, 165, 250, 0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, accuracy * 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // User position
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fill();

    // User icon
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👤', x, y);
  };

  const drawBeaconSignal = (ctx: CanvasRenderingContext2D, node: IndoorNode, beacon: BeaconData) => {
    const { x, y } = node;
    const signalStrength = Math.max(0, (100 + beacon.rssi) / 100);
    
    // Signal rings
    for (let i = 0; i < 3; i++) {
      const radius = 20 + i * 15;
      const alpha = signalStrength * (0.3 - i * 0.1);
      
      ctx.strokeStyle = `rgba(34, 197, 94, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
  };

  const getNodeColor = (type: string): string => {
    const colors = {
      room: '#3b82f6',
      junction: '#6b7280',
      stairs: '#f59e0b',
      elevator: '#10b981',
      entrance: '#8b5cf6',
      emergency_exit: '#ef4444',
      bathroom: '#06b6d4',
      landmark: '#ec4899'
    };
    return colors[type as keyof typeof colors] || '#6b7280';
  };

  const getNodeIcon = (type: string): string => {
    const icons = {
      room: '🚪',
      junction: '⊕',
      stairs: '🔺',
      elevator: '🔲',
      entrance: '🚪',
      emergency_exit: '🚨',
      bathroom: '🚻',
      landmark: '📍'
    };
    return icons[type as keyof typeof icons] || '⊕';
  };

  const getPathColor = (pathType: string): string => {
    const colors = {
      corridor: '#6b7280',
      stairs: '#f59e0b',
      elevator: '#10b981',
      escalator: '#06b6d4'
    };
    return colors[pathType as keyof typeof colors] || '#6b7280';
  };

  useEffect(() => {
    drawIndoorMap();
  }, [selectedFloor, userPosition, beacons, selectedPath, isPositioning]);

  return (
    <div className="space-y-4">
      {/* Indoor Navigation Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Indoor Navigation - Floor {selectedFloor}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Positioning Method</label>
              <Select value={positioningMethod} onValueChange={(value: any) => setPositioningMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beacon">Bluetooth Beacons</SelectItem>
                  <SelectItem value="wifi">WiFi Fingerprinting</SelectItem>
                  <SelectItem value="hybrid">Hybrid (Recommended)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button
                variant={isPositioning ? "default" : "outline"}
                onClick={() => setIsPositioning(!isPositioning)}
                className="w-full"
              >
                <Target className="h-4 w-4 mr-1" />
                {isPositioning ? 'Stop Positioning' : 'Start Positioning'}
              </Button>
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" onClick={() => setSelectedPath([])} className="w-full">
                Clear Path
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indoor Map Canvas */}
      <Card>
        <CardContent className="p-0">
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            className="w-full border cursor-crosshair"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 600;
              const y = ((e.clientY - rect.top) / rect.height) * 400;
              
              // Find clicked node
              const currentFloorNodes = indoorNodes.filter(node => node.floor === selectedFloor);
              const clickedNode = currentFloorNodes.find(node => {
                const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
                return distance <= 15;
              });
              
              if (clickedNode) {
                // Simple pathfinding demo - find path from user position to clicked node
                if (userPosition) {
                  const nearestNode = currentFloorNodes.reduce((nearest, node) => {
                    const distanceToUser = Math.sqrt((node.x - userPosition.x) ** 2 + (node.y - userPosition.y) ** 2);
                    const distanceToNearest = Math.sqrt((nearest.x - userPosition.x) ** 2 + (nearest.y - userPosition.y) ** 2);
                    return distanceToUser < distanceToNearest ? node : nearest;
                  });
                  
                  const path = findIndoorPath(nearestNode.id, clickedNode.id);
                  setSelectedPath(path);
                }
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Status Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Position Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Position Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {userPosition ? (
              <>
                <div className="flex justify-between text-sm">
                  <span>Floor:</span>
                  <Badge variant="outline">{userPosition.floor}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Coordinates:</span>
                  <span>({userPosition.x.toFixed(1)}, {userPosition.y.toFixed(1)})</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Accuracy:</span>
                  <span>±{userPosition.accuracy.toFixed(1)}m</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Method:</span>
                  <Badge variant="secondary">{userPosition.method}</Badge>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">Position tracking disabled</p>
            )}
          </CardContent>
        </Card>

        {/* Beacon Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bluetooth className="h-4 w-4" />
              Nearby Beacons
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {beacons.length > 0 ? (
              beacons.map(beacon => (
                <div key={beacon.id} className="flex justify-between items-center text-sm">
                  <span>{beacon.id}</span>
                  <div className="flex items-center gap-2">
                    <span>{beacon.distance.toFixed(1)}m</span>
                    <Badge 
                      variant={beacon.rssi > -50 ? "default" : beacon.rssi > -70 ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {beacon.rssi}dBm
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No beacons detected</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}