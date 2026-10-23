import { Hono } from 'hono';
import { cors } from 'hono/cors';
import {
  VOCABULARY_LIST,
  getWordsByLevel,
  getWordById,
  getWordByName,
  getRandomWordForLevel,
  DifficultyLevel,
  VocabularyWord,
} from './data/vocabulary.js';
import {
  verifyGeminiConnection,
  generateTutorReply,
  evaluateStudentAnswer,
  generateVocabularyQuiz,
  getAiClient,
  TutorContext,
} from './gemini.js';
import { AppError, formatErrorResponse, logSafeError } from './errors.js';
import { resolveTargetWord } from './targetWordManager.js';

export interface Bindings {
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  CLIENT_ORIGIN?: string;
}

const app = new Hono<{ Bindings: Bindings }>();

// Cache health check results across warm isolate invocations
let cachedHealth: {
  connected: boolean;
  model: string;
  message: string;
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Configure CORS for Cloudflare Pages, localhost, and configured origins
app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: (origin) => {
      if (!origin) return '*';
      const clientOrigin = c.env.CLIENT_ORIGIN;
      if (
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.endsWith('.pages.dev') ||
        (clientOrigin && origin === clientOrigin)
      ) {
        return origin;
      }
      return origin;
    },
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  return corsMiddleware(c, next);
});

// Centralized error handler
app.onError((err, c) => {
  logSafeError(`Worker ${c.req.method} ${c.req.path}`, err);
  const formatted = formatErrorResponse(err);
  return c.json(formatted, formatted.statusCode as any);
});

// 1. GET /api/health
app.get('/api/health', async (c) => {
  const apiKey = c.env.GEMINI_API_KEY?.trim();
  const model = c.env.GEMINI_MODEL?.trim() || 'gemini-flash-lite-latest';
  const isConfigured = Boolean(apiKey && apiKey.length > 5 && !apiKey.includes('your_'));
  const force = c.req.query('force') === 'true';
  const now = Date.now();

  let geminiStatus = {
    configured: isConfigured,
    model,
    connected: false,
    message: isConfigured ? 'Ready' : 'GEMINI_API_KEY is not configured',
  };

  if (!isConfigured) {
    cachedHealth = null;
  } else if (!force && cachedHealth && now - cachedHealth.timestamp < CACHE_TTL_MS) {
    geminiStatus.connected = cachedHealth.connected;
    geminiStatus.model = cachedHealth.model;
    geminiStatus.message = cachedHealth.message;
  } else {
    try {
      const test = await verifyGeminiConnection(apiKey, model);
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

  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: 0,
    gemini: geminiStatus,
  });
});

// 2. GET /api/config
app.get('/api/config', (c) => {
  const apiKey = c.env.GEMINI_API_KEY?.trim();
  const model = c.env.GEMINI_MODEL?.trim() || 'gemini-flash-lite-latest';
  const isConfigured = Boolean(apiKey && apiKey.length > 5 && !apiKey.includes('your_'));

  return c.json({
    appName: 'Voicio',
    tagline: 'Learn words. Speak confidently.',
    model,
    isGeminiConfigured: isConfigured,
    levels: ['Beginner', 'Intermediate', 'Advanced'],
    maxHistoryLength: 12,
    supportedFeatures: {
      voiceInput: true,
      speechSynthesis: true,
      sentenceEvaluation: true,
      dynamicQuizzes: true,
      localStoragePersistence: true,
    },
  });
});

// 3. GET /api/words
app.get('/api/words', (c) => {
  const level = c.req.query('level');
  if (level) {
    const typedLevel = level as DifficultyLevel;
    return c.json({
      success: true,
      words: getWordsByLevel(typedLevel),
    });
  }
  return c.json({
    success: true,
    words: VOCABULARY_LIST,
  });
});

// 4. POST /api/word
app.post('/api/word', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { wordId, wordName, level = 'Intermediate', action = 'details' } = body;
  const apiKey = c.env.GEMINI_API_KEY?.trim();
  const model = c.env.GEMINI_MODEL?.trim() || 'gemini-flash-lite-latest';
  const isConfigured = Boolean(apiKey && apiKey.length > 5 && !apiKey.includes('your_'));

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

  if (action === 'ai-explain' && isConfigured && apiKey) {
    try {
      const ai = getAiClient(apiKey);
      const response = await ai.models.generateContent({
        model,
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

      return c.json({
        success: true,
        word,
        aiExplanation: response.text?.trim(),
      });
    } catch (geminiErr) {
      console.warn('AI word explain fallback:', geminiErr);
    }
  }

  return c.json({
    success: true,
    word,
  });
});

// 5. POST /api/chat
app.post('/api/chat', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { message, level = 'Intermediate', currentWord, history = [] } = body;
  const apiKey = c.env.GEMINI_API_KEY?.trim();
  const model = c.env.GEMINI_MODEL?.trim() || 'gemini-flash-lite-latest';
  const isConfigured = Boolean(apiKey && apiKey.length > 5 && !apiKey.includes('your_'));

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

    return c.json({
      success: true,
      reply: resolution.clarificationQuestion,
      model: 'voicio-clarification',
      activeWord,
      suggestedPrompts,
    });
  }

  if (!isConfigured || !apiKey) {
    const fallbackReply = `Hello! I am Voicio, your vocabulary coach. Today's practice word is "${activeWord.word}" (${activeWord.partOfSpeech}) — "${activeWord.definition}". Would you like to try using "${activeWord.word}" in a sentence?`;
    return c.json({
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
  }

  const context: TutorContext = {
    level: typedLevel,
    currentWord: activeWord,
    history: Array.isArray(history) ? history : [],
    previousWord: resolution.previousWord,
    comparisonWord: resolution.comparisonWord,
    transitionType: resolution.type,
  };

  const { reply, model: usedModel } = await generateTutorReply(
    message.trim(),
    context,
    apiKey,
    model
  );

  const suggestedPrompts = [
    `Give me another example with "${activeWord.word}".`,
    `How do I pronounce "${activeWord.word}"?`,
    `Quiz me on "${activeWord.word}".`,
    `Teach me another ${typedLevel.toLowerCase()} word.`,
  ];

  return c.json({
    success: true,
    reply,
    model: usedModel,
    activeWord,
    suggestedPrompts,
  });
});

// 6. POST /api/evaluate
app.post('/api/evaluate', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const {
    word,
    userAnswer,
    level = 'Intermediate',
    taskDescription = 'Use the word naturally in a sentence',
  } = body;
  const apiKey = c.env.GEMINI_API_KEY?.trim();
  const model = c.env.GEMINI_MODEL?.trim() || 'gemini-flash-lite-latest';
  const isConfigured = Boolean(apiKey && apiKey.length > 5 && !apiKey.includes('your_'));

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

  if (!isConfigured || !apiKey) {
    const containsWord = answer.toLowerCase().includes(word.toLowerCase());
    return c.json({
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
  }

  const evaluation = await evaluateStudentAnswer(
    word,
    answer,
    typedLevel,
    taskDescription,
    apiKey,
    model
  );

  return c.json({
    success: true,
    evaluation,
  });
});

// 7. POST /api/quiz
app.post('/api/quiz', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { wordId, wordName, level = 'Intermediate', type = 'multiple-choice' } = body;
  const apiKey = c.env.GEMINI_API_KEY?.trim();
  const model = c.env.GEMINI_MODEL?.trim() || 'gemini-flash-lite-latest';
  const isConfigured = Boolean(apiKey && apiKey.length > 5 && !apiKey.includes('your_'));

  const typedLevel = (['Beginner', 'Intermediate', 'Advanced'].includes(level)
    ? level
    : 'Intermediate') as DifficultyLevel;

  let targetWord: VocabularyWord | undefined;
  if (wordId) {
    targetWord = getWordById(wordId);
  } else if (wordName) {
    targetWord = getWordByName(wordName);
  }

  if (!targetWord) {
    targetWord = getRandomWordForLevel(typedLevel);
  }

  const quizType = ['multiple-choice', 'fill-in-the-blank', 'synonym-match'].includes(type)
    ? (type as 'multiple-choice' | 'fill-in-the-blank' | 'synonym-match')
    : 'multiple-choice';

  if (isConfigured && apiKey) {
    try {
      const quiz = await generateVocabularyQuiz(targetWord, quizType, apiKey, model);
      return c.json({
        success: true,
        quiz,
      });
    } catch (geminiErr) {
      console.warn('Dynamic quiz generation fallback:', geminiErr);
    }
  }

  // Curated high quality fallback quiz
  let question = `What does "${targetWord.word}" mean?`;
  let options: string[] = [];
  let correctAnswer = targetWord.definition;

  if (quizType === 'fill-in-the-blank') {
    const sentenceWithBlank = targetWord.exampleSentence.replace(
      new RegExp(`\\b${targetWord.word}\\b`, 'i'),
      '_______'
    );
    question = `Fill in the blank: "${sentenceWithBlank}"`;
    correctAnswer = targetWord.word;

    const otherWords = getRandomWordForLevel(typedLevel, [targetWord.id]);
    options = [targetWord.word, otherWords.word, 'hesitant', 'reluctant'].sort(
      () => Math.random() - 0.5
    );
  } else if (quizType === 'synonym-match') {
    question = `Which word is a synonym for "${targetWord.word}"?`;
    correctAnswer = targetWord.synonyms[0] || 'receptive';
    options = [
      correctAnswer,
      targetWord.antonyms[0] || 'distant',
      'superficial',
      'reckless',
    ].sort(() => Math.random() - 0.5);
  } else {
    const altWord1 = getRandomWordForLevel(typedLevel, [targetWord.id]);
    const altWord2 = getRandomWordForLevel(typedLevel, [targetWord.id, altWord1.id]);

    options = [
      targetWord.definition,
      altWord1.definition,
      altWord2.definition,
      'Having or showing a stubborn desire to resist authority',
    ].sort(() => Math.random() - 0.5);
  }

  return c.json({
    success: true,
    quiz: {
      question,
      type: quizType,
      options,
      correctAnswer,
      explanation: `"${targetWord.word}" means ${targetWord.definition}. Example: "${targetWord.exampleSentence}"`,
      targetWord: targetWord.word,
    },
  });
});

// Fallback 404 for unknown endpoints
app.all('*', (c) => {
  const notFound = new AppError({
    code: 'NOT_FOUND',
    message: `API endpoint ${c.req.url} not found.`,
    statusCode: 404,
    retryable: false,
  });
  const formatted = formatErrorResponse(notFound);
  return c.json(formatted, 404);
});

export default app;
