import request from 'supertest';
import express from 'express';
import healthRoutes from '../../src/routes/health';
import mongoose from 'mongoose';
import { TestDatabase } from '../utils/testUtils';

describe('Health Check Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use('/health', healthRoutes);
  });

  beforeEach(async () => {
    await TestDatabase.cleanup();
  });

  describe('GET /health', () => {
    it('should return healthy status when all systems are up', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
    });

    it('should return unhealthy status when database is disconnected', async () => {
      // Store the current connection URI
      const uri = (mongoose.connection as any).client.s.url;
      
      // Disconnect from database
      await mongoose.disconnect();
      
      const response = await request(app).get('/health');
      expect(response.status).toBe(503);
      expect(response.body.status).toBe('unhealthy');
      
      // Reconnect to database
      await mongoose.connect(uri);
    }, 35000); // Increase timeout for this test
  });
}); 