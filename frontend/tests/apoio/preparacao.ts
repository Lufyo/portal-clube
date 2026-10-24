import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { apiFalsa } from "./apiFalsa";

beforeEach(() => {
  apiFalsa.limpar();
  vi.stubGlobal("fetch", apiFalsa.fetch);
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
