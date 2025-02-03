import type { Hex } from 'viem';
import type { CourseObject } from './shared';

export interface GameState {
  players: Hex[];
  currentTurn: number;
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED';
  scores: number[];
  courseHash: Hex;
  lastShotCommitment?: Hex;
  startTime: number;
  lastShotTime: number;
  maxShots: number;
  shotsRemaining: number[];
  hasFinished: boolean[];
}

export interface Shot {
  power: number;
  angle: number;
  timestamp: number;
  commitment: Hex;
}

export interface GameMetadata {
  id: Hex;
  difficulty: 1 | 2 | 3;
  theme: 'classic' | 'desert' | 'ice' | 'space';
  courseSeed: number;
  courseObjects: CourseObject[];
  par: number;
  maxShots: number;
  timeLimit: number;
}

export interface GameConfig {
  maxPlayers: number;
  turnTimeLimit: number;
  obstacleCount: {
    min: number;
    max: number;
  };
  difficultyModifiers: Record<1 | 2 | 3, {
    windStrength: number;
    obstacleComplexity: number;
    parMultiplier: number;
  }>;
} 