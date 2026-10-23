import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyError,
  sanitizeLogString,
  formatErrorResponse,
  AppError,
  USER_MESSAGES,
} from '../src/errors.js';
import { extractAndValidateJson } from '../src/gemini.js';

describe('Voicio Centralized Backend Error Handling', () => {
  test('Classifies Invalid API Key / Authentication as 401 non-retryable', () => {
    const rawError = new Error('API_KEY_INVALID: The provided API key is not valid.');
    const appError = classifyError(rawError);

    assert.equal(appError.code, 'INVALID_CREDENTIALS');
    assert.equal(appError.statusCode, 401);
    assert.equal(appError.retryable, false);
    assert.equal(
      appError.safeMessage,
      'Our AI tutor configuration is currently invalid. Please contact support or check server settings.'
    );
    // Ensure raw error text is NOT in the safe message
    assert.ok(!appError.safeMessage.includes('API_KEY_INVALID'));
  });

  test('Classifies Rate Limits & Quota Exhaustion as 429 retryable', () => {
    const rawError = new Error('RESOURCE_EXHAUSTED: Quota exceeded for quota metric');
    const appError = classifyError(rawError);

    assert.equal(appError.code, 'RATE_LIMITED');
    assert.equal(appError.statusCode, 429);
    assert.equal(appError.retryable, true);
    assert.equal(
      appError.safeMessage,
      'Too many requests right now. Please wait a moment and try again.'
    );
  });

  test('Classifies 503 / Model Overloaded as 503 retryable', () => {
    const rawError = new Error('503 Service Unavailable: The model is overloaded. Please try again later.');
    const appError = classifyError(rawError);

    assert.equal(appError.code, 'AI_UNAVAILABLE');
    assert.equal(appError.statusCode, 503);
    assert.equal(appError.retryable, true);
    assert.equal(
      appError.safeMessage,
      'Our AI tutor is temporarily unavailable. Please try again in a moment.'
    );
  });

  test('Classifies Timeouts / Deadline Exceeded as 504 retryable', () => {
    const rawError = new Error('DEADLINE_EXCEEDED: Request timed out after 30000ms');
    const appError = classifyError(rawError);

    assert.equal(appError.code, 'TIMEOUT');
    assert.equal(appError.statusCode, 504);
    assert.equal(appError.retryable, true);
    assert.equal(
      appError.safeMessage,
      'Our AI tutor is taking longer than usual to respond. Please try again in a moment.'
    );
  });

  test('Classifies Network / DNS failures as 502 retryable', () => {
    const rawError = new Error('getaddrinfo ENOTFOUND generativelanguage.googleapis.com');
    const appError = classifyError(rawError);

    assert.equal(appError.code, 'NETWORK_ERROR');
    assert.equal(appError.statusCode, 502);
    assert.equal(appError.retryable, true);
    assert.equal(
      appError.safeMessage,
      "We're having trouble connecting. Check your internet connection and try again."
    );
  });

  test('Classifies Safety Blocks as 400 non-retryable', () => {
    const rawError = new Error('Candidate was blocked due to SAFETY');
    const appError = classifyError(rawError);

    assert.equal(appError.code, 'SAFETY_BLOCKED');
    assert.equal(appError.statusCode, 400);
    assert.equal(appError.retryable, false);
    assert.ok(appError.safeMessage.includes('content safety'));
  });

  test('Classifies unexpected exceptions as generic 500 retryable', () => {
    const rawError = new Error('Unexpected database syntax error at 0xdeadbeef in line 42');
    const appError = classifyError(rawError);

    assert.equal(appError.code, 'INTERNAL_ERROR');
    assert.equal(appError.statusCode, 500);
    assert.equal(appError.retryable, true);
    assert.equal(appError.safeMessage, 'Something went wrong. Please try again.');
    // Ensure internal crash details are stripped
    assert.ok(!appError.safeMessage.includes('0xdeadbeef'));
  });

  test('Sanitizes Gemini API keys and Authorization headers from logs', () => {
    const fakeKey = 'AIzaSy' + 'A'.repeat(33);
    const logWithKey = `Error querying https://generativelanguage.googleapis.com/v1beta/models?key=${fakeKey} with Authorization: Bearer secret_token_xyz`;

    const sanitized = sanitizeLogString(logWithKey);
    assert.ok(!sanitized.includes(fakeKey));
    assert.ok(!sanitized.includes('secret_token_xyz'));
    assert.ok(sanitized.includes('[REDACTED_GEMINI_KEY]'));
    assert.ok(sanitized.includes('Bearer [REDACTED]'));
  });

  test('formatErrorResponse returns consistent schema with no stack traces or secrets', () => {
    const rawError = new Error('API_KEY_INVALID: Key AIzaSyDummyKeyIsHereFailed');
    const formatted = formatErrorResponse(rawError);

    assert.equal(formatted.success, false);
    assert.equal(formatted.code, 'INVALID_CREDENTIALS');
    assert.equal(formatted.statusCode, 401);
    assert.equal(formatted.retryable, false);
    assert.equal(typeof formatted.message, 'string');
    assert.ok(!formatted.message.includes('AIzaSy'));
    assert.equal((formatted as any).stack, undefined);
    assert.equal((formatted as any).cause, undefined);
  });

  test('extractAndValidateJson successfully extracts and validates markdown-wrapped JSON', () => {
    const markdownAiText = '```json\n{\n  "verdict": "correct",\n  "score": 95,\n  "feedback": "Excellent sentence!",\n  "wordUsedCorrectly": true\n}\n```';

    const result = extractAndValidateJson(markdownAiText, (parsed) => {
      if (parsed.verdict && typeof parsed.score === 'number') {
        return parsed;
      }
      return null;
    });

    assert.equal(result.verdict, 'correct');
    assert.equal(result.score, 95);
    assert.equal(result.wordUsedCorrectly, true);
  });

  test('extractAndValidateJson extracts JSON with surrounding conversational text', () => {
    const conversationalAiText = 'Here is your evaluation:\n{\n  "verdict": "partially_correct",\n  "score": 75,\n  "feedback": "Good attempt!",\n  "wordUsedCorrectly": true\n}\nHope this helps!';

    const result = extractAndValidateJson(conversationalAiText, (parsed) => {
      if (parsed.verdict) return parsed;
      return null;
    });

    assert.equal(result.verdict, 'partially_correct');
    assert.equal(result.score, 75);
  });

  test('extractAndValidateJson throws safe INVALID_AI_RESPONSE on malformed JSON', () => {
    const invalidAiText = '{\n  "verdict": "correct",\n  "score": broken_json_here\n';

    assert.throws(
      () => {
        extractAndValidateJson(invalidAiText, (parsed) => parsed);
      },
      (err: any) => {
        assert.equal(err.code, 'INVALID_AI_RESPONSE');
        assert.equal(err.statusCode, 502);
        assert.equal(err.retryable, true);
        assert.equal(
          err.safeMessage,
          "We couldn't generate your lesson this time. Please try again."
        );
        return true;
      }
    );
  });
});
