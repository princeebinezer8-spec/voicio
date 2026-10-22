import { GoogleGenAI } from '@google/genai';
import { config } from './config.js';
import { VocabularyWord, DifficultyLevel } from './data/vocabulary.js';

let aiClient: GoogleGenAI | null = null;
let cachedKey: string | null = null;

export function getAiClient(apiKeyOverride?: string): GoogleGenAI {
  const currentKey = apiKeyOverride || config.geminiApiKey;
  if (!currentKey || currentKey.length < 5 || currentKey.includes('your_')) {
    throw new Error('Gemini API key is not configured. Please add GEMINI_API_KEY in your configuration.');
  }
  if (!aiClient || cachedKey !== currentKey) {
    aiClient = new GoogleGenAI({ apiKey: currentKey });
    cachedKey = currentKey;
  }
  return aiClient;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface TutorContext {
  level: DifficultyLevel;
  currentWord?: VocabularyWord;
  history: ChatMessage[];
  userName?: string;
}

export interface SentenceEvaluation {
  verdict: 'correct' | 'partially_correct' | 'incorrect' | 'ambiguous' | 'empty';
  score: number; // 0 - 100
  feedback: string;
  wordUsedCorrectly: boolean;
  grammarFeedback?: string;
  betterExpression?: string;
}

export interface DynamicQuiz {
  question: string;
  type: 'multiple-choice' | 'fill-in-the-blank' | 'synonym-match';
  options: string[];
  correctAnswer: string;
  explanation: string;
  targetWord: string;
}

/**
 * Verify Gemini connection and model availability
 */
export async function verifyGeminiConnection(
  apiKey?: string,
  model?: string
): Promise<{ ok: boolean; model: string; message: string }> {
  const effectiveKey = apiKey || config.geminiApiKey;
  const effectiveModel = model || config.geminiModel;

  if (!effectiveKey || effectiveKey.length < 5 || effectiveKey.includes('your_')) {
    return {
      ok: false,
      model: effectiveModel,
      message: 'GEMINI_API_KEY is not set or is using a placeholder.',
    };
  }

  try {
    const ai = getAiClient(effectiveKey);
    const response = await ai.models.generateContent({
      model: effectiveModel,
      contents: 'Respond with exactly: "Voicio AI Tutor ready."',
      config: {
        maxOutputTokens: 20,
        temperature: 0.1,
      },
    });

    const reply = response.text?.trim() || '';
    return {
      ok: true,
      model: effectiveModel,
      message: reply || 'Connected successfully to Gemini model.',
    };
  } catch (err: any) {
    return {
      ok: false,
      model: effectiveModel,
      message: `Gemini API connection error: ${err?.message || 'Unknown error'}`,
    };
  }
}

/**
 * Generate AI Tutor Conversational Reply
 */
export async function generateTutorReply(
  userMessage: string,
  context: TutorContext,
  apiKey?: string,
  model?: string
): Promise<{ reply: string; model: string }> {
  const effectiveKey = apiKey || config.geminiApiKey;
  const ai = getAiClient(effectiveKey);
  const word = context.currentWord;
  const level = context.level || 'Intermediate';

  const systemInstruction = `You are Voicio, an encouraging, articulate, and intelligent voice-first English vocabulary tutor.
Your tagline: "Learn words. Speak confidently."
Target student level: ${level}.
${word ? `Current target vocabulary word being learned: "${word.word}" (${word.partOfSpeech}) - Definition: "${word.definition}". Pronunciation: "${word.pronunciationGuide}". Example: "${word.exampleSentence}".` : 'No specific target word selected yet.'}

Pedagogical and voice guidelines:
1. Speak in clear, natural, friendly conversational English.
2. Adapt vocabulary complexity to ${level} learners:
   - Beginner: Simple sentences, no jargon, warm encouragement, clear everyday examples.
   - Intermediate: Natural phrasing, explain nuance and common confusions, encourage expressive sentences.
   - Advanced: Sophisticated context, etymology nuances, rhetorical flair, precision in usage.
3. Keep responses CONCISE (2 to 4 sentences). The response will be spoken aloud to the student, so avoid long walls of text, bullet-point overload, or markdown tables.
4. When evaluating student speech/answers:
   - Never say an answer is correct if it has errors.
   - Point out grammatical slips kindly and constructively.
   - Suggest a more natural native expression if applicable.
5. End your turn with an engaging follow-up prompt or question to encourage the student to practice speaking.
6. Tone: Warm, empowering, positive, conversational.`;

  // Format past history for multi-turn context
  const contents = [];
  const maxHistory = config.maxHistoryLength || 12;
  const recentHistory = context.history.slice(-maxHistory);

  for (const msg of recentHistory) {
    contents.push({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    });
  }

  // Add the latest user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  let reply = '';
  let usedModel = model || config.geminiModel;

  try {
    const response = await ai.models.generateContent({
      model: usedModel,
      contents,
      config: {
        systemInstruction,
        temperature: 0.5,
        maxOutputTokens: 110,
      },
    });
    reply = response.text?.trim() || '';
  } catch (err: any) {
    // If primary model hits temporary 503 or 404, fallback to gemini-3.8-flash
    if (usedModel !== 'gemini-3.8-flash') {
      try {
        usedModel = 'gemini-3.8-flash';
        const fallbackRes = await ai.models.generateContent({
          model: usedModel,
          contents,
          config: {
            systemInstruction,
            temperature: 0.5,
            maxOutputTokens: 110,
          },
        });
        reply = fallbackRes.text?.trim() || '';
      } catch (fallbackErr) {
        throw err;
      }
    } else {
      throw err;
    }
  }

  if (!reply) {
    reply = "I'm here to help you practice! Could you try saying that again?";
  }
  return { reply, model: usedModel };
}

/**
 * Evaluate a student's sentence or explanation using Gemini
 */
export async function evaluateStudentAnswer(
  targetWord: string,
  userAnswer: string,
  level: DifficultyLevel,
  taskDescription: string = 'Use the word in a complete and natural sentence',
  apiKey?: string,
  model?: string
): Promise<SentenceEvaluation> {
  const trimmed = userAnswer.trim();
  if (!trimmed) {
    return {
      verdict: 'empty',
      score: 0,
      feedback: "It looks like you didn't provide an answer yet. Take your time and try speaking or typing a sentence!",
      wordUsedCorrectly: false,
    };
  }

  // Check unintelligible / single noise words
  if (trimmed.length < 3) {
    return {
      verdict: 'ambiguous',
      score: 20,
      feedback: `That was a bit too short for a full sentence. Try using "${targetWord}" in a sentence with a subject and action.`,
      wordUsedCorrectly: false,
    };
  }

  const effectiveKey = apiKey || config.geminiApiKey;
  const effectiveModel = model || config.geminiModel;
  const ai = getAiClient(effectiveKey);

  const prompt = `You are evaluating a student's English usage for the word "${targetWord}".
Student level: ${level}
Assignment: ${taskDescription}
Student's submission: "${trimmed}"

Evaluate the student's submission strictly and constructively according to these criteria:
1. Did the student actually use the target word "${targetWord}" or a valid grammatical inflection of it?
2. Is the meaning applied correctly in this context?
3. Is the sentence grammatically sound and sensible?
4. How natural does it sound to a native English speaker?

Respond ONLY with a valid JSON object matching this schema, with no markdown code fences or other text:
{
  "verdict": "correct" | "partially_correct" | "incorrect" | "ambiguous",
  "score": number between 0 and 100,
  "feedback": "Encouraging, 1-2 sentence explanation of what was good and any needed correction",
  "wordUsedCorrectly": boolean,
  "grammarFeedback": "Specific note on grammar or null if perfect",
  "betterExpression": "A polished, natural version of their sentence or null"
}`;

  try {
    const response = await ai.models.generateContent({
      model: effectiveModel,
      contents: prompt,
      config: {
        temperature: 0.2,
        maxOutputTokens: 200,
      },
    });

    const raw = response.text?.trim() || '{}';
    // Clean potential markdown blocks if returned
    const cleanJson = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      verdict: parsed.verdict || 'partially_correct',
      score: typeof parsed.score === 'number' ? Math.min(100, Math.max(0, parsed.score)) : 70,
      feedback: parsed.feedback || `Good effort with "${targetWord}"!`,
      wordUsedCorrectly: Boolean(parsed.wordUsedCorrectly),
      grammarFeedback: parsed.grammarFeedback || undefined,
      betterExpression: parsed.betterExpression || undefined,
    };
  } catch (err: any) {
    // If JSON parsing or Gemini call fails, provide graceful fallback evaluation
    const containsWord = trimmed.toLowerCase().includes(targetWord.toLowerCase());
    return {
      verdict: containsWord ? 'partially_correct' : 'incorrect',
      score: containsWord ? 70 : 40,
      feedback: containsWord
        ? `You used "${targetWord}" in your sentence! Keep practicing to build confidence.`
        : `Make sure to include the word "${targetWord}" in your sentence.`,
      wordUsedCorrectly: containsWord,
    };
  }
}

/**
 * Generate a dynamic vocabulary quiz question using Gemini
 */
export async function generateVocabularyQuiz(
  word: VocabularyWord,
  type: 'multiple-choice' | 'fill-in-the-blank' | 'synonym-match' = 'multiple-choice',
  apiKey?: string,
  model?: string
): Promise<DynamicQuiz> {
  const effectiveKey = apiKey || config.geminiApiKey;
  const effectiveModel = model || config.geminiModel;
  const ai = getAiClient(effectiveKey);

  const prompt = `Create a high-quality ${type} vocabulary quiz question for the English word "${word.word}" (${word.partOfSpeech}, level: ${word.level}).
Definition: ${word.definition}
Example: ${word.exampleSentence}

Return ONLY a valid JSON object matching this format without backticks or markdown:
{
  "question": "Clear question prompt for the student",
  "type": "${type}",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "The exact string of the correct option",
  "explanation": "1-2 sentence explanation of why this answer is correct",
  "targetWord": "${word.word}"
}`;

  try {
    const response = await ai.models.generateContent({
      model: effectiveModel,
      contents: prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 200,
      },
    });

    const raw = response.text?.trim() || '{}';
    const cleanJson = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleanJson);

    if (Array.isArray(parsed.options) && parsed.options.length >= 2 && parsed.correctAnswer) {
      return {
        question: parsed.question,
        type,
        options: parsed.options,
        correctAnswer: parsed.correctAnswer,
        explanation: parsed.explanation,
        targetWord: word.word,
      };
    }
  } catch {
    // Fall back to vocabulary item data if Gemini response parsing fails
  }

  // Pre-curated fallback question based on word data
  return {
    question: `What is the most accurate definition of "${word.word}"?`,
    type: 'multiple-choice',
    options: [
      word.definition,
      'Lasting for a very brief period of time',
      'Showing complete indifference or lack of interest',
      'Unwilling to accept change or modern ideas',
    ].sort(() => Math.random() - 0.5),
    correctAnswer: word.definition,
    explanation: `"${word.word}" means ${word.definition}. For example: "${word.exampleSentence}"`,
    targetWord: word.word,
  };
}
