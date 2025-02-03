import { useEffect, useRef, useState, useCallback } from 'react';
import type { Hex } from 'viem';
import type { CourseObject, Vector2D } from '../types/shared';
import { CourseRenderer } from '../renderer/courseRenderer';
import { useGameState } from '../hooks/useGameState';
import { GameInterface } from './GameInterface';
import { ScoreDisplay } from './ScoreDisplay';
import { GameStorage } from '../services/gameStorage';
import { ShotValidator } from '../services/shotValidator';
import { GameComplete } from './GameComplete';
import { LoadingSpinner } from './LoadingSpinner';

interface GameControllerProps {
  gameId: Hex;
  course: CourseObject[];
  difficulty: 1 | 2 | 3;
  theme: 'classic' | 'desert' | 'ice' | 'space';
}

export function GameController({ gameId, course, difficulty, theme }: GameControllerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CourseRenderer | null>(null);
  const validatorRef = useRef(new ShotValidator());
  const currentBallPosition = useRef<Vector2D>({ x: 0, y: 0 });
  const { gameState, isMyTurn, submitShot, markPlayerFinished } = useGameState(gameId);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showGameComplete, setShowGameComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeGame = async () => {
      try {
        if (!containerRef.current) return;

        rendererRef.current = new CourseRenderer(containerRef.current, {
          shadows: true,
          antialias: true
        });

        rendererRef.current.renderCourse(course);
        rendererRef.current.updateBallPosition(currentBallPosition.current);

        // Load saved game state
        const savedGame = GameStorage.getGame(gameId);
        if (savedGame?.course) {
          rendererRef.current.renderCourse(savedGame.course);
          if (savedGame.shots.length > 0) {
            const lastShot = savedGame.shots[savedGame.shots.length - 1];
            const validation = validatorRef.current.validateShot(
              lastShot.power,
              lastShot.angle,
              currentBallPosition.current,
              course
            );
            if (validation.trajectory) {
              currentBallPosition.current = validation.trajectory[validation.trajectory.length - 1];
              rendererRef.current.updateBallPosition(currentBallPosition.current);
            }
          }
        }

        rendererRef.current.animate();
        setIsInitializing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize game');
        setIsInitializing(false);
      }
    };

    initializeGame();

    return () => {
      rendererRef.current?.dispose();
    };
  }, [course, gameId]);

  const handleAnimationComplete = useCallback((inHole: boolean) => {
    setIsAnimating(false);
    if (inHole) {
      setShowGameComplete(true);
    }
  }, []);

  const handleShot = async (power: number, angle: number) => {
    if (!isMyTurn || isAnimating) return;
    setError(null);

    try {
      const validation = validatorRef.current.validateShot(
        power,
        angle,
        currentBallPosition.current,
        course
      );

      if (!validation.isValid) {
        throw new Error(validation.reason || 'Invalid shot');
      }

      setIsAnimating(true);

      // Start animation before contract interaction
      if (validation.trajectory) {
        rendererRef.current?.animateBall(validation.trajectory);
        currentBallPosition.current = validation.trajectory[validation.trajectory.length - 1];
      }

      // Submit shot to contract
      const shotCommitment = await submitShot(power, angle);

      // Save game state
      const currentGame = GameStorage.getGame(gameId);
      GameStorage.saveGame(gameId, {
        metadata: currentGame?.metadata,
        course,
        shots: [...(currentGame?.shots || []), shotCommitment]
      });

      // Check if ball is in hole
      const isInHole = validation.trajectory?.some(pos => {
        const hole = course.find(obj => obj.type === 'hole');
        if (!hole) return false;
        const distance = Math.hypot(pos.x - hole.position.x, pos.y - hole.position.y);
        return distance < (hole.dimensions.x / 2);
      });

      if (isInHole) {
        // Mark player as finished
        await markPlayerFinished(gameId);
        handleAnimationComplete(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit shot');
      setIsAnimating(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
        <button
          className="absolute top-0 right-0 px-4 py-3"
          onClick={() => setError(null)}
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div 
        ref={containerRef} 
        className="w-full h-[600px] rounded-lg overflow-hidden shadow-lg"
      />
      {gameState && (
        <>
          <ScoreDisplay gameState={gameState} />
          <GameInterface
            gameId={gameId}
            onShot={handleShot}
            disabled={!isMyTurn || isAnimating}
          />
          {showGameComplete && (
            <GameComplete
              gameState={gameState}
              currentPlayer={gameState.players[gameState.currentTurn]}
              onPlayAgain={() => {
                GameStorage.clearGame(gameId);
                window.location.href = '/';
              }}
            />
          )}
        </>
      )}
    </div>
  );
} 