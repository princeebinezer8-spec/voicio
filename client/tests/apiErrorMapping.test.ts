import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  ApiClientError,
  mapErrorToUserMessage,
  USER_FACING_MESSAGES,
} from '../src/services/api.js';

describe('Voicio Frontend User-Friendly Error Mapping', () => {
  test('Maps AI_UNAVAILABLE to concise user-friendly message', () => {
    const err = new ApiClientError({
      code: 'AI_UNAVAILABLE',
      message: USER_FACING_MESSAGES.AI_UNAVAILABLE,
      statusCode: 503,
      retryable: true,
    });
    const mapped = mapErrorToUserMessage(err);

    assert.equal(mapped.code, 'AI_UNAVAILABLE');
    assert.equal(mapped.message, 'Our AI tutor is temporarily unavailable. Please try again in a moment.');
    assert.equal(mapped.retryable, true);
  });

  test('Maps NETWORK_ERROR and browser TypeError fetch failures to connection message', () => {
    const fetchTypeError = new TypeError('Failed to fetch');
    const mapped = mapErrorToUserMessage(fetchTypeError);

    assert.equal(mapped.code, 'NETWORK_ERROR');
    assert.equal(mapped.message, "We're having trouble connecting. Check your internet connection and try again.");
    assert.equal(mapped.retryable, true);
  });

  test('Maps TIMEOUT and AbortError to friendly timeout message', () => {
    const abortErr = new DOMException('The user aborted a request.', 'AbortError');
    const mapped = mapErrorToUserMessage(abortErr);

    assert.equal(mapped.code, 'TIMEOUT');
    assert.equal(mapped.message, 'Our AI tutor is taking longer than usual to respond. Please try again in a moment.');
    assert.equal(mapped.retryable, true);
  });

  test('Maps INVALID_AI_RESPONSE to lesson generation message', () => {
    const err = new ApiClientError({
      code: 'INVALID_AI_RESPONSE',
      message: USER_FACING_MESSAGES.INVALID_AI_RESPONSE,
      statusCode: 502,
      retryable: true,
    });
    const mapped = mapErrorToUserMessage(err);

    assert.equal(mapped.code, 'INVALID_AI_RESPONSE');
    assert.equal(mapped.message, "We couldn't generate your lesson this time. Please try again.");
    assert.equal(mapped.retryable, true);
  });

  test('Maps RATE_LIMITED to wait and try again message', () => {
    const err = new ApiClientError({
      code: 'RATE_LIMITED',
      message: USER_FACING_MESSAGES.RATE_LIMITED,
      statusCode: 429,
      retryable: true,
    });
    const mapped = mapErrorToUserMessage(err);

    assert.equal(mapped.code, 'RATE_LIMITED');
    assert.equal(mapped.message, 'Too many requests right now. Please wait a moment and try again.');
    assert.equal(mapped.retryable, true);
  });

  test('Maps INVALID_CREDENTIALS to non-retryable safe configuration message', () => {
    const err = new ApiClientError({
      code: 'INVALID_CREDENTIALS',
      message: USER_FACING_MESSAGES.INVALID_CREDENTIALS,
      statusCode: 401,
      retryable: false,
    });
    const mapped = mapErrorToUserMessage(err);

    assert.equal(mapped.code, 'INVALID_CREDENTIALS');
    assert.equal(
      mapped.message,
      'Our AI tutor configuration is currently invalid. Please contact support or check server settings.'
    );
    assert.equal(mapped.retryable, false);
    // Ensure no sensitive terms or provider keys
    assert.ok(!mapped.message.includes('API_KEY'));
  });

  test('Falls back to generic user-friendly message for unknown exceptions without leaking details', () => {
    const unknownErr = new Error('Database connection string password=secret leaked at memory address 0x01');
    const mapped = mapErrorToUserMessage(unknownErr);

    assert.equal(mapped.code, 'INTERNAL_ERROR');
    assert.equal(mapped.message, 'Something went wrong. Please try again.');
    assert.equal(mapped.retryable, true);
    assert.ok(!mapped.message.includes('password'));
    assert.ok(!mapped.message.includes('0x01'));
  });
});
