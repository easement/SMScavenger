import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { config } from './config/env';
import { initializeDatabase } from './config/database';
import webhookRoutes from './routes/webhook';
import adminRoutes from './routes/admin';
import healthRoutes from './routes/health';

export const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-api-key']
}));

// Request logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/webhook', webhookRoutes);
app.use('/admin', adminRoutes);
app.use('/health', healthRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: config.server.nodeEnv === 'development' ? err.message : undefined
  });
});

// Initialize database and start server
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      app.listen(config.server.port, () => {
        console.log(`Server is running on port ${config.server.port}`);
      });
    })
    .catch((error) => {
      console.error('Failed to start server:', error);
      process.exit(1);
    });
} 