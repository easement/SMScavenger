import { Clue, IClue } from '../models/Clue';
import { PlayerSession, IPlayerSession } from '../models/PlayerSession';
import { Game, IGame } from '../models/Game';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export class GameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GameError';
  }
}

export class GameService {
  private static instance: GameService;

  private constructor() {}

  public static getInstance(): GameService {
    if (!GameService.instance) {
      GameService.instance = new GameService();
    }
    return GameService.instance;
  }

  public async getGame(gameId: string): Promise<Game | null> {
    return await Game.findByPk(gameId);
  }

  public async getAllGames(): Promise<Game[]> {
    return await Game.findAll({
      order: [['startTime', 'DESC']]
    });
  }

  public async createGame(gameData: Omit<IGame, 'id' | 'currentPlayers' | 'active' | 'startTime'>): Promise<Game> {
    return await Game.create({
      id: uuidv4(),
      ...gameData,
      currentPlayers: 0,
      active: true,
      startTime: new Date(),
      settings: gameData.settings || {}
    });
  }

  public async updateGame(gameId: string, gameData: Partial<Omit<IGame, 'id'>>): Promise<Game | null> {
    const game = await Game.findByPk(gameId);
    if (!game) return null;
    return await game.update(gameData);
  }

  public async deleteGame(gameId: string): Promise<boolean> {
    const deleted = await Game.destroy({
      where: { id: gameId }
    });
    return deleted > 0;
  }

  public async getClue(clueId: string): Promise<Clue | null> {
    return await Clue.findByPk(clueId);
  }

  public async getAllClues(): Promise<Clue[]> {
    return await Clue.findAll({
      order: [['id', 'ASC']]
    });
  }

  public async createClue(clueData: Omit<IClue, 'id' | 'answerLowerCase'>): Promise<Clue> {
    return await Clue.create({
      id: uuidv4(),
      ...clueData
    });
  }

  public async updateClue(clueId: string, clueData: Partial<Omit<IClue, 'id' | 'answerLowerCase'>>): Promise<Clue | null> {
    const clue = await Clue.findByPk(clueId);
    if (!clue) return null;
    return await clue.update(clueData);
  }

  public async deleteClue(clueId: string): Promise<boolean> {
    const deleted = await Clue.destroy({
      where: { id: clueId }
    });
    return deleted > 0;
  }

  public async getPlayerSession(phoneNumber: string): Promise<PlayerSession | null> {
    return await PlayerSession.findOne({
      where: { phoneNumber }
    });
  }

  public async createPlayerSession(sessionData: Pick<IPlayerSession, 'phoneNumber' | 'gameId' | 'currentClueId'>): Promise<PlayerSession> {
    return await PlayerSession.create({
      ...sessionData,
      startTime: new Date(),
      attempts: 0,
      hintsUsed: 0,
      completed: false
    });
  }

  public async updatePlayerSession(phoneNumber: string, sessionData: Partial<Omit<IPlayerSession, 'phoneNumber'>>): Promise<PlayerSession | null> {
    const session = await PlayerSession.findOne({
      where: { phoneNumber }
    });
    if (!session) return null;
    return await session.update(sessionData);
  }

  public async deletePlayerSession(phoneNumber: string): Promise<boolean> {
    const deleted = await PlayerSession.destroy({
      where: { phoneNumber }
    });
    return deleted > 0;
  }

  public async getGameStatistics(phoneNumber: string): Promise<{
    totalClues: number;
    completedClues: number;
    totalAttempts: number;
    hintsUsed: number;
  }> {
    const session = await PlayerSession.findOne({
      where: { phoneNumber }
    });

    if (!session) {
      return {
        totalClues: 0,
        completedClues: 0,
        totalAttempts: 0,
        hintsUsed: 0
      };
    }

    const totalClues = await Clue.count();
    const completedClues = session.completed ? totalClues : 0;

    return {
      totalClues,
      completedClues,
      totalAttempts: session.attempts,
      hintsUsed: session.hintsUsed
    };
  }
} 