// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { server } from './mocks/server';
import { clearAccessToken } from '../services/api/tokenManager';

// Start MSW mock server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

// Reset handlers and in-memory token state after each test
afterEach(() => {
  server.resetHandlers();
  clearAccessToken();
  vi.clearAllMocks();
});

// Close MSW mock server after all tests
afterAll(() => {
  server.close();
});

// Polyfill window.matchMedia for JSDOM
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Polyfill ResizeObserver
  class ResizeObserverMock {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

  // Polyfill window.scrollTo and scrollIntoView
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
}

