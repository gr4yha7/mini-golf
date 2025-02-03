import type { GameMetadata, Shot } from '../types/game';
import type { CourseObject } from '../types/shared';

interface StoredGame {
  metadata: GameMetadata;
  shots: Shot[];
  course: CourseObject[];
}

export class GameStorage {
  private static readonly PREFIX = 'minigolf_game_';

  static saveGame(gameId: string, data: Partial<StoredGame>): void {
    const key = this.PREFIX + gameId;
    const existing = this.getGame(gameId) || {};
    localStorage.setItem(key, JSON.stringify({ ...existing, ...data }));
  }

  static getGame(gameId: string): StoredGame | null {
    const key = this.PREFIX + gameId;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  static clearGame(gameId: string): void {
    const key = this.PREFIX + gameId;
    localStorage.removeItem(key);
  }
} 