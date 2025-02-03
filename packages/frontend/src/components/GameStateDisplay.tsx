import type { GameState } from '../types/game';
import type { Hex } from 'viem';

interface GameStateDisplayProps {
  gameState: GameState | null;
  currentPlayer?: Hex;
}

export function GameStateDisplay({ gameState, currentPlayer }: GameStateDisplayProps) {
  if (!gameState) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4">
        <p className="text-gray-500">Loading game state...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h2 className="text-lg font-semibold mb-2">Game Status</h2>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Status:</span>
          <span className="font-medium">{gameState.status}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Players:</span>
          <span className="font-medium">{gameState.players.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Current Turn:</span>
          <span className="font-medium">
            {gameState.players[gameState.currentTurn] === currentPlayer ? 
              'Your Turn' : 
              `Player ${gameState.currentTurn + 1}`}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Shots Left:</span>
          <span className="font-medium">
            {currentPlayer ? gameState.shotsRemaining[gameState.players.indexOf(currentPlayer)] : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
} 