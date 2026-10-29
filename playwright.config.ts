import { defineConfig } from "@playwright/test";

// E2E / responsivo / a11y (spec 0011 pergunta 7). Sobe `next start` numa porta própria (3100) sobre o build
// existente (`npx next build` antes) e aponta o banco para o *_test: nunca toca o banco de desenvolvimento.
// Rodar: npm run test:e2e   (precisa de `npm run db:up` e do banco de testes migrado: `npx vitest run` o migra).
const PORT = 3100;
const TEST_DB = process.env.TEST_DATABASE_URL ?? "postgresql://loja:loja@localhost:5432/loja_blog_test";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}` },
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
    // AUTH_TRUST_HOST: `next start` fora de produção real não confia no host localhost (Auth.js loga UntrustedHost).
    env: { DATABASE_URL: TEST_DB, AUTH_TRUST_HOST: "true" },
  },
});
