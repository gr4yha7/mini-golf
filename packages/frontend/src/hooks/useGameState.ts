import { useContractRead, useContractEvent, useAccount, useContractWrite } from 'wagmi';
import { useEffect, useState, useCallback } from 'react';
import type { GameState, Shot } from '../types/game';
import { MiniGolfABI } from '../abi/MiniGolf';
import { ENV } from '../config/env';
import { GameStateManager } from '../managers/GameStateManager';
import { keccak256, encodePacked } from 'viem';

// Helper function to convert contract data to GameState
function mapContractDataToGameState(data: any): GameState {
  return {
    players: data.players,
    currentTurn: data.currentTurn,
    status: ['WAITING', 'IN_PROGRESS', 'COMPLETED'][Number(data.status)] as GameState['status'],
    scores: data.scores.map((score: bigint) => Number(score)),
    courseHash: data.courseHash,
    lastShotCommitment: data.lastShotCommitment,
    startTime: Number(data.startTime),
    lastShotTime: Number(data.lastShotTime),
    maxShots: Number(data.maxShots),
    shotsRemaining: data.shotsRemaining.map((shots: bigint) => Number(shots)),
    hasFinished: data.hasFinished
  };
}

export function useGameState(gameId?: string) {
  const { address } = useAccount();
  const [gameManager] = useState(() => gameId ? new GameStateManager(gameId as `0x${string}`) : null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [lastShot, setLastShot] = useState<Shot | null>(null);

  const { data: gameState, refetch } = useContractRead({
    address: ENV.GAME_CONTRACT_ADDRESS as `0x${string}`,
    abi: MiniGolfABI,
    functionName: 'games',
    args: gameId ? [gameId as `0x${string}`] : undefined,
    enabled: !!gameId,
  });

  const updateGameState = useCallback((newState: GameState) => {
    if (!gameManager) return;
    try {
      gameManager.updateState(newState);
      if (address) {
        setIsMyTurn(gameManager.isPlayerTurn(address as `0x${string}`));
      }
    } catch (error) {
      console.error('Failed to update game state:', error);
    }
  }, [gameManager, address]);

  useEffect(() => {
    if (gameState) {
      updateGameState(mapContractDataToGameState(gameState));
    }
  }, [gameState, updateGameState]);

  useContractEvent({
    address: ENV.GAME_CONTRACT_ADDRESS as `0x${string}`,
    abi: MiniGolfABI,
    eventName: 'ShotSubmitted',
    listener(logs) {
      if (logs.filter(log => log.args.gameId === gameId).length > 0) {
        refetch();
      }
    }
  });

  const { write: submitShotToContract } = useContractWrite({
    address: ENV.GAME_CONTRACT_ADDRESS as `0x${string}`,
    abi: MiniGolfABI,
    functionName: 'submitShot'
  });

  const { write: markPlayerFinishedContract } = useContractWrite({
    address: ENV.GAME_CONTRACT_ADDRESS as `0x${string}`,
    abi: MiniGolfABI,
    functionName: 'markPlayerFinished' as const
  });

  const markPlayerFinished = useCallback(async (gameId: string) => {
    if (!gameManager || !isMyTurn || !address) {
      throw new Error('Cannot mark player as finished');
    }
    
    markPlayerFinishedContract({
      args: [gameId as `0x${string}`]
    });
  }, [gameManager, isMyTurn, address, markPlayerFinishedContract]);

  const submitShot = useCallback(async (power: number, angle: number) => {
    if (!gameManager || !isMyTurn || !gameId || !address) {
      throw new Error('Cannot submit shot now');
    }

    const gameState = gameManager.getCurrentState();
    if (!gameState) throw new Error('No game state');

    const currentTurn = gameState.currentTurn;
    if (gameState.shotsRemaining[currentTurn] <= 0) {
      throw new Error('No shots remaining');
    }

    if (gameState.hasFinished[currentTurn]) {
      throw new Error('Player already finished');
    }

    if (Date.now() / 1000 - gameState.lastShotTime > 30) {
      throw new Error('Turn time expired');
    }

    // Create shot commitment
    const commitment = keccak256(
      encodePacked(
        ['uint256', 'uint256', 'address'],
        [BigInt(power), BigInt(angle), address]
      )
    );

    const shot: Shot = {
      power,
      angle,
      commitment,
      timestamp: Date.now()
    };

    // Submit to contract
    submitShotToContract({
      args: [gameId as `0x${string}`, commitment]
    });

    // Update local state
    setLastShot(shot);
    gameManager.addShot(shot);

    return shot;
  }, [gameManager, isMyTurn, gameId, address, submitShotToContract]);

  return {
    gameState: gameManager?.getCurrentState() ?? null,
    isMyTurn,
    lastShot,
    refetch,
    submitShot,
    markPlayerFinished
  };
} 