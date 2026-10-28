import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { DEV_USERS, seedDevUsers } from "../prisma/seed";
import { assertDevSeedAllowed } from "../prisma/seed-guard";
import { authorizeCredentials } from "@/lib/auth-credentials";
import { db } from "@/lib/db";
import { TEST_DATABASE_URL } from "./test-env";

const OK_ENV = { NODE_ENV: "development", ALLOW_DEV_SEED: "1", DATABASE_URL: "postgresql://u:p@localhost:5432/loja_blog" };

afterAll(async () => {
  await db.authAttempt.deleteMany();
  await db.user.deleteMany({ where: { email: { in: DEV_USERS.map((u) => u.email) } } });
});

describe("seed de dev: guardas anti-produção", () => {
  it("passa em ambiente local de dev", () => {
    expect(() => assertDevSeedAllowed(OK_ENV)).not.toThrow();
    expect(() => assertDevSeedAllowed({ ...OK_ENV, DATABASE_URL: "postgresql://u:p@db.interno.com:5432/loja_dev" })).not.toThrow();
  });

  it.each([
    ["NODE_ENV=production", { ...OK_ENV, NODE_ENV: "production" }],
    ["sem ALLOW_DEV_SEED", { ...OK_ENV, ALLOW_DEV_SEED: undefined }],
    ["ALLOW_DEV_SEED diferente de 1", { ...OK_ENV, ALLOW_DEV_SEED: "true" }],
    ["host remoto", { ...OK_ENV, DATABASE_URL: "postgresql://u:SEGREDO@prod.exemplo.com:5432/loja_blog" }],
    ["sem DATABASE_URL", { ...OK_ENV, DATABASE_URL: undefined }],
    ["URL inválida", { ...OK_ENV, DATABASE_URL: "isso-nao-e-url-SEGREDO" }],
  ])("recusa: %s (sem vazar credenciais)", (_n, env) => {
    try {
      assertDevSeedAllowed(env);
      throw new Error("deveria recusar");
    } catch (e) {
      expect((e as Error).message).toMatch(/recusado/);
      expect((e as Error).message).not.toContain("SEGREDO");
    }
  });
});

describe("seed de dev: usuários", () => {
  it("idempotente: rodar 2x mantém 4 usuários; papéis e desativado corretos", async () => {
    const client = new PrismaClient({ datasources: { db: { url: TEST_DATABASE_URL } } });
    try {
      await seedDevUsers(client);
      await seedDevUsers(client);
    } finally {
      await client.$disconnect();
    }
    const rows = await db.user.findMany({ where: { email: { in: DEV_USERS.map((u) => u.email) } }, orderBy: { email: "asc" } });
    expect(rows).toHaveLength(4);
    expect(rows.map((r) => [r.email, r.role, !!r.disabledAt])).toEqual([
      ["admin@example.com", "ADMIN", false],
      ["cliente2@example.com", "CUSTOMER", false],
      ["cliente@example.com", "CUSTOMER", false],
      ["desativado@example.com", "CUSTOMER", true],
    ]);
  });

  it("login funciona com o mesmo hash do app: admin e cliente entram; desativado não", async () => {
    await db.authAttempt.deleteMany();
    expect((await authorizeCredentials({ email: "admin@example.com", password: "Admin@12345" }))?.role).toBe("ADMIN");
    expect((await authorizeCredentials({ email: "cliente@example.com", password: "Cliente@12345" }))?.role).toBe("CUSTOMER");
    expect(await authorizeCredentials({ email: "desativado@example.com", password: "Desativado@12345" })).toBeNull();
  });
});
