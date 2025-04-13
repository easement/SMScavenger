import { TestDataGenerator, TestHelpers } from './testUtils';
import { GameStateService } from '../../src/services/GameStateService';
import { Clue } from '../../src/models/Clue';
import { PlayerSession } from '../../src/models/PlayerSession';
import { Game } from '../../src/models/Game';
import { v4 as uuidv4 } from 'uuid';

export class IntegrationTestHelpers {
  static async setupCompleteGameFlow(): Promise<{
    game: Game;
    clues: Clue[];
    session: PlayerSession;
  }> {
    // Create a game
    const game = await Game.create({
      id: uuidv4(),
      name: 'Integration Test Game',
      description: 'A game for integration testing',
      active: true,
      startTime: new Date(),
      currentPlayers: 0,
      settings: {
        maxAttempts: 3,
        hintThreshold: 2,
        timeLimit: 60
      }
    });

    // Create clues
    const clues = await Promise.all([
      Clue.create({
        id: uuidv4(),
        type: 'text',
        question: 'First clue question',
        answer: 'First answer',
        hint: 'First hint'
      }),
      Clue.create({
        id: uuidv4(),
        type: 'text',
        question: 'Second clue question',
        answer: 'Second answer',
        hint: 'Second hint'
      }),
      Clue.create({
        id: uuidv4(),
        type: 'text',
        question: 'Final clue question',
        answer: 'Final answer',
        hint: 'Final hint'
      })
    ]);

    // Create a player session
    const session = await PlayerSession.create({
      phoneNumber: TestDataGenerator.generatePhoneNumber(),
      gameId: game.id,
      currentClueId: clues[0].id,
      attempts: 0,
      hintsUsed: 0,
      completed: false,
      startTime: new Date()
    });

    return { game, clues, session };
  }

  static async simulatePlayerProgress(
    session: PlayerSession,
    clues: Clue[],
    makeMistakes: boolean = false
  ): Promise<void> {
    const gameState = GameStateService.getInstance();

    for (let i = 0; i < clues.length; i++) {
      const clue = clues[i];
      
      if (makeMistakes) {
        // Make some incorrect attempts
        await gameState.checkAnswer(session.phoneNumber, 'wrong answer');
        await gameState.checkAnswer(session.phoneNumber, 'another wrong answer');
        
        // Request a hint
        await gameState.requestHint(session.phoneNumber);
      }

      // Get the correct answer
      const correctAnswer = clue.answer;
      
      // Check the answer
      const isCorrect = await gameState.checkAnswer(session.phoneNumber, correctAnswer);
      
      if (!isCorrect) {
        throw new Error(`Failed to check answer for clue ${i + 1}`);
      }

      // No need to explicitly advance to next clue as checkAnswer handles this
      // when the answer is correct
    }
  }

  static async generateLoadTestData(
    numGames: number = 5,
    numCluesPerGame: number = 5,
    numSessionsPerGame: number = 10
  ): Promise<{
    games: Game[];
    clues: Clue[];
    sessions: PlayerSession[];
  }> {
    const games = await Promise.all(
      Array.from({ length: numGames }, () =>
        Game.create({
          id: uuidv4(),
          name: `Load Test Game ${Math.random()}`,
          description: 'A game for load testing',
          active: true,
          startTime: new Date(),
          currentPlayers: 0,
          settings: {
            maxAttempts: 3,
            hintThreshold: 2,
            timeLimit: 60
          }
        })
      )
    );

    const clues = await Promise.all(
      games.flatMap(game =>
        Array.from({ length: numCluesPerGame }, () =>
          Clue.create({
            id: uuidv4(),
            type: 'text',
            question: `Load test clue ${Math.random()}`,
            answer: `Load test answer ${Math.random()}`,
            hint: `Load test hint ${Math.random()}`
          })
        )
      )
    );

    const sessions = await Promise.all(
      games.flatMap(game =>
        Array.from({ length: numSessionsPerGame }, () =>
          PlayerSession.create({
            phoneNumber: TestDataGenerator.generatePhoneNumber(),
            gameId: game.id,
            currentClueId: clues[0].id,
            attempts: Math.floor(Math.random() * 3),
            hintsUsed: Math.floor(Math.random() * 2),
            completed: Math.random() > 0.7,
            startTime: new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000)
          })
        )
      )
    );

    return { games, clues, sessions };
  }

  static async createPerformanceTestScenario(): Promise<{
    game: Game;
    clues: Clue[];
    sessions: PlayerSession[];
  }> {
    const { games, clues, sessions } = await this.generateLoadTestData(1, 5, 20);
    return {
      game: games[0],
      clues,
      sessions
    };
  }
}

export async function setupTestGame(phoneNumber: string): Promise<{
  gameId: string;
  currentClueId: string;
}> {
  // Clean up any existing data
  await Promise.all([
    Clue.destroy({ where: {} }),
    PlayerSession.destroy({ where: {} }),
    Game.destroy({ where: {} })
  ]);

  // Create a test game
  const game = await Game.create({
    id: uuidv4(),
    name: 'Test Game',
    description: 'A test game',
    active: true,
    startTime: new Date(),
    currentPlayers: 0,
    settings: {
      maxAttempts: 3,
      hintThreshold: 2,
      timeLimit: 60
    }
  });

  // Create test clues
  const clue = await Clue.create({
    id: uuidv4(),
    type: 'text',
    question: 'What is the capital of France?',
    answer: 'Paris',
    hint: 'City of Light'
  });

  // Create a player session
  await PlayerSession.create({
    phoneNumber,
    gameId: game.id,
    currentClueId: clue.id,
    attempts: 0,
    hintsUsed: 0,
    completed: false,
    startTime: new Date()
  });

  return {
    gameId: game.id,
    currentClueId: clue.id
  };
}

export async function completeGame(phoneNumber: string): Promise<void> {
  const session = await PlayerSession.findOne({
    where: { phoneNumber }
  });

  if (!session) {
    throw new Error('Session not found');
  }

  // Mark the session as completed
  await session.update({
    completed: true,
    completedAt: new Date()
  });
}

export async function cleanupTestData(): Promise<void> {
  await Promise.all([
    Clue.destroy({ where: {} }),
    PlayerSession.destroy({ where: {} }),
    Game.destroy({ where: {} })
  ]);
} 