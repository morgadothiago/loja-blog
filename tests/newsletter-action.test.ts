import { beforeEach, describe, expect, it, vi } from "vitest";

// Contexto de requisição do Next (cookie de idioma); o banco é real.
const cookieGet = vi.fn();
vi.mock("next/headers", () => ({ cookies: async () => ({ get: cookieGet }) }));

import { subscribeNewsletter } from "@/actions/newsletter";
import { db } from "@/lib/db";

beforeEach(async () => {
  cookieGet.mockReturnValue({ value: "en" });
  await db.subscriber.deleteMany();
});

describe("subscribeNewsletter", () => {
  it("caminho feliz: grava e-mail normalizado e locale do cookie", async () => {
    expect(await subscribeNewsletter({ email: "  Ana@Exemplo.com " })).toEqual({ ok: true, data: undefined });
    const rows = await db.subscriber.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ email: "ana@exemplo.com", locale: "en" });
  });

  it("é idempotente (inclusive com caixa diferente)", async () => {
    await subscribeNewsletter({ email: "ana@exemplo.com" });
    expect(await subscribeNewsletter({ email: "ANA@exemplo.com" })).toEqual({ ok: true, data: undefined });
    expect(await db.subscriber.count()).toBe(1);
  });

  it.each([{ email: "abc" }, { email: "" }, {}, null, "texto", { email: 42 }])(
    "rejeita input inválido %j",
    async (input) => {
      expect(await subscribeNewsletter(input)).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
      expect(await db.subscriber.count()).toBe(0);
    },
  );

  it("honeypot preenchido: responde ok mas não grava", async () => {
    expect(await subscribeNewsletter({ email: "bot@exemplo.com", website: "http://spam" })).toEqual({ ok: true, data: undefined });
    expect(await db.subscriber.count()).toBe(0);
  });

  it("é pública: funciona sem sessão (não consulta auth)", async () => {
    // A action não importa auth; qualquer papel (anônimo, cliente, admin) cai no mesmo caminho.
    expect(await subscribeNewsletter({ email: "x@exemplo.com" })).toEqual({ ok: true, data: undefined });
  });

  it("5 inscrições simultâneas do mesmo e-mail: 1 registro e nenhuma falha", async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () => subscribeNewsletter({ email: "corrida@exemplo.com" })),
    );
    expect(results.every((r) => r.ok)).toBe(true);
    expect(await db.subscriber.count()).toBe(1);
  });
});
