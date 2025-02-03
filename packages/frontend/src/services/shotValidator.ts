import type { CourseObject, Vector2D } from '../types/shared';
import { PhysicsEngine } from '../physics/engine';

export class ShotValidator {
  private physics: PhysicsEngine;

  constructor() {
    this.physics = new PhysicsEngine();
  }

  validateShot(
    power: number,
    angle: number,
    startPosition: Vector2D,
    course: CourseObject[]
  ): {
    isValid: boolean;
    reason?: string;
    trajectory?: Vector2D[];
  } {
    // Basic validation
    if (power < 0 || power > 100) {
      return { isValid: false, reason: 'Invalid power' };
    }

    if (angle < 0 || angle > 360) {
      return { isValid: false, reason: 'Invalid angle' };
    }

    // Simulate shot
    const result = this.physics.simulateShot(
      {
        position: startPosition,
        velocity: { x: 0, y: 0 },
        mass: 1,
        radius: 0.1,
      },
      power,
      angle,
      course
    );

    // Check if ball gets stuck
    if (result.positions.length >= 600) {
      return { isValid: false, reason: 'Shot too long' };
    }

    return {
      isValid: true,
      trajectory: result.positions
    };
  }
} 