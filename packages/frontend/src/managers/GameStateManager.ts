import type { GameState, Shot, GameMetadata } from '../types/game';
import type { Hex } from 'viem';

export class GameStateManager {
  private currentState: GameState | null = null;
  private metadata: GameMetadata | null = null;
  private shots: Shot[] = [];

  constructor(private gameId: Hex) {}

  getCurrentState(): GameState | null {
    return this.currentState;
  }

  getMetadata(): GameMetadata | null {
    return this.metadata;
  }

  setMetadata(metadata: GameMetadata): void {
    this.metadata = metadata;
  }

  updateState(newState: GameState): void {
    this.currentState = {
      players: newState.players,
      currentTurn: newState.currentTurn,
      status: ['WAITING', 'IN_PROGRESS', 'COMPLETED'][Number(newState.status)] as GameState['status'],
      scores: newState.scores,
      courseHash: newState.courseHash,
      lastShotCommitment: newState.lastShotCommitment,
      startTime: newState.startTime,
      lastShotTime: newState.lastShotTime,
      maxShots: newState.maxShots,
      shotsRemaining: newState.shotsRemaining,
      hasFinished: newState.hasFinished
    };
  }

  addShot(shot: Shot): void {
    this.shots.push(shot);
  }

  getShots(): Shot[] {
    return this.shots;
  }

  getLastShot(): Shot | null {
    return this.shots.length > 0 ? this.shots[this.shots.length - 1] : null;
  }

  isPlayerTurn(address: Hex): boolean {
    if (!this.currentState) return false;
    
    return (
      this.currentState.status === 'IN_PROGRESS' &&
      this.currentState.players[this.currentState.currentTurn] === address &&
      !this.currentState.hasFinished[this.currentState.currentTurn] &&
      this.currentState.shotsRemaining[this.currentState.currentTurn] > 0 &&
      (Date.now() / 1000 - this.currentState.lastShotTime) <= 30 // 30 second turn limit
    );
  }

  getPlayerIndex(address: Hex): number {
    if (!this.currentState) return -1;
    return this.currentState.players.findIndex(player => player === address);
  }

  getRemainingShots(address: Hex): number {
    if (!this.currentState) return 0;
    const playerIndex = this.getPlayerIndex(address);
    if (playerIndex === -1) return 0;
    return this.currentState.shotsRemaining[playerIndex];
  }

  hasPlayerFinished(address: Hex): boolean {
    if (!this.currentState) return false;
    const playerIndex = this.getPlayerIndex(address);
    if (playerIndex === -1) return false;
    return this.currentState.hasFinished[playerIndex];
  }

  getScore(address: Hex): number {
    if (!this.currentState) return 0;
    const playerIndex = this.getPlayerIndex(address);
    if (playerIndex === -1) return 0;
    return this.currentState.scores[playerIndex];
  }

  getTurnTimeRemaining(): number {
    if (!this.currentState || this.currentState.status !== 'IN_PROGRESS') return 0;
    const elapsed = Math.floor(Date.now() / 1000 - this.currentState.lastShotTime);
    return Math.max(0, 30 - elapsed); // 30 second turn limit
  }

  isGameComplete(): boolean {
    return this.currentState?.status === 'COMPLETED';
  }

  getWinner(): Hex | null {
    if (!this.currentState || !this.isGameComplete()) return null;

    let minScore = Number.MAX_VALUE;
    let winner: Hex | null = null;

    this.currentState.players.forEach((player, index) => {
      if (this.currentState!.scores[index] < minScore) {
        minScore = this.currentState!.scores[index];
        winner = player;
      }
    });

    return winner;
  }

  reset(): void {
    this.currentState = null;
    this.metadata = null;
    this.shots = [];
  }
} 