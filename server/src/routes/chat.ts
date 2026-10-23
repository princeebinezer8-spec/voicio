import { Router, Request, Response, NextFunction } from 'express';
import { generateTutorReply, ChatMessage, TutorContext } from '../gemini.js';
import { config } from '../config.js';
import { AppError } from '../errors.js';
import { DifficultyLevel, VocabularyWord } from '../data/vocabulary.js';
import { resolveTargetWord } from '../targetWordManager.js';

const router = Router();

router.post('/chat', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      message,
      level = 'Intermediate',
      currentWord,
      history = [],
      intent,
    } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      throw new AppError({
        code: 'VALIDATION_ERROR',
        message: 'Message cannot be empty.',
        statusCode: 400,
        retryable: false,
      });
    }

    const typedLevel = (['Beginner', 'Intermediate', 'Advanced'].includes(level)
      ? level
      : 'Intermediate') as DifficultyLevel;

    // Dynamically resolve target word from the student's latest utterance
    const resolution = resolveTargetWord(message.trim(), currentWord, typedLevel);
    const activeWord = resolution.activeWord;

    // Handle clarification turn if user wants to switch but didn't specify which word
    if (resolution.type === 'CLARIFICATION' && resolution.clarificationQuestion) {
      const suggestedPrompts = [
        `Teach me another ${typedLevel.toLowerCase()} word.`,
        `Give me another example with "${activeWord.word}".`,
        `How do I pronounce "${activeWord.word}"?`,
        `Quiz me on "${activeWord.word}".`,
      ];

      res.json({
        success: true,
        reply: resolution.clarificationQuestion,
        model: 'voicio-clarification',
        activeWord,
        suggestedPrompts,
      });
      return;
    }

    // If Gemini is not configured, give a polite, instructive fallback
    if (!config.isGeminiConfigured) {
      const fallbackReply = `Hello! I am Voicio, your vocabulary coach. To activate live AI conversational responses with Gemini, please set your GEMINI_API_KEY in the server configuration. Today's practice word is "${activeWord.word}" (${activeWord.partOfSpeech}) — "${activeWord.definition}". Would you like to try using "${activeWord.word}" in a sentence?`;

      res.json({
        success: true,
        reply: fallbackReply,
        model: 'offline-preview',
        activeWord,
        suggestedPrompts: [
          `How do I pronounce ${activeWord.word}?`,
          `Give me an example of ${activeWord.word}.`,
          `Can I use ${activeWord.word} in a sentence?`,
          `Quiz me on ${activeWord.word}.`,
        ],
      });
      return;
    }

    const context: TutorContext = {
      level: typedLevel,
      currentWord: activeWord,
      history: Array.isArray(history) ? history : [],
      previousWord: resolution.previousWord,
      comparisonWord: resolution.comparisonWord,
      transitionType: resolution.type,
    };

    const { reply, model } = await generateTutorReply(message.trim(), context);

    // Compute dynamic suggested prompts based on the NEW active target word
    const suggestedPrompts = [
      `Give me another example with "${activeWord.word}".`,
      `How do I pronounce "${activeWord.word}"?`,
      `Quiz me on "${activeWord.word}".`,
      `Teach me another ${typedLevel.toLowerCase()} word.`,
    ];

    res.json({
      success: true,
      reply,
      model,
      activeWord,
      suggestedPrompts,
    });
  } catch (err: any) {
    next(err);
  }
});

export default router;
