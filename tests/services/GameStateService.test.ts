import { v4 as uuidv4 } from 'uuid';
import { GameStateService } from '../../src/services/GameStateService';
import { Clue } from '../../src/models/Clue';
import { PlayerSession } from '../../src/models/PlayerSession';
import { Game } from '../../src/models/Game';
import { sequelize } from '../../src/config/database';

describe('GameStateService', () => {
  const testPhoneNumber = '+1234567890';
  const testClues = [
    {
      id: uuidv4(),
      type: 'text',
      question: 'What is the capital of France?',
      answer: 'Paris',
      hint: 'City of Light'
    },
    {
      id: uuidv4(),
      type: 'text',
      question: 'What is the largest planet in our solar system?',
      answer: 'Jupiter',
      hint: 'Gas giant'
    }
  ];

  let gameStateService: GameStateService;
  let game: Game;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await Clue.destroy({ where: {} });
    await PlayerSession.destroy({ where: {} });
    gameStateService = GameStateService.getInstance();
    await gameStateService.initializeClues();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('getCurrentClue', () => {
    it('should get the current clue for a player', async () => {
      const clue = await Clue.create({
        id: uuidv4(),
        type: 'text',
        question: 'Test question',
        answer: 'Test answer',
        hint: 'Test hint'
      });

      await PlayerSession.create({
        phoneNumber: testPhoneNumber,
        gameId: 'default',
        currentClueId: clue.id,
        attempts: 0,
        hintsUsed: 0,
        completed: false,
        startTime: new Date()
      });

      const currentClue = await gameStateService.getCurrentClue(testPhoneNumber);
      expect(currentClue?.question).toBe('Test question');
    });
  });

  describe('checkAnswer', () => {
    it('should correctly validate answers', async () => {
      const clue = await Clue.create({
        id: uuidv4(),
        type: 'text',
        question: 'Test question',
        answer: 'Test answer',
        hint: 'Test hint'
      });

      await PlayerSession.create({
        phoneNumber: testPhoneNumber,
        gameId: 'default',
        currentClueId: clue.id,
        attempts: 0,
        hintsUsed: 0,
        completed: false,
        startTime: new Date()
      });

      const isCorrect = await gameStateService.checkAnswer(testPhoneNumber, 'Test answer');
      expect(isCorrect).toBe(true);

      const isIncorrect = await gameStateService.checkAnswer(testPhoneNumber, 'Wrong answer');
      expect(isIncorrect).toBe(false);
    });
  });

  describe('requestHint', () => {
    it('should provide a hint after enough attempts', async () => {
      const clue = await Clue.create({
        id: uuidv4(),
        type: 'text',
        question: 'Test question',
        answer: 'Test answer',
        hint: 'Test hint'
      });

      await PlayerSession.create({
        phoneNumber: testPhoneNumber,
        gameId: 'default',
        currentClueId: clue.id,
        attempts: 0,
        hintsUsed: 0,
        completed: false,
        startTime: new Date()
      });

      // First attempt - no hint
      await gameStateService.checkAnswer(testPhoneNumber, 'Wrong answer');
      const hint1 = await gameStateService.requestHint(testPhoneNumber);
      expect(hint1).toBeNull();

      // Second attempt - no hint
      await gameStateService.checkAnswer(testPhoneNumber, 'Wrong answer');
      const hint2 = await gameStateService.requestHint(testPhoneNumber);
      expect(hint2).toBeNull();

      // Third attempt - should get hint
      await gameStateService.checkAnswer(testPhoneNumber, 'Wrong answer');
      const hint3 = await gameStateService.requestHint(testPhoneNumber);
      expect(hint3).toBe('Test hint');
    });
  });

  describe('getGameStatistics', () => {
    it('should return correct game statistics', async () => {
      const clue = await Clue.create({
        id: uuidv4(),
        type: 'text',
        question: 'Test question',
        answer: 'Test answer',
        hint: 'Test hint'
      });

      await PlayerSession.create({
        phoneNumber: testPhoneNumber,
        gameId: 'default',
        currentClueId: clue.id,
        attempts: 0,
        hintsUsed: 0,
        completed: false,
        startTime: new Date()
      });

      const stats = await gameStateService.getGameStatistics();
      expect(stats.totalClues).toBe(1);
      expect(stats.totalPlayers).toBe(1);
      expect(stats.activePlayers).toBe(1);
      expect(stats.completedPlayers).toBe(0);
    });
  });
}); 