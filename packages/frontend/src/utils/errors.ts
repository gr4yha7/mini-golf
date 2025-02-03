import { z } from 'zod';

export class GameError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'GameError';
  }
}

export function handleZodError(error: z.ZodError): GameError {
  const issues = error.issues.map(issue => issue.message).join(', ');
  return new GameError(`Validation failed: ${issues}`, 'VALIDATION_ERROR');
}

export function handleContractError(error: unknown): GameError {
  if (error instanceof Error) {
    return new GameError(error.message, 'CONTRACT_ERROR');
  }
  return new GameError('Unknown contract error', 'UNKNOWN_ERROR');
} 