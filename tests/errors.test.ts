import { Prisma } from "@prisma/client";
import { AuthError } from "next-auth";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { BusinessError, logError, mapError } from "@/lib/errors";
import { dictionaries, translateError, translateFieldError, type MessageKey } from "@/lib/i18n";
import { HTTP_STATUS } from "@/lib/result";

const known = (code: string, meta?: Record<string, unknown>) =>
  new Prisma.PrismaClientKnownRequestError("segredo: tabela User coluna email", { code, clientVersion: "6", meta });

describe("mapError", () => {
  it("ZodError -> VALIDATION com fieldErrors por campo", () => {
    const schema = z.object({ title: z.string().min(1), n: z.number().min(5), email: z.string().email(), big: z.string().max(2) });
    const r = schema.safeParse({ title: "", n: 1, email: "x", big: "abc" });
    const e = mapError(r.error);
    expect(e.code).toBe("VALIDATION");
    expect(e.fieldErrors).toEqual({ title: "REQUIRED", n: "TOO_SMALL", email: "INVALID", big: "TOO_LONG" });
  });

  it("campo ausente (undefined) -> REQUIRED", () => {
    const r = z.object({ a: z.string() }).safeParse({});
    expect(mapError(r.error).fieldErrors).toEqual({ a: "REQUIRED" });
  });

  it("Prisma: P2002/P2003/P2025/P1001 e inicialização", () => {
    expect(mapError(known("P2002", { target: ["email"] }))).toEqual({ code: "CONFLICT", detailCode: "EMAIL_TAKEN" });
    expect(mapError(known("P2002", { target: ["slug"] }))).toEqual({ code: "CONFLICT", detailCode: "SLUG_TAKEN" });
    expect(mapError(known("P2003"))).toEqual({ code: "CONFLICT", detailCode: "IN_USE" });
    expect(mapError(known("P2025"))).toEqual({ code: "NOT_FOUND" });
    expect(mapError(known("P1001"))).toEqual({ code: "UNAVAILABLE" });
    expect(mapError(new Prisma.PrismaClientInitializationError("down", "6"))).toEqual({ code: "UNAVAILABLE" });
  });

  it("BusinessError e AuthError", () => {
    expect(mapError(new BusinessError("CONFLICT", "OUT_OF_STOCK"))).toEqual({ code: "CONFLICT", detailCode: "OUT_OF_STOCK" });
    const cred = new AuthError("x");
    (cred as { type: string }).type = "CredentialsSignin";
    expect(mapError(cred)).toEqual({ code: "UNAUTHENTICATED", detailCode: "INVALID_CREDENTIALS" });
  });

  it("desconhecido -> INTERNAL sem vazar mensagem/stack", () => {
    const e = mapError(new Error("senha do banco é 123 e a tabela User"));
    expect(e).toEqual({ code: "INTERNAL" });
    expect(JSON.stringify(mapError(known("P9999")))).not.toMatch(/segredo|tabela|User/);
  });
});

describe("logError", () => {
  afterEach(() => vi.restoreAllMocks());

  it("registra nome, mensagem e stack de erros comuns, com o contexto", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logError(new Error("falha x"), { action: "a", userId: "u1" });
    const line = JSON.parse(spy.mock.calls[0][0] as string);
    expect(line).toMatchObject({ level: "error", action: "a", userId: "u1", name: "Error", message: "falha x" });
    expect(line.stack).toBeTruthy();
  });

  it("Prisma: só código e campo; nunca a mensagem (pode ter valores/PII)", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logError(known("P2002", { target: ["email"] }), { action: "a" });
    const raw = spy.mock.calls[0][0] as string;
    expect(JSON.parse(raw)).toMatchObject({ prismaCode: "P2002", target: ["email"] });
    expect(raw).not.toMatch(/segredo|tabela/);
  });
});

describe("catálogo i18n de erros", () => {
  const t = (l: "pt-BR" | "en" | "es") => (k: MessageKey) => dictionaries[l][k];
  const codes = Object.keys(HTTP_STATUS);
  const details = ["OUT_OF_STOCK", "PRODUCT_UNAVAILABLE", "EMPTY_CART", "EMAIL_TAKEN", "INVALID_CREDENTIALS", "SLUG_TAKEN", "IN_USE", "FILE_TYPE", "FILE_TOO_LARGE"];

  it.each(["pt-BR", "en", "es"] as const)("todo código e detalhe tem mensagem em %s", (l) => {
    for (const c of codes) expect(dictionaries[l][`error.${c}` as MessageKey], c).toBeTruthy();
    for (const d of details) expect(dictionaries[l][`error.${d}` as MessageKey], d).toBeTruthy();
    for (const f of ["REQUIRED", "INVALID", "TOO_SHORT", "TOO_LONG", "TOO_SMALL"]) {
      expect(translateFieldError(t(l), f)).toBe(dictionaries[l][`error.field.${f}` as MessageKey]);
    }
  });

  it("detalhe vence o código; detalhe/código desconhecido cai em mensagem segura", () => {
    expect(translateError(t("en"), { code: "CONFLICT", detailCode: "OUT_OF_STOCK" })).toContain("out of stock");
    expect(translateError(t("pt-BR"), { code: "CONFLICT", detailCode: "XYZ" })).toBe(dictionaries["pt-BR"]["error.CONFLICT"]);
    expect(translateError(t("pt-BR"), { code: "???" })).toBe(dictionaries["pt-BR"]["error.INTERNAL"]);
  });
});
