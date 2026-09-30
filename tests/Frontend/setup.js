import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

export const mediaListeners = new Set();
beforeEach(() => {
  mediaListeners.clear();
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn(() => ({
      matches: false,
      media: "(min-width: 1024px)",
      addEventListener: (_, listener) => mediaListeners.add(listener),
      removeEventListener: (_, listener) => mediaListeners.delete(listener),
    })),
  });
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
