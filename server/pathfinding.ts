// Pathfinding utilities using Dijkstra's algorithm
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

interface PathResult {
  path: string[];
  distance: number;
  directions: string[];
}

export class PathfindingService {
  private nodes: Map<string, Node> = new Map();
  private paths: Map<string, Path> = new Map();

  constructor(nodes: Node[], paths: Path[]) {
    this.loadGraph(nodes, paths);
  }

  private loadGraph(nodes: Node[], paths: Path[]) {
    this.nodes.clear();
    this.paths.clear();

    // Load nodes
    nodes.forEach(node => {
      this.nodes.set(node.id, node);
    });

    // Load paths and create bidirectional connections
    paths.forEach(path => {
      this.paths.set(path.id, path);
      
      // Ensure bidirectional connections
      const startNode = this.nodes.get(path.startNode);
      const endNode = this.nodes.get(path.endNode);
      
      if (startNode && !startNode.connections.includes(path.endNode)) {
        startNode.connections.push(path.endNode);
      }
      if (endNode && !endNode.connections.includes(path.startNode)) {
        endNode.connections.push(path.startNode);
      }
    });
  }

  private getDistance(nodeA: string, nodeB: string): number {
    // Find path between nodes
    const path = Array.from(this.paths.values()).find(
      p => (p.startNode === nodeA && p.endNode === nodeB) ||
           (p.startNode === nodeB && p.endNode === nodeA)
    );
    
    if (path) {
      return path.distance;
    }

    // Calculate Euclidean distance if no path defined
    const nodeAData = this.nodes.get(nodeA);
    const nodeBData = this.nodes.get(nodeB);
    
    if (!nodeAData || !nodeBData) return Infinity;
    
    const dx = nodeAData.x - nodeBData.x;
    const dy = nodeAData.y - nodeBData.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  findPath(startNodeId: string, endNodeId: string): PathResult | null {
    if (!this.nodes.has(startNodeId) || !this.nodes.has(endNodeId)) {
      return null;
    }

    if (startNodeId === endNodeId) {
      return {
        path: [startNodeId],
        distance: 0,
        directions: ["You are already at your destination"]
      };
    }

    // Dijkstra's algorithm
    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const unvisited = new Set<string>();

    // Initialize
    for (const nodeId of this.nodes.keys()) {
      distances.set(nodeId, Infinity);
      previous.set(nodeId, null);
      unvisited.add(nodeId);
    }
    distances.set(startNodeId, 0);

    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      let currentNode: string | null = null;
      let minDistance = Infinity;
      
      for (const nodeId of unvisited) {
        const distance = distances.get(nodeId) || Infinity;
        if (distance < minDistance) {
          minDistance = distance;
          currentNode = nodeId;
        }
      }

      if (!currentNode || minDistance === Infinity) {
        break; // No path found
      }

      unvisited.delete(currentNode);

      if (currentNode === endNodeId) {
        break; // Found target
      }

      // Check neighbors
      const node = this.nodes.get(currentNode);
      if (!node) continue;

      for (const neighborId of node.connections) {
        if (!unvisited.has(neighborId)) continue;

        const edgeDistance = this.getDistance(currentNode, neighborId);
        const totalDistance = (distances.get(currentNode) || 0) + edgeDistance;

        if (totalDistance < (distances.get(neighborId) || Infinity)) {
          distances.set(neighborId, totalDistance);
          previous.set(neighborId, currentNode);
        }
      }
    }

    // Reconstruct path
    const path: string[] = [];
    let current: string | null = endNodeId;

    while (current !== null) {
      path.unshift(current);
      current = previous.get(current) || null;
    }

    if (path[0] !== startNodeId) {
      return null; // No path found
    }

    const totalDistance = distances.get(endNodeId) || 0;
    const directions = this.generateDirections(path);

    return {
      path,
      distance: totalDistance,
      directions
    };
  }

  private generateDirections(path: string[]): string[] {
    const directions: string[] = [];
    
    if (path.length < 2) {
      return ["You are at your destination"];
    }

    for (let i = 0; i < path.length - 1; i++) {
      const currentNode = this.nodes.get(path[i]);
      const nextNode = this.nodes.get(path[i + 1]);
      
      if (!currentNode || !nextNode) continue;

      // Find the path type between nodes
      const pathData = Array.from(this.paths.values()).find(
        p => (p.startNode === path[i] && p.endNode === path[i + 1]) ||
             (p.startNode === path[i + 1] && p.endNode === path[i])
      );

      let direction = "";
      const distance = Math.round(this.getDistance(path[i], path[i + 1]));

      if (pathData?.pathType === 'stairs') {
        direction = `Take the stairs to ${nextNode.label || nextNode.id}`;
      } else if (pathData?.pathType === 'elevator') {
        direction = `Take the elevator to ${nextNode.label || nextNode.id}`;
      } else {
        // Calculate relative direction
        const angle = Math.atan2(nextNode.y - currentNode.y, nextNode.x - currentNode.x);
        const degrees = (angle * 180 / Math.PI + 360) % 360;
        
        let directionText = "";
        if (degrees >= 315 || degrees < 45) directionText = "east";
        else if (degrees >= 45 && degrees < 135) directionText = "south";
        else if (degrees >= 135 && degrees < 225) directionText = "west";
        else directionText = "north";

        direction = `Head ${directionText} for ${distance}m to ${nextNode.label || nextNode.id}`;
      }

      directions.push(direction);
    }

    directions.push("You have arrived at your destination");
    return directions;
  }

  // Helper method to find nearest node to a coordinate
  findNearestNode(x: number, y: number, nodeType?: string): Node | null {
    let nearestNode: Node | null = null;
    let minDistance = Infinity;

    for (const node of this.nodes.values()) {
      if (nodeType && node.type !== nodeType) continue;
      
      const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
      if (distance < minDistance) {
        minDistance = distance;
        nearestNode = node;
      }
    }

    return nearestNode;
  }
}

// Utility function to create pathfinding service from floor data
export function createPathfindingService(floorData: any): PathfindingService {
  const nodes = floorData.nodes || [];
  const paths = floorData.paths || [];
  return new PathfindingService(nodes, paths);
}