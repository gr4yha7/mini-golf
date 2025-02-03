import type { Hex } from 'viem';
import type { GameState, GameMetadata, Shot, GameConfig } from '../types/game';
// import type { CourseObject } from '../types/shared';
import { GameStateManager } from '../managers/GameStateManager';
import { PhysicsEngine } from '../physics/engine';
import { CourseRenderer } from '../renderer/courseRenderer';

export class GameController {
  private stateManager: GameStateManager;
  private physics: PhysicsEngine;
  private renderer: CourseRenderer | null = null;
  private config: GameConfig;
  private animationFrame: number | null = null;

  constructor(
    private gameId: Hex,
    private container: HTMLElement,
    config: Partial<GameConfig> = {}
  ) {
    this.stateManager = new GameStateManager(gameId);
    this.physics = new PhysicsEngine();
    this.config = this.initializeConfig(config);
  }

  private initializeConfig(config: Partial<GameConfig>): GameConfig {
    return {
      maxPlayers: config.maxPlayers ?? 4,
      turnTimeLimit: config.turnTimeLimit ?? 30,
      obstacleCount: config.obstacleCount ?? { min: 3, max: 8 },
      difficultyModifiers: config.difficultyModifiers ?? {
        1: { windStrength: 0, obstacleComplexity: 0.5, parMultiplier: 1 },
        2: { windStrength: 0.5, obstacleComplexity: 1, parMultiplier: 1.2 },
        3: { windStrength: 1, obstacleComplexity: 1.5, parMultiplier: 1.5 }
      }
    };
  }

  async initialize(metadata: GameMetadata): Promise<void> {
    this.stateManager.setMetadata(metadata);
    
    if (this.container) {
      this.renderer = new CourseRenderer(this.container, {
        shadows: true,
        antialias: true
      });
      this.renderer.renderCourse(metadata.courseObjects);
      this.startRenderLoop();
    }
  }

  private startRenderLoop(): void {
    if (!this.renderer) return;

    const animate = () => {
      this.renderer?.animate();
      this.animationFrame = requestAnimationFrame(animate);
    };
    animate();
  }

  async submitShot(power: number, angle: number): Promise<Shot> {
    if (!this.stateManager.isPlayerTurn(this.gameId)) {
      throw new Error('Not your turn');
    }

    const shot: Shot = {
      power,
      angle,
      commitment: '0x' as Hex, // This will be set by the contract
      timestamp: Date.now()
    };

    this.stateManager.addShot(shot);
    return shot;
  }

  handleResize(width: number, height: number): void {
    this.renderer?.resize(width, height);
  }

  cleanup(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.renderer?.dispose();
  }
} 