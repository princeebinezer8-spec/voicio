import { Router, Request, Response, NextFunction } from 'express';
import { generateTutorReply, ChatMessage, TutorContext } from '../gemini.js';
import { config } from '../config.js';
import {
  DifficultyLevel,
  getWordByName,
  getRandomWordForLevel,
  VocabularyWord
} from '../data/vocabulary.js';

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
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Message cannot be empty.',
      });
      return;
    }

    const typedLevel = (['Beginner', 'Intermediate', 'Advanced'].includes(level)
      ? level
      : 'Intermediate') as DifficultyLevel;

    // Resolve or find word if user specifically asked about a word
    let activeWord: VocabularyWord | undefined = currentWord;
    if (!activeWord) {
      // Try finding if the user mentioned a known word
      const words = message.match(/\b[A-Za-z]+\b/g) || [];
      for (const w of words) {
        const found = getWordByName(w);
        if (found) {
          activeWord = found;
          break;
        }
      }
      if (!activeWord) {
        activeWord = getRandomWordForLevel(typedLevel);
      }
    }

    // If Gemini is not configured, give a polite, instructive fallback instead of failing silently
    if (!config.isGeminiConfigured) {
      const fallbackReply = `Hello! I am Voicio, your vocabulary coach. To activate live AI conversational responses with Gemini, please set your GEMINI_API_KEY in the server .env file. Today's practice word is "${activeWord.word}" (${activeWord.partOfSpeech}) — "${activeWord.definition}". Would you like to try using "${activeWord.word}" in a sentence?`;
      
      res.json({
        success: true,
        reply: fallbackReply,
        model: 'offline-preview',
        activeWord,
        suggestedPrompts: [
          `How do I pronounce ${activeWord.word}?`,
          `Give me another example of ${activeWord.word}.`,
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
    };

    const { reply, model } = await generateTutorReply(message.trim(), context);

    // Compute dynamic suggested prompts based on the conversation
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
