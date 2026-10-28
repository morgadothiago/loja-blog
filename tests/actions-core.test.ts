import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const authMock = vi.fn();
vi.mock("@/auth", () => ({ auth: () => authMock() }));
const rethrow = vi.fn();
vi.mock("next/navigation", async () => {
  const real = await vi.importActual<typeof import("next/navigation")>("next/navigation");
  return { ...real, unstable_rethrow: (e: unknown) => { rethrow(e); return real.unstable_rethrow(e); } };
});

import { redirect } from "next/navigation";
import { defineAction, defineFormAction } from "@/lib/action";
import { BusinessError } from "@/lib/errors";

const handler = vi.fn();
const adminAction = defineAction({ name: "t", auth: "admin", schema: z.string().min(2) }, async (i) => handler(i));
const userAction = defineAction({ name: "t", auth: "user", schema: z.string() }, async (i, { user }) => ({ i, uid: user!.id }));
const publicAction = defineAction({ name: "t", auth: "public", schema: z.object({ a: z.string() }) }, async () => "ok");

beforeEach(() => {
  authMock.mockReset();
  handler.mockReset();
  rethrow.mockReset();
});

describe("defineAction: permissões antes de validar/executar", () => {
  it("não logado -> UNAUTHENTICATED e handler não roda (mesmo com input inválido)", async () => {
    authMock.mockResolvedValue(null);
    expect(await adminAction("x")).toEqual({ ok: false, error: { code: "UNAUTHENTICATED" } });
    expect(handler).not.toHaveBeenCalled();
  });

  it("cliente em ação de admin -> FORBIDDEN", async () => {
    authMock.mockResolvedValue({ user: { id: "1", role: "CUSTOMER" } });
    expect(await adminAction("ok!")).toEqual({ ok: false, error: { code: "FORBIDDEN" } });
    expect(handler).not.toHaveBeenCalled();
  });

  it("admin com input inválido -> VALIDATION com campo; válido -> ok", async () => {
    authMock.mockResolvedValue({ user: { id: "1", role: "ADMIN" } });
    const bad = await adminAction("x");
    expect(bad).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
    handler.mockResolvedValue(42);
    expect(await adminAction("ok!")).toEqual({ ok: true, data: 42 });
  });

  it("usuário logado recebe ctx.user; pública não consulta a sessão", async () => {
    authMock.mockResolvedValue({ user: { id: "9", role: "CUSTOMER" } });
    expect(await userAction("a")).toEqual({ ok: true, data: { i: "a", uid: "9" } });
    authMock.mockClear();
    expect(await publicAction({ a: "x" })).toEqual({ ok: true, data: "ok" });
    expect(authMock).not.toHaveBeenCalled();
  });
});

describe("defineAction: erros", () => {
  it("BusinessError vira resultado tipado; erro desconhecido vira INTERNAL sem a mensagem e é logado", async () => {
    authMock.mockResolvedValue({ user: { id: "1", role: "ADMIN" } });
    handler.mockRejectedValueOnce(new BusinessError("CONFLICT", "OUT_OF_STOCK"));
    expect(await adminAction("ok!")).toEqual({ ok: false, error: { code: "CONFLICT", detailCode: "OUT_OF_STOCK" } });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    handler.mockRejectedValueOnce(new Error("detalhe interno secreto"));
    const r = await adminAction("ok!");
    expect(JSON.stringify(r)).not.toContain("secreto");
    expect(r).toEqual({ ok: false, error: { code: "INTERNAL" } });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).not.toContain("ok!"); // entrada do usuário não é logada
    spy.mockRestore();
  });

  it("redirect() do handler é relançado, não convertido em erro", async () => {
    authMock.mockResolvedValue({ user: { id: "1", role: "ADMIN" } });
    handler.mockImplementationOnce(() => redirect("/onde"));
    await expect(adminAction("ok!")).rejects.toMatchObject({ digest: expect.stringContaining("NEXT_REDIRECT") });
    expect(rethrow).toHaveBeenCalled();
  });
});

describe("defineFormAction", () => {
  it("lê o FormData e entrega argumentos vinculados ao handler", async () => {
    authMock.mockResolvedValue({ user: { id: "1", role: "ADMIN" } });
    const action = defineFormAction({ name: "f", auth: "admin", schema: z.object({ n: z.string().min(1) }) }, async (i, _c, id: string) => ({ n: i.n, id }));
    const fd = new FormData();
    fd.set("n", "x");
    expect(await action("id-7", undefined, fd)).toEqual({ ok: true, data: { n: "x", id: "id-7" } });
    expect(await action("id-7", undefined, new FormData())).toMatchObject({ error: { code: "VALIDATION", fieldErrors: { n: "REQUIRED" } } });
  });
});
