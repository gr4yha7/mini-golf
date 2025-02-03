import type { Vector2D, CourseObject, PhysicsObject, TerrainType, TerrainProperties } from '../types/shared';
import { z } from 'zod';

const SimulationResultSchema = z.object({
  positions: z.array(z.object({
    x: z.number(),
    y: z.number()
  })),
  inHole: z.boolean(),
  gameEffects: z.array(z.string())
});

type SimulationResult = z.infer<typeof SimulationResultSchema>;

interface CollisionResult {
  type: 'vertical' | 'horizontal' | null;
  overlap: Vector2D;
}

export class PhysicsEngine {
  private readonly gravity = 9.81;
  private readonly defaultFriction = 0.3;
  private readonly timeStep = 1 / 60;
  private readonly maxIterations = 600;

  private readonly terrainEffects: Record<TerrainType, TerrainProperties> = {
    normal: { friction: 0.3, bounce: 0.8, speedMultiplier: 1.0 },
    ice: { friction: 0.1, bounce: 0.9, speedMultiplier: 1.2 },
    sand: { friction: 0.6, bounce: 0.4, speedMultiplier: 0.7 },
    water: { friction: 0.8, bounce: 0.3, speedMultiplier: 0.5 },
    boost: { friction: 0.2, bounce: 1.0, speedMultiplier: 1.5 }
  };

  simulateShot(
    ball: PhysicsObject,
    power: number,
    angle: number,
    course: CourseObject[],
  ): SimulationResult {
    const positions: Vector2D[] = [{ ...ball.position }];
    let velocity = this.getInitialVelocity(power, angle);
    let collisions = 0;

    while (this.isBallMoving(velocity) && positions.length < 600) {
      const nextPosition = this.getNextPosition(ball.position, velocity);
      
      // Check for collisions
      if (!this.isValidPosition(nextPosition, course, ball.radius)) {
        positions.push(nextPosition);
        continue;
      }

      positions.push(nextPosition);
      ball.position = nextPosition;

      velocity = this.updateVelocity(velocity);
    }

    return {
      positions,
      inHole: this.checkHole(ball, course),
      gameEffects: []
    };
  }

  private getInitialVelocity(power: number, angle: number): Vector2D {
    const multiplier = 0.5;
    const radians = (angle * Math.PI) / 180;
    return {
      x: power * multiplier * Math.cos(radians),
      y: power * multiplier * Math.sin(radians)
    };
  }

  private step(ball: PhysicsObject, course: CourseObject[]): PhysicsObject {
    const newBall = { ...ball };
    
    // Get current terrain properties
    const terrain = this.getCurrentTerrain(ball, course);
    const terrainProps = terrain ? this.terrainEffects[terrain.type as TerrainType] : null;
    const friction = terrainProps?.friction ?? this.defaultFriction;

    // Apply friction
    const speed = Math.sqrt(
      ball.velocity.x * ball.velocity.x + 
      ball.velocity.y * ball.velocity.y
    );

    if (speed > 0) {
      const frictionForce = friction * ball.mass * this.gravity;
      const frictionDecel = frictionForce / ball.mass;
      const timeToStop = speed / frictionDecel;
      
      if (timeToStop <= this.timeStep) {
        newBall.velocity = { x: 0, y: 0 };
      } else {
        const frictionFactor = 1 - (frictionDecel * this.timeStep / speed);
        newBall.velocity.x *= frictionFactor;
        newBall.velocity.y *= frictionFactor;
      }
    }

    // Update position
    newBall.position.x += newBall.velocity.x * this.timeStep;
    newBall.position.y += newBall.velocity.y * this.timeStep;

    // Handle collisions
    const collision = this.handleCollisions(newBall, course);
    if (collision) {
      newBall.position.x += collision.overlap.x;
      newBall.position.y += collision.overlap.y;
    }

    return newBall;
  }

  private handleCollisions(ball: PhysicsObject, course: CourseObject[]): CollisionResult | null {
    for (const object of course) {
      if (object.type !== 'wall') continue;

      const collision = this.checkCollision(ball, object);
      if (!collision.type) continue;

      const bounce = this.terrainEffects[object.type as TerrainType]?.bounce ?? 0.8;
      
      if (collision.type === 'vertical') {
        ball.velocity.x *= -bounce;
      } else {
        ball.velocity.y *= -bounce;
      }

      return collision;
    }

    return null;
  }

  private checkCollision(ball: PhysicsObject, object: CourseObject): CollisionResult {
    const ballBox = {
      left: ball.position.x - ball.radius,
      right: ball.position.x + ball.radius,
      top: ball.position.y + ball.radius,
      bottom: ball.position.y - ball.radius
    };

    const objectBox = {
      left: object.position.x,
      right: object.position.x + object.dimensions.x,
      top: object.position.y + object.dimensions.y,
      bottom: object.position.y
    };

    if (
      ballBox.left > objectBox.right ||
      ballBox.right < objectBox.left ||
      ballBox.top < objectBox.bottom ||
      ballBox.bottom > objectBox.top
    ) {
      return { type: null, overlap: { x: 0, y: 0 } };
    }

    const overlap = {
      x: ball.velocity.x > 0 ? objectBox.left - ballBox.right : objectBox.right - ballBox.left,
      y: ball.velocity.y > 0 ? objectBox.bottom - ballBox.top : objectBox.top - ballBox.bottom
    };

    const type = Math.abs(overlap.x) < Math.abs(overlap.y) ? 'vertical' : 'horizontal';
    return { type, overlap };
  }

  private getCurrentTerrain(ball: PhysicsObject, course: CourseObject[]): CourseObject | null {
    return course.find(obj => 
      obj.type in this.terrainEffects &&
      this.isPointInObject(ball.position, obj)
    ) ?? null;
  }

  private isPointInObject(point: Vector2D, object: CourseObject): boolean {
    return point.x >= object.position.x &&
           point.x <= object.position.x + object.dimensions.x &&
           point.y >= object.position.y &&
           point.y <= object.position.y + object.dimensions.y;
  }

  private checkHole(ball: PhysicsObject, course: CourseObject[]): boolean {
    const hole = course.find(obj => obj.type === 'hole');
    if (!hole) return false;

    const distance = Math.sqrt(
      Math.pow(ball.position.x - hole.position.x, 2) +
      Math.pow(ball.position.y - hole.position.y, 2)
    );

    return distance < hole.dimensions.x / 2;
  }

  private isStopped(ball: PhysicsObject): boolean {
    const minSpeed = 0.01;
    return Math.abs(ball.velocity.x) < minSpeed && 
           Math.abs(ball.velocity.y) < minSpeed;
  }

  private isBallMoving(velocity: Vector2D): boolean {
    return Math.abs(velocity.x) > 0.01 || Math.abs(velocity.y) > 0.01;
  }

  private getNextPosition(position: Vector2D, velocity: Vector2D): Vector2D {
    return {
      x: position.x + velocity.x * this.timeStep,
      y: position.y + velocity.y * this.timeStep
    };
  }

  private isValidPosition(position: Vector2D, course: CourseObject[], radius: number): boolean {
    for (const object of course) {
      if (object.type !== 'wall') continue;

      const objectBox = {
        left: object.position.x - radius,
        right: object.position.x + object.dimensions.x + radius,
        top: object.position.y + object.dimensions.y + radius,
        bottom: object.position.y - radius
      };

      if (
        position.x < objectBox.left ||
        position.x > objectBox.right ||
        position.y < objectBox.bottom ||
        position.y > objectBox.top
      ) {
        return false;
      }
    }

    return true;
  }

  private handleCollision(
    position: Vector2D, 
    nextPosition: Vector2D, 
    velocity: Vector2D, 
    course: CourseObject[]
  ): { newVelocity: Vector2D } {
    const collision = this.checkCollision({ 
      position, 
      velocity, 
      radius: 0.5, 
      mass: 1 // Add default mass to fix type error
    }, course[0]);
    const bounce = this.terrainEffects[course[0].type as TerrainType]?.bounce ?? 0.8;
    
    let newVelocity = { ...velocity };
    if (collision.type === 'vertical') {
      newVelocity.x *= -bounce;
    } else {
      newVelocity.y *= -bounce;
    }

    return { newVelocity };
  }

  private updateVelocity(velocity: Vector2D): Vector2D {
    return {
      x: velocity.x,
      y: velocity.y
    };
  }

  private isInHole(position: Vector2D, hole: CourseObject): boolean {
    const distance = Math.sqrt(
      Math.pow(position.x - hole.position.x, 2) +
      Math.pow(position.y - hole.position.y, 2)
    );

    return distance < hole.dimensions.x / 2;
  }
} 