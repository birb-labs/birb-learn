import { afterEach, vi } from 'vitest';
import { cleanup, configure } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

afterEach(cleanup);

// Code islands lazy-load the CodeMirror editor; under the load of the full
// suite that import can take longer than the default 1 s `findBy` wait.
configure({ asyncUtilTimeout: 5000 });

// Mock window.matchMedia for ThemeProvider. Files under
// `// @vitest-environment node` have no `window`.
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
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
}

// @dnd-kit/core (used by OrderingInput/MatchingInput) calls ResizeObserver,
// which jsdom does not implement. A minimal no-op stub is enough — these
// tests don't assert on actual resize behavior.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}
