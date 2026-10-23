import {
  VocabularyWord,
  DifficultyLevel,
  SentenceEvaluation,
  DynamicQuiz,
} from '../types';

const API_BASE =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ||
  '/api';

/**
 * Standard user-facing error messages required across Voicio.
 * Internal technical details and raw provider errors are never shown.
 */
export const USER_FACING_MESSAGES: Record<string, string> = {
  AI_UNAVAILABLE:
    'Our AI tutor is temporarily unavailable. Please try again in a moment.',
  NETWORK_ERROR:
    "We're having trouble connecting. Check your internet connection and try again.",
  TIMEOUT:
    'Our AI tutor is taking longer than usual to respond. Please try again in a moment.',
  INVALID_AI_RESPONSE:
    "We couldn't generate your lesson this time. Please try again.",
  RATE_LIMITED:
    'Too many requests right now. Please wait a moment and try again.',
  INVALID_CREDENTIALS:
    'Our AI tutor configuration is currently invalid. Please contact support or check server settings.',
  VALIDATION_ERROR:
    'Please check your request input and try again.',
  NOT_FOUND:
    'The requested lesson or vocabulary word could not be found.',
  SAFETY_BLOCKED:
    'The input was flagged by content safety guidelines. Please rephrase and try again.',
  INTERNAL_ERROR:
    'Something went wrong. Please try again.',
};

/**
 * Strongly-typed API client error encapsulating safe messages, HTTP status, and retryability
 */
export class ApiClientError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly retryable: boolean;
  public readonly originalError?: unknown;

  constructor(params: {
    message: string;
    code?: string;
    statusCode?: number;
    retryable?: boolean;
    originalError?: unknown;
  }) {
    super(params.message);
    this.name = 'ApiClientError';
    this.code = params.code || 'UNKNOWN_ERROR';
    this.statusCode = params.statusCode || 0;
    this.retryable = params.retryable ?? true;
    this.originalError = params.originalError;
  }
}

/**
 * Maps any error (ApiClientError, browser TypeError, timeout, etc.) to a friendly
 * user-facing message, retryable flag, and stable code.
 */
export function mapErrorToUserMessage(err: unknown): {
  message: string;
  retryable: boolean;
  code: string;
} {
  if (err instanceof ApiClientError) {
    return {
      message: err.message,
      retryable: err.retryable,
      code: err.code,
    };
  }

  // Network offline / DNS / fetch failures
  if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
    return {
      message: USER_FACING_MESSAGES.NETWORK_ERROR,
      retryable: true,
      code: 'NETWORK_ERROR',
    };
  }

  // Timeout / Abort
  if (err instanceof DOMException && err.name === 'AbortError') {
    return {
      message: USER_FACING_MESSAGES.TIMEOUT,
      retryable: true,
      code: 'TIMEOUT',
    };
  }

  return {
    message: USER_FACING_MESSAGES.INTERNAL_ERROR,
    retryable: true,
    code: 'INTERNAL_ERROR',
  };
}

function getFallbackMessageForCode(code: string): string {
  return USER_FACING_MESSAGES[code] || USER_FACING_MESSAGES.INTERNAL_ERROR;
}

function getFriendlyMessageForHttpStatus(status: number): {
  message: string;
  code: string;
  retryable: boolean;
} {
  switch (status) {
    case 400:
      return {
        message: USER_FACING_MESSAGES.VALIDATION_ERROR,
        code: 'VALIDATION_ERROR',
        retryable: false,
      };
    case 401:
    case 403:
      return {
        message: USER_FACING_MESSAGES.INVALID_CREDENTIALS,
        code: 'INVALID_CREDENTIALS',
        retryable: false,
      };
    case 404:
      return {
        message: USER_FACING_MESSAGES.NOT_FOUND,
        code: 'NOT_FOUND',
        retryable: false,
      };
    case 429:
      return {
        message: USER_FACING_MESSAGES.RATE_LIMITED,
        code: 'RATE_LIMITED',
        retryable: true,
      };
    case 502:
    case 503:
      return {
        message: USER_FACING_MESSAGES.AI_UNAVAILABLE,
        code: 'AI_UNAVAILABLE',
        retryable: true,
      };
    case 504:
      return {
        message: USER_FACING_MESSAGES.TIMEOUT,
        code: 'TIMEOUT',
        retryable: true,
      };
    default:
      return {
        message: USER_FACING_MESSAGES.INTERNAL_ERROR,
        code: 'INTERNAL_ERROR',
        retryable: true,
      };
  }
}

/**
 * Centralized fetch handler that enforces timeouts, validates JSON, and parses structured errors
 */
async function apiClientRequest<T>(
  endpoint: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const { timeoutMs = 15000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const res = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const rawText = await res.text();
    let jsonBody: any = null;
    if (rawText && rawText.trim().length > 0) {
      try {
        jsonBody = JSON.parse(rawText);
      } catch {
        // Non-JSON response (e.g. 502/504 HTML proxy gateway page)
      }
    }

    if (!res.ok) {
      // Backend returned our standard JSON error response
      if (jsonBody && typeof jsonBody === 'object' && jsonBody.success === false) {
        const code = jsonBody.code || 'INTERNAL_ERROR';
        const message = jsonBody.message || getFallbackMessageForCode(code);
        const retryable =
          typeof jsonBody.retryable === 'boolean'
            ? jsonBody.retryable
            : res.status >= 500 || res.status === 429;

        throw new ApiClientError({
          message,
          code,
          statusCode: res.status,
          retryable,
        });
      }

      // Non-structured response (e.g. Cloudflare HTML error or raw status)
      const mapped = getFriendlyMessageForHttpStatus(res.status);
      throw new ApiClientError({
        message: mapped.message,
        code: mapped.code,
        statusCode: res.status,
        retryable: mapped.retryable,
      });
    }

    // HTTP 2xx but body was empty when JSON was expected
    if (jsonBody === null) {
      throw new ApiClientError({
        message: USER_FACING_MESSAGES.INVALID_AI_RESPONSE,
        code: 'INVALID_AI_RESPONSE',
        statusCode: 502,
        retryable: true,
      });
    }

    return jsonBody as T;
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err instanceof ApiClientError) {
      throw err;
    }

    if (err.name === 'AbortError') {
      throw new ApiClientError({
        message: USER_FACING_MESSAGES.TIMEOUT,
        code: 'TIMEOUT',
        statusCode: 504,
        retryable: true,
        originalError: err,
      });
    }

    // Network connection errors
    throw new ApiClientError({
      message: USER_FACING_MESSAGES.NETWORK_ERROR,
      code: 'NETWORK_ERROR',
      statusCode: 0,
      retryable: true,
      originalError: err,
    });
  }
}

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
  return apiClientRequest<HealthResponse>('/health', { timeoutMs: 8000 });
}

export async function fetchConfig(): Promise<ConfigResponse> {
  return apiClientRequest<ConfigResponse>('/config', { timeoutMs: 8000 });
}

export async function fetchWords(level?: DifficultyLevel): Promise<VocabularyWord[]> {
  const endpoint = level ? `/words?level=${encodeURIComponent(level)}` : '/words';
  const data = await apiClientRequest<{ success: boolean; words: VocabularyWord[] }>(endpoint);
  return data.words || [];
}

export async function fetchWord(
  params: { wordId?: string; wordName?: string; level?: DifficultyLevel; action?: string }
): Promise<{ word: VocabularyWord; aiExplanation?: string }> {
  return apiClientRequest<{ word: VocabularyWord; aiExplanation?: string }>('/word', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
}

export async function sendChatMessage(params: {
  message: string;
  level: DifficultyLevel;
  currentWord?: VocabularyWord;
  history?: { role: 'user' | 'model'; text: string }[];
}): Promise<ChatResponse> {
  return apiClientRequest<ChatResponse>('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    timeoutMs: 20000,
  });
}

export async function evaluateAnswer(params: {
  word: string;
  userAnswer: string;
  level: DifficultyLevel;
  taskDescription?: string;
}): Promise<SentenceEvaluation> {
  const data = await apiClientRequest<{ success: boolean; evaluation: SentenceEvaluation }>('/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    timeoutMs: 20000,
  });
  return data.evaluation;
}

export async function fetchQuiz(params: {
  wordId?: string;
  wordName?: string;
  level: DifficultyLevel;
  type?: 'multiple-choice' | 'fill-in-the-blank' | 'synonym-match';
}): Promise<DynamicQuiz> {
  const data = await apiClientRequest<{ success: boolean; quiz: DynamicQuiz }>('/quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    timeoutMs: 15000,
  });
  return data.quiz;
}
