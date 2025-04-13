import request from 'supertest';
import { app } from '../../src/server';
import { Clue } from '../../src/models/Clue';
import { PlayerSession } from '../../src/models/PlayerSession';
import { config } from '../../src/config';
import { ClueType } from '../../src/types/models';
import { TestDatabase } from '../utils/testUtils';
import adminRoutes from '../../src/routes/admin';
import mongoose from 'mongoose';
import { IPlayerSession } from '../../src/types/models';

// Test data
const validClue = {
  id: 'test-clue-1',
  type: 'text',
  question: 'What is the capital of France?',
  answer: 'Paris',
  hint: 'It is known as the City of Light',
  order: 1
};

const validSession = {
  phoneNumber: '+1234567890',
  gameId: 'test-game-1',
  currentClueId: 'test-clue-1',
  attempts: 0,
  hintsUsed: 0,
  completed: false,
  startTime: new Date()
};

describe('Admin Routes', () => {
  beforeEach(async () => {
    await Clue.destroy({ where: {} });
    await PlayerSession.destroy({ where: {} });
  });

  describe('Clue Management', () => {
    describe('POST /admin/clues', () => {
      it('should create a new clue with valid data', async () => {
        const response = await request(app)
          .post('/admin/clues')
          .set('X-API-Key', config.admin.apiKey)
          .send(validClue);

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject(validClue);
      });

      it('should require API key', async () => {
        const response = await request(app)
          .post('/admin/clues')
          .send(validClue);

        expect(response.status).toBe(401);
      });

      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/admin/clues')
          .set('X-API-Key', config.admin.apiKey)
          .send({});

        expect(response.status).toBe(400);
      });

      it('should prevent duplicate clue IDs', async () => {
        await Clue.create(validClue);

        const response = await request(app)
          .post('/admin/clues')
          .set('X-API-Key', config.admin.apiKey)
          .send(validClue);

        expect(response.status).toBe(409);
      });
    });

    describe('GET /admin/clues', () => {
      beforeEach(async () => {
        await Clue.create(validClue);
      });

      it('should return all clues', async () => {
        const response = await request(app)
          .get('/admin/clues')
          .set('X-API-Key', config.admin.apiKey);

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0]).toMatchObject(validClue);
      });

      it('should require API key', async () => {
        const response = await request(app)
          .get('/admin/clues');

        expect(response.status).toBe(401);
      });
    });

    describe('GET /admin/clues/:id', () => {
      beforeEach(async () => {
        await Clue.create(validClue);
      });

      it('should return a specific clue', async () => {
        const response = await request(app)
          .get(`/admin/clues/${validClue.id}`)
          .set('X-API-Key', config.admin.apiKey);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject(validClue);
      });

      it('should return 404 for non-existent clue', async () => {
        const response = await request(app)
          .get('/admin/clues/non-existent')
          .set('X-API-Key', config.admin.apiKey);

        expect(response.status).toBe(404);
      });

      it('should require API key', async () => {
        const response = await request(app)
          .get(`/admin/clues/${validClue.id}`);

        expect(response.status).toBe(401);
      });
    });

    describe('PUT /admin/clues/:id', () => {
      beforeEach(async () => {
        await Clue.create(validClue);
      });

      it('should update an existing clue', async () => {
        const updatedClue = {
          ...validClue,
          question: 'Updated question'
        };

        const response = await request(app)
          .put(`/admin/clues/${validClue.id}`)
          .set('X-API-Key', config.admin.apiKey)
          .send(updatedClue);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject(updatedClue);
      });

      it('should return 404 for non-existent clue', async () => {
        const response = await request(app)
          .put('/admin/clues/non-existent')
          .set('X-API-Key', config.admin.apiKey)
          .send(validClue);

        expect(response.status).toBe(404);
      });

      it('should require API key', async () => {
        const response = await request(app)
          .put(`/admin/clues/${validClue.id}`)
          .send(validClue);

        expect(response.status).toBe(401);
      });
    });

    describe('DELETE /admin/clues/:id', () => {
      beforeEach(async () => {
        await Clue.create(validClue);
      });

      it('should delete an existing clue', async () => {
        const response = await request(app)
          .delete(`/admin/clues/${validClue.id}`)
          .set('X-API-Key', config.admin.apiKey);

        expect(response.status).toBe(204);

        const deletedClue = await Clue.findByPk(validClue.id);
        expect(deletedClue).toBeNull();
      });

      it('should return 404 for non-existent clue', async () => {
        const response = await request(app)
          .delete('/admin/clues/non-existent')
          .set('X-API-Key', config.admin.apiKey);

        expect(response.status).toBe(404);
      });

      it('should require API key', async () => {
        const response = await request(app)
          .delete(`/admin/clues/${validClue.id}`);

        expect(response.status).toBe(401);
      });
    });
  });

  describe('Session Management', () => {
    describe('GET /admin/sessions', () => {
      beforeEach(async () => {
        await PlayerSession.destroy({ where: {} });
        await PlayerSession.create({
          phoneNumber: '+1234567890',
          gameId: 'test-game-1',
          currentClueId: 'test-clue-1',
          attempts: 0,
          hintsUsed: 0,
          completed: false,
          startTime: new Date()
        } as IPlayerSession);
        await PlayerSession.create({
          phoneNumber: '+1987654321',
          gameId: 'test-game-1',
          currentClueId: 'test-clue-2',
          attempts: 1,
          hintsUsed: 1,
          completed: false,
          startTime: new Date()
        } as IPlayerSession);
      });

      it('should return all sessions', async () => {
        const response = await request(app)
          .get('/admin/sessions')
          .set('X-API-Key', config.admin.apiKey);

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);
        expect(response.body[0]).toMatchObject({
          phoneNumber: '+1234567890',
          gameId: 'test-game-1',
          currentClueId: 'test-clue-1',
          attempts: 0,
          hintsUsed: 0,
          completed: false,
          startTime: expect.any(String)
        });
        expect(response.body[1]).toMatchObject({
          phoneNumber: '+1987654321',
          gameId: 'test-game-1',
          currentClueId: 'test-clue-2',
          attempts: 1,
          hintsUsed: 1,
          completed: false,
          startTime: expect.any(String)
        });
      });

      it('should require API key', async () => {
        const response = await request(app)
          .get('/admin/sessions');

        expect(response.status).toBe(401);
      });
    });

    describe('GET /admin/sessions/:phoneNumber', () => {
      beforeEach(async () => {
        await PlayerSession.create(validSession);
      });

      it('should return a specific session', async () => {
        const response = await request(app)
          .get(`/admin/sessions/${validSession.phoneNumber}`)
          .set('X-API-Key', config.admin.apiKey);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject(validSession);
      });

      it('should return 404 for non-existent session', async () => {
        const response = await request(app)
          .get('/admin/sessions/+9999999999')
          .set('X-API-Key', config.admin.apiKey);

        expect(response.status).toBe(404);
      });

      it('should require API key', async () => {
        const response = await request(app)
          .get(`/admin/sessions/${validSession.phoneNumber}`);

        expect(response.status).toBe(401);
      });
    });

    describe('DELETE /admin/sessions/:phoneNumber', () => {
      beforeEach(async () => {
        await PlayerSession.create(validSession);
      });

      it('should delete an existing session', async () => {
        const response = await request(app)
          .delete(`/admin/sessions/${validSession.phoneNumber}`)
          .set('X-API-Key', config.admin.apiKey);

        expect(response.status).toBe(204);

        const deletedSession = await PlayerSession.findOne({
          where: { phoneNumber: validSession.phoneNumber }
        });
        expect(deletedSession).toBeNull();
      });

      it('should return 404 for non-existent session', async () => {
        const response = await request(app)
          .delete('/admin/sessions/+9999999999')
          .set('X-API-Key', config.admin.apiKey);

        expect(response.status).toBe(404);
      });

      it('should require API key', async () => {
        const response = await request(app)
          .delete(`/admin/sessions/${validSession.phoneNumber}`);

        expect(response.status).toBe(401);
      });
    });
  });

  describe('Game Statistics', () => {
    it('should return correct game statistics', async () => {
      // Create test data
      await request(app)
        .post('/admin/clues')
        .set('x-api-key', config.admin.apiKey)
        .send(validClue);

      await request(app)
        .post('/admin/clues')
        .set('x-api-key', config.admin.apiKey)
        .send({ ...validClue, id: 2 });

      // Create completed session
      await PlayerSession.create({
        phoneNumber: '+1234567890',
        gameId: 'test-game-1',
        currentClueId: 'test-clue-2',
        attempts: 0,
        hintsUsed: 0,
        completed: true,
        startTime: new Date(),
        completedAt: new Date()
      } as IPlayerSession);

      // Create in-progress session
      await PlayerSession.create({
        phoneNumber: '+1111111111',
        gameId: 'test-game-1',
        currentClueId: 'test-clue-1',
        attempts: 1,
        hintsUsed: 0,
        completed: false,
        startTime: new Date()
      } as IPlayerSession);

      // Create not started session
      await PlayerSession.create({
        phoneNumber: '+2222222222',
        gameId: 'test-game-1',
        currentClueId: 'test-clue-1',
        attempts: 0,
        hintsUsed: 0,
        completed: false,
        startTime: new Date()
      } as IPlayerSession);

      const response = await request(app)
        .get('/admin/stats')
        .set('x-api-key', config.admin.apiKey);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        totalClues: 2,
        totalSessions: 3,
        completedSessions: 2, // currentClueIndex > 0
        completionRate: (2 / 3) * 100
      });
    });
  });
}); 