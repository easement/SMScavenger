import { Clue } from '../../src/models/Clue';
import { PlayerSession } from '../../src/models/PlayerSession';
import { GameStateService } from '../../src/services/GameStateService';
import { TestDataGenerator } from '../utils/testUtils';

describe('Game Flow Integration', () => {
  const testPhoneNumber = '+1234567890';
  const clues = [
    {
      id: 'test-clue-1',
      type: 'text',
      question: 'What is the capital of France?',
      answer: 'Paris',
      hint: 'City of Light',
      answerLowerCase: 'paris'
    },
    {
      id: 'test-clue-2',
      type: 'text',
      question: 'What is the largest planet in our solar system?',
      answer: 'Jupiter',
      hint: 'Gas giant',
      answerLowerCase: 'jupiter'
    }
  ];

  let gameStateService: GameStateService;

  beforeEach(async () => {
    await Clue.destroy({ where: {} });
    await PlayerSession.destroy({ where: {} });
    
    // Create clues
    await Promise.all(clues.map(clue => Clue.create(clue)));
    
    gameStateService = GameStateService.getInstance();
    await gameStateService.initializeClues();
  });

  describe('Single Player Flow', () => {
    it('should handle a complete game flow', async () => {
      // Create session
      await PlayerSession.create({
        phoneNumber: testPhoneNumber,
        gameId: 'default',
        currentClueId: clues[0].id,
        attempts: 0,
        hintsUsed: 0,
        completed: false,
        startTime: new Date()
      });

      // Get first clue
      const firstClue = await gameStateService.getCurrentClue(testPhoneNumber);
      expect(firstClue?.question).toBe('What is the capital of France?');

      // Submit correct answer
      const isCorrect = await gameStateService.checkAnswer(testPhoneNumber, 'Paris');
      expect(isCorrect).toBe(true);

      // Move to next clue
      const nextClue = await gameStateService.getCurrentClue(testPhoneNumber);
      expect(nextClue?.question).toBe('What is the largest planet in our solar system?');

      // Check session state
      const session = await PlayerSession.findOne({
        where: { phoneNumber: testPhoneNumber }
      });
      expect(session?.currentClueId).toBe(clues[1].id);
    });

    it('should handle incorrect answers and hints', async () => {
      // Create session
      await PlayerSession.create({
        phoneNumber: testPhoneNumber,
        gameId: 'default',
        currentClueId: clues[0].id,
        attempts: 0,
        hintsUsed: 0,
        completed: false,
        startTime: new Date()
      });

      // Submit wrong answers
      await gameStateService.checkAnswer(testPhoneNumber, 'London');
      await gameStateService.checkAnswer(testPhoneNumber, 'Berlin');

      // Request hint
      const hint = await gameStateService.requestHint(testPhoneNumber);
      expect(hint).toBe('City of Light');

      // Check session state
      const session = await PlayerSession.findOne({
        where: { phoneNumber: testPhoneNumber }
      });
      expect(session?.attempts).toBe(2);
      expect(session?.hintsUsed).toBe(1);
    });
  });

  describe('Multiple Players', () => {
    it('should handle multiple players independently', async () => {
      const player1 = '+1111111111';
      const player2 = '+2222222222';

      // Create sessions
      await PlayerSession.create({
        phoneNumber: player1,
        gameId: 'default',
        currentClueId: clues[0].id,
        attempts: 0,
        hintsUsed: 0,
        completed: false,
        startTime: new Date()
      });

      await PlayerSession.create({
        phoneNumber: player2,
        gameId: 'default',
        currentClueId: clues[0].id,
        attempts: 0,
        hintsUsed: 0,
        completed: false,
        startTime: new Date()
      });

      // Player 1 advances
      await gameStateService.checkAnswer(player1, 'Paris');

      // Check both sessions
      const session1 = await PlayerSession.findOne({ where: { phoneNumber: player1 } });
      const session2 = await PlayerSession.findOne({ where: { phoneNumber: player2 } });

      expect(session1?.currentClueId).toBe(clues[1].id);
      expect(session2?.currentClueId).toBe(clues[0].id);
    });
  });
}); 