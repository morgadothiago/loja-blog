import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { TEST_DATABASE_URL } from "./test-env";

// Antes de qualquer import de src/lib/db: o Prisma lê DATABASE_URL ao instanciar.
process.env.DATABASE_URL = TEST_DATABASE_URL;

afterEach(() => cleanup());

// jsdom não tem estas APIs (embla e matchMedia). Stubs mínimos, só quando o ambiente é DOM.
if (typeof window !== "undefined") {
  class Noop {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  }
  window.ResizeObserver ??= Noop as unknown as typeof ResizeObserver;
  window.IntersectionObserver ??= Noop as unknown as typeof IntersectionObserver;
  window.matchMedia ??= ((query: string) => ({
    matches: false, media: query, onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
