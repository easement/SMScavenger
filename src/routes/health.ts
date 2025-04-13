import { Router } from 'express';
import mongoose from 'mongoose';
import { Request, Response } from 'express';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    
    // Get uptime
    const uptime = process.uptime();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        name: mongoose.connection.name
      },
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB'
      },
      uptime: Math.round(uptime) + 's'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

export default router; 