import { Clue, IClue } from '../../src/models/Clue';
import { PlayerSession, IPlayerSession } from '../../src/models/PlayerSession';
import { ClueType } from '../../src/types/models';
import { v4 as uuidv4 } from 'uuid';
import { Game, IGame } from '../../src/models/Game';
import { sequelize } from '../../src/config/database';

export class TestDatabase {
  static async connect(): Promise<void> {
    // No need for MongoDB connection with Sequelize
    await sequelize.authenticate();
  }

  static async disconnect(): Promise<void> {
    await sequelize.close();
  }

  static async cleanup(): Promise<void> {
    await Promise.all([
      Clue.destroy({ where: {} }),
      PlayerSession.destroy({ where: {} }),
      Game.destroy({ where: {} })
    ]);
  }
}

export class TestDataGenerator {
  static generateClue(overrides: Partial<IClue> = {}): IClue {
    const answer = `Test Answer ${Math.random()}`;
    const defaultClue: IClue = {
      id: uuidv4(),
      type: 'text',
      question: `Test Question ${Math.random()}`,
      answer,
      hint: `Test Hint ${Math.random()}`,
      answerLowerCase: answer.toLowerCase()
    };

    return { ...defaultClue, ...overrides };
  }

  static generatePhoneNumber(): string {
    const areaCode = Math.floor(Math.random() * 900) + 100;
    const prefix = Math.floor(Math.random() * 900) + 100;
    const lineNumber = Math.floor(Math.random() * 9000) + 1000;
    return `+1${areaCode}${prefix}${lineNumber}`;
  }

  static async createTestClues(count: number): Promise<Clue[]> {
    const clues = Array.from({ length: count }, () => {
      const clue = this.generateClue();
      return {
        id: clue.id,
        type: clue.type,
        question: clue.question,
        answer: clue.answer,
        hint: clue.hint,
        answerLowerCase: clue.answerLowerCase
      };
    });
    
    const createdClues = await Promise.all(
      clues.map(clue => Clue.create(clue))
    );
    
    return createdClues;
  }

  static async createTestSession(overrides: Partial<IPlayerSession> = {}): Promise<PlayerSession> {
    const defaultSession = {
      phoneNumber: this.generatePhoneNumber(),
      gameId: 'default',
      currentClueId: uuidv4(),
      attempts: 0,
      hintsUsed: 0,
      completed: false,
      startTime: new Date()
    };

    return await PlayerSession.create({ ...defaultSession, ...overrides });
  }

  static async createTestSessions(count: number): Promise<PlayerSession[]> {
    const sessions = await Promise.all(
      Array.from({ length: count }, () => 
        this.createTestSession({
          attempts: Math.floor(Math.random() * 3),
          hintsUsed: Math.floor(Math.random() * 2),
          completed: Math.random() > 0.7,
          startTime: new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000)
        })
      )
    );
    
    return sessions;
  }
}

export class TestHelpers {
  static async setupGameState(numClues: number = 5, numSessions: number = 3): Promise<{
    clues: Clue[];
    sessions: PlayerSession[];
  }> {
    const clues = await TestDataGenerator.createTestClues(numClues);
    const sessions = await TestDataGenerator.createTestSessions(numSessions);
    return { clues, sessions };
  }

  static createMockTwilioMessage(overrides: Partial<any> = {}): any {
    return {
      From: TestDataGenerator.generatePhoneNumber(),
      Body: 'Test message',
      MessageSid: `TEST_${Math.random().toString(36).substring(7)}`,
      AccountSid: 'TEST_ACCOUNT_SID',
      ...overrides
    };
  }

  static async waitForAsync(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static mockRequest(overrides: Partial<any> = {}): any {
    return {
      body: {},
      query: {},
      params: {},
      headers: {},
      ...overrides
    };
  }

  static mockResponse(): any {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  }
}

export const testClues = [
  {
    id: uuidv4(),
    type: 'text',
    question: 'What is the capital of France?',
    answer: 'Paris',
    hint: 'City of Light',
    answerLowerCase: 'paris'
  },
  {
    id: uuidv4(),
    type: 'text',
    question: 'What is the largest planet in our solar system?',
    answer: 'Jupiter',
    hint: 'Gas giant',
    answerLowerCase: 'jupiter'
  },
  {
    id: uuidv4(),
    type: 'text',
    question: 'Who painted the Mona Lisa?',
    answer: 'Leonardo da Vinci',
    hint: 'Italian Renaissance polymath',
    answerLowerCase: 'leonardo da vinci'
  }
] as const;

export const testGame = {
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
} as const;

export async function createTestClues(): Promise<Clue[]> {
  await Clue.destroy({ where: {} });
  const createdClues = await Promise.all(
    testClues.map(clue => Clue.create({
      id: clue.id,
      type: clue.type,
      question: clue.question,
      answer: clue.answer,
      hint: clue.hint
    }))
  );
  return createdClues;
}

export async function createTestGame(): Promise<Game> {
  return await Game.create(testGame);
}

export async function createTestSession(
  phoneNumber: string,
  gameId: string,
  currentClueId: string
): Promise<PlayerSession> {
  return await PlayerSession.create({
    phoneNumber,
    gameId,
    currentClueId,
    attempts: 0,
    hintsUsed: 0,
    completed: false,
    startTime: new Date()
  });
}

export async function cleanupDatabase(): Promise<void> {
  await Promise.all([
    Clue.destroy({ where: {} }),
    PlayerSession.destroy({ where: {} }),
    Game.destroy({ where: {} })
  ]);
}

export function generatePhoneNumber(): string {
  return `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`;
} 