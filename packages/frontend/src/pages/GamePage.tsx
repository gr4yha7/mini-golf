import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAccount } from 'wagmi';
import type { GameMetadata } from '../types/game';
import { GameInterface } from '../components/GameInterface';
import { GameComplete } from '../components/GameComplete';
import { ShotSimulation } from '../components/ShotSimulation';
import { useGameState } from '../hooks/useGameState';
import { CoursePreview } from '../components/CoursePreview';

export function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const { address } = useAccount();
  const { gameState, isMyTurn, submitShot } = useGameState(gameId);
  const [metadata, setMetadata] = useState<GameMetadata | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentShot, setCurrentShot] = useState<{ power: number; angle: number } | null>(null);

  useEffect(() => {
    // In a real app, fetch metadata from backend/contract
    if (gameId && !metadata) {
      // Temporary mock data
      setMetadata({
        id: gameId as `0x${string}`,
        difficulty: 1,
        theme: 'classic',
        courseSeed: 12345,
        courseObjects: [], // This would come from the backend
        par: 3,
        maxShots: 6,
        timeLimit: 30,
      });
    }
  }, [gameId, metadata]);

  const handleShot = async (power: number, angle: number) => {
    if (!gameId || !address || !isMyTurn) return;

    setCurrentShot({ power, angle });
    setIsSimulating(true);

    try {
      await submitShot(power, angle);
    } catch (error) {
      console.error('Failed to submit shot:', error);
      // Show error toast
    }
  };

  const handleSimulationComplete = (inHole: boolean) => {
    setIsSimulating(false);
    setCurrentShot(null);
    // Could show success/failure message
  };

  if (!gameId || !metadata) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading game...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {isSimulating && currentShot ? (
          <ShotSimulation
            course={metadata.courseObjects}
            power={currentShot.power}
            angle={currentShot.angle}
            onComplete={handleSimulationComplete}
          />
        ) : (
          <CoursePreview course={metadata.courseObjects} />
        )}

        <GameInterface
          gameId={gameId as `0x${string}`}
          onShot={handleShot}
          disabled={!isMyTurn || isSimulating}
        />

        {gameState?.status === 'COMPLETED' && (
          <GameComplete
            gameState={gameState}
            currentPlayer={address}
            onPlayAgain={() => {
              // Navigate to lobby or create new game
              window.location.href = '/';
            }}
          />
        )}
      </div>
    </div>
  );
} 