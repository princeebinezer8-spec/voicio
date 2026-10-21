import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [ip: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Basic in-memory rate limiter to protect free-tier Gemini API usage.
 * Defaults to 60 requests per minute per IP.
 */
export function basicRateLimiter(maxRequests: number = 60, windowMs: number = 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-client';
    const now = Date.now();

    if (!store[ip] || now > store[ip].resetTime) {
      store[ip] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return next();
    }

    store[ip].count += 1;

    if (store[ip].count > maxRequests) {
      const waitSeconds = Math.ceil((store[ip].resetTime - now) / 1000);
      res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Please wait ${waitSeconds} seconds before trying again to protect your API quota.`,
      });
      return;
    }

    next();
  };
}
