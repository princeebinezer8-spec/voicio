import { Router, Request, Response } from 'express';
import { config } from '../config.js';
import { verifyGeminiConnection } from '../gemini.js';

const router = Router();

// In-memory cache for health status to prevent blocking API requests
let cachedHealth: {
  connected: boolean;
  model: string;
  message: string;
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

router.get('/health', async (req: Request, res: Response) => {
  const force = req.query.force === 'true';
  const now = Date.now();

  let geminiStatus = {
    configured: config.isGeminiConfigured,
    model: config.geminiModel,
    connected: false,
    message: config.isGeminiConfigured ? 'Ready' : 'GEMINI_API_KEY is not configured',
  };

  if (!config.isGeminiConfigured) {
    cachedHealth = null;
  } else if (!force && cachedHealth && now - cachedHealth.timestamp < CACHE_TTL_MS) {
    // Return cached status instantly (0ms latency)
    geminiStatus.connected = cachedHealth.connected;
    geminiStatus.model = cachedHealth.model;
    geminiStatus.message = cachedHealth.message;
  } else {
    try {
      const test = await verifyGeminiConnection();
      geminiStatus.connected = test.ok;
      geminiStatus.model = test.model;
      geminiStatus.message = test.message;

      cachedHealth = {
        connected: test.ok,
        model: test.model,
        message: test.message,
        timestamp: now,
      };
    } catch (err: any) {
      geminiStatus.connected = false;
      geminiStatus.message = err?.message || 'Connection test failed';
    }
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    gemini: geminiStatus,
  });
});

export default router;
