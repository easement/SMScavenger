export class GameStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GameStateError';
  }
} 