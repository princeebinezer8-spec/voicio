import { Router, Request, Response, NextFunction } from 'express';
import { evaluateStudentAnswer } from '../gemini.js';
import { config } from '../config.js';
import { AppError } from '../errors.js';
import { DifficultyLevel } from '../data/vocabulary.js';

const router = Router();

router.post('/evaluate', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      word,
      userAnswer,
      level = 'Intermediate',
      taskDescription = 'Use the word naturally in a sentence',
    } = req.body;

    if (!word || typeof word !== 'string' || !word.trim()) {
      throw new AppError({
        code: 'VALIDATION_ERROR',
        message: 'Word parameter is required.',
        statusCode: 400,
        retryable: false,
      });
    }

    const answer = typeof userAnswer === 'string' ? userAnswer : '';
    const typedLevel = (['Beginner', 'Intermediate', 'Advanced'].includes(level)
      ? level
      : 'Intermediate') as DifficultyLevel;

    // Handle offline / unconfigured state gracefully
    if (!config.isGeminiConfigured) {
      const containsWord = answer.toLowerCase().includes(word.toLowerCase());
      res.json({
        success: true,
        evaluation: {
          verdict: containsWord ? 'correct' : 'partially_correct',
          score: containsWord ? 85 : 50,
          feedback: containsWord
            ? `Great job using "${word}" in your sentence! (Offline evaluation mode)`
            : `Try to include the word "${word}" in your sentence to practice it.`,
          wordUsedCorrectly: containsWord,
          grammarFeedback: null,
          betterExpression: null,
        },
      });
      return;
    }

    const evaluation = await evaluateStudentAnswer(
      word,
      answer,
      typedLevel,
      taskDescription
    );

    res.json({
      success: true,
      evaluation,
    });
  } catch (err: any) {
    next(err);
  }
});

export default router;
