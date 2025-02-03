import { useEffect, useState } from 'react';
import type { Vector2D, CourseObject } from '../types/shared';
import { PhysicsEngine } from '../physics/engine';
import { CoursePreview } from './CoursePreview';

interface ShotSimulationProps {
  course: CourseObject[];
  power: number;
  angle: number;
  onComplete: (inHole: boolean) => void;
}

export function ShotSimulation({ 
  course, 
  power, 
  angle, 
  onComplete 
}: ShotSimulationProps) {
  const [ballPositions, setBallPositions] = useState<Vector2D[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const physics = new PhysicsEngine();
    const result = physics.simulateShot(
      {
        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        mass: 1,
        radius: 0.1,
      },
      power,
      angle,
      course
    );

    setBallPositions(result.positions);
    setIsAnimating(true);
    setCurrentFrame(0);
  }, [power, angle, course]);

  useEffect(() => {
    if (!isAnimating) return;

    const interval = setInterval(() => {
      setCurrentFrame(prev => {
        if (prev >= ballPositions.length - 1) {
          setIsAnimating(false);
          onComplete(true); // TODO: Check if ball is in hole
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / 60); // 60 FPS

    return () => clearInterval(interval);
  }, [isAnimating, ballPositions, onComplete]);

  return (
    <div className="relative">
      <CoursePreview course={course} />
      {ballPositions[currentFrame] && (
        <div 
          className="absolute w-4 h-4 bg-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${(ballPositions[currentFrame].x + 10) * 40}px`,
            top: `${(ballPositions[currentFrame].y + 7.5) * 40}px`
          }}
        />
      )}
    </div>
  );
} 