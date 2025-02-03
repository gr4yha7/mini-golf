import { useState, useRef, useEffect } from 'react';
import type { Hex } from 'viem';
import type { Vector2D } from '../types/shared';
import { useAccount } from 'wagmi';
import { useGameState } from '../hooks/useGameState';
import { GameStateDisplay } from './GameStateDisplay';

interface GameInterfaceProps {
  gameId: Hex;
  onShot: (power: number, angle: number) => void;
  disabled?: boolean;
  maxPower?: number;
}

export function GameInterface({ gameId, onShot, disabled = false, maxPower = 100 }: GameInterfaceProps) {
  const { address } = useAccount();
  const { gameState, isMyTurn, submitShot } = useGameState(gameId);
  const [isDragging, setIsDragging] = useState(false);
  const [power, setPower] = useState(50);
  const [angle, setAngle] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef<Vector2D>({ x: 0, y: 0 });
  const currentPosRef = useRef<Vector2D>({ x: 0, y: 0 });
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (!gameState) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor(Date.now() / 1000 - gameState.lastShotTime);
      const remaining = Math.max(0, 30 - elapsed);
      setTimeLeft(remaining);

      if (remaining === 0 && !disabled) {
        // Auto-submit current shot when time runs out
        onShot(power, angle);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, disabled, power, angle, onShot]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - startPosRef.current.x;
      const y = e.clientY - rect.top - startPosRef.current.y;
      
      currentPosRef.current = { x, y };

      // Calculate power (distance from start)
      const distance = Math.sqrt(x * x + y * y);
      const normalizedPower = Math.min(distance / 100, 1) * maxPower;
      setPower(Math.round(normalizedPower));

      // Calculate angle (in degrees)
      const angleRad = Math.atan2(y, x);
      const angleDeg = (angleRad * 180 / Math.PI + 360) % 360;
      setAngle(Math.round(angleDeg));
    };

    const handleMouseUp = () => {
      if (isDragging && power > 0) {
        onShot?.(power, angle);
      }
      setIsDragging(false);
      setPower(0);
      setAngle(0);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, power, angle, maxPower, onShot]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setIsDragging(true);
    startPosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    currentPosRef.current = { ...startPosRef.current };
  };

  return (
    <div className="space-y-4">
      <GameStateDisplay gameState={gameState} currentPlayer={address as `0x${string}`} />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Shot Controls</h2>
        <div className={`text-lg ${timeLeft <= 5 ? 'text-red-500' : ''}`}>
          Time left: {timeLeft}s
        </div>
      </div>
      <div 
        ref={containerRef}
        className="relative w-full h-32 bg-gray-100 rounded-lg cursor-pointer select-none"
        onMouseDown={isMyTurn ? handleMouseDown : undefined}
        style={{ cursor: isMyTurn ? 'pointer' : 'not-allowed' }}
      >
        {isDragging && (
          <>
            {/* Direction line */}
            <div
              className="absolute w-1 bg-blue-500 origin-top"
              style={{
                height: `${power}px`,
                left: `${startPosRef.current.x}px`,
                top: `${startPosRef.current.y}px`,
                transform: `rotate(${angle}deg)`,
              }}
            />
            {/* Power indicator */}
            <div className="absolute left-4 top-4 bg-white px-2 py-1 rounded shadow">
              Power: {power}
            </div>
            {/* Angle indicator */}
            <div className="absolute right-4 top-4 bg-white px-2 py-1 rounded shadow">
              Angle: {angle}°
            </div>
          </>
        )}
        {!isDragging && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            {disabled ? 'Wait for your turn' : 'Click and drag to shoot'}
          </div>
        )}
      </div>
    </div>
  )
} 