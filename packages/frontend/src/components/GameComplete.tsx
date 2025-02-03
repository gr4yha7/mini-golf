import type { GameState } from '../types/game';
import type { Hex } from 'viem';

interface GameCompleteProps {
  gameState: GameState;
  currentPlayer?: Hex;
  onPlayAgain: () => void;
}

export function GameComplete({ gameState, currentPlayer, onPlayAgain }: GameCompleteProps) {
  const getWinner = () => {
    const minScore = Math.min(...gameState.scores);
    const winnerIndex = gameState.scores.indexOf(minScore);
    const isWinner = gameState.players[winnerIndex] === currentPlayer;

    return {
      playerIndex: winnerIndex,
      score: minScore,
      isCurrentPlayer: isWinner
    };
  };

  const winner = getWinner();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <h2 className="text-3xl font-bold text-center mb-6">
          Game Complete!
        </h2>
        <div className="text-center mb-8">
          <p className="text-xl mb-2">
            {winner.isCurrentPlayer ? 
              'Congratulations, you won!' : 
              `Player ${winner.playerIndex + 1} wins!`}
          </p>
          <p className="text-gray-600">
            Winning score: {winner.score}
          </p>
        </div>
        <div className="space-y-4">
          <h3 className="font-semibold">Final Scores:</h3>
          {gameState.players.map((player, index) => (
            <div 
              key={player}
              className={`flex justify-between ${player === currentPlayer ? 'font-bold' : ''}`}
            >
              <span>
                {player === currentPlayer ? 'You' : `Player ${index + 1}`}
              </span>
              <span>{gameState.scores[index]}</span>
            </div>
          ))}
        </div>
        <button
          onClick={onPlayAgain}
          className="mt-8 w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Play Again
        </button>
      </div>
    </div>
  );
} 