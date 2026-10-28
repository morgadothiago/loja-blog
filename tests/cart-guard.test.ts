import { describe, expect, it } from "vitest";
import { authConfig } from "@/auth.config";

const authorized = authConfig.callbacks.authorized as (a: {
  auth: { user?: { role?: string } } | null;
  request: { nextUrl: URL };
}) => boolean | Response;

const at = (path: string) => ({ nextUrl: new URL(path, "http://localhost:3000") });

describe("proxy: /carrinho", () => {
  it("deslogado é redirecionado para /login com callbackUrl interno", () => {
    const r = authorized({ auth: null, request: at("/carrinho") }) as Response;
    expect(r).toBeInstanceOf(Response);
    const loc = new URL(r.headers.get("location")!);
    expect(loc.origin).toBe("http://localhost:3000");
    expect(loc.pathname).toBe("/login");
    expect(loc.searchParams.get("callbackUrl")).toBe("/carrinho");
  });

  it.each(["CUSTOMER", "ADMIN"])("logado (%s) passa", (role) => {
    expect(authorized({ auth: { user: { role } }, request: at("/carrinho") })).toBe(true);
  });

  it("páginas públicas continuam abertas a deslogados", () => {
    for (const p of ["/", "/loja", "/blog"]) expect(authorized({ auth: null, request: at(p) })).toBe(true);
  });

  it("regressão: dashboard e conta seguem protegidos", () => {
    expect(authorized({ auth: null, request: at("/dashboard") })).toBe(false);
    expect(authorized({ auth: null, request: at("/conta") })).toBe(false);
  });
});
