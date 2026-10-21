import { Router, Request, Response, NextFunction } from 'express';
import {
  VOCABULARY_LIST,
  getWordsByLevel,
  getWordById,
  getWordByName,
  getRandomWordForLevel,
  DifficultyLevel,
  VocabularyWord
} from '../data/vocabulary.js';
import { config } from '../config.js';
import { getAiClient } from '../gemini.js';

const router = Router();

// GET /api/words - List all or filtered by level
router.get('/words', (req: Request, res: Response) => {
  const { level } = req.query;
  if (level && typeof level === 'string') {
    const typedLevel = level as DifficultyLevel;
    res.json({
      success: true,
      words: getWordsByLevel(typedLevel),
    });
    return;
  }
  res.json({
    success: true,
    words: VOCABULARY_LIST,
  });
});

// POST /api/word - Get word details or request AI explanation
router.post('/word', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { wordId, wordName, level = 'Intermediate', action = 'details' } = req.body;

    const typedLevel = (['Beginner', 'Intermediate', 'Advanced'].includes(level)
      ? level
      : 'Intermediate') as DifficultyLevel;

    let word: VocabularyWord | undefined;
    if (wordId) {
      word = getWordById(wordId);
    } else if (wordName) {
      word = getWordByName(wordName);
    } else {
      word = getRandomWordForLevel(typedLevel);
    }

    if (!word) {
      word = getRandomWordForLevel(typedLevel);
    }

    // If client requested an AI enriched breakdown
    if (action === 'ai-explain' && config.isGeminiConfigured) {
      try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
          model: config.geminiModel,
          contents: `Provide an engaging, clear voice-friendly explanation for the English vocabulary word "${word.word}".
Level: ${word.level}
Explain:
1. Everyday intuitive meaning (no jargon)
2. How to pronounce it accurately
3. 2 realistic modern sentences
4. 1 common mistake to avoid when using it.
Keep total response under 120 words so it sounds natural when spoken aloud.`,
          config: {
            temperature: 0.6,
            maxOutputTokens: 250,
          },
        });

        res.json({
          success: true,
          word,
          aiExplanation: response.text?.trim(),
        });
        return;
      } catch (geminiErr) {
        console.warn('AI word explain fallback:', geminiErr);
      }
    }

    res.json({
      success: true,
      word,
    });
  } catch (err: any) {
    next(err);
  }
});

export default router;
