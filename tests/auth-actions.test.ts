import { AuthError, CredentialsSignin } from "next-auth";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const signInMock = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({ signIn: signInMock, signOut: vi.fn(), auth: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "5.5.5.5" }), cookies: async () => ({ get: () => undefined }) }));

import { login, register } from "@/actions/auth";
import { RateLimitedSignin } from "@/lib/auth-credentials";
import { db } from "@/lib/db";
import { passwordBytes, verifyPassword } from "@/lib/password";
import { LIMITS } from "@/lib/rate-limit";

// signIn do Auth.js termina em redirect (lança): simulamos igual.
const redirectError = (to: string) => Object.assign(new Error("NEXT_REDIRECT"), { digest: `NEXT_REDIRECT;push;${to};307;` });

beforeEach(async () => {
  signInMock.mockReset();
  signInMock.mockImplementation(async (_p: string, o: { redirectTo: string }) => {
    throw redirectError(o.redirectTo);
  });
  await db.authAttempt.deleteMany();
  await db.user.deleteMany({ where: { email: { endsWith: "@reg.test" } } });
});
afterAll(async () => {
  await db.authAttempt.deleteMany();
  await db.user.deleteMany({ where: { email: { endsWith: "@reg.test" } } });
});

const reg = (o: Record<string, unknown> = {}) => register({ name: "Ana", email: "ana@reg.test", password: "Senha@12345", ...o });

describe("login", () => {
  it("sucesso = redirect (relançado): destino padrão /destino (sem consulta prévia ao banco)", async () => {
    const spy = vi.spyOn(db.user, "findUnique");
    await expect(login({ email: "a@b.com", password: "x" })).rejects.toMatchObject({ digest: expect.stringContaining("/destino") });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("callbackUrl interno vence; externo/hostil é ignorado", async () => {
    await expect(login({ email: "a@b.com", password: "x", callbackUrl: "/carrinho" })).rejects.toMatchObject({ digest: expect.stringContaining("/carrinho") });
    for (const bad of ["https://evil.com", "//evil.com", "/\\evil.com"]) {
      await expect(login({ email: "a@b.com", password: "x", callbackUrl: bad })).rejects.toMatchObject({ digest: expect.stringContaining("/destino") });
    }
  });

  it("credencial inválida -> INVALID_CREDENTIALS; bloqueio -> RATE_LIMITED; erro de config -> INTERNAL genérico", async () => {
    signInMock.mockRejectedValueOnce(new CredentialsSignin());
    expect(await login({ email: "a@b.com", password: "x" })).toEqual({ ok: false, error: { code: "UNAUTHENTICATED", detailCode: "INVALID_CREDENTIALS" } });
    signInMock.mockRejectedValueOnce(new RateLimitedSignin());
    expect(await login({ email: "a@b.com", password: "x" })).toEqual({ ok: false, error: { code: "RATE_LIMITED" } });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    signInMock.mockRejectedValueOnce(new AuthError("Configuration"));
    expect(await login({ email: "a@b.com", password: "x" })).toEqual({ ok: false, error: { code: "INTERNAL" } });
    spy.mockRestore();
  });

  it("input inválido -> VALIDATION (senha enorme, e-mail ruim) sem chamar signIn", async () => {
    expect(await login({ email: "nao-e-email", password: "x" })).toMatchObject({ error: { code: "VALIDATION", fieldErrors: { email: "INVALID" } } });
    expect(await login({ email: "a@b.com", password: "é".repeat(40) })).toMatchObject({ error: { code: "VALIDATION" } });
    expect(signInMock).not.toHaveBeenCalled();
  });
});

describe("register", () => {
  it("feliz: cria CUSTOMER com e-mail normalizado e hash verificável; redireciona para /conta", async () => {
    await expect(reg({ email: "  Ana@Reg.Test " })).rejects.toMatchObject({ digest: expect.stringContaining("/conta") });
    const u = (await db.user.findUnique({ where: { email: "ana@reg.test" } }))!;
    expect(u).toMatchObject({ role: "CUSTOMER", name: "Ana" });
    expect(u.password).not.toContain("Senha@12345");
    expect(await verifyPassword("Senha@12345", u.password)).toBe(true);
    expect(signInMock).toHaveBeenCalledWith("credentials", expect.objectContaining({ email: "ana@reg.test", redirectTo: "/conta" }));
  });

  it("senha curta (<8) e longa (>72 bytes) -> VALIDATION; nada é gravado", async () => {
    expect(await reg({ password: "1234567" })).toMatchObject({ error: { code: "VALIDATION", fieldErrors: { password: "TOO_SHORT" } } });
    expect(passwordBytes("é".repeat(37))).toBeGreaterThan(72);
    expect(await reg({ password: "é".repeat(37) })).toMatchObject({ error: { code: "VALIDATION" } });
    expect(await reg({ name: "A" })).toMatchObject({ error: { fieldErrors: { name: "TOO_SHORT" } } });
    expect(await db.user.count({ where: { email: { endsWith: "@reg.test" } } })).toBe(0);
  });

  it("e-mail duplicado (inclusive com outra caixa) -> CONFLICT/EMAIL_TAKEN", async () => {
    await expect(reg()).rejects.toBeTruthy();
    expect(await reg({ email: "ANA@reg.test" })).toEqual({ ok: false, error: { code: "CONFLICT", detailCode: "EMAIL_TAKEN" } });
    expect(await db.user.count({ where: { email: { endsWith: "@reg.test" } } })).toBe(1);
  });

  it("5 cadastros simultâneos do mesmo e-mail: 1 usuário, nenhuma falha INTERNAL", async () => {
    const results = await Promise.allSettled(Array.from({ length: 5 }, () => reg({ email: "corrida@reg.test" })));
    expect(await db.user.count({ where: { email: "corrida@reg.test" } })).toBe(1);
    for (const r of results) {
      if (r.status === "fulfilled") expect(r.value).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
      else expect(r.reason.digest).toContain("NEXT_REDIRECT");
    }
  });

  it("rate limit por IP: após o limite, RATE_LIMITED", async () => {
    await db.authAttempt.createMany({ data: Array.from({ length: LIMITS.registerIp }, () => ({ key: "register-ip:5.5.5.5" })) });
    expect(await reg({ email: "x@reg.test" })).toMatchObject({ ok: false, error: { code: "RATE_LIMITED" } });
    expect(await db.user.count({ where: { email: "x@reg.test" } })).toBe(0);
  });

  it("callbackUrl hostil cai em /conta", async () => {
    await expect(reg({ email: "h@reg.test", callbackUrl: "https://evil.com" })).rejects.toMatchObject({ digest: expect.stringContaining("/conta") });
  });
});
