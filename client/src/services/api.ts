import {
  VocabularyWord,
  DifficultyLevel,
  SentenceEvaluation,
  DynamicQuiz
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export interface HealthResponse {
  status: string;
  uptime: number;
  gemini: {
    configured: boolean;
    model: string;
    connected: boolean;
    message: string;
  };
}

export interface ConfigResponse {
  appName: string;
  tagline: string;
  model: string;
  isGeminiConfigured: boolean;
  levels: DifficultyLevel[];
  maxHistoryLength: number;
}

export interface ChatResponse {
  success: boolean;
  reply: string;
  model: string;
  activeWord: VocabularyWord;
  suggestedPrompts: string[];
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed with status ${res.status}`);
  }
  return res.json();
}

export async function fetchConfig(): Promise<ConfigResponse> {
  const res = await fetch(`${API_BASE}/config`);
  if (!res.ok) {
    throw new Error(`Config fetch failed with status ${res.status}`);
  }
  return res.json();
}

export async function fetchWords(level?: DifficultyLevel): Promise<VocabularyWord[]> {
  const url = level ? `${API_BASE}/words?level=${encodeURIComponent(level)}` : `${API_BASE}/words`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch words: ${res.statusText}`);
  }
  const data = await res.json();
  return data.words || [];
}

export async function fetchWord(
  params: { wordId?: string; wordName?: string; level?: DifficultyLevel; action?: string }
): Promise<{ word: VocabularyWord; aiExplanation?: string }> {
  const res = await fetch(`${API_BASE}/word`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch word details: ${res.statusText}`);
  }
  return res.json();
}

export async function sendChatMessage(params: {
  message: string;
  level: DifficultyLevel;
  currentWord?: VocabularyWord;
  history?: { role: 'user' | 'model'; text: string }[];
}): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Chat request failed: ${res.statusText}`);
  }
  return data;
}

export async function evaluateAnswer(params: {
  word: string;
  userAnswer: string;
  level: DifficultyLevel;
  taskDescription?: string;
}): Promise<SentenceEvaluation> {
  const res = await fetch(`${API_BASE}/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Evaluation failed: ${res.statusText}`);
  }
  return data.evaluation;
}

export async function fetchQuiz(params: {
  wordId?: string;
  wordName?: string;
  level: DifficultyLevel;
  type?: 'multiple-choice' | 'fill-in-the-blank' | 'synonym-match';
}): Promise<DynamicQuiz> {
  const res = await fetch(`${API_BASE}/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Quiz generation failed: ${res.statusText}`);
  }
  return data.quiz;
}
