import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from '../src/config';
import webhookRoutes from '../src/routes/webhook';
import adminRoutes from '../src/routes/admin';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.server.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-api-key']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/webhook', webhookRoutes);
app.use('/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

describe('Server', () => {
  it('should handle health check requests', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
  });

  it('should handle CORS preflight requests', async () => {
    const response = await request(app)
      .options('/health')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'GET');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe(config.server.corsOrigin);
    expect(response.headers['access-control-allow-methods']).toContain('GET');
  });

  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/unknown-route');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Not Found' });
  });

  it('should allow API key in headers', async () => {
    const response = await request(app)
      .get('/health')
      .set('x-api-key', 'test-key');
    expect(response.status).toBe(200);
  });
}); 