/**
 * Voicio Centralized Backend Error System
 * Classifies all Gemini API, network, validation, and internal errors into safe,
 * consistent responses containing `success: false`, `code`, `message`, and `retryable`.
 * Secrets and raw stack traces are never exposed to clients or in logs.
 */

export type ApiErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'RATE_LIMITED'
  | 'AI_UNAVAILABLE'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'SAFETY_BLOCKED'
  | 'INVALID_AI_RESPONSE'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR';

export interface StandardErrorResponse {
  success: false;
  code: ApiErrorCode;
  message: string;
  retryable: boolean;
  statusCode: number;
}

export const USER_MESSAGES: Record<ApiErrorCode, string> = {
  INVALID_CREDENTIALS:
    'Our AI tutor configuration is currently invalid. Please contact support or check server settings.',
  RATE_LIMITED:
    'Too many requests right now. Please wait a moment and try again.',
  AI_UNAVAILABLE:
    'Our AI tutor is temporarily unavailable. Please try again in a moment.',
  TIMEOUT:
    'Our AI tutor is taking longer than usual to respond. Please try again in a moment.',
  NETWORK_ERROR:
    "We're having trouble connecting. Check your internet connection and try again.",
  SAFETY_BLOCKED:
    'The request was flagged by content safety guidelines. Please rephrase and try again.',
  INVALID_AI_RESPONSE:
    "We couldn't generate your lesson this time. Please try again.",
  VALIDATION_ERROR:
    'Please check your request input and try again.',
  NOT_FOUND:
    'The requested lesson resource could not be found.',
  INTERNAL_ERROR:
    'Something went wrong. Please try again.',
};

export class AppError extends Error {
  public readonly code: ApiErrorCode;
  public readonly statusCode: number;
  public readonly retryable: boolean;
  public readonly safeMessage: string;

  constructor(options: {
    code: ApiErrorCode;
    message?: string;
    statusCode?: number;
    retryable?: boolean;
    cause?: unknown;
  }) {
    const safeMsg = options.message || USER_MESSAGES[options.code];
    super(safeMsg);
    this.name = 'AppError';
    this.code = options.code;
    this.safeMessage = safeMsg;
    this.statusCode = options.statusCode ?? getDefaultStatusCode(options.code);
    this.retryable = options.retryable ?? getDefaultRetryable(options.code);
    if (options.cause) {
      this.cause = options.cause;
    }
  }
}

function getDefaultStatusCode(code: ApiErrorCode): number {
  switch (code) {
    case 'INVALID_CREDENTIALS':
      return 401;
    case 'VALIDATION_ERROR':
    case 'SAFETY_BLOCKED':
      return 400;
    case 'NOT_FOUND':
      return 404;
    case 'RATE_LIMITED':
      return 429;
    case 'TIMEOUT':
      return 504;
    case 'NETWORK_ERROR':
    case 'INVALID_AI_RESPONSE':
      return 502;
    case 'AI_UNAVAILABLE':
      return 503;
    case 'INTERNAL_ERROR':
    default:
      return 500;
  }
}

function getDefaultRetryable(code: ApiErrorCode): boolean {
  switch (code) {
    case 'INVALID_CREDENTIALS':
    case 'VALIDATION_ERROR':
    case 'SAFETY_BLOCKED':
    case 'NOT_FOUND':
      return false;
    case 'RATE_LIMITED':
    case 'AI_UNAVAILABLE':
    case 'TIMEOUT':
    case 'NETWORK_ERROR':
    case 'INVALID_AI_RESPONSE':
    case 'INTERNAL_ERROR':
    default:
      return true;
  }
}

/**
 * Classifies any thrown error (GoogleGenAI SDK, network, JSON parsing, or standard Error)
 * into a strongly-typed AppError with safe user-facing message and retryable flag.
 */
export function classifyError(err: unknown): AppError {
  if (err instanceof AppError) {
    return err;
  }

  const rawMessage = err instanceof Error ? err.message : String(err || '');
  const rawStatus = (err as any)?.status || (err as any)?.statusCode || 0;
  const lowerMsg = rawMessage.toLowerCase();

  // 1. Invalid API Key / Authentication
  if (
    lowerMsg.includes('api_key_invalid') ||
    lowerMsg.includes('api key not valid') ||
    lowerMsg.includes('unauthenticated') ||
    lowerMsg.includes('gemini api key is not configured') ||
    lowerMsg.includes('permission_denied') ||
    rawStatus === 401 ||
    (rawStatus === 403 && lowerMsg.includes('key'))
  ) {
    return new AppError({
      code: 'INVALID_CREDENTIALS',
      statusCode: 401,
      retryable: false,
      cause: err,
    });
  }

  // 2. Rate Limits & Quotas
  if (
    lowerMsg.includes('resource_exhausted') ||
    lowerMsg.includes('rate limit') ||
    lowerMsg.includes('quota') ||
    lowerMsg.includes('too many requests') ||
    rawStatus === 429
  ) {
    return new AppError({
      code: 'RATE_LIMITED',
      message: 'Too many requests right now. Please wait a moment and try again.',
      statusCode: 429,
      retryable: true,
      cause: err,
    });
  }

  // 3. AI Service Unavailable / Temporary Capacity
  if (
    lowerMsg.includes('unavailable') ||
    lowerMsg.includes('overloaded') ||
    lowerMsg.includes('temporarily unavailable') ||
    lowerMsg.includes('service unavailable') ||
    rawStatus === 503
  ) {
    return new AppError({
      code: 'AI_UNAVAILABLE',
      message: 'Our AI tutor is temporarily unavailable. Please try again in a moment.',
      statusCode: 503,
      retryable: true,
      cause: err,
    });
  }

  // 4. Timeouts
  if (
    lowerMsg.includes('deadline_exceeded') ||
    lowerMsg.includes('timed out') ||
    lowerMsg.includes('etimedout') ||
    lowerMsg.includes('esockettimedout') ||
    lowerMsg.includes('timeout') ||
    rawStatus === 504
  ) {
    return new AppError({
      code: 'TIMEOUT',
      message: 'Our AI tutor is taking longer than usual to respond. Please try again in a moment.',
      statusCode: 504,
      retryable: true,
      cause: err,
    });
  }

  // 5. Network Failures
  if (
    lowerMsg.includes('enotfound') ||
    lowerMsg.includes('econnrefused') ||
    lowerMsg.includes('econnreset') ||
    lowerMsg.includes('fetch failed') ||
    lowerMsg.includes('network error')
  ) {
    return new AppError({
      code: 'NETWORK_ERROR',
      message: "We're having trouble connecting. Check your internet connection and try again.",
      statusCode: 502,
      retryable: true,
      cause: err,
    });
  }

  // 6. Safety Filter Blocks
  if (
    lowerMsg.includes('safety') ||
    lowerMsg.includes('harm_category') ||
    lowerMsg.includes('blocked')
  ) {
    return new AppError({
      code: 'SAFETY_BLOCKED',
      message: 'The request was flagged by content safety guidelines. Please rephrase and try again.',
      statusCode: 400,
      retryable: false,
      cause: err,
    });
  }

  // 7. Malformed AI Response / JSON Parse Error
  if (
    lowerMsg.includes('invalid_ai_response') ||
    lowerMsg.includes('unexpected token') ||
    lowerMsg.includes('is not valid json') ||
    lowerMsg.includes('json parse')
  ) {
    return new AppError({
      code: 'INVALID_AI_RESPONSE',
      message: "We couldn't generate your lesson this time. Please try again.",
      statusCode: 502,
      retryable: true,
      cause: err,
    });
  }

  // 8. Not Found
  if (lowerMsg.includes('not found') || rawStatus === 404) {
    return new AppError({
      code: 'NOT_FOUND',
      statusCode: 404,
      retryable: false,
      cause: err,
    });
  }

  // 9. Validation Error
  if (lowerMsg.includes('validation') || rawStatus === 400) {
    return new AppError({
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      retryable: false,
      cause: err,
    });
  }

  // 10. Default Unexpected Internal Error
  return new AppError({
    code: 'INTERNAL_ERROR',
    message: 'Something went wrong. Please try again.',
    statusCode: 500,
    retryable: true,
    cause: err,
  });
}

/**
 * Sanitizes any string to scrub sensitive tokens like Google API keys or auth headers
 * so they cannot leak into server logs.
 */
export function sanitizeLogString(str: string): string {
  if (!str) return '';
  return str
    .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_GEMINI_KEY]')
    .replace(/key=[A-Za-z0-9_-]{15,}/gi, 'key=[REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
    .replace(/"apiKey"\s*:\s*"[^"]+"/gi, '"apiKey":"[REDACTED]"')
    .replace(/'apiKey'\s*:\s*'[^']+'/gi, "'apiKey':'[REDACTED]'");
}

/**
 * Logs errors cleanly without leaking sensitive credentials or raw stack traces to the public
 */
export function logSafeError(context: string, err: unknown): void {
  const classified = classifyError(err);
  const rawMsg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  const sanitized = sanitizeLogString(rawMsg);
  console.error(
    `[${context}] Code: ${classified.code} (${classified.statusCode}) | Retryable: ${classified.retryable} | Detail: ${sanitized}`
  );
}

/**
 * Formats standard JSON error response for client transmission
 */
export function formatErrorResponse(err: unknown): StandardErrorResponse {
  const classified = classifyError(err);
  return {
    success: false,
    code: classified.code,
    message: classified.safeMessage,
    retryable: classified.retryable,
    statusCode: classified.statusCode,
  };
}
