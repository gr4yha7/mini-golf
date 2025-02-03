import type { GameState } from '../types/game';
import type { Hex } from 'viem';
import { useAccount } from 'wagmi';

interface ScoreDisplayProps {
  gameState: GameState;
}

export function ScoreDisplay({ gameState }: ScoreDisplayProps) {
  const { address } = useAccount();

  const getPlayerStatus = (player: Hex, index: number) => {
    const isCurrentTurn = index === gameState.currentTurn;
    const isFinished = gameState.hasFinished[index];
    const shotsLeft = gameState.shotsRemaining[index];
    const score = gameState.scores[index];

    return {
      isCurrentTurn,
      isFinished,
      shotsLeft,
      score,
      isCurrentPlayer: player === address
    };
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-bold mb-4">Scores</h2>
      <div className="space-y-2">
        {gameState.players.map((player, index) => {
          const status = getPlayerStatus(player, index);
          return (
            <div 
              key={player}
              className={`flex justify-between items-center p-2 rounded ${
                status.isCurrentTurn ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className={status.isCurrentPlayer ? 'font-bold' : ''}>
                  {status.isCurrentPlayer ? 'You' : `Player ${index + 1}`}
                </span>
                {status.isFinished && (
                  <span className="text-green-500 text-sm">(Finished)</span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Shots left: {status.shotsLeft}
                </span>
                <span className="font-semibold">
                  Score: {status.score}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 