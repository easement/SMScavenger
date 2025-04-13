import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // Maximum requests per window

export const rateLimit = (req: Request, res: Response, next: NextFunction) => {
  const now = Date.now();
  const key = req.ip || 'unknown';

  // Clean up expired entries
  Object.keys(store).forEach(k => {
    const entry = store[k];
    if (entry && entry.resetTime <= now) {
      delete store[k];
    }
  });

  // Initialize or get existing rate limit data
  if (!store[key]) {
    store[key] = {
      count: 0,
      resetTime: now + WINDOW_MS
    };
  }

  const entry = store[key];
  if (!entry) {
    return next();
  }

  // Check if rate limit is exceeded
  if (entry.count >= MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil((entry.resetTime - now) / 1000)
    });
  }

  // Increment request count
  entry.count++;

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', MAX_REQUESTS - entry.count);
  res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

  next();
}; 