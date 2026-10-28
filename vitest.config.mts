import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  // JSX automático sem plugin React (o plugin exigia babel 8, conflitante).
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/setup.ts"],
    globalSetup: ["tests/global-setup.ts"],
    // Testes de integração compartilham 1 banco: sem paralelismo entre arquivos.
    fileParallelism: false,
    // next-auth importa "next/server" sem extensão (ESM puro do Node falha): deixa o Vite resolver.
    server: { deps: { inline: [/next-auth/, /@auth\/core/] } },
  },
});
