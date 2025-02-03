import type { CourseObject, Vector2D } from '../types/shared';

interface GeneratorOptions {
  difficulty: 1 | 2 | 3;
  theme: 'classic' | 'desert' | 'ice' | 'space';
  seed: number;
  width?: number;
  height?: number;
}

export class CourseGenerator {
  private readonly minDistance = 1.5;
  private readonly maxAttempts = 100;
  private readonly gridSize = 0.5;

  generateCourse(options: GeneratorOptions): CourseObject[] {
    const width = options.width ?? 20;
    const height = options.height ?? 20;
    const objects: CourseObject[] = [];

    // Add boundaries
    objects.push(
      this.createWall({ x: -width/2, y: -height/2 }, { x: width, y: 0.5 }), // Bottom
      this.createWall({ x: -width/2, y: height/2 }, { x: width, y: 0.5 }), // Top
      this.createWall({ x: -width/2, y: -height/2 }, { x: 0.5, y: height }), // Left
      this.createWall({ x: width/2, y: -height/2 }, { x: 0.5, y: height }) // Right
    );

    // Add hole
    const holePosition = this.findValidPosition(objects, width, height);
    objects.push(this.createHole(holePosition));

    // Add obstacles based on difficulty
    const obstacleCount = Math.floor(5 + options.difficulty * 2);
    for (let i = 0; i < obstacleCount; i++) {
      const position = this.findValidPosition(objects, width, height);
      objects.push(this.createObstacle(position, options));
    }

    return objects;
  }

  private findValidPosition(
    existingObjects: CourseObject[],
    width: number,
    height: number
  ): Vector2D {
    for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
      const position = {
        x: Math.floor(Math.random() * width - width/2) * this.gridSize,
        y: Math.floor(Math.random() * height - height/2) * this.gridSize
      };

      if (this.isValidPosition(position, existingObjects)) {
        return position;
      }
    }
    throw new Error('Could not find valid position');
  }

  private isValidPosition(position: Vector2D, objects: CourseObject[]): boolean {
    return objects.every(obj => 
      Math.hypot(position.x - obj.position.x, position.y - obj.position.y) > this.minDistance
    );
  }

  private createWall(position: Vector2D, dimensions: Vector2D): CourseObject {
    return {
      type: 'wall',
      position,
      dimensions,
      properties: {
        bounce: 0.8
      }
    };
  }

  private createHole(position: Vector2D): CourseObject {
    return {
      type: 'hole',
      position,
      dimensions: { x: 0.4, y: 0.4 }
    };
  }

  private createObstacle(position: Vector2D, options: GeneratorOptions): CourseObject {
    const types = ['water', 'sand', 'boost'] as const;
    const type = types[Math.floor(Math.random() * types.length)];
    
    return {
      type,
      position,
      dimensions: { x: 2, y: 2 },
      properties: {
        friction: type === 'sand' ? 0.8 : 0.3
      }
    };
  }
} 