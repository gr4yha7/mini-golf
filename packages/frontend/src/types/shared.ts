export interface Vector2D {
  x: number;
  y: number;
}

export type TerrainType = 'normal' | 'ice' | 'sand' | 'water' | 'boost';

export interface TerrainProperties {
  friction: number;
  bounce: number;
  speedMultiplier: number;
}

export interface PhysicsObject {
  position: Vector2D;
  velocity: Vector2D;
  mass: number;
  radius: number;
}

export interface CourseObjectProperties {
  bounce?: number;
  friction?: number;
}

export interface CourseObject {
  type: 'wall' | 'hole' | 'water' | 'sand' | 'boost';
  position: Vector2D;
  dimensions: Vector2D;
  properties?: CourseObjectProperties;
}

export type ObstacleType = 
  | 'wall'
  | 'bumper'      // Bouncy obstacle
  | 'teleporter'  // Teleports ball to paired teleporter
  | 'windmill'    // Moving obstacle
  | 'portal'      // One-way passage
  | 'magnet';     // Attracts/repels ball

export interface ObstacleProperties {
  type: ObstacleType;
  movementPattern?: {
    type: 'rotate' | 'linear' | 'sine';
    speed: number;
    range: number;
    phase: number;
  };
  pairedId?: string;  // For teleporters/portals
  strength?: number;  // For magnets/bumpers
}

export interface GameState {
  players: string[];
  currentTurn: number;
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED';
  scores: number[];
  courseHash: string;
  lastShotCommitment?: string;
  terrain: Record<string, TerrainProperties>;
  obstacles: Record<string, ObstacleProperties>;
} 