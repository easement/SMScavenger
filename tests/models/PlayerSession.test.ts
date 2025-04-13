import { PlayerSession, IPlayerSession } from '../../src/models/PlayerSession';
import { v4 as uuidv4 } from 'uuid';

describe('PlayerSession Model', () => {
  beforeEach(async () => {
    await PlayerSession.destroy({ where: {} });
  });

  it('should create a player session successfully', async () => {
    const sessionData: IPlayerSession = {
      phoneNumber: '+1234567890',
      gameId: uuidv4(),
      currentClueId: uuidv4(),
      attempts: 0,
      hintsUsed: 0,
      completed: false,
      startTime: new Date()
    };

    const session = await PlayerSession.create(sessionData);

    expect(session.phoneNumber).toBe(sessionData.phoneNumber);
    expect(session.gameId).toBe(sessionData.gameId);
    expect(session.currentClueId).toBe(sessionData.currentClueId);
    expect(session.attempts).toBe(0);
    expect(session.hintsUsed).toBe(0);
    expect(session.completed).toBe(false);
    expect(session.startTime).toBeDefined();
  });

  it('should increment attempts correctly', async () => {
    const sessionData: IPlayerSession = {
      phoneNumber: '+1234567890',
      gameId: uuidv4(),
      currentClueId: uuidv4(),
      attempts: 0,
      hintsUsed: 0,
      completed: false,
      startTime: new Date()
    };

    const session = await PlayerSession.create(sessionData);
    await session.incrementAttempts();

    const updatedSession = await PlayerSession.findOne({
      where: { phoneNumber: session.phoneNumber }
    });
    expect(updatedSession?.attempts).toBe(1);
  });

  it('should reset for next clue correctly', async () => {
    const sessionData: IPlayerSession = {
      phoneNumber: '+1234567890',
      gameId: uuidv4(),
      currentClueId: uuidv4(),
      attempts: 2,
      hintsUsed: 1,
      completed: false,
      startTime: new Date()
    };

    const session = await PlayerSession.create(sessionData);
    const newClueId = uuidv4();
    await session.resetForNextClue(newClueId);

    const updatedSession = await PlayerSession.findOne({
      where: { phoneNumber: session.phoneNumber }
    });
    expect(updatedSession?.currentClueId).toBe(newClueId);
    expect(updatedSession?.attempts).toBe(0);
    expect(updatedSession?.hintsUsed).toBe(0);
  });

  it('should require a phone number', async () => {
    const sessionData = {
      gameId: uuidv4(),
      currentClueId: uuidv4(),
      attempts: 0,
      hintsUsed: 0,
      completed: false,
      startTime: new Date()
    };

    await expect(PlayerSession.create(sessionData as IPlayerSession)).rejects.toThrow();
  });

  it('should enforce unique phone numbers per game', async () => {
    const phoneNumber = '+1234567890';
    const gameId = uuidv4();

    const sessionData: IPlayerSession = {
      phoneNumber,
      gameId,
      currentClueId: uuidv4(),
      attempts: 0,
      hintsUsed: 0,
      completed: false,
      startTime: new Date()
    };

    await PlayerSession.create(sessionData);

    await expect(PlayerSession.create(sessionData)).rejects.toThrow();
  });
}); 