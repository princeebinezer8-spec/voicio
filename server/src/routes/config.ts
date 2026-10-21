import { Router, Request, Response } from 'express';
import { config } from '../config.js';

const router = Router();

router.get('/config', (req: Request, res: Response) => {
  res.json({
    appName: 'Voicio',
    tagline: 'Learn words. Speak confidently.',
    model: config.geminiModel,
    isGeminiConfigured: config.isGeminiConfigured,
    levels: ['Beginner', 'Intermediate', 'Advanced'],
    maxHistoryLength: config.maxHistoryLength,
    supportedFeatures: {
      voiceInput: true,
      speechSynthesis: true,
      sentenceEvaluation: true,
      dynamicQuizzes: true,
      localStoragePersistence: true,
    },
  });
});

export default router;
