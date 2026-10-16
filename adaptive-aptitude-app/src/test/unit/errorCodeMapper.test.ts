// src/test/unit/errorCodeMapper.test.ts
import { describe, it, expect } from 'vitest';
import { mapErrorCodeToMessage, formatErrorWithCorrelation } from '../../utils/errorCodeMapper';

describe('errorCodeMapper (User-Friendly Error Taxonomy)', () => {
  it('maps known backend error codes to descriptive learner explanations', () => {
    expect(mapErrorCodeToMessage('ACCOUNT_DISABLED')).toContain('deactivated');
    expect(mapErrorCodeToMessage('TOKEN_EXPIRED')).toContain('session has expired');
    expect(mapErrorCodeToMessage('RATE_LIMIT_EXCEEDED')).toContain('Too many requests');
    expect(mapErrorCodeToMessage('IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD')).toContain('different payload');
  });

  it('falls back to default message when code is unrecognized or missing', () => {
    expect(mapErrorCodeToMessage('UNKNOWN_CODE_XYZ')).toBe('An unexpected error occurred. Please try again.');
    expect(mapErrorCodeToMessage(undefined)).toBe('An unexpected error occurred. Please try again.');
  });

  it('formats error messages with correlation ID when available', () => {
    const formatted = formatErrorWithCorrelation('Unable to load questions', 'req-corr-777');
    expect(formatted).toBe('Unable to load questions (Correlation ID: req-corr-777)');

    const withoutCorr = formatErrorWithCorrelation('Unable to load questions', null);
    expect(withoutCorr).toBe('Unable to load questions');
  });
});
