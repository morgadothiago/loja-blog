import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

// Contexto de requisição do Next (cookie de idioma e IP); o banco é real.
const cookieGet = vi.fn();
const ip = { value: "203.0.113.10" };
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookieGet }),
  headers: async () => new Headers({ "x-forwarded-for": ip.value }),
}));

import { sendContactMessage } from "@/actions/contact";
import { db } from "@/lib/db";
import { LIMITS, attemptKeys, recordAttempt } from "@/lib/rate-limit";

const fd = (o: Record<string, string>) => Object.entries(o).reduce((f, [k, v]) => (f.set(k, v), f), new FormData());
const valid = { name: "  Ana Souza ", email: "  Ana@Exemplo.com ", message: "  Olá, gostaria de saber mais.  " };
const send = (o: Record<string, string> = valid) => sendContactMessage(undefined, fd(o));

async function clean() {
  await db.contactMessage.deleteMany();
  await db.authAttempt.deleteMany({ where: { key: { startsWith: "contact-ip:" } } });
}

beforeEach(async () => {
  cookieGet.mockReturnValue({ value: "es" });
  ip.value = "203.0.113.10";
  await clean();
});
afterAll(clean);

describe("sendContactMessage", () => {
  it("caminho feliz: grava campos normalizados e o idioma do cookie", async () => {
    expect(await send()).toEqual({ ok: true, data: undefined });
    const rows = await db.contactMessage.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: "Ana Souza", email: "ana@exemplo.com", message: "Olá, gostaria de saber mais.", locale: "es" });
    expect(rows[0].readAt).toBeNull();
  });

  it("é pública: funciona sem sessão (não consulta auth)", async () => {
    expect((await send()).ok).toBe(true);
  });

  it.each([
    [{ ...valid, name: "" }, { name: "REQUIRED" }],
    [{ ...valid, email: "abc" }, { email: "INVALID" }],
    [{ ...valid, message: "   " }, { message: "REQUIRED" }],
    [{ ...valid, name: "x".repeat(101) }, { name: "TOO_LONG" }],
    [{ ...valid, email: `${"a".repeat(250)}@x.com` }, { email: "TOO_LONG" }],
    [{ ...valid, message: "m".repeat(1001) }, { message: "TOO_LONG" }],
  ])("input inválido %# -> VALIDATION com o campo e nada gravado", async (input, fieldErrors) => {
    expect(await send(input)).toMatchObject({ ok: false, error: { code: "VALIDATION", fieldErrors } });
    expect(await db.contactMessage.count()).toBe(0);
  });

  it("limites exatos passam (100 / 1000)", async () => {
    expect((await send({ ...valid, name: "x".repeat(100), message: "m".repeat(1000) })).ok).toBe(true);
  });

  it("honeypot preenchido: responde ok, não grava e não gasta o limite", async () => {
    expect(await send({ ...valid, website: "http://spam" })).toEqual({ ok: true, data: undefined });
    expect(await db.contactMessage.count()).toBe(0);
    expect(await db.authAttempt.count({ where: { key: attemptKeys.contactIp(ip.value) } })).toBe(0);
  });

  it("rate limit por IP: bloqueia na 6ª; outro IP não é afetado; contadores de login não são tocados", async () => {
    for (let i = 0; i < LIMITS.contactIp; i++) expect((await send()).ok).toBe(true);
    expect(await send()).toMatchObject({ ok: false, error: { code: "RATE_LIMITED" } });
    expect(await db.contactMessage.count()).toBe(LIMITS.contactIp);

    ip.value = "203.0.113.99";
    expect((await send()).ok).toBe(true);

    expect(await db.authAttempt.count({ where: { key: { startsWith: "ip:" } } })).toBe(0);
  });

  it("tentativas antigas (fora da janela de 15 min) não bloqueiam", async () => {
    const old = new Date(Date.now() - 16 * 60 * 1000);
    for (let i = 0; i < LIMITS.contactIp; i++) await recordAttempt([attemptKeys.contactIp(ip.value)], old);
    expect((await send()).ok).toBe(true);
  });

  it("falha inesperada vira INTERNAL genérico e o log não contém a mensagem nem o e-mail", async () => {
    // Único ponto mockado: forçar uma falha do banco, que não dá para provocar com dados válidos.
    const create = vi.spyOn(db.contactMessage, "create").mockRejectedValueOnce(new Error("boom"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(await send()).toEqual({ ok: false, error: { code: "INTERNAL" } });
      expect(log).toHaveBeenCalledTimes(1);
      const line = String(log.mock.calls[0][0]);
      expect(line).not.toContain("Ana");
      expect(line).not.toContain("exemplo.com");
      expect(line).not.toContain("gostaria");
    } finally {
      create.mockRestore();
      log.mockRestore();
    }
  });
});
