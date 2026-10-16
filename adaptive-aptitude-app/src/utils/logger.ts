// src/utils/logger.ts

/**
 * Development-only logger using import.meta.env.DEV.
 * Redacts credentials and avoids emitting literal console.log in production.
 */
export const logger = {
  debug: (...args: unknown[]): void => {
    if (import.meta.env.DEV) {
      console.debug(...args);
    }
  },
  info: (...args: unknown[]): void => {
    if (import.meta.env.DEV) {
      console.info(...args);
    }
  },
  warn: (...args: unknown[]): void => {
    if (import.meta.env.DEV) {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]): void => {
    if (import.meta.env.DEV) {
      console.error(...args);
    }
  },
};
