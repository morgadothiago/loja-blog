import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const spy = vi.hoisted(() => ({ verify: vi.fn() }));
vi.mock("@/lib/password", async (orig) => {
  const real = await orig<typeof import("@/lib/password")>();
  return { ...real, verifyPassword: (...a: Parameters<typeof real.verifyPassword>) => (spy.verify(...a), real.verifyPassword(...a)) };
});

import { RateLimitedSignin, authorizeCredentials } from "@/lib/auth-credentials";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { WINDOW_MS } from "@/lib/rate-limit";
import { refreshToken } from "@/lib/session-refresh";

const emails = ["adm-a@x.com", "cli-a@x.com", "off-a@x.com", "Maius-a@x.com"];
const req = (ip = "9.9.9.9") => new Request("http://localhost/api/auth/callback/credentials", { headers: { "x-forwarded-for": `${ip}, 10.0.0.1` } });

beforeAll(async () => {
  await db.user.deleteMany({ where: { email: { in: emails.map((e) => e.toLowerCase()).concat(emails) } } });
  const password = await hashPassword("Senha@12345");
  await db.user.createMany({
    data: [
      { email: "adm-a@x.com", password, role: "ADMIN", name: "A" },
      { email: "cli-a@x.com", password, role: "CUSTOMER" },
      { email: "off-a@x.com", password, disabledAt: new Date("2025-01-01") },
      { email: "Maius-a@x.com", password }, // conta antiga com maiúscula
    ],
  });
});
afterAll(async () => {
  await db.authAttempt.deleteMany();
  await db.user.deleteMany({ where: { email: { in: emails } } });
});
beforeEach(async () => {
  spy.verify.mockClear();
  await db.authAttempt.deleteMany();
});

describe("authorizeCredentials", () => {
  it("ADMIN e CUSTOMER autenticam e retornam id/role (sem senha)", async () => {
    const admin = await authorizeCredentials({ email: "adm-a@x.com", password: "Senha@12345" }, req());
    expect(admin).toMatchObject({ email: "adm-a@x.com", role: "ADMIN" });
    expect(admin).not.toHaveProperty("password");
    expect((await authorizeCredentials({ email: "cli-a@x.com", password: "Senha@12345" }, req()))?.role).toBe("CUSTOMER");
  });

  it("senha errada e e-mail inexistente: null e bcrypt.compare é chamado nos dois ramos (tempo igual)", async () => {
    expect(await authorizeCredentials({ email: "adm-a@x.com", password: "errada" }, req())).toBeNull();
    expect(await authorizeCredentials({ email: "ninguem@x.com", password: "qualquer" }, req())).toBeNull();
    expect(spy.verify).toHaveBeenCalledTimes(2);
    // o ramo "sem usuário" compara contra o hash dummy (nunca contra a senha de alguém)
    expect(spy.verify.mock.calls[1][1]).toMatch(/^\$2[aby]\$10\$/);
  });

  it("usuário desativado: null mesmo com a senha certa", async () => {
    expect(await authorizeCredentials({ email: "off-a@x.com", password: "Senha@12345" }, req())).toBeNull();
  });

  it("normaliza espaço/caixa; conta antiga com maiúscula continua entrando", async () => {
    expect((await authorizeCredentials({ email: "  ADM-A@X.COM ", password: "Senha@12345" }, req()))?.email).toBe("adm-a@x.com");
    expect((await authorizeCredentials({ email: "maius-a@x.com", password: "Senha@12345" }, req()))?.email).toBe("Maius-a@x.com");
  });

  it("input inválido: null sem tocar no banco de tentativas", async () => {
    for (const raw of [null, {}, { email: "x", password: "a" }, { email: "a@b.com", password: "" }, { email: "a@b.com", password: "é".repeat(40) }]) {
      expect(await authorizeCredentials(raw, req())).toBeNull();
    }
    expect(await db.authAttempt.count()).toBe(0);
  });
});

describe("rate limit (janela de 15 min, relógio injetável)", () => {
  const t0 = new Date("2026-01-01T12:00:00Z");
  const bad = (n: number, at: Date, ip = "1.1.1.1") =>
    Promise.all(Array.from({ length: n }, () => authorizeCredentials({ email: "cli-a@x.com", password: "errada" }, req(ip), at)));

  it("5 falhas bloqueiam a 6ª (mesmo com a senha certa); sucesso antes do limite zera", async () => {
    await bad(5, t0);
    await expect(authorizeCredentials({ email: "cli-a@x.com", password: "Senha@12345" }, req(), t0)).rejects.toBeInstanceOf(RateLimitedSignin);
    await db.authAttempt.deleteMany();
    await bad(4, t0);
    expect(await authorizeCredentials({ email: "cli-a@x.com", password: "Senha@12345" }, req("2.2.2.2"), t0)).not.toBeNull();
    expect(await db.authAttempt.count({ where: { key: "email:cli-a@x.com" } })).toBe(0);
  });

  it("a janela expira", async () => {
    await bad(5, t0);
    const later = new Date(t0.getTime() + WINDOW_MS + 1000);
    expect(await authorizeCredentials({ email: "cli-a@x.com", password: "Senha@12345" }, req("3.3.3.3"), later)).not.toBeNull();
  });

  it("limite por IP (20) vale para e-mails diferentes", async () => {
    for (let i = 0; i < 20; i++) await authorizeCredentials({ email: `ninguem${i}@x.com`, password: "x" }, req("7.7.7.7"), t0);
    await expect(authorizeCredentials({ email: "adm-a@x.com", password: "Senha@12345" }, req("7.7.7.7"), t0)).rejects.toBeInstanceOf(RateLimitedSignin);
    expect(await authorizeCredentials({ email: "adm-a@x.com", password: "Senha@12345" }, req("8.8.8.8"), t0)).not.toBeNull();
  });

  it("o erro de bloqueio carrega o código lido por mapError", () => {
    expect(new RateLimitedSignin().code).toBe("rate_limited");
  });
});

describe("refreshToken (revalidação da sessão JWT)", () => {
  const now = 1_000_000_000;
  const lookup = vi.fn();
  beforeEach(() => lookup.mockReset());

  it("dentro da janela não consulta o banco", async () => {
    const t = { id: "1", role: "ADMIN", checkedAt: now - 1000 };
    expect(await refreshToken(t, lookup, now)).toBe(t);
    expect(lookup).not.toHaveBeenCalled();
  });
  it("papel mudou: atualiza; apagado ou desativado: encerra (null)", async () => {
    lookup.mockResolvedValueOnce({ role: "CUSTOMER", disabledAt: null });
    expect(await refreshToken({ id: "1", role: "ADMIN" }, lookup, now)).toMatchObject({ role: "CUSTOMER", checkedAt: now });
    lookup.mockResolvedValueOnce(null);
    expect(await refreshToken({ id: "1" }, lookup, now)).toBeNull();
    lookup.mockResolvedValueOnce({ role: "CUSTOMER", disabledAt: new Date() });
    expect(await refreshToken({ id: "1" }, lookup, now)).toBeNull();
  });
  it("token sem id (anônimo) passa direto", async () => {
    const t = {};
    expect(await refreshToken(t, lookup, now)).toBe(t);
  });
});
