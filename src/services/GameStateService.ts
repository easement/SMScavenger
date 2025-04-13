import { Clue, IClue } from '../models/Clue';
import { PlayerSession, IPlayerSession } from '../models/PlayerSession';
import { Op } from 'sequelize';

export class GameStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GameStateError';
  }
}

export class GameStateService {
  private static instance: GameStateService | null = null;
  private clues: Map<string, Clue>;

  private constructor() {
    this.clues = new Map();
  }

  public static getInstance(): GameStateService {
    if (!GameStateService.instance) {
      GameStateService.instance = new GameStateService();
    }
    return GameStateService.instance;
  }

  public async initializeClues(): Promise<string> {
    const clues = await Clue.findAll({
      order: [['id', 'ASC']]
    });

    this.clues.clear();
    clues.forEach(clue => {
      this.clues.set(clue.id, clue);
    });

    return 'default'; // For now, we'll use a default game ID
  }

  public async getCurrentClue(phoneNumber: string): Promise<Clue | null> {
    const session = await PlayerSession.findOne({
      where: { phoneNumber }
    });

    if (!session) {
      throw new GameStateError('No active session found for this phone number');
    }

    return this.clues.get(session.currentClueId) || null;
  }

  public async checkAnswer(phoneNumber: string, answer: string): Promise<boolean> {
    const session = await PlayerSession.findOne({
      where: { phoneNumber }
    });

    if (!session) {
      throw new GameStateError('No active session found for this phone number');
    }

    const currentClue = this.clues.get(session.currentClueId);
    if (!currentClue) {
      throw new GameStateError('No clue found for current session');
    }

    const isCorrect = currentClue.checkAnswer(answer);
    if (isCorrect) {
      await this.advanceToNextClue(phoneNumber);
    } else {
      await session.incrementAttempts();
    }

    return isCorrect;
  }

  public async requestHint(phoneNumber: string): Promise<string | null> {
    const session = await PlayerSession.findOne({
      where: { phoneNumber }
    });

    if (!session) {
      throw new GameStateError('No active session found for this phone number');
    }

    if (!(await session.canRequestHint())) {
      return null;
    }

    const currentClue = this.clues.get(session.currentClueId);
    if (!currentClue || !currentClue.hint) {
      return null;
    }

    session.hintsUsed += 1;
    await session.save();

    return currentClue.hint;
  }

  private async advanceToNextClue(phoneNumber: string): Promise<void> {
    const session = await PlayerSession.findOne({
      where: { phoneNumber }
    });

    if (!session) {
      throw new GameStateError('No active session found for this phone number');
    }

    const currentClue = this.clues.get(session.currentClueId);
    if (!currentClue) {
      throw new GameStateError('No clue found for current session');
    }

    const clueIds = Array.from(this.clues.keys());
    const currentIndex = clueIds.indexOf(currentClue.id);
    const nextClueId = clueIds[currentIndex + 1];

    if (!nextClueId) {
      session.completed = true;
      session.completedAt = new Date();
      await session.save();
      return;
    }

    await session.resetForNextClue(nextClueId);
  }

  public async isGameComplete(phoneNumber: string): Promise<boolean> {
    const session = await PlayerSession.findOne({
      where: { phoneNumber }
    });

    if (!session) {
      throw new GameStateError('No active session found for this phone number');
    }

    return session.completed;
  }

  public async getGameStatistics(): Promise<{
    totalClues: number;
    totalPlayers: number;
    activePlayers: number;
    completedPlayers: number;
  }> {
    const [totalClues, totalPlayers, activePlayers, completedPlayers] = await Promise.all([
      Clue.count(),
      PlayerSession.count(),
      PlayerSession.count({
        where: {
          completed: false
        }
      }),
      PlayerSession.count({
        where: {
          completed: true
        }
      })
    ]);

    return {
      totalClues,
      totalPlayers,
      activePlayers,
      completedPlayers
    };
  }
} 