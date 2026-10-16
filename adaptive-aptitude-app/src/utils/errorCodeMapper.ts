// src/utils/errorCodeMapper.ts

export interface ErrorMapping {
  code: string;
  category: string;
  message: string;
  retryPermitted: boolean;
  boundary: string;
}

const ERROR_CODE_MAP: Record<string, { category: string; message: string; retryPermitted: boolean; boundary: string }> = {
  UNAUTHORIZED: {
    category: 'Session Expired',
    message: 'Your session has expired or is invalid. Please sign in again.',
    retryPermitted: true,
    boundary: 'Auth Boundary',
  },
  IDENTITY_MISMATCH: {
    category: 'Security Boundary',
    message: 'You do not have permission to access or modify this resource.',
    retryPermitted: false,
    boundary: 'Forbidden Alert',
  },
  OWNERSHIP_VIOLATION: {
    category: 'Security Boundary',
    message: 'You do not own this resource.',
    retryPermitted: false,
    boundary: 'Forbidden Alert',
  },
  ACCOUNT_DISABLED: {
    category: 'Account Deactivated',
    message: 'Your account has been deactivated. Please contact support.',
    retryPermitted: false,
    boundary: 'Dedicated Inactive View',
  },
  PASSWORD_BLOCKLISTED: {
    category: 'Form Validation',
    message: 'The chosen password is too common or blocklisted. Please choose a stronger password.',
    retryPermitted: true,
    boundary: 'Inline Input Error',
  },
  TOO_MANY_REQUESTS: {
    category: 'Rate Limiting',
    message: 'Too many requests. Please wait before trying again.',
    retryPermitted: true,
    boundary: 'Cooldown Countdown',
  },
  RATE_LIMIT_CAPACITY_EXCEEDED: {
    category: 'Capacity Alert',
    message: 'AI capacity is currently exceeded. Please wait a moment.',
    retryPermitted: true,
    boundary: 'Inline Warning Banner',
  },
  FINALIZATION_IN_PROGRESS: {
    category: 'System Finalizing',
    message: 'Exam score finalization is currently in progress. Please wait...',
    retryPermitted: true,
    boundary: 'Loading Shimmer/Poll',
  },
  FINALIZATION_LEASE_LOST: {
    category: 'Finalization Contention',
    message: 'Finalization lease was lost. Please retry.',
    retryPermitted: true,
    boundary: 'Retry Alert Banner',
  },
  MOCK_SESSION_EXPIRED: {
    category: 'Exam Expired',
    message: 'This mock examination session has expired.',
    retryPermitted: true,
    boundary: 'Score Report Router',
  },
  SECTION_LOCKED: {
    category: 'Section Sealed',
    message: 'This section has been completed and is now locked.',
    retryPermitted: false,
    boundary: 'Locked Notice Banner',
  },
  SECTION_NOT_ACTIVE: {
    category: 'Section Inactive',
    message: 'This section is not active.',
    retryPermitted: false,
    boundary: 'Barrier Warning',
  },
  RESPONSE_FROZEN: {
    category: 'Exam Finalized',
    message: 'Exam responses have been finalized and cannot be modified.',
    retryPermitted: false,
    boundary: 'Frozen Notice Banner',
  },
  SESSION_STATE_CONFLICT: {
    category: 'State Conflict',
    message: 'Session state conflict occurred. Please refresh.',
    retryPermitted: true,
    boundary: 'Session Refresh Alert',
  },
  MOCK_SESSION_NOT_TERMINAL: {
    category: 'Exam Not Terminal',
    message: 'Mock examination is not in a completed terminal state.',
    retryPermitted: false,
    boundary: 'Catalog Redirect',
  },
  INVALID_SESSION_STATE: {
    category: 'Invalid Transition',
    message: 'Invalid session transition requested.',
    retryPermitted: false,
    boundary: 'Catalog Redirect',
  },
  INVALID_OPTION: {
    category: 'Validation Alert',
    message: 'Invalid option selected.',
    retryPermitted: true,
    boundary: 'Form Selection Alert',
  },
  INVALID_TIME_TAKEN: {
    category: 'Pacing Validation',
    message: 'Time taken recorded is invalid.',
    retryPermitted: true,
    boundary: 'Advisory Notice',
  },
  MOCK_SESSION_NOT_FOUND: {
    category: 'Resource Missing',
    message: 'Mock examination session was not found.',
    retryPermitted: false,
    boundary: 'Not Found Card',
  },
  LLM_PROVIDER_UNAVAILABLE: {
    category: 'AI Offline',
    message: 'AI Tutor service is temporarily unavailable. Please try again later.',
    retryPermitted: true,
    boundary: 'Fallback Hint Card',
  },
  LLM_PROVIDER_TIMEOUT: {
    category: 'AI Timeout',
    message: 'AI Tutor request timed out. Please try again.',
    retryPermitted: true,
    boundary: 'Fallback Hint Card',
  },
  INTERNAL_SERVER_ERROR: {
    category: 'System Fault',
    message: 'An unexpected server error occurred. Please try again later.',
    retryPermitted: true,
    boundary: 'Recoverable Error Alert',
  },
  IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD: {
    category: 'Idempotency Conflict',
    message: 'Idempotency key was reused with a different payload.',
    retryPermitted: false,
    boundary: 'Form Selection Alert',
  },

};

export function mapBackendErrorCode(code?: string, defaultMessage?: string): ErrorMapping {
  const normalized = code ? code.toUpperCase() : 'INTERNAL_SERVER_ERROR';
  const entry = ERROR_CODE_MAP[normalized];
  if (entry) {
    return {
      code: normalized,
      category: entry.category,
      message: defaultMessage || entry.message,
      retryPermitted: entry.retryPermitted,
      boundary: entry.boundary,
    };
  }
  return {
    code: normalized,
    category: 'System Fault',
    message: defaultMessage || 'An unexpected error occurred. Please try again.',
    retryPermitted: true,
    boundary: 'Recoverable Error Alert',
  };
}

export function mapErrorCodeToMessage(code?: string): string {
  if (!code) return 'An unexpected error occurred. Please try again.';
  const normalized = code.toUpperCase();
  if (normalized === 'TOKEN_EXPIRED') {
    return 'Your session has expired. Please sign in again.';
  }
  if (normalized === 'RATE_LIMIT_EXCEEDED') {
    return 'Too many requests. Please wait before trying again.';
  }
  const entry = ERROR_CODE_MAP[normalized];
  if (entry) {
    return entry.message;
  }
  return 'An unexpected error occurred. Please try again.';
}

export function formatErrorWithCorrelation(message: string, correlationId?: string | null): string {
  if (correlationId) {
    return `${message} (Correlation ID: ${correlationId})`;
  }
  return message;
}

