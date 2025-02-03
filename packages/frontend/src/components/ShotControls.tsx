import { useState, useRef, useEffect } from 'react';

interface ShotControlsProps {
  onShot: (power: number, angle: number) => void;
  disabled?: boolean;
}

export function ShotControls({ onShot, disabled }: ShotControlsProps) {
  const [power, setPower] = useState(50);
  const [angle, setAngle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const controlRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging && !disabled) {
        setIsDragging(false);
        onShot(power, angle);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging, power, angle, onShot, disabled]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    const rect = controlRef.current?.getBoundingClientRect();
    if (rect) {
      startPosRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || disabled) return;
    const rect = controlRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    const deltaX = currentX - startPosRef.current.x;
    const deltaY = currentY - startPosRef.current.y;

    // Calculate angle
    const newAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    setAngle(newAngle);

    // Calculate power based on distance
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const newPower = Math.min(100, Math.max(0, distance / 2));
    setPower(newPower);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div 
        ref={controlRef}
        className="relative w-full h-40 bg-gray-100 rounded-lg cursor-pointer"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        {isDragging && (
          <div 
            className="absolute w-1 bg-blue-500"
            style={{
              height: `${power}%`,
              transform: `rotate(${angle}deg)`,
              transformOrigin: 'center bottom',
              left: '50%',
              bottom: '0'
            }}
          />
        )}
        {!isDragging && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            Click and drag to aim
          </div>
        )}
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Power: {Math.round(power)}%</span>
          <span>Angle: {Math.round(angle)}°</span>
        </div>
      </div>
    </div>
  );
} 