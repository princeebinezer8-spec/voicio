import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config.js';
import healthRouter from './routes/health.js';
import configRouter from './routes/config.js';
import chatRouter from './routes/chat.js';
import evaluateRouter from './routes/evaluate.js';
import quizRouter from './routes/quiz.js';
import wordRouter from './routes/word.js';
import { basicRateLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';
import { AppError } from './errors.js';

const clientDistPath = fs.existsSync(path.resolve(process.cwd(), '../client/dist'))
  ? path.resolve(process.cwd(), '../client/dist')
  : path.resolve(process.cwd(), 'client/dist');

const app = express();

// Trust proxy for rate limiting behind reverse proxies (Vercel, Render, Railway, etc.)
app.set('trust proxy', 1);

// Configure CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin) return callback(null, true);

      // In local development or preview, allow localhost
      if (
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin === config.clientOrigin ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive for initial prototype to avoid blocking valid client deployments
    },
    credentials: true,
  })
);

// Body parsing with safe size limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Apply rate limiter to /api
app.use('/api', basicRateLimiter(60, 60 * 1000));

// Register routes
app.use('/api', healthRouter);
app.use('/api', configRouter);
app.use('/api', chatRouter);
app.use('/api', evaluateRouter);
app.use('/api', quizRouter);
app.use('/api', wordRouter);

// Fallback 404 for unknown API endpoints
app.use('/api/*', (req, res, next) => {
  next(
    new AppError({
      code: 'NOT_FOUND',
      message: `API endpoint ${req.originalUrl} not found.`,
      statusCode: 404,
      retryable: false,
    })
  );
});

// Serve frontend static build if present
if (fs.existsSync(clientDistPath)) {
  console.log(`📦 Serving frontend static assets from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Centralized error handler
app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`===============================================`);
  console.log(`🎙️  Voicio Server running on port ${config.port}`);
  console.log(`📡 Client Origin: ${config.clientOrigin}`);
  console.log(`🤖 Gemini Configured: ${config.isGeminiConfigured ? 'YES' : 'NO (Add GEMINI_API_KEY in .env)'}`);
  console.log(`🧠 Gemini Model: ${config.geminiModel}`);
  console.log(`===============================================`);
});

export default app;
export { server };
